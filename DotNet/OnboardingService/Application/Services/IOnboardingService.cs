using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Models.Responses;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

namespace LantanaGroup.Link.OnboardingService.Application.Services;

public interface IOnboardingService
{
    Task<CreateSessionResponse> CreateSessionAsync(CreateSessionRequest request, string baseUrl, CancellationToken ct = default);
    Task<List<SessionResponse>> GetAllSessionsAsync(CancellationToken ct = default);
    Task<SessionResponse?> GetSessionAsync(string token, CancellationToken ct = default);
    Task<OnboardingSession?> ValidateTokenAsync(string token, CancellationToken ct = default);
    Task CompleteStepAsync(string token, string stepName, CancellationToken ct = default);
    Task SaveFormDataAsync(string token, Dictionary<string, string> fields, CancellationToken ct = default);
    Task SetVendorAsync(string token, string vendor, CancellationToken ct = default);
    Task SetFacilityIdAsync(string token, string facilityId, CancellationToken ct = default);
    Task CompleteOnboardingAsync(string token, CancellationToken ct = default);
}
