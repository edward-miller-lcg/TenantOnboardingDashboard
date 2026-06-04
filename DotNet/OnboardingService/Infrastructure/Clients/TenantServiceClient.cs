using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.Extensions.Options;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

public class TenantServiceClient
{
    private readonly HttpClient _http;
    private readonly IOptions<ServiceRegistry> _registry;
    private readonly ILogger<TenantServiceClient> _logger;

    public TenantServiceClient(HttpClient http, IOptions<ServiceRegistry> registry, ILogger<TenantServiceClient> logger)
    {
        _http = http;
        _registry = registry;
        _logger = logger;
        _http.BaseAddress = new Uri(_registry.Value.TenantServiceUrl.TrimEnd('/') + "/");
    }

    public async Task<HttpResponseMessage> CreateFacilityAsync(object facilityModel, CancellationToken ct = default)
    {
        _logger.LogInformation("Creating facility in Tenant service");
        return await _http.PostAsJsonAsync("api/facility", facilityModel, ct);
    }

    public async Task<HttpResponseMessage> GetFacilityAsync(string facilityId, CancellationToken ct = default)
    {
        return await _http.GetAsync($"api/facility/{facilityId}", ct);
    }

    public async Task<HttpResponseMessage> HealthCheckAsync(CancellationToken ct = default)
    {
        return await _http.GetAsync("health", ct);
    }
}
