using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data;

public class OnboardingDbContext : DbContext
{
    public OnboardingDbContext(DbContextOptions<OnboardingDbContext> options) : base(options) { }

    public DbSet<OnboardingSession> OnboardingSessions => Set<OnboardingSession>();
    public DbSet<OnboardingStepProgress> OnboardingStepProgress => Set<OnboardingStepProgress>();
    public DbSet<OnboardingFormData> OnboardingFormData => Set<OnboardingFormData>();
    public DbSet<EhrVendorTemplate> EhrVendorTemplates => Set<EhrVendorTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OnboardingSession>(entity =>
        {
            entity.HasKey(e => e.Id).IsClustered(false);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasIndex(e => e.Token).IsUnique();
        });

        modelBuilder.Entity<OnboardingStepProgress>(entity =>
        {
            entity.HasKey(e => e.Id).IsClustered(false);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasOne(e => e.Session)
                  .WithMany(s => s.StepProgress)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OnboardingFormData>(entity =>
        {
            entity.HasKey(e => e.Id).IsClustered(false);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasOne(e => e.Session)
                  .WithMany(s => s.FormData)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EhrVendorTemplate>(entity =>
        {
            entity.HasKey(e => e.Id).IsClustered(false);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Category).HasConversion<string>().HasMaxLength(50);
            entity.HasIndex(e => new { e.Vendor, e.Category, e.ResourceType, e.IsActive });
        });
    }
}
