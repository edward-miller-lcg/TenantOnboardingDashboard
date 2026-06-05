# Troubleshooting

All errors encountered during development and deployment, with exact fixes.

---

## Azure Deployment Errors

### BCP258 — sqlAdminPassword missing from params file

```
Error BCP258: The following parameters are declared in the Bicep file but are
missing an assignment in the params file: "sqlAdminPassword"
```

**Cause:** Bicep validates `.bicepparam` files in isolation before applying any `--parameters` CLI overrides. `sqlAdminPassword` uses `readEnvironmentVariable()` in the params file, which requires the env var to be set in the process environment.

**Fix:**
```bash
# Locally
export SQL_ADMIN_PASSWORD="yourpassword"       # bash/zsh
$env:SQL_ADMIN_PASSWORD = "yourpassword"       # PowerShell

# ADO pipeline — env var is injected via the task's env: block automatically
```

> **ADO gotcha:** `$(SECRET_VAR)` does NOT expand inside bash `inlineScript` blocks. Secrets must be mapped via `env:` and referenced as `$VAR` (bash syntax), not `$(VAR)` (ADO syntax).

---

### AuthorizationFailed — roleAssignments/write

```
does not have authorization to perform action
'Microsoft.Authorization/roleAssignments/write'
```

**Cause:** The service principal only has `Contributor`. Creating role assignments (AcrPull for the managed identity) requires `User Access Administrator` as well.

**Fix:**
```bash
az role assignment create \
  --assignee "<sp-app-id>" \
  --role "User Access Administrator" \
  --scope "/subscriptions/<subscription-id>"
```

Assign at **subscription scope**, not resource group scope, so the assignment survives teardowns.

---

### AuthorizationFailed — whatIf/action (after teardown)

```
does not have authorization to perform action
'Microsoft.Resources/deployments/whatIf/action'
```

**Cause:** `az deployment group what-if` is group-scoped and requires the resource group to exist. After deleting the RG, the scope is invalid. The pipeline now creates the RG before running `what-if`, so re-running the pipeline is self-healing.

**Fix:** Just re-run the pipeline. The Preview stage creates the RG first.

---

### MissingSubscriptionRegistration

```
The subscription is not registered to use namespace 'Microsoft.Sql'
```

**Cause:** Resource providers not registered on the subscription (common on new/VS subscriptions).

**Fix:** See [[Prerequisites#resource-provider-registration]] — register all 5 providers and wait for `Registered` status before re-running.

> `Microsoft.App` takes 3–5 minutes to fully propagate after `az provider register` returns.

---

### ProvisioningDisabled — SQL region restriction

```
Provisioning is restricted in this region. Please choose a different region.
```

**Cause:** Azure SQL is quota-restricted in `eastus` and `eastus2` for Visual Studio subscriptions.

**Fix:** Use `southcentralus`. Update `location` in `infrastructure/dev.bicepparam` AND the two `az group create --location` calls in `pipelines/deploy-infrastructure.yml`:

```bicep
param location = 'southcentralus'
```

If `southcentralus` also fails, try `centralus` or `westus2`.

---

### AKSCapacityHeavyUsage — Container Apps region

```
AKS is experiencing heavy usage in region eastus2.
```

**Cause:** Container Apps Environments run on AKS under the hood. `eastus2` was at capacity.

**Fix:** Same as above — use `southcentralus`. See ProvisioningDisabled fix.

---

### InvalidResourceGroupLocation

```
Invalid resource group location 'eastus'. The Resource group already
exists in location 'eastus2'.
```

**Cause:** The RG was created in one region (by the what-if step) and the pipeline's `az group create` has a different `--location` hardcoded.

**Fix:** Delete the empty RG and update `--location` in `pipelines/deploy-infrastructure.yml` to match the `.bicepparam` location.

---

### Conflict — resource already exists in different location

```
The resource 'nhsnob-dev-logs' already exists in location 'eastus'
in resource group 'rg-nhsnlink-onboarding-dev'. A resource with the
same name cannot be created in location 'eastus2'.
```

**Cause:** A previous failed deployment partially created resources in one region. Switching regions causes name conflicts.

**Fix:** Delete the resource group (or just the specific conflicting resources), then re-run in the new region.

---

## Application Errors

### UI Stuck on "Testing..." / Buttons Not Updating

**Cause:** Angular 21 lazy-loaded standalone components don't always trigger zone-based change detection after HTTP subscribe callbacks.

**Fix:** All wizard step components have `ChangeDetectorRef` injected with `markForCheck()` called after every state mutation in subscribe callbacks. If this appears on a new component, add:

```typescript
constructor(private cdr: ChangeDetectorRef, ...) {}

// In subscribe callback:
next: result => {
  this.myProp = result;
  this.cdr.markForCheck();   // ← required
}
```

---

### Connection Test Always Fails with 404

**Cause:** The connection test hits `{fhirBaseUrl}/metadata` (the FHIR CapabilityStatement endpoint). A 404 means either the URL is wrong or the FHIR server doesn't expose that path.

**Check:**
1. Verify the FHIR base URL saved in Server Info (check the session via `GET /api/onboarding/{token}` → `formData.FhirBaseUrl`)
2. Test manually: `curl {fhirBaseUrl}/metadata`

---

## Docker / Local Dev Errors

### `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file`

Docker Desktop isn't running or is in Windows containers mode. Open Docker Desktop and switch to Linux containers (right-click tray icon).

### `&&` not recognized in PowerShell

Use `;` instead of `&&`:
```powershell
cmd1; cmd2; cmd3
```

### Resource group deletion taking too long

`az group delete --no-wait` runs in the background. Poll with:
```powershell
az group exists --name rg-nhsnlink-onboarding-dev
```
Wait until it returns `false`. Typically 3–5 minutes.
