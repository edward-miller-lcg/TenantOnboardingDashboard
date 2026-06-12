using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;

public interface IEhrVendorTemplateRepository
{
    Task<List<EhrVendorTemplate>> GetAllAsync(string? vendor, EhrTemplateCategory? category, CancellationToken ct = default);
    Task<EhrVendorTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<EhrVendorTemplate>> GetActiveAsync(string vendor, EhrTemplateCategory category, string? resourceType = null, CancellationToken ct = default);
    Task<List<string>> GetDistinctVendorsAsync(CancellationToken ct = default);
    Task<EhrVendorTemplate> CreateAsync(EhrVendorTemplate template, CancellationToken ct = default);
    Task UpdateAsync(EhrVendorTemplate template, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
