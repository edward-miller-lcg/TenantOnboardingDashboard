# CI/CD Pipelines

## Pipeline Overview

| Pipeline | File | Trigger | Purpose |
|---|---|---|---|
| **PR Validation** | `pipelines/pr-validation.yml` | Every PR → main | Build + test, Docker build check. No push, no deploy. |
| **Build & Push** | `pipelines/build-push.yml` | Merge → main | Build Docker images, push to ACR with Build ID tag |
| **Deploy Infrastructure** | `pipelines/deploy-infrastructure.yml` | Manual + `infrastructure/**` changes | Deploy Bicep or Terraform with approval gate |
| **Release** | `pipelines/release.yml` | Merge → main (full CD) | Build → Push → Deploy Dev → Smoke Tests → Integration Tests → Approve → Deploy Prod |

## Release Pipeline Stages

```
1 · Build & Test         dotnet build + test, ng build
2 · Build & Push         docker build + push to ACR
3 · Deploy → Dev         az containerapp update (automatic, no gate)
4 · Smoke Tests          /health 200 + web root 200
5 · Integration Tests    full API lifecycle tests against live dev
6 · Deploy → Prod        az containerapp update (APPROVAL REQUIRED)
```

## Reusable Templates

All templates live in `pipelines/templates/` — they're just YAML files in the repo, not separate ADO pipelines.

| Template | Used By | Purpose |
|---|---|---|
| `steps-build-dotnet.yml` | PR validation, Release | `dotnet restore/build/test` |
| `steps-build-angular.yml` | PR validation, Release | `npm ci && ng build` |
| `steps-docker-build-push.yml` | Build & Push, Release | `docker build + tag + push` |
| `steps-deploy-container-app.yml` | Release, Deploy Infra | `az containerapp update` |
| `steps-integration-tests.yml` | Release | curl-based API lifecycle tests |

## Key Pipeline Behaviors

**Skip build and redeploy a previous tag:**
```
Release → Run pipeline
  imageTag:   1234     (a previous BuildId)
  skipBuild:  true
```

**Deploy infra only (no app changes):**
```
Deploy Infrastructure → Run pipeline
  environment:  dev
  tool:         bicep
```

**Secrets in bash inlineScript tasks** must use `env:` mapping — `$(SECRET)` does not expand in bash scripts:

```yaml
- task: AzureCLI@2
  inputs:
    inlineScript: |
      echo $MY_SECRET    # ← bash env var syntax
  env:
    MY_SECRET: $(MY_SECRET_VAR)   # ← maps ADO secret to env var
```

## Setup Script

One-command ADO bootstrap (creates variable groups, environments, pipelines, and branch policy):

```bash
chmod +x pipelines/scripts/setup-ado.sh

./pipelines/scripts/setup-ado.sh \
  --org        https://dev.azure.com/YourOrg \
  --project    YourProject \
  --repo       TenantOnboardingDashboard \
  --sql-pass   "YourSqlPassword" \
  --tenant-url https://link-tenant.yourdomain.com \
  --dataacq-url https://link-dataacq.yourdomain.com \
  --report-url  https://link-report.yourdomain.com \
  --norm-url    https://link-normalization.yourdomain.com
```

See [[ADO Setup]] for the two remaining manual steps (service connections + prod approvers).
