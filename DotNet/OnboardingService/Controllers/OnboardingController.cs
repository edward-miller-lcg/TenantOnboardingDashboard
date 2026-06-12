using System.Text.Json;
using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Models.Responses;
using LantanaGroup.Link.OnboardingService.Application.Services;
using LantanaGroup.Link.OnboardingService.Infrastructure.Clients;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;
using LantanaGroup.Link.OnboardingService.Infrastructure.Templates;
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
    private readonly DataAcquisitionClient _dataAcqClient;
    private readonly IEhrVendorTemplateRepository _templates;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OnboardingController> _logger;

    private static readonly JsonSerializerOptions _jsonOpts = new(JsonSerializerDefaults.Web);

    private const string DefaultEhrVendor = "Epic";

    public OnboardingController(
        IOnboardingService onboarding,
        TenantServiceClient tenantClient,
        ReportServiceClient reportClient,
        NormalizationServiceClient normClient,
        DataAcquisitionClient dataAcqClient,
        IEhrVendorTemplateRepository templates,
        IHttpClientFactory httpClientFactory,
        ILogger<OnboardingController> logger)
    {
        _onboarding = onboarding;
        _tenantClient = tenantClient;
        _reportClient = reportClient;
        _normClient = normClient;
        _dataAcqClient = dataAcqClient;
        _templates = templates;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // EHR vendor template helpers — see docs/ehr-vendor-templates-proposal.md
    // -------------------------------------------------------------------------

    private async Task<List<EhrVendorTemplate>> GetNormalizationTemplatesAsync(string? vendor, string resourceType, CancellationToken ct)
    {
        var effectiveVendor = string.IsNullOrWhiteSpace(vendor) ? DefaultEhrVendor : vendor;
        var templates = await _templates.GetActiveAsync(effectiveVendor, EhrTemplateCategory.Normalization, resourceType, ct);

        if (templates.Count == 0 && effectiveVendor != DefaultEhrVendor)
        {
            _logger.LogWarning("No normalization templates configured for vendor {Vendor}/{ResourceType}; falling back to {DefaultVendor}",
                effectiveVendor, resourceType, DefaultEhrVendor);
            templates = await _templates.GetActiveAsync(DefaultEhrVendor, EhrTemplateCategory.Normalization, resourceType, ct);
        }

        return templates;
    }

    private async Task<HttpResponseMessage> CreateOperationFromTemplateAsync(
        EhrVendorTemplate template, string facilityId, Dictionary<string, object?> context, CancellationToken ct)
    {
        var operation = EhrTemplateMerger.Merge(template.DefinitionJson, context);
        var payload = new NormCreatePayload(
            ResourceTypes: new List<string> { template.ResourceType },
            FacilityId: facilityId,
            Operation: operation);

        return await _normClient.CreateOperationAsync(payload, ct);
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
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["FhirBaseUrl"] = request.FhirBaseUrl,
            ["EhrVendor"] = request.EhrVendor
        }, ct);
        await _onboarding.SetVendorAsync(token, request.EhrVendor, ct);

        if (session.FacilityId is not null)
            await InjectQueryPlansAsync(session.FacilityId, request.EhrVendor, ct);

        await _onboarding.CompleteStepAsync(token, "ServerInfo", ct);
        return Ok();
    }

    // Best-effort: vendor query-plan templates are injected into DataAcquisition
    // but never block onboarding if the call fails (see ehr-vendor-templates-proposal.md).
    private async Task InjectQueryPlansAsync(string facilityId, string ehrVendor, CancellationToken ct)
    {
        try
        {
            var effectiveVendor = string.IsNullOrWhiteSpace(ehrVendor) ? DefaultEhrVendor : ehrVendor;
            var templates = await _templates.GetActiveAsync(effectiveVendor, EhrTemplateCategory.QueryPlan, ct: ct);
            if (templates.Count == 0 && effectiveVendor != DefaultEhrVendor)
                templates = await _templates.GetActiveAsync(DefaultEhrVendor, EhrTemplateCategory.QueryPlan, ct: ct);

            if (templates.Count == 0) return;

            var queryPlans = templates
                .Select(t => JsonSerializer.Deserialize<QueryPlanDto>(t.DefinitionJson, _jsonOpts))
                .Where(p => p is not null)
                .Select(p => p!)
                .ToList();

            var payload = new QueryConfigPayload(facilityId, effectiveVendor, queryPlans);
            var response = await _dataAcqClient.SaveQueryConfigAsync(facilityId, payload, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Failed to save query config for {FacilityId}: {Error}", facilityId, err);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to inject query plan templates for {FacilityId}", facilityId);
        }
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

        // Templates are vendor-specific (see docs/ehr-vendor-templates-proposal.md).
        // Normalization operation creation is best-effort and never blocks this step:
        // the normalization service currently requires a forwarded bearer token
        // (IsLinkAdmin policy, see Auth gap in the proposal) that callers may not have,
        // so failures here are logged and the mapping the user entered is still saved.
        var context = new Dictionary<string, object?>
        {
            ["SourceSystem"] = request.SourceSystem,
            ["CodeMaps"] = request.Codes.ToDictionary(
                c => c.SourceCode,
                c => new NormCodeEntryDto { Code = c.TargetCode, Display = c.Display })
        };

        var templates = await GetNormalizationTemplatesAsync(session.EhrVendor, "Location", ct);
        foreach (var template in templates)
        {
            var response = await CreateOperationFromTemplateAsync(template, session.FacilityId, context, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("{TemplateName} could not be created for {FacilityId}: {Error}. Manual action may be needed.", template.Name, session.FacilityId, err);
            }
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

        // Templates are vendor-specific (see docs/ehr-vendor-templates-proposal.md).
        // Normalization operation creation is best-effort and never blocks this step:
        // the normalization service currently requires a forwarded bearer token
        // (IsLinkAdmin policy, see Auth gap in the proposal) that callers may not have,
        // so failures here are logged and the mapping the user entered is still saved.
        var context = new Dictionary<string, object?>
        {
            ["CodeSystemMaps"] = request.CodeSystemMaps.Select(csm => new NormCodeSystemMapDto
            {
                SourceSystem = csm.SourceSystem,
                TargetSystem = csm.TargetSystem,
                CodeMaps = csm.Codes.ToDictionary(
                    c => c.SourceCode,
                    c => new NormCodeEntryDto { Code = c.TargetCode, Display = c.Display })
            }).ToList()
        };

        var templates = await GetNormalizationTemplatesAsync(session.EhrVendor, "Encounter", ct);
        foreach (var template in templates)
        {
            var response = await CreateOperationFromTemplateAsync(template, session.FacilityId, context, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("{TemplateName} could not be created for {FacilityId}: {Error}. Manual action may be needed.", template.Name, session.FacilityId, err);
            }
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
