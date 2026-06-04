output "acr_login_server" {
  description = "ACR login server — push images here before deploying."
  value       = module.container_registry.login_server
}

output "onboarding_web_url" {
  description = "Onboarding app URL — share this with facility users."
  value       = module.onboarding_web.url
}

output "onboarding_api_url" {
  description = "Onboarding API URL — used by link-cloud and for debugging."
  value       = module.onboarding_service.url
}

output "image_push_commands" {
  description = "Commands to tag and push images after az acr login."
  value = {
    login        = "az acr login --name ${trimsuffix(module.container_registry.login_server, ".azurecr.io")}"
    tag_service  = "docker tag nhsnlink-onboarding-service:latest ${module.container_registry.login_server}/nhsnlink-onboarding-service:${var.api_image_tag}"
    push_service = "docker push ${module.container_registry.login_server}/nhsnlink-onboarding-service:${var.api_image_tag}"
    tag_web      = "docker tag nhsnlink-onboarding-web:latest ${module.container_registry.login_server}/nhsnlink-onboarding-web:${var.web_image_tag}"
    push_web     = "docker push ${module.container_registry.login_server}/nhsnlink-onboarding-web:${var.web_image_tag}"
  }
}

output "sql_server_fqdn" {
  description = "SQL Server fully qualified domain name."
  value       = module.sql.server_fqdn
}
