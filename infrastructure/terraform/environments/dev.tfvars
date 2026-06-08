# ─────────────────────────────────────────────────────────────────────────────
#  Dev environment — ~$10-15/month
#  Always-warm containers (minReplicas=1), SQL serverless autopause after 4h.
# ─────────────────────────────────────────────────────────────────────────────

app_name            = "nhsnob"
environment         = "dev"
location            = "eastus"
resource_group_name = "rg-nhsnlink-onboarding-dev"

# Container Apps: 1 replica always warm — eliminates cold-start hangs during dev
container_app_cpu          = "0.25"
container_app_memory       = "0.5Gi"
container_app_min_replicas = 1       # Always-warm (~$3-5/month above free grant)
container_app_max_replicas = 3

# SQL: Serverless 1 vCore max, autopause after 240 min idle (extended from 60 min
#      to avoid mid-session wake-up delays of ~30-60s)
sql_sku_name         = "GP_S_Gen5_1"
sql_min_capacity     = 0.5
sql_auto_pause_delay = 240

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
