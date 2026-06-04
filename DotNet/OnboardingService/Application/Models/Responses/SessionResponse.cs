namespace LantanaGroup.Link.OnboardingService.Application.Models.Responses;

public class SessionResponse
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string NhsnOrgId { get; set; } = string.Empty;
    public string HealthSystemName { get; set; } = string.Empty;
    public string? FacilityId { get; set; }
    public string? EhrVendor { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Dictionary<string, bool> StepProgress { get; set; } = new();
    public Dictionary<string, string> FormData { get; set; } = new();
}

public class CreateSessionResponse
{
    public string Token { get; set; } = string.Empty;
    public string OnboardingUrl { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public string NhsnOrgId { get; set; } = string.Empty;
    public string HealthSystemName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ConnectionTestResponse
{
    public bool Success { get; set; }
    public string? ErrorDetails { get; set; }
}
