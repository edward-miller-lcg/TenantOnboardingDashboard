# ─────────────────────────────────────────────────────────────────────────────
#  NHSNLink Tenant Onboarding — Azure Infrastructure (Terraform)
#
#  Deploy (dev):
#    terraform init
#    terraform apply \
#      -var-file=environments/dev.tfvars \
#      -var="sql_admin_password=<strong-password>"
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix = "${var.app_name}-${var.environment}"
  # ACR names must be alphanumeric only, 5-50 chars
  acr_name = replace("${var.app_name}${var.environment}acr", "-", "")

  tags = {
    application = "nhsnlink-onboarding"
    environment = var.environment
    managed_by  = "terraform"
  }

  # Connection string built here — never written to a module output
  db_connection_string = "Server=tcp:${module.sql.server_fqdn},1433;Initial Catalog=${module.sql.database_name};Persist Security Info=False;User ID=${var.sql_admin_login};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}

# ─── Resource Group ───────────────────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.tags
}

# ─── Modules ──────────────────────────────────────────────────────────────────

module "log_analytics" {
  source              = "./modules/log_analytics"
  name                = "${local.prefix}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "container_registry" {
  source              = "./modules/container_registry"
  acr_name            = local.acr_name
  identity_name       = "${local.prefix}-pull-identity"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

module "container_apps_env" {
  source                     = "./modules/container_apps_env"
  name                       = "${local.prefix}-cae"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = module.log_analytics.workspace_id
  tags                       = local.tags
}

module "sql" {
  source              = "./modules/sql"
  server_name         = "${local.prefix}-sql"
  database_name       = "link-onboarding"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  admin_login         = var.sql_admin_login
  admin_password      = var.sql_admin_password
  sku_name            = var.sql_sku_name
  min_capacity        = var.sql_min_capacity
  auto_pause_delay    = var.sql_auto_pause_delay
  tags                = local.tags
}

module "onboarding_service" {
  source              = "./modules/onboarding_service"
  name                = "${local.prefix}-api"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  environment_id      = module.container_apps_env.environment_id
  acr_login_server    = module.container_registry.login_server
  identity_id         = module.container_registry.identity_id
  image_tag           = var.api_image_tag

  cpu          = var.container_app_cpu
  memory       = var.container_app_memory
  min_replicas = var.container_app_min_replicas
  max_replicas = var.container_app_max_replicas

  db_connection_string         = local.db_connection_string
  tenant_service_url           = var.tenant_service_url
  data_acquisition_service_url = var.data_acquisition_service_url
  report_service_url           = var.report_service_url
  normalization_service_url    = var.normalization_service_url
  cors_origins                 = "https://${local.prefix}-web.${module.container_apps_env.default_domain}"

  tags = local.tags
}

module "onboarding_web" {
  source              = "./modules/onboarding_web"
  name                = "${local.prefix}-web"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  environment_id      = module.container_apps_env.environment_id
  acr_login_server    = module.container_registry.login_server
  identity_id         = module.container_registry.identity_id
  image_tag           = var.web_image_tag
  api_url             = module.onboarding_service.url

  cpu          = var.container_app_cpu
  memory       = var.container_app_memory
  min_replicas = var.container_app_min_replicas
  max_replicas = var.container_app_max_replicas

  tags = local.tags
}
