using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Models.Responses;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;

namespace LantanaGroup.Link.OnboardingService.Application.Services;

public class OnboardingService : IOnboardingService
{
    private readonly IOnboardingRepository _repo;
    private readonly ILogger<OnboardingService> _logger;

    public OnboardingService(IOnboardingRepository repo, ILogger<OnboardingService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<CreateSessionResponse> CreateSessionAsync(CreateSessionRequest request, string baseUrl, CancellationToken ct = default)
    {
        var token = Guid.NewGuid().ToString("N");
        var session = new OnboardingSession
        {
            Token = token,
            NhsnOrgId = request.NhsnOrgId,
            HealthSystemName = request.HealthSystemName,
            Status = "InProgress"
        };

        await _repo.CreateAsync(session, ct);
        _logger.LogInformation("Created onboarding session {Token} for {NhsnOrgId}", token, request.NhsnOrgId);

        return new CreateSessionResponse
        {
            Token = token,
            OnboardingUrl = $"{baseUrl.TrimEnd('/')}/onboarding/{token}",
            SessionId = session.Id,
            NhsnOrgId = session.NhsnOrgId,
            HealthSystemName = session.HealthSystemName,
            CreatedAt = session.CreatedAt
        };
    }

    public async Task<List<SessionResponse>> GetAllSessionsAsync(CancellationToken ct = default)
    {
        var sessions = await _repo.GetAllAsync(ct);
        return sessions.Select(MapToResponse).ToList();
    }

    public async Task<SessionResponse?> GetSessionAsync(string token, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct);
        return session is null ? null : MapToResponse(session);
    }

    public async Task<OnboardingSession?> ValidateTokenAsync(string token, CancellationToken ct = default)
    {
        return await _repo.GetByTokenAsync(token, ct);
    }

    public async Task CompleteStepAsync(string token, string stepName, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct)
            ?? throw new KeyNotFoundException($"Session not found: {token}");
        await _repo.SetStepCompletedAsync(session.Id, stepName, ct);
        _logger.LogInformation("Completed step {Step} for session {Token}", stepName, token);
    }

    public async Task SaveFormDataAsync(string token, Dictionary<string, string> fields, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct)
            ?? throw new KeyNotFoundException($"Session not found: {token}");

        foreach (var (key, value) in fields)
            await _repo.SetFormValueAsync(session.Id, key, value, ct);
    }

    public async Task SetVendorAsync(string token, string vendor, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct)
            ?? throw new KeyNotFoundException($"Session not found: {token}");
        session.EhrVendor = vendor;
        await _repo.UpdateAsync(session, ct);
    }

    public async Task SetFacilityIdAsync(string token, string facilityId, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct)
            ?? throw new KeyNotFoundException($"Session not found: {token}");
        session.FacilityId = facilityId;
        await _repo.UpdateAsync(session, ct);
    }

    public async Task CompleteOnboardingAsync(string token, CancellationToken ct = default)
    {
        var session = await _repo.GetByTokenAsync(token, ct)
            ?? throw new KeyNotFoundException($"Session not found: {token}");
        session.Status = "Completed";
        session.CompletedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(session, ct);
        _logger.LogInformation("Onboarding completed for session {Token}", token);
    }

    private static SessionResponse MapToResponse(OnboardingSession session)
    {
        return new SessionResponse
        {
            Id = session.Id,
            Token = session.Token,
            NhsnOrgId = session.NhsnOrgId,
            HealthSystemName = session.HealthSystemName,
            FacilityId = session.FacilityId,
            EhrVendor = session.EhrVendor,
            Status = session.Status,
            CreatedAt = session.CreatedAt,
            CompletedAt = session.CompletedAt,
            StepProgress = session.StepProgress.ToDictionary(s => s.StepName, s => s.IsCompleted),
            FormData = session.FormData
                .Where(d => d.FieldValue is not null)
                .ToDictionary(d => d.FieldKey, d => d.FieldValue!)
        };
    }
}
