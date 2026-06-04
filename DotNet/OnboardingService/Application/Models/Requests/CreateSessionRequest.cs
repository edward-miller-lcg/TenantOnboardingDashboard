using System.ComponentModel.DataAnnotations;

namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class CreateSessionRequest
{
    [Required]
    public string NhsnOrgId { get; set; } = string.Empty;

    [Required]
    public string HealthSystemName { get; set; } = string.Empty;
}
