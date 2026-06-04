variable "server_name"         { type = string }
variable "database_name"       { type = string }
variable "location"            { type = string }
variable "resource_group_name" { type = string }
variable "admin_login"         { type = string }
variable "admin_password"      { type = string; sensitive = true }
variable "sku_name"            { type = string; default = "GP_S_Gen5_1" }
variable "min_capacity"        { type = number; default = 0.5 }
variable "auto_pause_delay"    { type = number; default = 60 }
variable "tags"                { type = map(string); default = {} }
