# ─── Identity & Naming ────────────────────────────────────────────────────────

variable "app_name" {
  description = "Short name prefix applied to all resources (<=8 chars, alphanumeric)."
  type        = string
  default     = "nhsnob"
}

variable "environment" {
  description = "Deployment environment. Used in resource names and tags."
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Name of the resource group to create and deploy into."
  type        = string
}

# ─── Container App Sizing ─────────────────────────────────────────────────────

variable "container_app_cpu" {
  description = "vCPU allocation per container replica. Valid: 0.25 | 0.5 | 0.75 | 1.0"
  type        = string
  default     = "0.25"
}

variable "container_app_memory" {
  description = "Memory allocation per replica. Must match vCPU pair (0.25→0.5Gi, 0.5→1.0Gi)."
  type        = string
  default     = "0.5Gi"
}

variable "container_app_min_replicas" {
  description = "Minimum replicas. 0 = scale-to-zero (dev); 1 = always-on (prod)."
  type        = number
  default     = 0
}

variable "container_app_max_replicas" {
  description = "Maximum replicas. Container Apps scales up under HTTP load."
  type        = number
  default     = 3
}

# ─── SQL Tier ─────────────────────────────────────────────────────────────────

variable "sql_sku_name" {
  description = "Azure SQL SKU. GP_S_Gen5_1 = Serverless 1 vCore max (dev). GP_S_Gen5_2 = prod."
  type        = string
  default     = "GP_S_Gen5_1"
}

variable "sql_min_capacity" {
  description = "Serverless minimum vCores when active."
  type        = number
  default     = 0.5
}

variable "sql_auto_pause_delay" {
  description = "Minutes of idle before database auto-pauses. -1 = disabled (prod)."
  type        = number
  default     = 60
}

# ─── Secrets ──────────────────────────────────────────────────────────────────

variable "sql_admin_login" {
  description = "SQL Server administrator username."
  type        = string
  default     = "onboardingadmin"
}

variable "sql_admin_password" {
  description = "SQL Server administrator password. Pass via TF_VAR_sql_admin_password or -var flag."
  type        = string
  sensitive   = true
}

# ─── Image Tags ───────────────────────────────────────────────────────────────

variable "api_image_tag" {
  description = "Docker image tag for nhsnlink-onboarding-service."
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Docker image tag for nhsnlink-onboarding-web."
  type        = string
  default     = "latest"
}

# ─── link-cloud Service URLs ──────────────────────────────────────────────────
# These point to the existing link-cloud deployment in Azure.

variable "tenant_service_url" {
  description = "URL of the link-cloud Tenant service (no trailing slash)."
  type        = string
}

variable "data_acquisition_service_url" {
  description = "URL of the link-cloud DataAcquisition service."
  type        = string
}

variable "report_service_url" {
  description = "URL of the link-cloud Report service."
  type        = string
}

variable "normalization_service_url" {
  description = "URL of the link-cloud Normalization service."
  type        = string
}
