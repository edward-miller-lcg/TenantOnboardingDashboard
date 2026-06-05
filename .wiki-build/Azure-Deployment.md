# Azure Deployment (Bicep)

Isolated deployment — no shared infrastructure with the main link-cloud Azure environment.

## Cost Summary

| Tier | Resources | Est. Monthly |
|---|---|---|
| **Dev** | Container Apps (2×, scale-to-zero) + SQL Serverless (autopause 60min) + ACR Basic | **~$5–8/mo** |
| **Prod** | Container Apps (2×, min 1 replica) + SQL Serverless (autopause off) + ACR Basic | **~$40–55/mo** |

## Architecture

```
Internet → onboarding-web (Container App, port 80)
              nginx proxies /api/* → onboarding-service
           onboarding-service (Container App, port 5100)
              EF Core auto-migrates on startup
              → Azure SQL Database (link-onboarding)
              → link-cloud services (URL params)
```

## First-Time Deployment

### 1. Complete Prerequisites
See [[Prerequisites]] — register all 5 resource providers and assign SP roles before continuing.

### 2. Deploy Infrastructure

```bash
export SQL_ADMIN_PASSWORD="<strong-password>"

az deployment group create \
  --resource-group rg-nhsnlink-onboarding-dev \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/dev.bicepparam
```

Save the outputs (especially `acrLoginServer`):

```bash
az deployment group show \
  --resource-group rg-nhsnlink-onboarding-dev \
  --name main \
  --query properties.outputs
```

### 3. Build & Push Docker Images

```bash
ACR=<acrLoginServer from outputs>
az acr login --name ${ACR%%.*}

# Build (run from TenantOnboardingDashboard/ root)
docker build -t $ACR/nhsnlink-onboarding-service:dev -f DotNet/OnboardingService/Dockerfile .
docker build -t $ACR/nhsnlink-onboarding-web:dev -f Web/Dockerfile Web/

docker push $ACR/nhsnlink-onboarding-service:dev
docker push $ACR/nhsnlink-onboarding-web:dev
```

### 4. Update Container Apps

```bash
az containerapp update \
  --name nhsnob-dev-api \
  --resource-group rg-nhsnlink-onboarding-dev \
  --image $ACR/nhsnlink-onboarding-service:dev

az containerapp update \
  --name nhsnob-dev-web \
  --resource-group rg-nhsnlink-onboarding-dev \
  --image $ACR/nhsnlink-onboarding-web:dev
```

### 5. Get the App URL

```bash
az containerapp show \
  --name nhsnob-dev-web \
  --resource-group rg-nhsnlink-onboarding-dev \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

Open `https://<fqdn>/admin` to generate onboarding URLs.

## Bicep Module Reference

| Module | Resources Created |
|---|---|
| `log-analytics` | Log Analytics Workspace (PAYG, 5 GB free) |
| `container-registry` | ACR Basic + User-Assigned Managed Identity + AcrPull role |
| `container-apps-env` | Container Apps Environment (Consumption, scale-to-zero) |
| `sql` | Azure SQL Server + Serverless database |
| `onboarding-service` | Container App (API, port 5100) |
| `onboarding-web` | Container App (nginx, port 80) |

## Updating Parameters

Edit `infrastructure/dev.bicepparam` or `infrastructure/prod.bicepparam`, then re-run `az deployment group create`. Bicep deployments are idempotent.

## Teardown

**Do not delete the resource group.** Role assignments scoped to the RG are deleted with it, requiring re-granting permissions. Delete resources inside the RG instead:

```bash
az containerapp delete --name nhsnob-dev-api --resource-group rg-nhsnlink-onboarding-dev --yes
az containerapp delete --name nhsnob-dev-web --resource-group rg-nhsnlink-onboarding-dev --yes
az containerappenv delete --name nhsnob-dev-cae --resource-group rg-nhsnlink-onboarding-dev --yes
az sql db delete --server nhsnob-dev-sql --name link-onboarding --resource-group rg-nhsnlink-onboarding-dev --yes
az sql server delete --name nhsnob-dev-sql --resource-group rg-nhsnlink-onboarding-dev --yes
az acr delete --name nhsnobdevacr --resource-group rg-nhsnlink-onboarding-dev --yes
```
