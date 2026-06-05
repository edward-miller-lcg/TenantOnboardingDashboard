# Prerequisites

## Local Development

| Tool | Version | Purpose |
|---|---|---|
| Docker Desktop | Latest (Linux containers mode) | Run full stack locally |
| .NET SDK | 10.x | Build/run the backend |
| Node.js | 23.x | Build/run the frontend |
| Azure CLI | 2.x | Infrastructure deployment |

**Docker Desktop must be in Linux containers mode.** Right-click the tray icon — if you see "Switch to Windows containers…" you're already in Linux mode. If you see "Switch to Linux containers…" click it first.

---

## Azure Deployment

### Azure CLI Extensions

```bash
az extension add --name containerapp
```

### Resource Provider Registration (one-time per subscription)

These providers are not registered by default on new/Visual Studio subscriptions. Run once — stays registered permanently.

```bash
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.ManagedIdentity
```

Check status (all must show `Registered` before deploying):

```bash
az provider show --namespace Microsoft.Sql --query registrationState -o tsv
az provider show --namespace Microsoft.ContainerRegistry --query registrationState -o tsv
az provider show --namespace Microsoft.OperationalInsights --query registrationState -o tsv
az provider show --namespace Microsoft.App --query registrationState -o tsv
az provider show --namespace Microsoft.ManagedIdentity --query registrationState -o tsv
```

> **Note:** `Microsoft.App` (Container Apps) can take 3–5 minutes to finish registering even after `az provider register` returns. Always verify before re-running a deployment.

### Service Principal Permissions

The ADO service principal needs **two roles** — `Contributor` alone is insufficient because the Bicep template creates role assignments (AcrPull for the managed identity).

```bash
# Grant at subscription scope so it survives resource group teardowns
az role assignment create \
  --assignee "<service-principal-app-id>" \
  --role "Contributor" \
  --scope "/subscriptions/<subscription-id>"

az role assignment create \
  --assignee "<service-principal-app-id>" \
  --role "User Access Administrator" \
  --scope "/subscriptions/<subscription-id>"
```

> **Why subscription scope?** Role assignments scoped to a resource group are deleted when that group is deleted. Subscription-scoped assignments survive teardowns.

### SQL Admin Password

`sqlAdminPassword` is read at deploy time via `readEnvironmentVariable()` in the `.bicepparam` files:

```bash
# Locally
export SQL_ADMIN_PASSWORD="yourpassword"

# ADO pipeline — store as a secret in the nhsnlink-onboarding-dev variable group
# The pipeline env: block injects it automatically
```
