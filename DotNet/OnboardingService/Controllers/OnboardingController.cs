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

    [HttpGet]
    public async Task<IActionResult> GetSession(string token, CancellationToken ct)
    {
        var session = await _onboarding.GetSessionAsync(token, ct);
        if (session is null) return NotFound();
        return Ok(session);
    }

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

        var tenantResponse = await _tenantClient.CreateFacilityAsync(facilityModel, ct);
        if (!tenantResponse.IsSuccessStatusCode && tenantResponse.StatusCode != System.Net.HttpStatusCode.Conflict)
        {
            var error = await tenantResponse.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Tenant service returned {Status}: {Error}", tenantResponse.StatusCode, error);
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

        // Retrieve the FHIR base URL saved during Server Info
        var sessionData = await _onboarding.GetSessionAsync(token, ct);
        var fhirBaseUrl = sessionData?.FormData.GetValueOrDefault("FhirBaseUrl");

        if (string.IsNullOrWhiteSpace(fhirBaseUrl))
            return BadRequest(new { error = "FHIR base URL not configured. Please complete the Server Info step first." });

        // Test connectivity by fetching the FHIR CapabilityStatement (metadata)
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
                _logger.LogInformation("FHIR connection test succeeded: {StatusCode}", (int)response.StatusCode);
                return Ok(new ConnectionTestResponse { Success = true });
            }

            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("FHIR server returned {StatusCode} for {Url}", (int)response.StatusCode, metadataUrl);
            return Ok(new ConnectionTestResponse
            {
                Success = false,
                ErrorDetails = $"FHIR server returned HTTP {(int)response.StatusCode} ({response.ReasonPhrase}). " +
                               $"Verify the FHIR base URL and that the server is accessible.\n\nResponse:\n{body[..Math.Min(500, body.Length)]}"
            });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "FHIR connection test failed for {Url}", metadataUrl);
            return Ok(new ConnectionTestResponse
            {
                Success = false,
                ErrorDetails = $"Unable to reach FHIR server at {metadataUrl}.\n\nError: {ex.Message}\n\n" +
                               "Check that the URL is correct and accessible from the NHSNLink network."
            });
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("FHIR connection test timed out for {Url}", metadataUrl);
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

    [HttpPost("location-type-mapping")]
    public async Task<IActionResult> CompleteLocationTypeMapping(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteStepAsync(token, "LocationTypeMapping", ct);
        return Ok();
    }

    [HttpGet("encounter-type-mapping")]
    public async Task<IActionResult> GetEncounterTypeMapping(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        var value = await _onboarding.GetSessionAsync(token, ct);
        var mapJson = value?.FormData.GetValueOrDefault("EncounterTypeMapping");
        if (mapJson is null) return Ok(new EncounterTypeMappingRequest());

        var map = JsonSerializer.Deserialize<EncounterTypeMappingRequest>(mapJson);
        return Ok(map);
    }

    [HttpPost("encounter-type-mapping")]
    public async Task<IActionResult> SaveEncounterTypeMapping(string token, [FromBody] EncounterTypeMappingRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();

        await _onboarding.SaveFormDataAsync(token, new Dictionary<string, string>
        {
            ["EncounterTypeMapping"] = JsonSerializer.Serialize(request)
        }, ct);
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

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _reportClient.GetReportsAsync(session.FacilityId, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
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
        var content = await response.Content.ReadAsStringAsync(ct);

        if (response.IsSuccessStatusCode)
            await _onboarding.CompleteStepAsync(token, "TestReport", ct);

        return Content(content, "application/json");
    }

    [HttpGet("reports/{reportId}")]
    public async Task<IActionResult> GetReport(string token, string reportId, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _reportClient.GetReportAsync(session.FacilityId, reportId, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpGet("normalizations")]
    public async Task<IActionResult> GetNormalizations(string token, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.GetNormalizationsAsync(session.FacilityId, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return Content(content, "application/json");
    }

    [HttpPost("normalizations/code-map")]
    public async Task<IActionResult> CreateCodeMap(string token, [FromBody] CodeMapRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.CreateNormalizationAsync(session.FacilityId, new { Type = "CodeMap", Config = request }, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return StatusCode((int)response.StatusCode, content);
    }

    [HttpPut("normalizations/code-map/{id}")]
    public async Task<IActionResult> UpdateCodeMap(string token, string id, [FromBody] CodeMapRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.UpdateNormalizationAsync(session.FacilityId, id, new { Type = "CodeMap", Config = request }, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("normalizations/copy-property")]
    public async Task<IActionResult> CreateCopyProperty(string token, [FromBody] CopyPropertyRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.CreateNormalizationAsync(session.FacilityId, new { Type = "CopyProperty", Config = request }, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return StatusCode((int)response.StatusCode, content);
    }

    [HttpPut("normalizations/copy-property/{id}")]
    public async Task<IActionResult> UpdateCopyProperty(string token, string id, [FromBody] CopyPropertyRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.UpdateNormalizationAsync(session.FacilityId, id, new { Type = "CopyProperty", Config = request }, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("normalizations/conditional")]
    public async Task<IActionResult> CreateConditionalTransformation(string token, [FromBody] ConditionalTransformationRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.CreateNormalizationAsync(session.FacilityId, new { Type = "ConditionalTransformation", Config = request }, ct);
        var content = await response.Content.ReadAsStringAsync(ct);
        return StatusCode((int)response.StatusCode, content);
    }

    [HttpPut("normalizations/conditional/{id}")]
    public async Task<IActionResult> UpdateConditionalTransformation(string token, string id, [FromBody] ConditionalTransformationRequest request, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.UpdateNormalizationAsync(session.FacilityId, id, new { Type = "ConditionalTransformation", Config = request }, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpDelete("normalizations/{id}")]
    public async Task<IActionResult> DeleteNormalization(string token, string id, CancellationToken ct)
    {
        var session = await _onboarding.ValidateTokenAsync(token, ct);
        if (session is null) return NotFound();
        if (session.FacilityId is null) return BadRequest();

        var response = await _normClient.DeleteNormalizationAsync(session.FacilityId, id, ct);
        return StatusCode((int)response.StatusCode);
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompleteOnboarding(string token, CancellationToken ct)
    {
        if (await _onboarding.ValidateTokenAsync(token, ct) is null) return NotFound();
        await _onboarding.CompleteOnboardingAsync(token, ct);
        return Ok();
    }
}
