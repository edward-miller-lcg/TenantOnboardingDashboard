# Azure Container Registry (Basic) + User-Assigned Managed Identity with AcrPull.
# Basic SKU: ~$5/month. adminUserEnabled = false — managed identity auth only.

resource "azurerm_container_registry" "main" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = false   # Use managed identity — no username/password needed
  tags                = var.tags
}

# Managed identity shared by both Container Apps to pull images from ACR
resource "azurerm_user_assigned_identity" "main" {
  name                = var.identity_name
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

# Grant AcrPull to the managed identity on this registry
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.main.principal_id
}
