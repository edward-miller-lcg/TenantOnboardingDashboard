// Azure SQL Server + Serverless Database.
// Serverless: compute billed per second only when active; pauses automatically.
// Storage: ~$0.115/GB/month (typically <1 GB for onboarding data).

param serverName string
param location string
param adminLogin string
@secure()
param adminPassword string
param databaseName string = 'link-onboarding'
param tags object = {}

// ─── Tier parameters ───────────────────────────────────────────────────────
// These are set from the environment-specific .bicepparam file.
// Dev defaults: Serverless 1 vCore max, autopause after 60 minutes idle.
// Prod: higher vCore ceiling, autopause disabled.

@description('Azure SQL SKU name. GP_S_Gen5_1 = Serverless 1 vCore max.')
param skuName string = 'GP_S_Gen5_1'

@description('Minimum vCore capacity when active (0.5 or 1 recommended for Serverless).')
param minCapacity string = '0.5'

@description('Minutes of inactivity before the database auto-pauses. -1 = disabled.')
param autoPauseDelay int = 60

// ─── SQL Server ────────────────────────────────────────────────────────────
resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: serverName
  location: location
  tags: tags
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }

  // Allow all Azure services to reach the server
  resource azureServicesFirewall 'firewallRules' = {
    name: 'AllowAllWindowsAzureIps'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
}

// ─── Serverless Database ───────────────────────────────────────────────────
resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  tags: tags
  sku: {
    name: skuName          // e.g. 'GP_S_Gen5_1'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368   // 32 GB max (not pre-allocated)
    autoPauseDelay: autoPauseDelay
    minCapacity: json(minCapacity)
    requestedBackupStorageRedundancy: 'Local'   // Cheapest backup tier
    zoneRedundant: false
  }
}

output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
// Connection string is NOT output here to avoid leaking the password in deployment history.
// Build it in the calling scope (main.bicep) using sqlServerFqdn + the secure password param.
