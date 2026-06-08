// ─────────────────────────────────────────────────────────────────────────────
//  Dev environment parameters
//  ~$10-15/month total (ACR Basic + SQL serverless + always-warm Container Apps)
//  minReplicas=1: eliminates cold-start timeouts; SQL pauses after 4h idle.
// ─────────────────────────────────────────────────────────────────────────────

using './main.bicep'

param appName = 'nhsnob'
param environment = 'dev'
param location = 'centralus'

// ─── Container App sizing ─────────────────────────────────────────────────────
// 1 replica always warm to avoid cold-start timeouts during dev.
// ~$3-5/month above free grant (0.25 vCPU × 2 containers × 24/7).
param containerAppTier = {
  cpu: '0.25'
  memory: '0.5Gi'
  minReplicas: 1      // Always-warm — eliminates cold-start hangs
  maxReplicas: 3
}

// ─── SQL Database sizing ──────────────────────────────────────────────────────
// Serverless GP_S_Gen5_1: max 1 vCore, autopause after 240 min idle.
// Extended from 60 min to avoid mid-session resume delays (~30-60s wake-up).
param sqlTier = {
  skuName: 'GP_S_Gen5_1'
  minCapacity: '0.5'
  autoPauseDelay: 240
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
// Read from environment variables — set in the ADO variable group
// 'nhsnlink-onboarding-dev' and injected via the pipeline env: block.
// Locally: export TENANT_SERVICE_URL="https://..." before running az deploy.
param tenantServiceUrl          = readEnvironmentVariable('TENANT_SERVICE_URL')
param dataAcquisitionServiceUrl = readEnvironmentVariable('DATA_ACQUISITION_URL')
param reportServiceUrl          = readEnvironmentVariable('REPORT_SERVICE_URL')
param normalizationServiceUrl   = readEnvironmentVariable('NORMALIZATION_SERVICE_URL')
