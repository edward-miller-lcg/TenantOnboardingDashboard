// ─────────────────────────────────────────────────────────────────────────────
//  Dev environment parameters
//  ~$5-8/month total (ACR Basic + near-zero SQL + $0 Container Apps)
//  Scale-to-zero: containers pause when not in use.
// ─────────────────────────────────────────────────────────────────────────────

using './main.bicep'

param appName = 'nhsnob'
param environment = 'dev'
param location = 'eastus2'

// ─── Container App sizing ─────────────────────────────────────────────────────
// Minimum consumption tier. Both containers scale to 0 when idle.
// ~$0/month within Azure's free grant (180K vCPU-sec/month per subscription).
param containerAppTier = {
  cpu: '0.25'
  memory: '0.5Gi'
  minReplicas: 0      // Scale to zero — no charge when idle
  maxReplicas: 3
}

// ─── SQL Database sizing ──────────────────────────────────────────────────────
// Serverless GP_S_Gen5_1: max 1 vCore, autopause after 60 min idle.
// Cost: ~$0 when paused + $0.115/GB/month storage.
param sqlTier = {
  skuName: 'GP_S_Gen5_1'
  minCapacity: '0.5'
  autoPauseDelay: 60
}

// ─── Secrets ─────────────────────────────────────────────────────────────────
// readEnvironmentVariable() reads SQL_ADMIN_PASSWORD from the shell environment
// at params-file processing time — never stored in source control.
// Locally:  export SQL_ADMIN_PASSWORD="yourpass" before running az deploy
// Pipeline: the env: block in the AzureCLI task injects it automatically
param sqlAdminLogin    = 'onboardingadmin'
param sqlAdminPassword = readEnvironmentVariable('SQL_ADMIN_PASSWORD')

// ─── Image tags ───────────────────────────────────────────────────────────────
param apiImageTag = 'dev'
param webImageTag = 'dev'

// ─── link-cloud service URLs ──────────────────────────────────────────────────
// Replace with the actual URLs from your link-cloud Azure deployment.
param tenantServiceUrl          = 'https://link-tenant.yourdomain.com'
param dataAcquisitionServiceUrl = 'https://link-dataacq.yourdomain.com'
param reportServiceUrl          = 'https://link-report.yourdomain.com'
param normalizationServiceUrl   = 'https://link-normalization.yourdomain.com'
