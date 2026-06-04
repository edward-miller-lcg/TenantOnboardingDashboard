using System.ComponentModel.DataAnnotations;

namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class FacilityInfoRequest
{
    [Required]
    public string OrganizationNames { get; set; } = string.Empty;

    [Required]
    public string TimeZone { get; set; } = string.Empty;

    [Required]
    public string PhysicalAddress { get; set; } = string.Empty;

    public string? TechnicalContactPhone { get; set; }
}
