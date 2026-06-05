# ADO Setup

## What the Bootstrap Script Does

Run `pipelines/scripts/setup-ado.sh` to automatically create:
- ✅ Variable groups (`nhsnlink-onboarding-common`, `-dev`, `-prod`)
- ✅ Environments (`nhsnlink-dev`, `nhsnlink-prod`)
- ✅ All 4 pipelines
- ✅ Branch policy (PR Validation required on main)

See [[CI CD Pipelines#setup-script]] for the full command.

## What Requires Manual Steps in ADO UI

### 1. Service Connections (browser required — credential handshake)

**Project Settings → Service connections → New → Azure Resource Manager → App registration (manual)**

| Name | Subscription | Role Required |
|---|---|---|
| `azure-nhsnlink-dev` | Dev subscription | Contributor + User Access Administrator |
| `azure-nhsnlink-prod` | Prod subscription | Same for prod |

Use **Workload Identity Federation** auth type — no client secrets to rotate.

See [[Prerequisites#service-principal-permissions]] for the role assignment commands.

### 2. Prod Environment Approvers

**Pipelines → Environments → nhsnlink-prod → Approvals and checks → + Add → Approvals**

Add the people who must approve before every production deployment. The `nhsnlink-dev` environment has no approval gate.

### 3. Update ACR Values After Infrastructure Deploy

After the first successful Bicep/Terraform deployment, update the `nhsnlink-onboarding-common` variable group with the real ACR values from the deployment outputs:

**Pipelines → Library → nhsnlink-onboarding-common**

| Variable | Update to |
|---|---|
| `ACR_NAME` | e.g. `nhsnobdevacr` |
| `ACR_LOGIN_SERVER` | e.g. `nhsnobdevacr.azurecr.io` |

## Variable Groups Reference

### `nhsnlink-onboarding-common`
| Variable | Value | Secret? |
|---|---|---|
| `ACR_NAME` | ACR name (no `.azurecr.io`) | No |
| `ACR_LOGIN_SERVER` | Full ACR login server | No |
| `AZURE_SERVICE_CONNECTION_DEV` | Service connection name | No |
| `AZURE_SERVICE_CONNECTION_PROD` | Service connection name | No |

### `nhsnlink-onboarding-dev` / `nhsnlink-onboarding-prod`
| Variable | Value | Secret? |
|---|---|---|
| `AZURE_SERVICE_CONNECTION` | Service connection name | No |
| `RESOURCE_GROUP` | e.g. `rg-nhsnlink-onboarding-dev` | No |
| `APP_NAME_PREFIX` | e.g. `nhsnob-dev` | No |
| `SQL_ADMIN_PASSWORD` | SQL Server password | **Yes** |
| `TENANT_SERVICE_URL` | link-cloud Tenant service URL | No |
| `DATA_ACQUISITION_URL` | link-cloud DataAcquisition URL | No |
| `REPORT_SERVICE_URL` | link-cloud Report service URL | No |
| `NORMALIZATION_SERVICE_URL` | link-cloud Normalization URL | No |

> **Tip:** Link `SQL_ADMIN_PASSWORD` to an Azure Key Vault secret for automatic rotation: **Library → variable group → Link secrets from an Azure key vault**.
