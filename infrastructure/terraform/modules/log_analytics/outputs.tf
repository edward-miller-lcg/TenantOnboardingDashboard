output "workspace_id"  { value = azurerm_log_analytics_workspace.main.id }
output "customer_id"   { value = azurerm_log_analytics_workspace.main.workspace_id }
output "primary_key" {
  value     = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive = true   # Marked sensitive — never printed in plan/apply output
}
