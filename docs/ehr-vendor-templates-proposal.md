# EHR Vendor Templates — Admin Configuration Proposal

> Status: **implemented**. Tracks the "configure the configuration" initiative — managing per-EHR-vendor (Epic, Cerner, ...) presets for normalization operations and data-acquisition query plans, without exposing any of this to onboarding end users.
>
> - `EhrVendorTemplate` entity, migration (`AddEhrVendorTemplates`), and repository: done.
> - Admin API (`/api/admin/ehr-templates`, CRUD + `/vendors`): done, on the existing `AdminController`.
> - Epic seed data (HSLOC/SNOMED normalization templates + draft Patient query plan): done via `EhrVendorTemplateSeeder`, runs on startup.
> - `SaveLocationTypeMapping`/`SaveEncounterTypeMapping` refactored to load templates via `EhrTemplateMerger` (token-substitution merge) instead of hardcoding Epic operations.
> - `SaveServerInfo` now injects `QueryPlan` templates into `DataAcquisitionClient.SaveQueryConfigAsync` (best-effort, non-blocking).
> - Admin UI at `/admin/ehr-templates` (linked from `/admin`), modern shell styling via `.workspace-content`.
> - Remaining: `IsLinkAdmin` auth policy (flagged, not blocking — see Auth gap below), `QueryConfigPayload` shape confirmation with Data Acquisition team, JSON-schema validation for `DefinitionJson`.

## Why

Today, `OnboardingController.SaveLocationTypeMapping` and `SaveEncounterTypeMapping` hardcode "Epic-specific" normalization operations (HSLOC location code maps, SNOMED encounter code maps, the `Encounter.status = "finished"` conditional transform). As we onboard non-Epic facilities (Cerner, MEDITECH, etc.), these vendor-specific definitions need to vary per EHR vendor — but the onboarding wizard end user should never see or edit this. They only supply facility-specific data (their source codes/systems).

Similarly, `DataAcquisitionClient.SaveQueryConfigAsync`/`SaveSftpConfigAsync` exist but are unused — there's no query-plan configuration at all yet, and query plans (which FHIR resources/search params/frequency to pull) are also vendor-dependent.

This proposal introduces an **admin-only template system**: LCG admins manage `EhrVendorTemplate` records per vendor, and the onboarding backend injects the matching templates (merged with facility-specific user input) when a facility completes the relevant wizard step.

---

## 1. `EhrVendorTemplate` Entity (OnboardingService DB)

New table `dbo.EhrVendorTemplates`, following the existing `OnboardingFormData` annotation pattern (non-clustered PK, `ValueGeneratedOnAdd`).

```csharp
[Table("EhrVendorTemplates", Schema = "dbo")]
public class EhrVendorTemplate
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Vendor { get; set; } = string.Empty;       // "Epic", "Cerner", "MEDITECH", "Other"

    [Required]
    public EhrTemplateCategory Category { get; set; }        // Normalization | QueryPlan

    [Required]
    [MaxLength(50)]
    public string ResourceType { get; set; } = string.Empty; // "Location", "Encounter", "Patient", ...

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public string DefinitionJson { get; set; } = "{}";       // shape depends on Category, see below

    public int Sequence { get; set; }                         // ordering hint within vendor+category+resourceType

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum EhrTemplateCategory
{
    Normalization = 0,
    QueryPlan = 1
}
```

`OnboardingDbContext.OnModelCreating` adds:

```csharp
modelBuilder.Entity<EhrVendorTemplate>(entity =>
{
    entity.HasKey(e => e.Id).IsClustered(false);
    entity.Property(e => e.Id).ValueGeneratedOnAdd();
    entity.Property(e => e.Category).HasConversion<string>();
    entity.HasIndex(e => new { e.Vendor, e.Category, e.ResourceType, e.IsActive });
});
```

A new EF Core migration (`AddEhrVendorTemplates`) adds this table.

### `DefinitionJson` shape — Normalization category

Mirrors the existing `NormCreatePayload.Operation` discriminated shapes (`NormCodeMapDto`, `NormCopyLocationDto`, `NormConditionalTransformDto`, etc.) plus a small token-substitution convention so facility-specific data (codes, systems) supplied by the wizard can be merged in at injection time.

A string value of the form `"${TokenName}"` anywhere in the JSON is replaced wholesale (string, object, or array) by the value the controller supplies in a per-step "context" dictionary. Templates that need no facility input (e.g. the Encounter status conditional transform) simply contain no tokens.

