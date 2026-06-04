# NHSNLink Onboarding — Azure DevOps Pipelines

## Pipeline Overview

| File | Trigger | Purpose |
|------|---------|---------|
| `pr-validation.yml` | Every PR → main/develop | Build + test, no push, no deploy |
| `build-push.yml` | Merge → main | Build images, push to ACR |
| `deploy-infrastructure.yml` | Manual + infra changes | Deploy Bicep or Terraform |
| `release.yml` | Merge → main (full CD) | Build → push → dev → approve → prod |

> **Recommended for most teams:** use `release.yml` as the single CD pipeline.
> Use `build-push.yml` + `deploy-infrastructure.yml` separately if you want finer control.

---

## One-time ADO Setup

### 1. Service Connections

In ADO → **Project Settings → Service connections**, create two Azure Resource Manager connections:

| Name | Subscription | Role needed |
|------|-------------|-------------|
| `azure-nhsnlink-dev` | Dev subscription | **Contributor** on `rg-nhsnlink-onboarding-dev` + **AcrPush** on ACR |
| `azure-nhsnlink-prod` | Prod subscription | Same but for prod RG |

> Use the "Workload Identity Federation" auth type (recommended) — no client secrets to rotate.

### 2. Variable Groups

In ADO → **Pipelines → Library**, create these variable groups:

#### `nhsnlink-onboarding-common`
| Variable | Value | Secret? |
|----------|-------|---------|
| `ACR_NAME` | `nhsnobdevacr` | No |
| `ACR_LOGIN_SERVER` | `nhsnobdevacr.azurecr.io` | No |
| `AZURE_SERVICE_CONNECTION_DEV` | `azure-nhsnlink-dev` | No |
| `AZURE_SERVICE_CONNECTION_PROD` | `azure-nhsnlink-prod` | No |

#### `nhsnlink-onboarding-dev`
| Variable | Value | Secret? |
|----------|-------|---------|
| `AZURE_SERVICE_CONNECTION` | `azure-nhsnlink-dev` | No |
| `RESOURCE_GROUP` | `rg-nhsnlink-onboarding-dev` | No |
| `APP_NAME_PREFIX` | `nhsnob-dev` | No |
| `SQL_ADMIN_PASSWORD` | `<strong-password>` | **Yes** |
| `TENANT_SERVICE_URL` | `https://link-tenant.yourdomain.com` | No |
| `DATA_ACQUISITION_URL` | `https://link-dataacq.yourdomain.com` | No |
| `REPORT_SERVICE_URL` | `https://link-report.yourdomain.com` | No |
| `NORMALIZATION_SERVICE_URL` | `https://link-normalization.yourdomain.com` | No |

#### `nhsnlink-onboarding-prod`
Same variables as dev with prod values.

> **Tip:** Link variable groups to an **Azure Key Vault** for secrets — ADO will pull them directly at runtime.

### 3. ADO Environments

In ADO → **Pipelines → Environments**, create:

| Name | Approval gate |
|------|--------------|
| `nhsnlink-dev` | None — auto-deploy |
| `nhsnlink-prod` | ✅ Add approvers — only they can proceed to prod |

### 4. Create Pipelines in ADO

For each pipeline file, in ADO → **Pipelines → New Pipeline**:
1. Connect to your Azure Repos / GitHub
2. Select "Existing Azure Pipelines YAML file"
3. Pick the path (e.g. `/pipelines/release.yml`)
4. Save (don't run yet)

### 5. Branch Policy (PR Validation)

In ADO → **Repos → Branches → main → Branch policies**:
- Add **Build validation** → select the `pr-validation` pipeline
- Set "Required" and "Automatic" trigger

---

## Pipeline Flow Diagram

```
PR opened / updated
  └─► pr-validation.yml
        ├─ Build .NET (no push)
        ├─ Build Angular (no push)
        └─ Docker build check (no push)

Merge to main
  └─► release.yml
        │
        ├─ Stage 1: Build & Test
        │    ├─ dotnet build + test
        │    └─ ng build
        │
        ├─ Stage 2: Build & Push
        │    ├─ docker build + push onboarding-service:<buildId>
        │    └─ docker build + push onboarding-web:<buildId>
        │
        ├─ Stage 3: Deploy → Dev  (automatic)
        │    ├─ az containerapp update (API)
        │    └─ az containerapp update (Web)
        │
        ├─ Stage 4: Smoke Tests
        │    ├─ /health endpoint returns 200
        │    └─ Web root returns 200
        │
        └─ Stage 5: Deploy → Prod  (APPROVAL REQUIRED)
             ├─ az containerapp update (API)
             └─ az containerapp update (Web)

infra/** changed on main  (or manual trigger)
  └─► deploy-infrastructure.yml
        ├─ what-if / plan (Preview stage)
        └─ Deployment job with environment gate
             ├─ bicep: az deployment group create
             └─ terraform: init + apply
```

---

## Running Pipelines Manually

### Release with a specific image tag (re-deploy without rebuild)

```
Pipelines → release → Run pipeline
  Parameters:
    imageTag:   1234     ← the BuildId from a previous run
    skipBuild:  true     ← skip stages 1 & 2
```

### Infrastructure only

```
Pipelines → deploy-infrastructure → Run pipeline
  Parameters:
    environment:  dev | prod
    tool:         bicep | terraform
```

---

## Template Reference

| Template | Used by | Purpose |
|----------|---------|---------|
| `templates/steps-build-dotnet.yml` | pr-validation, build-push, release | dotnet restore/build/test/publish |
| `templates/steps-build-angular.yml` | pr-validation, build-push, release | npm ci + ng build |
| `templates/steps-docker-build-push.yml` | build-push, release | docker build + tag + push to ACR |
| `templates/steps-deploy-container-app.yml` | release, deploy-infrastructure | az containerapp update |

---

## Extending the Pipelines

### Add unit tests to the backend
Add test projects (`*.Tests.csproj`) — the `steps-build-dotnet.yml` template
automatically discovers and runs all test projects via `**/*.Tests.csproj`.

### Add integration tests
Add a new stage between `SmokeTestDev` and `DeployProd` in `release.yml`:
```yaml
- stage: IntegrationTests
  dependsOn: SmokeTestDev
  jobs:
    - job: RunTests
      steps:
        - script: |
            # Run your integration test suite against the dev environment
```

### Use Azure Key Vault for secrets
In ADO Library, link the variable group to a Key Vault:
**Library → nhsnlink-onboarding-dev → Link secrets from an Azure key vault**.
The `SQL_ADMIN_PASSWORD` variable will be pulled automatically at runtime.
