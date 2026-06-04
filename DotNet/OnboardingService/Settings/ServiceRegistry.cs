namespace LantanaGroup.Link.OnboardingService.Settings;

public class ServiceRegistry
{
    public const string ConfigSectionName = "ServiceRegistry";

    public string TenantServiceUrl { get; set; } = string.Empty;
    public string DataAcquisitionServiceUrl { get; set; } = string.Empty;
    public string ReportServiceUrl { get; set; } = string.Empty;
    public string NormalizationServiceUrl { get; set; } = string.Empty;
}
