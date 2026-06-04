using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data;

public class OnboardingDbContextFactory : IDesignTimeDbContextFactory<OnboardingDbContext>
{
    public OnboardingDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<OnboardingDbContext>();
        optionsBuilder.UseSqlServer(
            "Server=localhost,1433;Initial Catalog=link-onboarding;User ID=sa;Password=YourStrong@Passw0rd;Encrypt=True;TrustServerCertificate=True;");
        return new OnboardingDbContext(optionsBuilder.Options);
    }
}
