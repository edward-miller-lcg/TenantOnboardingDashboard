# Container App — NHSNLink Onboarding Web App (Angular 21 / nginx).
# API_URL is injected as an env var; nginx.conf.template substitutes it at startup
# so /api/* proxies to the onboarding-service Container App.

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

  ingress {
    external_enabled = true
    target_port      = 80
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
      name   = "onboarding-web"
      image  = "${var.acr_login_server}/nhsnlink-onboarding-web:${var.image_tag}"
      cpu    = tonumber(var.cpu)
      memory = var.memory

      # Overrides the Dockerfile default; nginx substitutes ${API_URL} at startup
      env {
        name  = "API_URL"
        value = var.api_url
      }
    }

    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = "20"
    }
  }
}
