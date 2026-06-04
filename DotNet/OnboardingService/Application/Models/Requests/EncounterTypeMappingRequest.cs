namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class EncounterTypeMappingRequest
{
    public string ResourceType { get; set; } = "Encounter";
    public string FhirPath { get; set; } = "type";
    public List<CodeSystemMap> CodeSystemMaps { get; set; } = new();
}

public class CodeSystemMap
{
    public string SourceSystem { get; set; } = string.Empty;
    public string TargetSystem { get; set; } = "http://snomed.info/sct";
    public List<CodeEntry> Codes { get; set; } = new();
}

public class CodeEntry
{
    public string SourceCode { get; set; } = string.Empty;
    public string TargetCode { get; set; } = string.Empty;
    public string Display { get; set; } = string.Empty;
}
