using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;

public class EhrVendorTemplateRepository : IEhrVendorTemplateRepository
{
    private readonly OnboardingDbContext _db;

    public EhrVendorTemplateRepository(OnboardingDbContext db) => _db = db;

    public async Task<List<EhrVendorTemplate>> GetAllAsync(string? vendor, EhrTemplateCategory? category, CancellationToken ct = default)
    {
        var query = _db.EhrVendorTemplates.AsQueryable();

        if (!string.IsNullOrWhiteSpace(vendor))
            query = query.Where(t => t.Vendor == vendor);

        if (category.HasValue)
            query = query.Where(t => t.Category == category.Value);

        return await query
            .OrderBy(t => t.Vendor)
            .ThenBy(t => t.Category)
            .ThenBy(t => t.ResourceType)
            .ThenBy(t => t.Sequence)
            .ToListAsync(ct);
    }

    public Task<EhrVendorTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.EhrVendorTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<List<EhrVendorTemplate>> GetActiveAsync(string vendor, EhrTemplateCategory category, string? resourceType = null, CancellationToken ct = default)
    {
        var query = _db.EhrVendorTemplates
            .Where(t => t.Vendor == vendor && t.Category == category && t.IsActive);

        if (!string.IsNullOrWhiteSpace(resourceType))
            query = query.Where(t => t.ResourceType == resourceType);

        return query.OrderBy(t => t.Sequence).ToListAsync(ct);
    }

    public Task<List<string>> GetDistinctVendorsAsync(CancellationToken ct = default) =>
        _db.EhrVendorTemplates.Select(t => t.Vendor).Distinct().OrderBy(v => v).ToListAsync(ct);

    public async Task<EhrVendorTemplate> CreateAsync(EhrVendorTemplate template, CancellationToken ct = default)
    {
        template.Id = Guid.NewGuid();
        template.CreatedAt = DateTime.UtcNow;
        _db.EhrVendorTemplates.Add(template);
        await _db.SaveChangesAsync(ct);
        return template;
    }

    public async Task UpdateAsync(EhrVendorTemplate template, CancellationToken ct = default)
    {
        template.UpdatedAt = DateTime.UtcNow;
        _db.EhrVendorTemplates.Update(template);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.EhrVendorTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entity is null) return;
        _db.EhrVendorTemplates.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}
