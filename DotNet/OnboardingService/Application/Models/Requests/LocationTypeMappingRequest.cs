namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class LocationTypeMappingRequest
{
    /// <summary>
    /// The Epic location identifier system URI (e.g. "urn:epic:location:identifier").
    /// </summary>
    public string SourceSystem { get; set; } = string.Empty;

    /// <summary>
    /// Epic location code → HSLOC code mappings.
    /// </summary>
    public List<CodeEntry> Codes { get; set; } = new();
}
