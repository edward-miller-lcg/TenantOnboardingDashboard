# NHSNLink Onboarding — Azure Infrastructure (Terraform)

Terraform equivalent of the Bicep scripts in `../`. Identical resources, same cost profile.
Use whichever toolchain your team prefers — both produce the same Azure infrastructure.

## Quick-start

```bash
cd infrastructure/terraform

# 1. Initialise providers (run once per workspace)
terraform init

# 2. Preview what will be created
terraform plan \
  -var-file=environments/dev.tfvars \
  -var="sql_admin_password=<strong-password>"

# 3. Apply
terraform apply \
  -var-file=environments/dev.tfvars \
  -var="sql_admin_password=<strong-password>"
```

The SQL admin password is `sensitive = true` and is **never** written to plan output
or stored in module outputs. Pass it via `-var`, `TF_VAR_sql_admin_password`, or a
secrets manager integration (Vault, Azure Key Vault provider, etc.).

## File Structure

```
terraform/
├── versions.tf               # Provider versions + optional remote backend
├── main.tf                   # Resource group + all module calls
├── variables.tf              # All variable declarations
├── outputs.tf                # ACR server, app URLs, push commands
├── environments/
│   ├── dev.tfvars            # Dev: scale-to-zero, autopause, ~$5-8/mo
│   └── prod.tfvars           # Prod: always-on, no autopause, ~$40-55/mo
└── modules/
    ├── log_analytics/        # Log Analytics Workspace (PAYG, 5 GB free)
    ├── container_registry/   # ACR Basic + managed identity + AcrPull role
    ├── container_apps_env/   # Container Apps Environment (Consumption)
    ├── sql/                  # SQL Server + Serverless database
    ├── onboarding_service/   # API Container App (port 5100)
    └── onboarding_web/       # Web Container App (port 80, nginx)
```

## After Apply — Push Images

```bash
# Get outputs
ACR=$(terraform output -raw acr_login_server)
WEB_URL=$(terraform output -raw onboarding_web_url)

echo "App URL: $WEB_URL"

# Login and push
az acr login --name ${ACR%%.*}

cd ../..   # repo root (TenantOnboardingDashboard/)

docker build -t $ACR/nhsnlink-onboarding-service:dev \
  -f DotNet/OnboardingService/Dockerfile .

docker build -t $ACR/nhsnlink-onboarding-web:dev \
  -f Web/Dockerfile Web/

docker push $ACR/nhsnlink-onboarding-service:dev
docker push $ACR/nhsnlink-onboarding-web:dev
```

## Update Images (Rolling Restart)

```bash
# Force a new revision after pushing a new image tag
az containerapp update \
  --name nhsnob-dev-api \
  --resource-group rg-nhsnlink-onboarding-dev \
  --image $ACR/nhsnlink-onboarding-service:dev

az containerapp update \
  --name nhsnob-dev-web \
  --resource-group rg-nhsnlink-onboarding-dev \
  --image $ACR/nhsnlink-onboarding-web:dev
```

## Remote State (Recommended for Teams)

Uncomment the `backend "azurerm"` block in `versions.tf` and create the storage:

```bash
az storage account create \
  --name nhsnobtfstate \
  --resource-group rg-tfstate \
  --sku Standard_LRS

az storage container create \
  --name tfstate \
  --account-name nhsnobtfstate

terraform init -reconfigure
```

## Destroy

```bash
terraform destroy \
  -var-file=environments/dev.tfvars \
  -var="sql_admin_password=<password>"
```
