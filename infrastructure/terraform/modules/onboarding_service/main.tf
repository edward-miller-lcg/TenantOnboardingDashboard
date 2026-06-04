# Container App — NHSNLink Onboarding API (ASP.NET Core 10).
# Consumption profile. Scales to zero when idle (min_replicas = 0 in dev).

resource "azurerm_container_app" "main" {
  name                         = var.name
  resource_group_name          = var.resource_group_name
  container_app_environment_id = var.environment_id
  revision_mode                = "Single"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [var.identity_id]
  }

  registry {
    server   = var.acr_login_server
    identity = var.identity_id
  }

  # DB connection string stored as a Container App secret — not in env vars directly
  secret {
    name  = "db-connection-string"
    value = var.db_connection_string
  }

  ingress {
    external_enabled = true
    target_port      = 5100
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "onboarding-service"
      image  = "${var.acr_login_server}/nhsnlink-onboarding-service:${var.image_tag}"
      cpu    = tonumber(var.cpu)
      memory = var.memory

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Docker"
      }
      env {
        name  = "ASPNETCORE_HTTP_PORTS"
        value = "5100"
      }
      env {
        name        = "ConnectionStrings__DatabaseConnection"
        secret_name = "db-connection-string"
      }
      env {
        name  = "ServiceRegistry__TenantServiceUrl"
        value = var.tenant_service_url
      }
      env {
        name  = "ServiceRegistry__DataAcquisitionServiceUrl"
        value = var.data_acquisition_service_url
      }
      env {
        name  = "ServiceRegistry__ReportServiceUrl"
        value = var.report_service_url
      }
      env {
        name  = "ServiceRegistry__NormalizationServiceUrl"
        value = var.normalization_service_url
      }
      env {
        name  = "Cors__AllowedOrigins__0"
        value = var.cors_origins
      }
    }

    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = "10"
    }
  }
}
