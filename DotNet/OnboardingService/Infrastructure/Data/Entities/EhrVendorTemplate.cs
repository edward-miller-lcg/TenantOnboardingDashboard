using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

public enum EhrTemplateCategory
{
    Normalization = 0,
    QueryPlan = 1
}

[Table("EhrVendorTemplates", Schema = "dbo")]
public class EhrVendorTemplate
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Vendor { get; set; } = string.Empty;

    [Required]
    public EhrTemplateCategory Category { get; set; }

    [Required]
    [MaxLength(50)]
    public string ResourceType { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public string DefinitionJson { get; set; } = "{}";

    public int Sequence { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
