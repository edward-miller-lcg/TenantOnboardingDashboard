namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class CodeMapRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string FhirPath { get; set; } = string.Empty;
    public List<CodeSystemMap> CodeSystemMaps { get; set; } = new();
}

public class CopyPropertyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string SourceFhirPath { get; set; } = string.Empty;
    public string TargetFhirPath { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

public class ConditionalTransformationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string TargetFhirPath { get; set; } = string.Empty;
    public string TargetValue { get; set; } = string.Empty;
    public List<TransformationCondition> Conditions { get; set; } = new();
    public bool Enabled { get; set; } = true;
}

public class TransformationCondition
{
    public string FhirPath { get; set; } = string.Empty;
    public string Operator { get; set; } = "Equals";
    public string? Value { get; set; }
}