Example — Epic "Map Location Identifier to HSLOC" (CodeMap, requires facility codes):

```json
{
  "operationType": "CodeMap",
  "name": "Map Location Identifier to HSLOC",
  "description": "Translates Epic location identifier codes to CDC NHSN HSLOC codes.",
  "fhirPath": "Location.identifier.value",
  "resourceTypes": ["Location"],
  "codeSystemMaps": [
    {
      "sourceSystem": "${SourceSystem}",
      "targetSystem": "https://www.cdc.gov/nhsn/cdaportal/terminology/codesystem/hsloc.html",
      "codeMaps": "${CodeMaps}"
    }
  ]
}
```

Example — Epic "Set Encounter Status to Finished" (ConditionalTransform, no facility input):

```json
{
  "operationType": "ConditionalTransform",
  "name": "Set Encounter Status to Finished",
  "description": "Marks encounters as finished once a period end date is present.",
  "resourceTypes": ["Encounter"],
  "targetFhirPath": "Encounter.status",
  "targetValue": "finished",
  "conditions": [
    { "fhirPathSource": "Encounter.period.end", "operator": "Exists" }
  ]
}
```

### `DefinitionJson` shape — QueryPlan category

See `QueryPlanDto` in section 3.

---

## 2. Admin API — `/api/admin/ehr-templates`

