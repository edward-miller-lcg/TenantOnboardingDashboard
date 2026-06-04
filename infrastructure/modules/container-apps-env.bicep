// Container Apps Environment — Consumption plan.
// No per-environment charge. Only billed for actual vCPU/memory used by containers.
// Free grant: 180,000 vCPU-sec + 360,000 GiB-sec per subscription per month.

param name string
param location string
param logAnalyticsCustomerId string
@secure()
param logAnalyticsPrimaryKey string
param tags object = {}

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsPrimaryKey
      }
    }
    workloadProfiles: [
      {
        // Consumption profile — scale to zero, no minimum charge
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    // No VNet injection — public endpoints are fine for this workload
    vnetConfiguration: null
    peerAuthentication: {
      mtls: {
        enabled: false
      }
    }
  }
}

output environmentId string = env.id
output environmentName string = env.name
output defaultDomain string = env.properties.defaultDomain
