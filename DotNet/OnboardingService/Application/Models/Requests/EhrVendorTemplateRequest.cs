using System.ComponentModel.DataAnnotations;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class EhrVendorTemplateRequest
{
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
}
