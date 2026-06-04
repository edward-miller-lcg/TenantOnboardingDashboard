// Container App — NHSNLink Onboarding Web App (Angular 21 / nginx).
// Receives API_URL at runtime so nginx can proxy /api/* to the correct backend.
// Consumption profile, scale to zero when idle.

param name string
param location string
param environmentId string
param acrLoginServer string
param identityId string
param imageTag string = 'latest'
param tags object = {}

// ─── Size / Scaling (from .bicepparam) ────────────────────────────────────
param cpu string = '0.25'
param memory string = '0.5Gi'
param minReplicas int = 0
param maxReplicas int = 3

// ─── Runtime config ─────────────────────────────────────────────────────────
@description('Full HTTPS URL of the onboarding-service Container App.')
param apiUrl string   // e.g. https://onboarding-service.<hash>.<region>.azurecontainerapps.io

// ─── Container App ──────────────────────────────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    environmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 80
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: identityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'onboarding-web'
          image: '${acrLoginServer}/nhsnlink-onboarding-web:${imageTag}'
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            // Injected into nginx.conf.template by envsubst at container start.
            // The Dockerfile sets a default; this override wins at runtime.
            { name: 'API_URL', value: apiUrl }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '20'
              }
            }
          }
        ]
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
