using System.Text.Json;
using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Models.Responses;
using LantanaGroup.Link.OnboardingService.Application.Services;
using LantanaGroup.Link.OnboardingService.Infrastructure.Clients;
using Microsoft.AspNetCore.Mvc;

namespace LantanaGroup.Link.OnboardingService.Controllers;

[ApiController]
[Route("api/onboarding/{token}")]
public class OnboardingController : ControllerBase
{
    private readonly IOnboardingService _onboarding;
    private readonly TenantServiceClient _tenantClient;
    private readonly ReportServiceClient _reportClient;
    private readonly NormalizationServiceClient _normClient;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OnboardingController> _logger;

    private static readonly JsonSerializerOptions _jsonOpts = new(JsonSerializerDefaults.Web);

    public OnboardingController(
        IOnboardingService onboarding,
        TenantServiceClient tenantClient,
        ReportServiceClient reportClient,
        NormalizationServiceClient normClient,
        IHttpClientFactory httpClientFactory,
        ILogger<OnboardingController> logger)
    {
        _onboarding = onboarding;
        _tenantClient = tenantClient;
        _reportClient = reportClient;
        _normClient = normClient;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Session
    // -------------------------------------------------------------------------

    [HttpGet]
    public async Task<IActionResult> GetSession(string token, CancellationToken ct)
    {
        var session = await _onboarding.GetSessionAsync(token, ct);
        if (session is null) return NotFound();
        return Ok(session);
    }

    // -------------------------------------------------------------------------
    // Onboarding steps
    // -------------------------------------------------------------------------

    [HttpPost("compliance-attestation")]
    public async Task<IActionResult> CompleteAttestation(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteStepAsync(token, "ComplianceAttestation", ct);
        return Ok();
    }

    [HttpPost("facility-info")]
    public async Task<IActionResult> SaveFacilityInfo(string token, [FromBody] FacilityInfoRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var facilityId = session.NhsnOrgId;

        var facilityModel = new
        {
            FacilityId = facilityId,
            FacilityName = request.OrganizationNames,
            TimeZone = request.TimeZone,
            ScheduledReports = new { Daily = Array.Empty<string>(), Monthly = Array.Empty<string>(), Weekly = Array.Empty<string>() }
        };

        try
        {
            var tenantResponse = await _tenantClient.CreateFacilityAsync(facilityModel, ct);
            if (!tenantResponse.IsSuccessStatusCode && tenantResponse.StatusCode != System.Net.HttpStatusCode.Conflict)
            {
                var error = await tenantResponse.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Tenant service returned {Status}: {Error}", tenantResponse.StatusCode, error);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Tenant service call failed for facility {FacilityId}; continuing.", facilityId);
        }

        await _onboarding.SetFacilityIdAsync(token, facilityId, ct);
        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["OrganizationNames"] = request.OrganizationNames,
            ["TimeZone"] = request.TimeZone,
            ["PhysicalAddress"] = request.PhysicalAddress,
            ["TechnicalContactPhone"] = request.TechnicalContactPhone ?? string.Empty
        }, ct);
        await _onboarding.CompleteStepAsync(token, "FacilityInfo", ct);
        return Ok(new { FacilityId = facilityId });
    }

    [HttpPost("server-info")]
    public async Task<IActionResult> SaveServerInfo(string token, [FromBody] ServerInfoRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();

        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["FhirBaseUrl"] = request.FhirBaseUrl,
            ["EhrVendor"] = request.EhrVendor
        }, ct);
        await _onboarding.SetVendorAsync(token, request.EhrVendor, ct);
        await _onboarding.CompleteStepAsync(token, "ServerInfo", ct);
        return Ok();
    }

    [HttpPost("authorization")]
    public async Task<IActionResult> CompleteAuthorization(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteStepAsync(token, "Authorization", ct);
        return Ok();
    }

    [HttpPost("connection-test")]
    public async Task<IActionResult> TestConnection(string token, [FromBody] ConnectionTestRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var sessionData = await _onboarding.GetSessionAsync(token, ct);
        var fhirBaseUrl = sessionData?.FormData.GetValueOrDefault("FhirBaseUrl");

        if (string.IsNullOrWhiteSpace(fhirBaseUrl))
            return BadRequest(new { error = "FHIR base URL not configured. Please complete the Server Info step first." });

        var metadataUrl = fhirBaseUrl.TrimEnd('/') + "/metadata";
        _logger.LogInformation("Testing FHIR connection for facility {FacilityId} at {MetadataUrl}",
            session.FacilityId ?? session.NhsnOrgId, metadataUrl);

        var httpClient = _httpClientFactory.CreateClient("fhir-test");
        httpClient.Timeout = TimeSpan.FromSeconds(30);
        httpClient.DefaultRequestHeaders.Accept.ParseAdd("application/fhir+json");

        try
        {
            var response = await httpClient.GetAsync(metadataUrl, ct);

            if (response.IsSuccessStatusCode)
            {
                await _onboarding.CompleteStepAsync(token, "ConnectionTest", ct);
                return Ok(new ConnectionTestResponse { Success = true });
            }

            var body = await response.Content.ReadAsStringAsync(ct);
            return Ok(new ConnectionTestResponse
            {
                Success = false,
                ErrorDetails = $"FHIR server returned HTTP {(int)response.StatusCode} ({response.ReasonPhrase}). " +
                               $"Verify the FHIR base URL and that the server is accessible.\n\nResponse:\n{body[..Math.Min(500, body.Length)]}"
            });
        }
        catch (HttpRequestException ex)
        {
            return Ok(new ConnectionTestResponse
            {
                Success = false,
                ErrorDetails = $"Unable to reach FHIR server at {metadataUrl}.\n\nError: {ex.Message}"
            });
        }
        catch (TaskCanceledException)
        {
            return Ok(new ConnectionTestResponse
            {
                Success = false,
                ErrorDetails = $"Connection to FHIR server timed out after 30 seconds.\n\nURL: {metadataUrl}"
            });
        }
    }

    [HttpPost("patients-of-interest")]
    public async Task<IActionResult> SavePatientsOfInterest(string token, [FromBody] JsonElement body, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var fields = new Dictionary<string, string>();

        if (body.TryGetProperty("patientListIds", out var listIds))
            fields["PatientListIds"] = listIds.GetString() ?? string.Empty;
        if (body.TryGetProperty("sftpUrl", out var sftpUrl))
            fields["SftpUrl"] = sftpUrl.GetString() ?? string.Empty;
        if (body.TryGetProperty("sftpUsername", out var sftpUser))
            fields["SftpUsername"] = sftpUser.GetString() ?? string.Empty;
        if (body.TryGetProperty("sftpPassword", out var sftpPass))
            fields["SftpPassword"] = sftpPass.GetString() ?? string.Empty;

        await _onboarding.SaveFormDataAsync(token, fields, ct);
        await _onboarding.CompleteStepAsync(token, "PatientsOfInterest", ct);
        return Ok();
    }

    // -------------------------------------------------------------------------
    // Location Type Mapping — guided HSLOC code map step (Option A)
    // Creates two normalization operations for the facility:
    //   1. CodeMap:      Location.identifier.value  →  HSLOC
    //   2. CopyLocation: promotes HSLOC identifier  →  Location.type
    // -------------------------------------------------------------------------

    [HttpGet("location-type-mapping")]
    public async Task<IActionResult> GetLocationTypeMapping(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var sessionData = await _onboarding.GetSessionAsync(token, ct);
        var mapJson = sessionData?.FormData.GetValueOrDefault("LocationTypeMapping");
        if (mapJson is null) return Ok(new LocationTypeMappingRequest());

        return Ok(JsonSerializer.Deserialize<LocationTypeMappingRequest>(mapJson, _jsonOpts));
    }

    [HttpPost("location-type-mapping")]
    public async Task<IActionResult> SaveLocationTypeMapping(string token, [FromBody] LocationTypeMappingRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null)
            return BadRequest(new { error = "FacilityId not set. Complete the Facility Info step first." });

        // Persist form data so the user can return and see what they entered.
        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["LocationTypeMapping"] = JsonSerializer.Serialize(request, _jsonOpts)
        }, ct);

        // Build CodeMap operation: Location.identifier.value → HSLOC
        var codeMapPayload = new NormCreatePayload(
            ResourceTypes: new List<string> { "Location" },
            FacilityId: session.FacilityId,
            Operation: new NormCodeMapDto
            {
                Name = "Map Location Identifier to HSLOC",
                Description = "Translates Epic location identifier codes to CDC NHSN HSLOC codes.",
                FhirPath = "Location.identifier.value",
                CodeSystemMaps = new List<NormCodeSystemMapDto>
                {
                    new NormCodeSystemMapDto
                    {
                        SourceSystem = request.SourceSystem,
                        TargetSystem = "https://www.cdc.gov/nhsn/cdaportal/terminology/codesystem/hsloc.html",
                        CodeMaps = request.Codes.ToDictionary(
                            c => c.SourceCode,
                            c => new NormCodeEntryDto { Code = c.TargetCode, Display = c.Display })
                    }
                }
            });

        var codeMapResponse = await _normClient.CreateOperationAsync(codeMapPayload, ct);
        if (!codeMapResponse.IsSuccessStatusCode)
        {
            var err = await codeMapResponse.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Failed to create HSLOC CodeMap for {FacilityId}: {Error}", session.FacilityId, err);
            return StatusCode((int)codeMapResponse.StatusCode,
                new { error = "Failed to create HSLOC code map operation.", detail = err });
        }

        // Build CopyLocation operation (must run after the HSLOC code map, sequence is auto-managed)
        var copyLocationPayload = new NormCreatePayload(
            ResourceTypes: new List<string> { "Location" },
            FacilityId: session.FacilityId,
            Operation: new NormCopyLocationDto
            {
                Name = "Copy Location Identifier to Type",
                Description = "Promotes mapped HSLOC identifiers into Location.type as a CodeableConcept."
            });

        var copyLocationResponse = await _normClient.CreateOperationAsync(copyLocationPayload, ct);
        if (!copyLocationResponse.IsSuccessStatusCode)
        {
            var err = await copyLocationResponse.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Failed to create CopyLocation for {FacilityId}: {Error}", session.FacilityId, err);
            return StatusCode((int)copyLocationResponse.StatusCode,
                new { error = "HSLOC code map was saved but the Copy Location step failed.", detail = err });
        }

        await _onboarding.CompleteStepAsync(token, "LocationTypeMapping", ct);
        return Ok();
    }

    // -------------------------------------------------------------------------
    // Encounter Type Mapping — Epic-specific CodeMap + ConditionalTransform
    // Creates two normalization operations for the facility:
    //   1. CodeMap (seq 10):             Encounter.type.coding   → SNOMED CT
    //   2. ConditionalTransform (seq 20): Encounter.status = "finished" when period.end Exists
    // -------------------------------------------------------------------------

    [HttpGet("encounter-type-mapping")]
    public async Task<IActionResult> GetEncounterTypeMapping(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var sessionData = await _onboarding.GetSessionAsync(token, ct);
        var mapJson = sessionData?.FormData.GetValueOrDefault("EncounterTypeMapping");
        if (mapJson is null) return Ok(new EncounterTypeMappingRequest());

        return Ok(JsonSerializer.Deserialize<EncounterTypeMappingRequest>(mapJson, _jsonOpts));
    }

    [HttpPost("encounter-type-mapping")]
    public async Task<IActionResult> SaveEncounterTypeMapping(string token, [FromBody] EncounterTypeMappingRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null)
            return BadRequest(new { error = "FacilityId not set. Complete the Facility Info step first." });

        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["EncounterTypeMapping"] = JsonSerializer.Serialize(request, _jsonOpts)
        }, ct);

        // Operation 1: CodeMap — Encounter.type.coding → SNOMED CT (sequence 10)
        var codeMapPayload = new NormCreatePayload(
            ResourceTypes: new List<string> { "Encounter" },
            FacilityId: session.FacilityId,
            Operation: new NormCodeMapDto
            {
                Name = "Map Encounter Type to SNOMED",
                Description = "Translates Epic encounter type codes to SNOMED CT for NHSN reporting.",
                FhirPath = "Encounter.type.coding",
                CodeSystemMaps = request.CodeSystemMaps.Select(csm => new NormCodeSystemMapDto
                {
                    SourceSystem = csm.SourceSystem,
                    TargetSystem = csm.TargetSystem,
                    CodeMaps = csm.Codes.ToDictionary(
                        c => c.SourceCode,
                        c => new NormCodeEntryDto { Code = c.TargetCode, Display = c.Display })
                }).ToList()
            });

        var codeMapResponse = await _normClient.CreateOperationAsync(codeMapPayload, ct);
        if (!codeMapResponse.IsSuccessStatusCode)
        {
            var err = await codeMapResponse.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Failed to create Encounter CodeMap for {FacilityId}: {Error}", session.FacilityId, err);
            return StatusCode((int)codeMapResponse.StatusCode,
                new { error = "Failed to create Encounter type code map operation.", detail = err });
        }

        // Operation 2: ConditionalTransform — set Encounter.status = "finished" when period.end Exists (sequence 20)
        var conditionalPayload = new NormCreatePayload(
            ResourceTypes: new List<string> { "Encounter" },
            FacilityId: session.FacilityId,
            Operation: new NormConditionalTransformDto
            {
                Name = "Set Encounter Status to Finished",
                Description = "Sets Encounter.status to 'finished' when a period end date is present.",
                TargetFhirPath = "Encounter.status",
                TargetValue = "finished",
                Conditions = new List<NormConditionDto>
                {
                    new NormConditionDto
                    {
                        FhirPathSource = "Encounter.period.end",
                        Operator = "Exists",
                        Value = null
                    }
                }
            });

        var conditionalResponse = await _normClient.CreateOperationAsync(conditionalPayload, ct);
        if (!conditionalResponse.IsSuccessStatusCode)
        {
            var err = await conditionalResponse.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Failed to create Encounter ConditionalTransform for {FacilityId}: {Error}", session.FacilityId, err);
            // Code map already saved — log and continue rather than blocking the step.
            // The user can add the conditional transform manually from the Normalizations page.
            _logger.LogWarning("Encounter type code map was saved but ConditionalTransform could not be created. Manual action may be needed.");
        }

        await _onboarding.CompleteStepAsync(token, "EncounterTypeMapping", ct);
        return Ok();
    }

    [HttpPost("poi-compiling")]
    public async Task<IActionResult> StartPoiCompiling(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteStepAsync(token, "PoiCompiling", ct);
        return Ok();
    }

    [HttpPost("verify-poi")]
    public async Task<IActionResult> VerifyPoi(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteStepAsync(token, "VerifyPoi", ct);
        return Ok();
    }

    // -------------------------------------------------------------------------
    // Reports
    // -------------------------------------------------------------------------

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _reportClient.GetReportsAsync(session.FacilityId, ct);
        return Content(await response.Content.ReadAsStringAsync(ct), "application/json");
    }

    [HttpPost("reports")]
    public async Task<IActionResult> GenerateReport(string token, [FromBody] JsonElement body, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var startDate = body.TryGetProperty("startDate", out var sd) ? sd.GetDateTime() : DateTime.UtcNow.AddDays(-30);
        var endDate = body.TryGetProperty("endDate", out var ed) ? ed.GetDateTime() : DateTime.UtcNow;

        var response = await _reportClient.GenerateReportAsync(session.FacilityId, startDate, endDate, ct);
        if (response.IsSuccessStatusCode)
            await _onboarding.CompleteStepAsync(token, "TestReport", ct);

        return Content(await response.Content.ReadAsStringAsync(ct), "application/json");
    }

    [HttpGet("reports/{reportId}")]
    public async Task<IActionResult> GetReport(string token, string reportId, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _reportClient.GetReportAsync(session.FacilityId, reportId, ct);
        return Content(await response.Content.ReadAsStringAsync(ct), "application/json");
    }

    // -------------------------------------------------------------------------
    // Normalizations — CRUD proxy to normalization service operations API
    // -------------------------------------------------------------------------

    [HttpGet("normalizations")]
    public async Task<IActionResult> GetNormalizations(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.GetOperationsAsync(session.FacilityId, ct);
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode);

        // Deserialize the paged response and project to the onboarding UI model.
        var raw = await response.Content.ReadAsStringAsync(ct);
        var paged = JsonSerializer.Deserialize<PagedOperationsResponse>(raw, _jsonOpts);
        var items = (paged?.Records ?? new List<NormOperationRecord>())
            .Select(r => new NormalizationOperationResponse
            {
                Id = r.Id.ToString(),
                Name = r.Name,
                Description = r.Description,
                OperationType = r.OperationType,
                ResourceTypes = r.OperationResourceTypes
                    .Select(ort => ort.Resource?.Name ?? string.Empty)
                    .Where(n => !string.IsNullOrEmpty(n))
                    .ToList(),
                IsDisabled = r.IsDisabled,
                CanDelete = true
            })
            .ToList();

        return Ok(items);
    }

    [HttpGet("normalizations/resource-types")]
    public async Task<IActionResult> GetResourceTypes(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        var response = await _normClient.GetResourceTypesAsync(ct);
        return Content(await response.Content.ReadAsStringAsync(ct), "application/json");
    }

    [HttpPost("normalizations/code-map")]
    public async Task<IActionResult> CreateCodeMap(string token, [FromBody] CodeMapRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var payload = new NormCreatePayload(
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            Operation: BuildCodeMapDto(request));

        var response = await _normClient.CreateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync(ct));
    }

    [HttpPut("normalizations/code-map/{id}")]
    public async Task<IActionResult> UpdateCodeMap(string token, string id, [FromBody] CodeMapRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        if (!Guid.TryParse(id, out var opId)) return BadRequest("Invalid operation id.");

        var payload = new NormUpdatePayload(
            Id: opId,
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            IsDisabled: false,
            Operation: BuildCodeMapDto(request));

        var response = await _normClient.UpdateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("normalizations/copy-property")]
    public async Task<IActionResult> CreateCopyProperty(string token, [FromBody] CopyPropertyRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var payload = new NormCreatePayload(
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            Operation: new NormCopyPropertyDto
            {
                Name = request.Name,
                Description = request.Description,
                SourceFhirPath = request.SourceFhirPath,
                TargetFhirPath = request.TargetFhirPath
            });

        var response = await _normClient.CreateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync(ct));
    }

    [HttpPut("normalizations/copy-property/{id}")]
    public async Task<IActionResult> UpdateCopyProperty(string token, string id, [FromBody] CopyPropertyRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        if (!Guid.TryParse(id, out var opId)) return BadRequest("Invalid operation id.");

        var payload = new NormUpdatePayload(
            Id: opId,
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            IsDisabled: !request.Enabled,
            Operation: new NormCopyPropertyDto
            {
                Name = request.Name,
                Description = request.Description,
                SourceFhirPath = request.SourceFhirPath,
                TargetFhirPath = request.TargetFhirPath
            });

        var response = await _normClient.UpdateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("normalizations/conditional")]
    public async Task<IActionResult> CreateConditionalTransformation(string token, [FromBody] ConditionalTransformationRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var payload = new NormCreatePayload(
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            Operation: BuildConditionalDto(request));

        var response = await _normClient.CreateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync(ct));
    }

    [HttpPut("normalizations/conditional/{id}")]
    public async Task<IActionResult> UpdateConditionalTransformation(string token, string id, [FromBody] ConditionalTransformationRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        if (!Guid.TryParse(id, out var opId)) return BadRequest("Invalid operation id.");

        var payload = new NormUpdatePayload(
            Id: opId,
            ResourceTypes: new List<string> { request.ResourceType },
            FacilityId: session.FacilityId,
            IsDisabled: !request.Enabled,
            Operation: BuildConditionalDto(request));

        var response = await _normClient.UpdateOperationAsync(payload, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpDelete("normalizations/{id}")]
    public async Task<IActionResult> DeleteNormalization(string token, string id, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        if (!Guid.TryParse(id, out var opId)) return BadRequest("Invalid operation id.");

        var response = await _normClient.DeleteOperationAsync(session.FacilityId, opId, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteOnboarding(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteOnboardingAsync(token, ct);
        return Ok();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private static NormCodeMapDto BuildCodeMapDto(CodeMapRequest request) => new NormCodeMapDto
    {
        Name = request.Name,
        Description = request.Description,
        FhirPath = request.FhirPath,
        CodeSystemMaps = request.CodeSystemMaps.Select(csm => new NormCodeSystemMapDto
        {
            SourceSystem = csm.SourceSystem,
            TargetSystem = csm.TargetSystem,
            CodeMaps = csm.Codes.ToDictionary(
                c => c.SourceCode,
                c => new NormCodeEntryDto { Code = c.TargetCode, Display = c.Display })
        }).ToList()
    };

    private static NormConditionalTransformDto BuildConditionalDto(ConditionalTransformationRequest request) =>
        new NormConditionalTransformDto
        {
            Name = request.Name,
            Description = request.Description,
            TargetFhirPath = request.TargetFhirPath,
            TargetValue = request.TargetValue,
            Conditions = request.Conditions.Select(c => new NormConditionDto
            {
                FhirPathSource = c.FhirPath,
                Operator = c.Operator,
                Value = c.Value
            }).ToList()
        };

    // -------------------------------------------------------------------------
    // Local DTOs for deserializing the normalization service paged response
    // -------------------------------------------------------------------------

    private record PagedOperationsResponse(List<NormOperationRecord> Records);

    private record NormOperationRecord(
        Guid Id,
        string Name,
        string Description,
        string OperationType,
        bool IsDisabled,
        List<NormResourceTypeRecord> OperationResourceTypes);

    private record NormResourceTypeRecord(ResourceRecord? Resource);

    private record ResourceRecord(string Name);
}
