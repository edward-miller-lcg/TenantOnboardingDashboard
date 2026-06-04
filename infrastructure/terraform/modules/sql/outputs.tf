output "server_fqdn"    { value = azurerm_mssql_server.main.fully_qualified_domain_name }
output "database_name"  { value = azurerm_mssql_database.main.name }
# Connection string intentionally NOT output here — built in root main.tf so the
# password (sensitive var) is never written to a module output or state in plaintext.
