output "acr_id"       { value = azurerm_container_registry.main.id }
output "login_server" { value = azurerm_container_registry.main.login_server }
output "identity_id"  { value = azurerm_user_assigned_identity.main.id }
