// Azure Container Registry + User-Assigned Managed Identity with AcrPull.
// Basic SKU: ~$5/month. Stores the onboarding-service and onboarding-web images.

param name string
param location string
param tags object = {}
param identityName string

// ACR
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Basic'   // Lowest cost; 10 GB included storage, no geo-replication
  }
  properties: {
    adminUserEnabled: false   // Use managed identity — no passwords needed
    anonymousPullEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// Managed identity used by both Container Apps to pull images
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

// AcrPull built-in role
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output acrId string = acr.id
output loginServer string = acr.properties.loginServer
output identityId string = identity.id
output identityClientId string = identity.properties.clientId
