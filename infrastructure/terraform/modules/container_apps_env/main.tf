# Container Apps Environment — Consumption plan (no workload_profile block = Consumption).
# No per-environment charge. Free grant: 180K vCPU-sec + 360K GiB-sec per subscription/month.

resource "azurerm_container_app_environment" "main" {
  name                       = var.name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags                       = var.tags
  # No workload_profile block → defaults to Consumption (scale-to-zero eligible)
}
