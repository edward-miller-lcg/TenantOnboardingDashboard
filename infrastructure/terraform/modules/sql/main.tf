# Azure SQL Server + Serverless Database.
# Serverless compute: billed per-second only when active; pauses automatically.
# Storage: ~$0.115/GB/month. Near-zero cost for light dev use.

resource "azurerm_mssql_server" "main" {
  name                         = var.server_name
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.admin_login
  administrator_login_password = var.admin_password
  minimum_tls_version          = "1.2"
  tags                         = var.tags
}

# Allow all Azure services (Container Apps, etc.) to reach the server
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAllWindowsAzureIps"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_mssql_database" "main" {
  name      = var.database_name
  server_id = azurerm_mssql_server.main.id
  collation = "SQL_Latin1_General_CP1_CI_AS"

  # Serverless tier (GP_S_Gen5_n): compute charged per second when active only
  sku_name     = var.sku_name
  min_capacity = var.min_capacity

  # auto_pause_delay_in_minutes: 60 (dev) / -1 (disabled, prod)
  auto_pause_delay_in_minutes = var.auto_pause_delay

  max_size_gb          = 32
  storage_account_type = "Local"   # Cheapest backup redundancy
  tags                 = var.tags

  lifecycle {
    # Prevent accidental data loss if someone changes the SKU
    prevent_destroy = false
  }
}
