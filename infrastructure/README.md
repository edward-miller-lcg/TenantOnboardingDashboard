# NHSNLink Onboarding — Azure Infrastructure

Isolated deployment using Azure Container Apps (Consumption) + Azure SQL Serverless.
Independent of the link-cloud Azure resources; connects to link-cloud services via URL parameters.

## Cost Summary

| Tier | Resource | Monthly Cost |
|------|----------|-------------|
| **Dev** | Container Apps (2×, scale-to-zero) | ~$0 (free grant) |
| | SQL Database (Serverless, autopause 60 min) | ~$0.12–$3 |
| | Azure Container Registry (Basic) | ~$5 |
| | Log Analytics (first 5 GB free) | $0 |
| | **Dev Total** | **~$5–8/month** |
| **Prod** | Container Apps (2×, min 1 replica) | ~$25–30 |
| | SQL Database (Serverless, autopause off) | ~$10–20 |
| | ACR (Basic) | ~$5 |
| | **Prod Total** | **~$40–55/month** |

## Architecture

```
Internet
  │
  ▼
onboarding-web (Container App, port 80)
  │  nginx proxies /api/* → onboarding-service
  ▼
onboarding-service (Container App, port 5100)
  │  EF Core auto-migrates on startup
  ├──► Azure SQL Database (link-onboarding)
  ├──► link-cloud Tenant Service     (URL param)
  ├──► link-cloud DataAcquisition    (URL param)
  ├──► link-cloud Report Service     (URL param)
  └──► link-cloud Normalization      (URL param)
```

## Prerequisites

```bash
az extension add --name containerapp
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

## First-time Deployment

### 1. Create the Resource Group

```bash
az group create \
  --name rg-nhsnlink-onboarding-dev \
  --location eastus
```

### 2. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group rg-nhsnlink-onboarding-dev \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/dev.bicepparam \
  --parameters sqlAdminPassword="<strong-password>"
```

Save the outputs — you will need `acrLoginServer`:

```bash
az deployment group show \
  --resource-group rg-nhsnlink-onboarding-dev \
  --name main \
  --query properties.outputs
```

### 3. Build & Push Docker Images

```bash
ACR=<acrLoginServer from outputs>

# Login to ACR
az acr login --name ${ACR%%.*}

# Build
docker build -t nhsnlink-onboarding-service:dev ./DotNet/OnboardingService \
  -f DotNet/OnboardingService/Dockerfile \
  --build-arg BUILD_CONTEXT=.

docker build -t nhsnlink-onboarding-web:dev ./Web

# Tag and push
docker tag nhsnlink-onboarding-service:dev $ACR/nhsnlink-onboarding-service:dev
docker push $ACR/nhsnlink-onboarding-service:dev

docker tag nhsnlink-onboarding-web:dev $ACR/nhsnlink-onboarding-web:dev
docker push $ACR/nhsnlink-onboarding-web:dev
```

> **Note:** The onboarding-service Dockerfile build context must be the repo root
> (`TenantOnboardingDashboard/`) so it can `COPY` the `DotNet/OnboardingService/` path:
> ```bash
> cd TenantOnboardingDashboard
> docker build -t nhsnlink-onboarding-service:dev \
>   -f DotNet/OnboardingService/Dockerfile .
> ```

### 4. Redeploy After Image Push

Container Apps pull the new image on the next revision. Force a new revision:

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

### 5. Access the App

```bash
az containerapp show \
  --name nhsnob-dev-web \
  --resource-group rg-nhsnlink-onboarding-dev \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

Open `https://<fqdn>/admin` to generate onboarding URLs.

## Updating Parameters

Edit `dev.bicepparam` or `prod.bicepparam`, then re-run `az deployment group create`.
Bicep deployments are idempotent — unchanged resources are not recreated.

## Tearing Down

```bash
az group delete --name rg-nhsnlink-onboarding-dev --yes --no-wait
```

## CI/CD (GitHub Actions skeleton)

```yaml
- name: Deploy infrastructure
  run: |
    az deployment group create \
      --resource-group ${{ vars.RG }} \
      --template-file infrastructure/main.bicep \
      --parameters infrastructure/${{ vars.ENV }}.bicepparam \
      --parameters sqlAdminPassword=${{ secrets.SQL_PASS }}

- name: Build and push images
  run: |
    az acr login --name ${{ vars.ACR_NAME }}
    docker build -t ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }} \
      -f DotNet/OnboardingService/Dockerfile .
    docker push ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }}
    # ... similar for web

- name: Update Container Apps
  run: |
    az containerapp update \
      --name nhsnob-${{ vars.ENV }}-api \
      --resource-group ${{ vars.RG }} \
      --image ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }}
```
