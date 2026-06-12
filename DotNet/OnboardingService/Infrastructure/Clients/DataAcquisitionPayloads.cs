namespace LantanaGroup.Link.OnboardingService.Infrastructure.Clients;

// ---------------------------------------------------------------------------
// Draft payload sent to DataAcquisitionClient.SaveQueryConfigAsync. Shape is
// provisional pending confirmation from the Data Acquisition team — see
// docs/ehr-vendor-templates-proposal.md.
// ---------------------------------------------------------------------------

public record QueryConfigPayload(
    string FacilityId,
    string EhrVendor,
    List<QueryPlanDto> QueryPlans);

public class QueryPlanDto
{
    public string ResourceType { get; init; } = string.Empty;
    public string QueryType { get; init; } = "Initial";
    public Dictionary<string, string> SearchParameters { get; init; } = new();
    public string? Frequency { get; init; }
    public bool Enabled { get; init; } = true;
}
