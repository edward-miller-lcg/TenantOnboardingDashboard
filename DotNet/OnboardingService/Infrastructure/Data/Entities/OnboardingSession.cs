using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

[Table("OnboardingSessions", Schema = "dbo")]
public class OnboardingSession
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string NhsnOrgId { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string HealthSystemName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FacilityId { get; set; }

    [MaxLength(50)]
    public string? EhrVendor { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "InProgress";

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ICollection<OnboardingStepProgress> StepProgress { get; set; } = new List<OnboardingStepProgress>();

    public ICollection<OnboardingFormData> FormData { get; set; } = new List<OnboardingFormData>();
}
