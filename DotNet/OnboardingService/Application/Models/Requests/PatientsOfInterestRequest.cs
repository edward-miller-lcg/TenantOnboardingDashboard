namespace LantanaGroup.Link.OnboardingService.Application.Models.Requests;

public class PatientsOfInterestEpicRequest
{
    public string PatientListIds { get; set; } = string.Empty;
}

public class PatientsOfInterestCernerRequest
{
    public string SftpUrl { get; set; } = string.Empty;
    public string SftpUsername { get; set; } = string.Empty;
    public string SftpPassword { get; set; } = string.Empty;
}
