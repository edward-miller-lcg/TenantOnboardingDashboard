using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace LantanaGroup.Link.OnboardingService.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IOnboardingService _onboarding;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IOnboardingService onboarding, ILogger<AdminController> logger)
    {
        _onboarding = onboarding;
        _logger = logger;
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var result = await _onboarding.CreateSessionAsync(request, baseUrl, ct);
        return Ok(result);
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions(CancellationToken ct)
    {
        var sessions = await _onboarding.GetAllSessionsAsync(ct);
        return Ok(sessions);
    }
}
