// ─────────────────────────────────────────────────────────────────────────────
//  NHSNLink Tenant Onboarding — Azure Infrastructure
//  Target: isolated resource group, no shared infrastructure with link-cloud.
//
//  Deploy:
//    az deployment group create \
//      --resource-group <rg> \
//      --template-file infrastructure/main.bicep \
//      --parameters infrastructure/dev.bicepparam
// ─────────────────────────────────────────────────────────────────────────────

targetScope = 'resourceGroup'

// ─── Identity & Naming ────────────────────────────────────────────────────────

@description('Short name prefix applied to all resources. Keep it short (<=8 chars).')
param appName string = 'nhsnob'

@description('Deployment environment tag. Used in resource names and tags.')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

param location string = resourceGroup().location

// ─── Container App sizing ────────────────────────────────────────────────────
// Use the pre-defined tier objects from .bicepparam for consistent sizing.

@description('Container Apps compute size and replica scaling.')
param containerAppTier object = {
  cpu: '0.25'        // 0.25 | 0.5 | 1.0 vCPU
  memory: '0.5Gi'   // Must match a valid vCPU/memory pair
  minReplicas: 0     // 0 = scale to zero (dev); 1 = always-on (prod)
  maxReplicas: 3
}

// ─── SQL Database sizing ──────────────────────────────────────────────────────

@description('Azure SQL Serverless tier settings.')
param sqlTier object = {
  skuName: 'GP_S_Gen5_1'   // Serverless 1 vCore max
  minCapacity: '0.5'        // Min vCores when active
  autoPauseDelay: 60        // Minutes idle before pause (-1 = disabled)
}

// ─── Secrets ─────────────────────────────────────────────────────────────────

@description('SQL Server administrator username.')
param sqlAdminLogin string = 'onboardingadmin'

@secure()
@description('SQL Server administrator password.')
param sqlAdminPassword string

// ─── Image Tags ───────────────────────────────────────────────────────────────

@description('Docker image tag for onboarding-service. Defaults to "latest".')
param apiImageTag string = 'latest'

@description('Docker image tag for onboarding-web. Defaults to "latest".')
param webImageTag string = 'latest'

// ─── link-cloud Service URLs ─────────────────────────────────────────────────
// These point to the existing link-cloud deployment in Azure.
// Format: https://<host> (no trailing slash)

@description('URL of the link-cloud Tenant service.')
param tenantServiceUrl string

@description('URL of the link-cloud DataAcquisition service.')
param dataAcquisitionServiceUrl string

@description('URL of the link-cloud Report service.')
param reportServiceUrl string

@description('URL of the link-cloud Normalization service.')
param normalizationServiceUrl string

// ─── Derived names ────────────────────────────────────────────────────────────

var prefix = '${appName}-${environment}'
var tags = {
  application: 'nhsnlink-onboarding'
  environment: environment
  managedBy: 'bicep'
}

// ACR names must be alphanumeric only, 5-50 chars
var acrName = replace('${appName}${environment}acr', '-', '')

// Build connection string inline — vars are not persisted in deployment history.
var dbConnectionString = 'Server=tcp:${sql.outputs.sqlServerFqdn},1433;Initial Catalog=${sql.outputs.databaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

// ─── Modules ─────────────────────────────────────────────────────────────────

module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'log-analytics'
  params: {
    name: '${prefix}-logs'
    location: location
    tags: tags
  }
}

module registry 'modules/container-registry.bicep' = {
  name: 'container-registry'
  params: {
    name: acrName
    location: location
    identityName: '${prefix}-pull-identity'
    tags: tags
  }
}

module containerAppsEnv 'modules/container-apps-env.bicep' = {
  name: 'container-apps-env'
  params: {
    name: '${prefix}-cae'
    location: location
    logAnalyticsCustomerId: logAnalytics.outputs.customerId
    logAnalyticsPrimaryKey: logAnalytics.outputs.primarySharedKey
    tags: tags
  }
}

module sql 'modules/sql.bicep' = {
  name: 'sql-database'
  params: {
    serverName: '${prefix}-sql'
    location: location
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
    databaseName: 'link-onboarding'
    skuName: sqlTier.skuName
    minCapacity: sqlTier.minCapacity
    autoPauseDelay: sqlTier.autoPauseDelay
    tags: tags
  }
}

module apiApp 'modules/onboarding-service.bicep' = {
  name: 'onboarding-service'
  params: {
    name: '${prefix}-api'
    location: location
    environmentId: containerAppsEnv.outputs.environmentId
    acrLoginServer: registry.outputs.loginServer
    identityId: registry.outputs.identityId
    imageTag: apiImageTag
    cpu: containerAppTier.cpu
    memory: containerAppTier.memory
    minReplicas: containerAppTier.minReplicas
    maxReplicas: containerAppTier.maxReplicas
    dbConnectionString: dbConnectionString
    tenantServiceUrl: tenantServiceUrl
    dataAcquisitionServiceUrl: dataAcquisitionServiceUrl
    reportServiceUrl: reportServiceUrl
    normalizationServiceUrl: normalizationServiceUrl
    corsOrigins: 'https://${prefix}-web.${containerAppsEnv.outputs.defaultDomain}'
    tags: tags
  }
}

module webApp 'modules/onboarding-web.bicep' = {
  name: 'onboarding-web'
  params: {
    name: '${prefix}-web'
    location: location
    environmentId: containerAppsEnv.outputs.environmentId
    acrLoginServer: registry.outputs.loginServer
    identityId: registry.outputs.identityId
    imageTag: webImageTag
    cpu: containerAppTier.cpu
    memory: containerAppTier.memory
    minReplicas: containerAppTier.minReplicas
    maxReplicas: containerAppTier.maxReplicas
    apiUrl: apiApp.outputs.url
    tags: tags
  }
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

@description('ACR login server — push images here before deploying.')
output acrLoginServer string = registry.outputs.loginServer

@description('Onboarding app URL — share this with facility users.')
output onboardingWebUrl string = webApp.outputs.url

@description('Onboarding API URL — used by link-cloud and for debugging.')
output onboardingApiUrl string = apiApp.outputs.url

@description('ACR image push commands (run after az acr login).')
output imagePushCommands object = {
  login: 'az acr login --name ${acrName}'
  tagService: 'docker tag nhsnlink-onboarding-service:latest ${registry.outputs.loginServer}/nhsnlink-onboarding-service:${apiImageTag}'
  pushService: 'docker push ${registry.outputs.loginServer}/nhsnlink-onboarding-service:${apiImageTag}'
  tagWeb: 'docker tag nhsnlink-onboarding-web:latest ${registry.outputs.loginServer}/nhsnlink-onboarding-web:${webImageTag}'
  pushWeb: 'docker push ${registry.outputs.loginServer}/nhsnlink-onboarding-web:${webImageTag}'
}
