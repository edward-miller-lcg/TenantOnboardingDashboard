using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;

[Table("OnboardingFormData", Schema = "dbo")]
public class OnboardingFormData
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid SessionId { get; set; }

    [ForeignKey(nameof(SessionId))]
    public OnboardingSession Session { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string FieldKey { get; set; } = string.Empty;

    public string? FieldValue { get; set; }
}
