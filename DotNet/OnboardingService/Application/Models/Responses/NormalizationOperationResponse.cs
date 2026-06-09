namespace LantanaGroup.Link.OnboardingService.Application.Models.Responses;

/// <summary>
/// Projected view of a normalization operation returned to the onboarding UI.
/// </summary>
public class NormalizationOperationResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
    public List<string> ResourceTypes { get; set; } = new();
    public bool IsDisabled { get; set; }
    public bool CanDelete { get; set; } = true;
}
