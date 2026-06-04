// ─────────────────────────────────────────────────────────────────────────────
//  Prod environment parameters
//  ~$30-50/month (always-on containers + higher SQL tier + ACR)
//  Minimum 1 replica: no cold starts for facility users.
// ─────────────────────────────────────────────────────────────────────────────

using './main.bicep'

param appName = 'nhsnob'
param environment = 'prod'
param location = 'eastus'

// ─── Container App sizing ─────────────────────────────────────────────────────
// 0.5 vCPU / 1 GiB per container, always 1 replica running.
// ~$12-15/month per container (2 containers = ~$25-30/month total compute).
param containerAppTier = {
  cpu: '0.5'
  memory: '1.0Gi'
  minReplicas: 1      // Always-on — no cold start for facility users
  maxReplicas: 5
}

// ─── SQL Database sizing ──────────────────────────────────────────────────────
// Serverless GP_S_Gen5_2: max 2 vCores, autopause DISABLED (production uptime).
// Cost: ~$10-20/month depending on load.
param sqlTier = {
  skuName: 'GP_S_Gen5_2'
  minCapacity: '1'
  autoPauseDelay: -1   // -1 = disabled; always ready
}

// ─── Secrets (use --parameters sqlAdminPassword=... or CI secret) ─────────────
param sqlAdminLogin = 'onboardingadmin'
// param sqlAdminPassword = ''    // Pass securely — do not hardcode

// ─── Image tags ───────────────────────────────────────────────────────────────
param apiImageTag = 'latest'
param webImageTag = 'latest'

// ─── link-cloud service URLs ──────────────────────────────────────────────────
param tenantServiceUrl          = 'https://link-tenant.yourdomain.com'
param dataAcquisitionServiceUrl = 'https://link-dataacq.yourdomain.com'
param reportServiceUrl          = 'https://link-report.yourdomain.com'
param normalizationServiceUrl   = 'https://link-normalization.yourdomain.com'
