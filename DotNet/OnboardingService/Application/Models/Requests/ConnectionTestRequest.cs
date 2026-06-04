using System.ComponentModel.DataAnnotations;

namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class ConnectionTestRequest
{
    [Required]
    public string PatientFhirId { get; set; } = string.Empty;
}
