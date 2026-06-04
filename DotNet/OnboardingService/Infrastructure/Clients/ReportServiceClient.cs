using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.Extensions.Options;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

public class ReportServiceClient
{
    private readonly HttpClient _http;
    private readonly IOptions<ServiceRegistry> _registry;
    private readonly ILogger<ReportServiceClient> _logger;

    public ReportServiceClient(HttpClient http, IOptions<ServiceRegistry> registry, ILogger<ReportServiceClient> logger)
    {
        _http = http;
        _registry = registry;
        _logger = logger;
        _http.BaseAddress = new Uri(_registry.Value.ReportServiceUrl.TrimEnd('/') + "/");
    }

    public async Task<HttpResponseMessage> GenerateReportAsync(string facilityId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        _logger.LogInformation("Generating test report for facility {FacilityId}", facilityId);
        return await _http.PostAsJsonAsync($"api/report/{facilityId}/generate",
            new { StartDate = startDate, EndDate = endDate }, ct);
    }

    public async Task<HttpResponseMessage> GetReportsAsync(string facilityId, CancellationToken ct = default)
    {
        return await _http.GetAsync($"api/report/{facilityId}", ct);
    }

    public async Task<HttpResponseMessage> GetReportAsync(string facilityId, string reportId, CancellationToken ct = default)
    {
        return await _http.GetAsync($"api/report/{facilityId}/{reportId}", ct);
    }

    public async Task<HttpResponseMessage> HealthCheckAsync(CancellationToken ct = default)
    {
        return await _http.GetAsync("health", ct);
    }
}
