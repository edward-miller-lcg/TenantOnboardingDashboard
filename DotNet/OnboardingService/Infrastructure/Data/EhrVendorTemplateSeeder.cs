using LantanaGroup.Link.OnboardingService.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace LantanaGroup.Link.OnboardingService.Infrastructure.Data;

// ---------------------------------------------------------------------------
// Seeds the Epic vendor templates extracted from the previously-hardcoded
// operations in OnboardingController (HSLOC location mapping, SNOMED
// encounter mapping) plus a draft Patient query plan. Runs once on startup;
// no-ops if Epic templates already exist.
// ---------------------------------------------------------------------------
public static class EhrVendorTemplateSeeder
{
    public static async Task SeedAsync(OnboardingDbContext db, CancellationToken ct = default)
    {
        if (await db.EhrVendorTemplates.AnyAsync(t => t.Vendor == "Epic", ct))
            return;

        var now = DateTime.UtcNow;

        db.EhrVendorTemplates.AddRange(
            new EhrVendorTemplate
            {
                Vendor = "Epic",
                Category = EhrTemplateCategory.Normalization,
                ResourceType = "Location",
                Name = "Map Location Identifier to HSLOC",
                Description = "Translates Epic location identifier codes to CDC NHSN HSLOC codes.",
                Sequence = 10,
                IsActive = true,
                CreatedAt = now,
                DefinitionJson = """
                {
                  "OperationType": "CodeMap",
                  "Name": "Map Location Identifier to HSLOC",
                  "Description": "Translates Epic location identifier codes to CDC NHSN HSLOC codes.",
                  "FhirPath": "Location.identifier.value",
                  "CodeSystemMaps": [
                    {
                      "SourceSystem": "${SourceSystem}",
                      "TargetSystem": "https://www.cdc.gov/nhsn/cdaportal/terminology/codesystem/hsloc.html",
                      "CodeMaps": "${CodeMaps}"
                    }
                  ]
                }
                """
            },
            new EhrVendorTemplate
            {
                Vendor = "Epic",
                Category = EhrTemplateCategory.Normalization,
                ResourceType = "Location",
                Name = "Copy Location Identifier to Type",
                Description = "Promotes mapped HSLOC identifiers into Location.type as a CodeableConcept.",
                Sequence = 20,
                IsActive = true,
                CreatedAt = now,
                DefinitionJson = """
                {
                  "OperationType": "CopyLocation",
                  "Name": "Copy Location Identifier to Type",
                  "Description": "Promotes mapped HSLOC identifiers into Location.type as a CodeableConcept."
                }
                """
            },
            new EhrVendorTemplate
            {
                Vendor = "Epic",
                Category = EhrTemplateCategory.Normalization,
                ResourceType = "Encounter",
                Name = "Map Encounter Type to SNOMED",
                Description = "Translates Epic encounter type codes to SNOMED CT for NHSN reporting.",
                Sequence = 10,
                IsActive = true,
                CreatedAt = now,
                DefinitionJson = """
                {
                  "OperationType": "CodeMap",
                  "Name": "Map Encounter Type to SNOMED",
                  "Description": "Translates Epic encounter type codes to SNOMED CT for NHSN reporting.",
                  "FhirPath": "Encounter.type.coding",
                  "CodeSystemMaps": "${CodeSystemMaps}"
                }
                """
            },
            new EhrVendorTemplate
            {
                Vendor = "Epic",
                Category = EhrTemplateCategory.Normalization,
                ResourceType = "Encounter",
                Name = "Set Encounter Status to Finished",
                Description = "Sets Encounter.status to 'finished' when a period end date is present.",
                Sequence = 20,
                IsActive = true,
                CreatedAt = now,
                DefinitionJson = """
                {
                  "OperationType": "ConditionalTransform",
                  "Name": "Set Encounter Status to Finished",
                  "Description": "Sets Encounter.status to 'finished' when a period end date is present.",
                  "TargetFhirPath": "Encounter.status",
                  "TargetValue": "finished",
                  "Conditions": [
                    { "FhirPathSource": "Encounter.period.end", "Operator": "Exists", "Value": null }
                  ]
                }
                """
            },
            new EhrVendorTemplate
            {
                Vendor = "Epic",
                Category = EhrTemplateCategory.QueryPlan,
                ResourceType = "Patient",
                Name = "Initial Patient Query",
                Description = "Draft initial Patient query plan for Epic facilities (DataAcquisition team to confirm shape).",
                Sequence = 10,
                IsActive = true,
                CreatedAt = now,
                DefinitionJson = """
                {
                  "ResourceType": "Patient",
                  "QueryType": "Initial",
                  "SearchParameters": { "_id": "${PatientFhirId}" },
                  "Frequency": null,
                  "Enabled": true
                }
                """
            });

        await db.SaveChangesAsync(ct);
    }
}
