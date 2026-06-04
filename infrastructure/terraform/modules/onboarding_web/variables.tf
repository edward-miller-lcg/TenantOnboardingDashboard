variable "name"                { type = string }
variable "location"            { type = string }
variable "resource_group_name" { type = string }
variable "environment_id"      { type = string }
variable "acr_login_server"    { type = string }
variable "identity_id"         { type = string }
variable "image_tag"           { type = string; default = "latest" }
variable "api_url"             { type = string }

variable "cpu"          { type = string; default = "0.25" }
variable "memory"       { type = string; default = "0.5Gi" }
variable "min_replicas" { type = number; default = 0 }
variable "max_replicas" { type = number; default = 3 }

variable "tags" { type = map(string); default = {} }
