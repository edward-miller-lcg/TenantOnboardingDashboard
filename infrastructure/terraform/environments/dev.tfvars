# ─────────────────────────────────────────────────────────────────────────────
#  Dev environment — ~$5-8/month
#  Scale-to-zero, smallest SQL Serverless tier, autopause after 60 min idle.
# ─────────────────────────────────────────────────────────────────────────────

app_name            = "nhsnob"
environment         = "dev"
location            = "eastus"
resource_group_name = "rg-nhsnlink-onboarding-dev"

# Container Apps: minimum consumption tier, scale to zero when idle
container_app_cpu          = "0.25"
container_app_memory       = "0.5Gi"
container_app_min_replicas = 0       # Free when nobody is using it
container_app_max_replicas = 3

# SQL: Serverless 1 vCore max, autopause after 60 min idle (~$0 when paused)
sql_sku_name         = "GP_S_Gen5_1"
sql_min_capacity     = 0.5
sql_auto_pause_delay = 60

# Image tags
api_image_tag = "dev"
web_image_tag = "dev"

# sql_admin_login is "onboardingadmin" (default in variables.tf)
# sql_admin_password — pass via: terraform apply -var="sql_admin_password=<pw>"
#                      or:        export TF_VAR_sql_admin_password="<pw>"

# ─── link-cloud service URLs ──────────────────────────────────────────────────
# Replace with actual URLs from your link-cloud Azure deployment
tenant_service_url           = "https://link-tenant.yourdomain.com"
data_acquisition_service_url = "https://link-dataacq.yourdomain.com"
report_service_url           = "https://link-report.yourdomain.com"
normalization_service_url    = "https://link-normalization.yourdomain.com"
