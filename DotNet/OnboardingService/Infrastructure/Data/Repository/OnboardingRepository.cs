using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;

public class OnboardingRepository : IOnboardingRepository
{
    private readonly OnboardingDbContext _db;

    public OnboardingRepository(OnboardingDbContext db) => _db = db;

    public Task<OnboardingSession?> GetByTokenAsync(string token, CancellationToken ct = default) =>
        _db.OnboardingSessions
           .Include(s => s.StepProgress)
           .Include(s => s.FormData)
           .FirstOrDefaultAsync(s => s.Token == token, ct);

    public Task<OnboardingSession?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.OnboardingSessions
           .Include(s => s.StepProgress)
           .Include(s => s.FormData)
           .FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<List<OnboardingSession>> GetAllAsync(CancellationToken ct = default) =>
        _db.OnboardingSessions
           .Include(s => s.StepProgress)
           .OrderByDescending(s => s.CreatedAt)
           .ToListAsync(ct);

    public async Task<OnboardingSession> CreateAsync(OnboardingSession session, CancellationToken ct = default)
    {
        session.Id = Guid.NewGuid();
        session.CreatedAt = DateTime.UtcNow;
        _db.OnboardingSessions.Add(session);
        await _db.SaveChangesAsync(ct);
        return session;
    }

    public async Task UpdateAsync(OnboardingSession session, CancellationToken ct = default)
    {
        session.UpdatedAt = DateTime.UtcNow;
        _db.OnboardingSessions.Update(session);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string?> GetFormValueAsync(Guid sessionId, string key, CancellationToken ct = default)
    {
        var entry = await _db.OnboardingFormData
            .FirstOrDefaultAsync(d => d.SessionId == sessionId && d.FieldKey == key, ct);
        return entry?.FieldValue;
    }

    public async Task SetFormValueAsync(Guid sessionId, string key, string value, CancellationToken ct = default)
    {
        var entry = await _db.OnboardingFormData
            .FirstOrDefaultAsync(d => d.SessionId == sessionId && d.FieldKey == key, ct);

        if (entry is null)
        {
            _db.OnboardingFormData.Add(new OnboardingFormData
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                FieldKey = key,
                FieldValue = value
            });
        }
        else
        {
            entry.FieldValue = value;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task<Dictionary<string, string>> GetAllFormDataAsync(Guid sessionId, CancellationToken ct = default)
    {
        var entries = await _db.OnboardingFormData
            .Where(d => d.SessionId == sessionId)
            .ToListAsync(ct);
        return entries
            .Where(e => e.FieldValue is not null)
            .ToDictionary(e => e.FieldKey, e => e.FieldValue!);
    }

    public async Task SetStepCompletedAsync(Guid sessionId, string stepName, CancellationToken ct = default)
    {
        var step = await _db.OnboardingStepProgress
            .FirstOrDefaultAsync(s => s.SessionId == sessionId && s.StepName == stepName, ct);

        if (step is null)
        {
            _db.OnboardingStepProgress.Add(new OnboardingStepProgress
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                StepName = stepName,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow
            });
        }
        else
        {
            step.IsCompleted = true;
            step.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }
}
