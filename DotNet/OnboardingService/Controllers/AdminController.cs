using LantanaGroup.Link.OnboardingService.Application.Models.Requests;
using LantanaGroup.Link.OnboardingService.Application.Services;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;
using Microsoft.AspNetCore.Mvc;

namespace LantanaGroup.Link.OnboardingService.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IOnboardingService _onboarding;
    private readonly IEhrVendorTemplateRepository _templates;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IOnboardingService onboarding, IEhrVendorTemplateRepository templates, ILogger<AdminController> logger)
    {
        _onboarding = onboarding;
        _templates = templates;
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

    [HttpGet("ehr-templates")]
    public async Task<IActionResult> GetEhrTemplates([FromQuery] string? vendor, [FromQuery] EhrTemplateCategory? category, CancellationToken ct)
    {
        var templates = await _templates.GetAllAsync(vendor, category, ct);
        return Ok(templates);
    }

    [HttpGet("ehr-templates/vendors")]
    public async Task<IActionResult> GetEhrTemplateVendors(CancellationToken ct)
    {
        var vendors = await _templates.GetDistinctVendorsAsync(ct);
        return Ok(vendors);
    }

    [HttpGet("ehr-templates/{id:guid}")]
    public async Task<IActionResult> GetEhrTemplate(Guid id, CancellationToken ct)
    {
        var template = await _templates.GetByIdAsync(id, ct);
        return template is null ? NotFound() : Ok(template);
    }

    [HttpPost("ehr-templates")]
    public async Task<IActionResult> CreateEhrTemplate([FromBody] EhrVendorTemplateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var template = new EhrVendorTemplate
        {
            Vendor = request.Vendor,
            Category = request.Category,
            ResourceType = request.ResourceType,
            Name = request.Name,
            Description = request.Description,
            DefinitionJson = request.DefinitionJson,
            Sequence = request.Sequence,
            IsActive = request.IsActive
        };

        var created = await _templates.CreateAsync(template, ct);
        return Ok(created);
    }

    [HttpPut("ehr-templates/{id:guid}")]
    public async Task<IActionResult> UpdateEhrTemplate(Guid id, [FromBody] EhrVendorTemplateRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var template = await _templates.GetByIdAsync(id, ct);
        if (template is null) return NotFound();

        template.Vendor = request.Vendor;
        template.Category = request.Category;
        template.ResourceType = request.ResourceType;
        template.Name = request.Name;
        template.Description = request.Description;
        template.DefinitionJson = request.DefinitionJson;
        template.Sequence = request.Sequence;
        template.IsActive = request.IsActive;

        await _templates.UpdateAsync(template, ct);
        return Ok(template);
    }

    [HttpDelete("ehr-templates/{id:guid}")]
    public async Task<IActionResult> DeleteEhrTemplate(Guid id, CancellationToken ct)
    {
        await _templates.DeleteAsync(id, ct);
        return NoContent();
    }
}
