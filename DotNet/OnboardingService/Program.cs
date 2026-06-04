using LantanaGroup.Link.OnboardingService.Application.Services;
using LantanaGroup.Link.OnboardingService.Infrastructure.Clients;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data;
using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Repository;
using LantanaGroup.Link.OnboardingService.Settings;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console()
    .ReadFrom.Configuration(ctx.Configuration));

// Database
var connectionString = builder.Configuration.GetConnectionString("DatabaseConnection")
    ?? throw new InvalidOperationException("DatabaseConnection is required.");

builder.Services.AddDbContext<OnboardingDbContext>(options =>
    options.UseSqlServer(connectionString));

// Settings
builder.Services.Configure<ServiceRegistry>(
    builder.Configuration.GetSection(ServiceRegistry.ConfigSectionName));

// Repository & Services
builder.Services.AddScoped<IOnboardingRepository, OnboardingRepository>();
builder.Services.AddScoped<IOnboardingService, LantanaGroup.Link.OnboardingService.Application.Services.OnboardingService>();

// Link-cloud proxy clients
builder.Services.AddHttpClient<TenantServiceClient>();
builder.Services.AddHttpClient<DataAcquisitionClient>();
builder.Services.AddHttpClient<ReportServiceClient>();
builder.Services.AddHttpClient<NormalizationServiceClient>();

// API
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);

builder.Services.AddOpenApi();

// CORS — allow Angular dev server
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<OnboardingDbContext>();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OnboardingDbContext>();
    await db.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.MapOpenApi();
}

app.UseCors();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
