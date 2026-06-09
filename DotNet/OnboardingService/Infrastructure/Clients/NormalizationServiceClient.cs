using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

public class NormalizationServiceClient
{
    private readonly HttpClient _http;
    private readonly IOptions<ServiceRegistry> _registry;
    private readonly ILogger<NormalizationServiceClient> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public NormalizationServiceClient(
        HttpClient http,
        IOptions<ServiceRegistry> registry,
        ILogger<NormalizationServiceClient> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _http = http;
        _registry = registry;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _http.BaseAddress = new Uri(_registry.Value.NormalizationServiceUrl.TrimEnd('/') + "/");
    }

    private HttpRequestMessage NewRequest(HttpMethod method, string relativeUrl, object? body = null)
    {
        var request = new HttpRequestMessage(method, relativeUrl);

        // Forward the caller's bearer token so the normalization service (IsLinkAdmin policy) accepts the request.
        // Replace with client-credentials flow once a service account is provisioned.
        var auth = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(auth))
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(auth);

        if (body != null)
            request.Content = JsonContent.Create(body);

        return request;
    }

    public async Task<HttpResponseMessage> GetOperationsAsync(string facilityId, CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching operations for facility {FacilityId}", facilityId);
        return await _http.SendAsync(
            NewRequest(HttpMethod.Get,
                $"api/normalization/operations?facilityId={Uri.EscapeDataString(facilityId)}&pageSize=100"),
            ct);
    }

    public async Task<HttpResponseMessage> CreateOperationAsync(object payload, CancellationToken ct = default)
    {
        _logger.LogInformation("Creating normalization operation");
        return await _http.SendAsync(NewRequest(HttpMethod.Post, "api/normalization/operations", payload), ct);
    }

    public async Task<HttpResponseMessage> UpdateOperationAsync(object payload, CancellationToken ct = default)
    {
        return await _http.SendAsync(NewRequest(HttpMethod.Put, "api/normalization/operations", payload), ct);
    }

    public async Task<HttpResponseMessage> DeleteOperationAsync(string facilityId, Guid operationId, CancellationToken ct = default)
    {
        _logger.LogInformation("Deleting operation {OperationId} for facility {FacilityId}", operationId, facilityId);
        return await _http.SendAsync(
            NewRequest(HttpMethod.Delete,
                $"api/normalization/operations/facility/{Uri.EscapeDataString(facilityId)}?operationId={operationId}"),
            ct);
    }

    public async Task<HttpResponseMessage> GetResourceTypesAsync(CancellationToken ct = default)
    {
        return await _http.SendAsync(NewRequest(HttpMethod.Get, "api/normalization/resource/resources"), ct);
    }

    public async Task<HttpResponseMessage> HealthCheckAsync(CancellationToken ct = default)
        => await _http.GetAsync("health", ct);
}
