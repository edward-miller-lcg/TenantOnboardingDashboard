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

### Azure CLI extensions

```bash
az extension add --name containerapp
```

### Resource provider registration (one-time per subscription)

These providers are not registered by default on new/Visual Studio subscriptions.
Run once before the first deployment — stays registered permanently.

```bash
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.ManagedIdentity
```

Registration is async. Check status before deploying:

```bash
az provider show --namespace Microsoft.Sql --query registrationState -o tsv
az provider show --namespace Microsoft.ContainerRegistry --query registrationState -o tsv
az provider show --namespace Microsoft.OperationalInsights --query registrationState -o tsv
az provider show --namespace Microsoft.App --query registrationState -o tsv
az provider show --namespace Microsoft.ManagedIdentity --query registrationState -o tsv
```

All must return `Registered` before running a deployment.

### ADO service connection permissions

The service principal used by the ADO service connection needs two roles —
`Contributor` alone is not enough because the Bicep template creates role assignments
(AcrPull on the ACR for the managed identity), which requires write access to
`Microsoft.Authorization/roleAssignments`.

```bash
# Contributor — create/update all resources
az role assignment create \
  --assignee "<service-principal-app-id>" \
  --role "Contributor" \
  --scope "/subscriptions/<subscription-id>"

# User Access Administrator — create role assignments during deployment
az role assignment create \
  --assignee "<service-principal-app-id>" \
  --role "User Access Administrator" \
  --scope "/subscriptions/<subscription-id>"
```

Grant at subscription scope (not resource group) because the RG is created
as part of the deployment itself.

### SQL Admin Password

The `sqlAdminPassword` parameter is intentionally omitted from the committed
`.bicepparam` files. It is read at deploy time via `readEnvironmentVariable()`:

- **Locally:** `export SQL_ADMIN_PASSWORD="yourpassword"` before running `az deployment`
- **ADO pipeline:** stored as a secret in the `nhsnlink-onboarding-dev/prod` variable
  group; the pipeline `env:` block injects it automatically

---

## First-time Deployment

### 1. Create the Resource Group

```bash
az group create \
  --name rg-nhsnlink-onboarding-dev \
  --location eastus
```

### 2. Deploy Infrastructure

```bash
export SQL_ADMIN_PASSWORD="<strong-password>"

az deployment group create \
  --resource-group rg-nhsnlink-onboarding-dev \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/dev.bicepparam
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

# Build (run from repo root TenantOnboardingDashboard/)
docker build -t $ACR/nhsnlink-onboarding-service:dev -f DotNet/OnboardingService/Dockerfile .
docker build -t $ACR/nhsnlink-onboarding-web:dev -f Web/Dockerfile Web/

# Push
docker push $ACR/nhsnlink-onboarding-service:dev
docker push $ACR/nhsnlink-onboarding-web:dev
```

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

---

## Updating Parameters

Edit `dev.bicepparam` or `prod.bicepparam`, then re-run `az deployment group create`.
Bicep deployments are idempotent — unchanged resources are not recreated.

## Tearing Down

```bash
az group delete --name rg-nhsnlink-onboarding-dev --yes --no-wait
```

---

## Troubleshooting

### BCP258 — parameter missing assignment (sqlAdminPassword)

```
Error BCP258: The following parameters are declared in the Bicep file but are
missing an assignment in the params file: "sqlAdminPassword"
```

The `sqlAdminPassword` is read via `readEnvironmentVariable('SQL_ADMIN_PASSWORD')` in
the `.bicepparam` files. The environment variable must be set before running `az deployment`:

```bash
export SQL_ADMIN_PASSWORD="yourpassword"   # bash/zsh
$env:SQL_ADMIN_PASSWORD = "yourpassword"   # PowerShell
```

In ADO pipelines the variable group secret is injected automatically via the `env:` block
on the AzureCLI task — no manual action needed there.

> **Note:** `$(SECRET_VAR)` does not expand inside bash `inlineScript` blocks in ADO.
> Secrets must be mapped via `env:` and referenced as `$VAR` (not `$(VAR)`).

---

### AuthorizationFailed — roleAssignments/write

```
The client does not have authorization to perform action
'Microsoft.Authorization/roleAssignments/write'
```

The service principal needs `User Access Administrator` in addition to `Contributor`.
See [ADO service connection permissions](#ado-service-connection-permissions) above.

---

### MissingSubscriptionRegistration

```
The subscription is not registered to use namespace 'Microsoft.Sql'
```

Resource providers are not registered. See [Resource provider registration](#resource-provider-registration-one-time-per-subscription) above.
This is a one-time fix per subscription.

---

## CI/CD (GitHub Actions skeleton)

```yaml
- name: Deploy infrastructure
  env:
    SQL_ADMIN_PASSWORD: ${{ secrets.SQL_ADMIN_PASSWORD }}
  run: |
    az deployment group create \
      --resource-group ${{ vars.RG }} \
      --template-file infrastructure/main.bicep \
      --parameters infrastructure/${{ vars.ENV }}.bicepparam

- name: Build and push images
  run: |
    az acr login --name ${{ vars.ACR_NAME }}
    docker build -t ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }} \
      -f DotNet/OnboardingService/Dockerfile .
    docker push ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }}

- name: Update Container Apps
  run: |
    az containerapp update \
      --name nhsnob-${{ vars.ENV }}-api \
      --resource-group ${{ vars.RG }} \
      --image ${{ vars.ACR }}/nhsnlink-onboarding-service:${{ github.sha }}
```
