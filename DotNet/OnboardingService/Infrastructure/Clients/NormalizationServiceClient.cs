using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.Extensions.Options;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

public class NormalizationServiceClient
{
    private readonly HttpClient _http;
    private readonly IOptions<ServiceRegistry> _registry;
    private readonly ILogger<NormalizationServiceClient> _logger;

    public NormalizationServiceClient(HttpClient http, IOptions<ServiceRegistry> registry, ILogger<NormalizationServiceClient> logger)
    {
        _http = http;
        _registry = registry;
        _logger = logger;
        _http.BaseAddress = new Uri(_registry.Value.NormalizationServiceUrl.TrimEnd('/') + "/");
    }

    public async Task<HttpResponseMessage> GetNormalizationsAsync(string facilityId, CancellationToken ct = default)
    {
        return await _http.GetAsync($"api/normalization/{facilityId}/config", ct);
    }

    public async Task<HttpResponseMessage> CreateNormalizationAsync(string facilityId, object config, CancellationToken ct = default)
    {
        _logger.LogInformation("Creating normalization for facility {FacilityId}", facilityId);
        return await _http.PostAsJsonAsync($"api/normalization/{facilityId}/config", config, ct);
    }

    public async Task<HttpResponseMessage> UpdateNormalizationAsync(string facilityId, string id, object config, CancellationToken ct = default)
    {
        return await _http.PutAsJsonAsync($"api/normalization/{facilityId}/config/{id}", config, ct);
    }

    public async Task<HttpResponseMessage> DeleteNormalizationAsync(string facilityId, string id, CancellationToken ct = default)
    {
        return await _http.DeleteAsync($"api/normalization/{facilityId}/config/{id}", ct);
    }

    public async Task<HttpResponseMessage> HealthCheckAsync(CancellationToken ct = default)
    {
        return await _http.GetAsync("health", ct);
    }
}
