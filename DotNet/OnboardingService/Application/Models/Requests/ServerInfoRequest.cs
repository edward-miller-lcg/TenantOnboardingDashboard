using System.ComponentModel.DataAnnotations;

namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class ServerInfoRequest
{
    [Required]
    [Url]
    public string FhirBaseUrl { get; set; } = string.Empty;

    [Required]
    public string EhrVendor { get; set; } = string.Empty;
}
