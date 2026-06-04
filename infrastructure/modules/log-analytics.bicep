// Log Analytics Workspace — used by Container Apps Environment for diagnostics.
// The first 5 GB/month of ingestion is free.

param name string
param location string
param tags object = {}

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'   // Pay-as-you-go; first 5 GB/month free
    }
    retentionInDays: 30   // Minimum; keeps cost low
    features: {
      disableLocalAuth: false
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output workspaceId string = workspace.id
output customerId string = workspace.properties.customerId

// listKeys() must flow to the Container Apps Environment.
// Marked @secure() so Bicep treats it as a secret (not written to deployment state in plaintext).
#disable-next-line outputs-should-not-contain-secrets
@secure()
output primarySharedKey string = workspace.listKeys().primarySharedKey
