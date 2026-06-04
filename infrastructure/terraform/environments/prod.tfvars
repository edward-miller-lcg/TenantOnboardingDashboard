# ─────────────────────────────────────────────────────────────────────────────
#  Prod environment — ~$40-55/month
#  Always-on replicas (no cold starts), larger SQL tier, autopause disabled.
# ─────────────────────────────────────────────────────────────────────────────

app_name            = "nhsnob"
environment         = "prod"
location            = "eastus"
resource_group_name = "rg-nhsnlink-onboarding-prod"

# Container Apps: 0.5 vCPU / 1 GiB, always 1 replica (no cold start for users)
container_app_cpu          = "0.5"
container_app_memory       = "1.0Gi"
container_app_min_replicas = 1       # Always warm
container_app_max_replicas = 5

# SQL: Serverless 2 vCores max, autopause disabled (always ready for users)
sql_sku_name         = "GP_S_Gen5_2"
sql_min_capacity     = 1
sql_auto_pause_delay = -1   # -1 = disabled

# Image tags
api_image_tag = "latest"
web_image_tag = "latest"

# ─── link-cloud service URLs ──────────────────────────────────────────────────
tenant_service_url           = "https://link-tenant.yourdomain.com"
data_acquisition_service_url = "https://link-dataacq.yourdomain.com"
report_service_url           = "https://link-report.yourdomain.com"
normalization_service_url    = "https://link-normalization.yourdomain.com"
