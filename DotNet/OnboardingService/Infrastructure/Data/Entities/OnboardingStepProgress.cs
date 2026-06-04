using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

[Table("OnboardingStepProgress", Schema = "dbo")]
public class OnboardingStepProgress
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid SessionId { get; set; }

    [ForeignKey(nameof(SessionId))]
    public OnboardingSession Session { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string StepName { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }
}
