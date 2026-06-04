using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.Extensions.Options;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

public class DataAcquisitionClient
{
    private readonly HttpClient _http;
    private readonly IOptions<ServiceRegistry> _registry;
    private readonly ILogger<DataAcquisitionClient> _logger;

    public DataAcquisitionClient(HttpClient http, IOptions<ServiceRegistry> registry, ILogger<DataAcquisitionClient> logger)
    {
        _http = http;
        _registry = registry;
        _logger = logger;
        _http.BaseAddress = new Uri(_registry.Value.DataAcquisitionServiceUrl.TrimEnd('/') + "/");
    }

    public async Task<HttpResponseMessage> TestConnectionAsync(string facilityId, string patientFhirId, CancellationToken ct = default)
    {
        _logger.LogInformation("Testing FHIR connection for facility {FacilityId}", facilityId);
        return await _http.PostAsJsonAsync($"api/dataAcquisition/{facilityId}/testConnection",
            new { PatientFhirId = patientFhirId }, ct);
    }

    public async Task<HttpResponseMessage> SaveQueryConfigAsync(string facilityId, object config, CancellationToken ct = default)
    {
        return await _http.PostAsJsonAsync($"api/dataAcquisition/queryConfig/{facilityId}", config, ct);
    }

    public async Task<HttpResponseMessage> SaveSftpConfigAsync(string facilityId, object config, CancellationToken ct = default)
    {
        return await _http.PostAsJsonAsync($"api/dataAcquisition/sftp/{facilityId}", config, ct);
    }

    public async Task<HttpResponseMessage> HealthCheckAsync(CancellationToken ct = default)
    {
        return await _http.GetAsync("health", ct);
    }
}
