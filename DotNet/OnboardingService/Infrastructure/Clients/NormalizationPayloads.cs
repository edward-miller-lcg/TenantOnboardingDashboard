namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

// ---------------------------------------------------------------------------
// Payloads sent to the normalization service's new operations API.
// Field names match the normalization service's PostOperationModel /
// PutOperationModel exactly, including the OperationType discriminator that
// OperationConverter uses to select the concrete IOperation type.
// ---------------------------------------------------------------------------

public record NormCreatePayload(
    List<string> ResourceTypes,
    string FacilityId,
    object Operation);

public record NormUpdatePayload(
    Guid Id,
    List<string> ResourceTypes,
    string FacilityId,
    bool IsDisabled,
    object Operation);

// ---- operation shapes ----

public class NormCodeMapDto
{
    public string OperationType => "CodeMap";
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string FhirPath { get; init; } = string.Empty;
    public List<NormCodeSystemMapDto> CodeSystemMaps { get; init; } = new();
}

public class NormCodeSystemMapDto
{
    public string SourceSystem { get; init; } = string.Empty;
    public string TargetSystem { get; init; } = string.Empty;
    // key = source code, value = { Code, Display }
    public Dictionary<string, NormCodeEntryDto> CodeMaps { get; init; } = new();
}

public class NormCodeEntryDto
{
    public string Code { get; init; } = string.Empty;
    public string Display { get; init; } = string.Empty;
}

public class NormCopyPropertyDto
{
    public string OperationType => "CopyProperty";
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string SourceFhirPath { get; init; } = string.Empty;
    public string TargetFhirPath { get; init; } = string.Empty;
}

public class NormConditionalTransformDto
{
    public string OperationType => "ConditionalTransform";
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string TargetFhirPath { get; init; } = string.Empty;
    public string TargetValue { get; init; } = string.Empty;
    public List<NormConditionDto> Conditions { get; init; } = new();
}

public class NormConditionDto
{
    public string FhirPathSource { get; init; } = string.Empty;
    public string Operator { get; init; } = string.Empty;
    public string? Value { get; init; }
}

public class NormCopyLocationDto
{
    public string OperationType => "CopyLocation";
    public string Name { get; init; } = "Copy Location Identifier to Type";
    public string Description { get; init; } = string.Empty;
}

public class NormRemoveExtensionsDto
{
    public string OperationType => "RemoveExtensions";
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public List<string> ExtensionUrls { get; init; } = new();
}
