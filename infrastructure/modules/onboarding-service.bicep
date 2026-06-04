// Container App — NHSNLink Onboarding API (ASP.NET Core 10).
// Consumption profile, scale to zero when idle.

param name string
param location string
param environmentId string
param acrLoginServer string
param identityId string
param imageTag string = 'latest'
param tags object = {}

// ─── Size / Scaling (from .bicepparam) ────────────────────────────────────
param cpu string = '0.25'          // '0.25' dev | '0.5' prod
param memory string = '0.5Gi'      // '0.5Gi' dev | '1.0Gi' prod
param minReplicas int = 0           // 0 = scale-to-zero | 1 = always-on
param maxReplicas int = 3

// ─── App config ─────────────────────────────────────────────────────────────
@secure()
param dbConnectionString string

param tenantServiceUrl string
param dataAcquisitionServiceUrl string
param reportServiceUrl string
param normalizationServiceUrl string

@description('Comma-separated list of allowed CORS origins.')
param corsOrigins string = '*'

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
        targetPort: 5100
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: identityId
        }
      ]
      // Secrets stored in Container Apps — no Key Vault required
      secrets: [
        {
          name: 'db-connection-string'
          value: dbConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'onboarding-service'
          image: '${acrLoginServer}/nhsnlink-onboarding-service:${imageTag}'
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT',             value: 'Docker' }
            { name: 'ASPNETCORE_HTTP_PORTS',              value: '5100' }
            { name: 'ConnectionStrings__DatabaseConnection', secretRef: 'db-connection-string' }
            { name: 'ServiceRegistry__TenantServiceUrl',           value: tenantServiceUrl }
            { name: 'ServiceRegistry__DataAcquisitionServiceUrl',  value: dataAcquisitionServiceUrl }
            { name: 'ServiceRegistry__ReportServiceUrl',           value: reportServiceUrl }
            { name: 'ServiceRegistry__NormalizationServiceUrl',    value: normalizationServiceUrl }
            { name: 'Cors__AllowedOrigins__0',            value: corsOrigins }
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
                concurrentRequests: '10'   // Scale up when >10 concurrent requests per replica
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
output containerAppId string = containerApp.id
