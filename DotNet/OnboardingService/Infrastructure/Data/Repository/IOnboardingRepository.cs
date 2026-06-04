using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;

public interface IOnboardingRepository
{
    Task<OnboardingSession?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<OnboardingSession?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<OnboardingSession>> GetAllAsync(CancellationToken ct = default);
    Task<OnboardingSession> CreateAsync(OnboardingSession session, CancellationToken ct = default);
    Task UpdateAsync(OnboardingSession session, CancellationToken ct = default);
    Task<string?> GetFormValueAsync(Guid sessionId, string key, CancellationToken ct = default);
    Task SetFormValueAsync(Guid sessionId, string key, string value, CancellationToken ct = default);
    Task<Dictionary<string, string>> GetAllFormDataAsync(Guid sessionId, CancellationToken ct = default);
    Task SetStepCompletedAsync(Guid sessionId, string stepName, CancellationToken ct = default);
}
