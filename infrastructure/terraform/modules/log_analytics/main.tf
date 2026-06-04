# Log Analytics Workspace — used by the Container Apps Environment for diagnostics.
# First 5 GB/month of ingestion is free on the PerGB2018 SKU.

resource "azurerm_log_analytics_workspace" "main" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30   # Minimum; keeps cost at the floor
  tags                = var.tags
}