New `AdminEhrTemplatesController` in OnboardingService:

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/ehr-templates?vendor=Epic&category=Normalization` | List templates, optional filters |
| GET | `/api/admin/ehr-templates/{id}` | Get one |
| POST | `/api/admin/ehr-templates` | Create |
| PUT | `/api/admin/ehr-templates/{id}` | Update |
| DELETE | `/api/admin/ehr-templates/{id}` | Delete |
| GET | `/api/admin/ehr-templates/vendors` | Distinct vendor names in use (for the UI's vendor picker) |

### Auth gap

OnboardingService currently has **no `AddAuthorization`/policy infrastructure** — `NormalizationServiceClient` simply forwards the caller's bearer token to a service that itself enforces `IsLinkAdmin`. For this iteration:

- The Admin API endpoints are added **without** a `[Authorize]` attribute (matching the rest of OnboardingController, which is also unauthenticated at this layer today).
- The Admin UI route is placed under `/admin` and is not linked from the tenant-facing onboarding shell, so it's "hidden by obscurity" for now.
- **Follow-on (flagged, not blocking)**: add an `IsLinkAdmin` authorization policy to OnboardingService (per [[project_auth]] — Keycloak at `oauth.nhsnlink.org`) and apply `[Authorize(Policy = "IsLinkAdmin")]` to `AdminEhrTemplatesController` once the service has a JWT bearer scheme configured.

---

## 3. `QueryPlanDto` — Data Acquisition query plans (draft)

```csharp
public class QueryPlanDto
{
    public string ResourceType { get; set; } = string.Empty;       // "Patient", "Encounter", "Observation", ...
    public string QueryType { get; set; } = "Initial";             // "Initial" | "Scheduled" | "Supplemental"
    public Dictionary<string, string> SearchParameters { get; set; } = new(); // FHIR search params, may contain ${...} tokens
    public string? Frequency { get; set; }                          // ISO 8601 duration, e.g. "P1D"; null = one-time
    public bool Enabled { get; set; } = true;
}
```

Stored in `DefinitionJson` for `Category = QueryPlan` as a single `QueryPlanDto`-shaped object (one row per resource-type query plan). Example Epic seed for `Patient`:

```json
{
  "resourceType": "Patient",
  "queryType": "Initial",
  "searchParameters": { "_id": "${PatientFhirId}" },
  "frequency": null,
  "enabled": true
}
```

### Wiring

A new `QueryConfigPayload` is sent to the existing `DataAcquisitionClient.SaveQueryConfigAsync`:

```csharp
public record QueryConfigPayload(string FacilityId, string EhrVendor, List<QueryPlanDto> QueryPlans);
```

This is a **draft shape** for the Data Acquisition team to confirm/adjust — `SaveQueryConfigAsync` accepts `object config`, so the payload shape can evolve without changing `DataAcquisitionClient`.

### Injection point

During `SaveServerInfo` (after `SetVendorAsync` succeeds and `session.FacilityId` is known), look up active `EhrVendorTemplate` rows for `(session.EhrVendor, QueryPlan)`, deserialize each `DefinitionJson` into `QueryPlanDto`, substitute any `${...}` tokens (e.g. `${PatientFhirId}` from facility form data, if available at that point — otherwise left as-is for Data Acquisition to resolve later), and call `_dataAcqClient.SaveQueryConfigAsync(facilityId, payload, ct)`. Failures are logged as warnings and do **not** block the step (consistent with the non-blocking treatment of the Encounter `ConditionalTransform` today).

---

## 4. Injection refactor — Location & Encounter mapping

Both `SaveLocationTypeMapping` and `SaveEncounterTypeMapping` change from "build hardcoded `Norm*Dto` objects inline" to:

1. Load active `EhrVendorTemplate` rows for `(session.EhrVendor, Normalization, ResourceType)`, ordered by `Sequence`.
2. Build a per-step **context dictionary** from the request body:
   - Location step: `{ "SourceSystem": request.SourceSystem, "CodeMaps": <dict built from request.Codes> }`
   - Encounter step: `{ "CodeSystemMaps": <list built from request.CodeSystemMaps> }`
3. For each template, deep-walk `DefinitionJson`, replacing any `"${Key}"` string with `context[Key]` (a `TemplateMerger` helper).
4. Deserialize the merged JSON into the appropriate `Norm*Dto` based on `operationType`, wrap in `NormCreatePayload`, and call `_normClient.CreateOperationAsync` — same error-handling behavior as today (CodeMap failures are hard errors; ConditionalTransform/CopyLocation failures for templates marked non-critical are logged and non-blocking — add an `IsCritical` flag... actually keep it simple: preserve current behavior by ordering — first template per resource type is treated as critical, subsequent ones as non-blocking, matching today's CodeMap-then-CopyLocation / CodeMap-then-ConditionalTransform pattern).

If `session.EhrVendor` has no matching templates (e.g. unknown vendor), fall back to the `"Epic"` templates seeded below and log a warning — this avoids hard-failing onboarding for vendors not yet configured, while signalling to admins that templates are missing.

---

## 5. Seed data (Epic)

Seeded via `OnboardingDbContext` migration data seeding (`HasData`) or a startup seeder, vendor = `"Epic"`, category = `Normalization`:

| ResourceType | Sequence | Name | OperationType |
|---|---|---|---|
| Location | 10 | Map Location Identifier to HSLOC | CodeMap (tokens: `SourceSystem`, `CodeMaps`) |
| Location | 20 | Copy Location Identifier to Type | CopyLocation (no tokens) |
| Encounter | 10 | Map Encounter Type to SNOMED | CodeMap (token: `CodeSystemMaps`) |
| Encounter | 20 | Set Encounter Status to Finished | ConditionalTransform (no tokens) |

Plus one Epic `QueryPlan` seed (Patient, Initial) as a starting example for the Data Acquisition team.

---

## 6. Admin UI — `/admin/ehr-templates`

- New top-level route `/admin` (sibling to `/onboarding/:token`, not nested under the tenant shell), rendered with the modern shell chrome (`WorkspaceToolbarComponent`-style header, violet Material theme via `.workspace-content` styles already in `styles.scss`).
- `AdminEhrTemplatesComponent`:
  - Vendor selector (dropdown, populated from `GET /api/admin/ehr-templates/vendors`, plus an "Add new vendor" free-text option).
  - Category tabs: **Normalization** | **Query Plans**.
  - Grid (reusing `NormalizationGridComponent`-style table: Seq / Name / Resource Type / Description / Status / Actions).
  - Row actions: Edit (opens a form with a raw JSON textarea for `DefinitionJson`, plus Name/Description/ResourceType/Sequence/IsActive fields), Delete.
  - "Add template" button opens the same form for create.
- No changes to onboarding end-user routes/components — this is purely additive.

---

## Open Items / Follow-ons

- `IsLinkAdmin` authorization policy for OnboardingService (see Auth gap above).
- `QueryConfigPayload` shape confirmation with the Data Acquisition team.
- JSON-schema validation for `DefinitionJson` in the Admin UI (currently raw textarea — easy to submit invalid JSON or an unknown `operationType`).
- Vendor preset sync with the normalization service's existing (currently empty) vendor-preset tables — out of scope for this pass, per the "OnboardingService DB" storage decision.
