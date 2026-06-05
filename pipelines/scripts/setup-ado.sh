#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  ADO Bootstrap Script — NHSNLink Onboarding
#
#  Automates creation of:
#    - Variable groups (common, dev, prod)
#    - Environments (nhsnlink-dev, nhsnlink-prod)
#    - Pipelines (pr-validation, build-push, deploy-infrastructure, release)
#    - Branch policy wiring pr-validation to main
#
#  What this script CANNOT do (requires manual steps in ADO UI):
#    - Create service connections (credential handshake requires browser)
#    - Add environment approvers (requires user identity lookup)
#
#  Prerequisites:
#    az extension add --name azure-devops
#    az login
#
#  Usage:
#    chmod +x setup-ado.sh
#    ./setup-ado.sh \
#      --org        https://dev.azure.com/YourOrg \
#      --project    YourProject \
#      --repo       TenantOnboardingDashboard \
#      --env        dev \
#      --sql-pass   "YourDevSqlPass" \
#      --tenant-url https://link-tenant.yourdomain.com \
#      --dataacq-url https://link-dataacq.yourdomain.com \
#      --report-url  https://link-report.yourdomain.com \
#      --norm-url    https://link-normalization.yourdomain.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Parse arguments ─────────────────────────────────────────────────────────
ORG=""
PROJECT=""
REPO=""
SQL_PASS=""
TENANT_URL=""
DATAACQ_URL=""
REPORT_URL=""
NORM_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --org)        ORG="$2";        shift 2 ;;
    --project)    PROJECT="$2";    shift 2 ;;
    --repo)       REPO="$2";       shift 2 ;;
    --sql-pass)   SQL_PASS="$2";   shift 2 ;;
    --tenant-url) TENANT_URL="$2"; shift 2 ;;
    --dataacq-url) DATAACQ_URL="$2"; shift 2 ;;
    --report-url) REPORT_URL="$2"; shift 2 ;;
    --norm-url)   NORM_URL="$2";   shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# Validate required args
for var in ORG PROJECT REPO SQL_PASS TENANT_URL DATAACQ_URL REPORT_URL NORM_URL; do
  [[ -z "${!var}" ]] && echo "Error: --${var,,} is required" && exit 1
done

# ─── Configure defaults ───────────────────────────────────────────────────────
az devops configure --defaults organization="$ORG" project="$PROJECT"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  NHSNLink Onboarding — ADO Bootstrap"
echo "  Org:     $ORG"
echo "  Project: $PROJECT"
echo "  Repo:    $REPO"
echo "════════════════════════════════════════════════════════"
echo ""

# ─── 1. Variable Groups ───────────────────────────────────────────────────────
echo "▶ Creating variable groups..."

# Common (non-secret values — fill ACR details after infra deploy)
az pipelines variable-group create \
  --name "nhsnlink-onboarding-common" \
  --variables \
    ACR_NAME="nhsnobdevacr" \
    ACR_LOGIN_SERVER="nhsnobdevacr.azurecr.io" \
    AZURE_SERVICE_CONNECTION_DEV="azure-nhsnlink-dev" \
    AZURE_SERVICE_CONNECTION_PROD="azure-nhsnlink-prod" \
  --authorize true \
  --output table 2>/dev/null \
  || echo "  (nhsnlink-onboarding-common already exists — skipping)"

# Dev variable group
DEV_GROUP_ID=$(az pipelines variable-group create \
  --name "nhsnlink-onboarding-dev" \
  --variables \
    AZURE_SERVICE_CONNECTION="azure-nhsnlink-dev" \
    RESOURCE_GROUP="rg-nhsnlink-onboarding-dev" \
    APP_NAME_PREFIX="nhsnob-dev" \
    TENANT_SERVICE_URL="$TENANT_URL" \
    DATA_ACQUISITION_URL="$DATAACQ_URL" \
    REPORT_SERVICE_URL="$REPORT_URL" \
    NORMALIZATION_SERVICE_URL="$NORM_URL" \
  --authorize true \
  --query id \
  --output tsv 2>/dev/null) \
  || { echo "  (nhsnlink-onboarding-dev already exists — skipping)"; DEV_GROUP_ID=""; }

# Add SQL password as a secret (separate call so --secret flag applies)
if [[ -n "$DEV_GROUP_ID" ]]; then
  az pipelines variable-group variable create \
    --group-id "$DEV_GROUP_ID" \
    --name "SQL_ADMIN_PASSWORD" \
    --value "$SQL_PASS" \
    --secret true \
    --output none
  echo "  ✓ Dev variable group created (id: $DEV_GROUP_ID)"
fi

# Prod variable group (placeholder values — update with real prod URLs)
az pipelines variable-group create \
  --name "nhsnlink-onboarding-prod" \
  --variables \
    AZURE_SERVICE_CONNECTION="azure-nhsnlink-prod" \
    RESOURCE_GROUP="rg-nhsnlink-onboarding-prod" \
    APP_NAME_PREFIX="nhsnob-prod" \
    TENANT_SERVICE_URL="$TENANT_URL" \
    DATA_ACQUISITION_URL="$DATAACQ_URL" \
    REPORT_SERVICE_URL="$REPORT_URL" \
    NORMALIZATION_SERVICE_URL="$NORM_URL" \
  --authorize true \
  --output table 2>/dev/null \
  || echo "  (nhsnlink-onboarding-prod already exists — skipping)"

echo "  ✓ Variable groups done"
echo ""

# ─── 2. Environments ─────────────────────────────────────────────────────────
echo "▶ Creating environments..."

create_environment() {
  local name="$1"
  local desc="$2"
  az devops invoke \
    --area distributedtask \
    --resource environments \
    --route-parameters project="$PROJECT" \
    --http-method POST \
    --in-file /dev/stdin \
    --api-version "7.1-preview.1" \
    --output none <<EOF
{ "name": "$name", "description": "$desc" }
EOF
}

create_environment "nhsnlink-dev"  "NHSNLink Onboarding — Dev (auto-deploy, no approval)" \
  2>/dev/null || echo "  (nhsnlink-dev already exists — skipping)"

create_environment "nhsnlink-prod" "NHSNLink Onboarding — Prod (APPROVAL REQUIRED before deploy)" \
  2>/dev/null || echo "  (nhsnlink-prod already exists — skipping)"

echo "  ✓ Environments created"
echo "  ⚠  MANUAL STEP: Add approvers to nhsnlink-prod in ADO UI"
echo "     Pipelines → Environments → nhsnlink-prod → Approvals and checks → + Add → Approvals"
echo ""

# ─── 3. Pipelines ─────────────────────────────────────────────────────────────
echo "▶ Creating pipelines..."

create_pipeline() {
  local name="$1"
  local yaml_path="$2"
  az pipelines create \
    --name "$name" \
    --repository "$REPO" \
    --repository-type tfsgit \
    --branch main \
    --yaml-path "$yaml_path" \
    --skip-first-run true \
    --output table 2>/dev/null \
    || echo "  ($name already exists — skipping)"
}

create_pipeline "nhsnlink-pr-validation"        "pipelines/pr-validation.yml"
create_pipeline "nhsnlink-build-push"           "pipelines/build-push.yml"
create_pipeline "nhsnlink-deploy-infrastructure" "pipelines/deploy-infrastructure.yml"
create_pipeline "nhsnlink-release"              "pipelines/release.yml"

echo "  ✓ Pipelines created"
echo ""

# ─── 4. Branch Policy — PR Validation on main ────────────────────────────────
echo "▶ Wiring pr-validation as branch policy on main..."

# Get the pipeline ID for pr-validation
PR_PIPELINE_ID=$(az pipelines show \
  --name "nhsnlink-pr-validation" \
  --query id \
  --output tsv 2>/dev/null || echo "")

# Get the repo ID
REPO_ID=$(az repos show \
  --repository "$REPO" \
  --query id \
  --output tsv 2>/dev/null || echo "")

if [[ -n "$PR_PIPELINE_ID" && -n "$REPO_ID" ]]; then
  az devops invoke \
    --area policy \
    --resource configurations \
    --route-parameters project="$PROJECT" \
    --http-method POST \
    --api-version "7.1" \
    --in-file /dev/stdin \
    --output none <<EOF
{
  "isEnabled": true,
  "isBlocking": true,
  "type": { "id": "fa4e907d-c16b-452d-8106-7efa0cb84489" },
  "settings": {
    "buildDefinitionId": $PR_PIPELINE_ID,
    "queueOnSourceUpdateOnly": true,
    "manualQueueOnly": false,
    "displayName": "PR Validation",
    "validDuration": 720,
    "scope": [
      {
        "repositoryId": "$REPO_ID",
        "refName": "refs/heads/main",
        "matchKind": "Exact"
      }
    ]
  }
}
EOF
  echo "  ✓ Branch policy set on main"
else
  echo "  ⚠  Could not auto-create branch policy (pipeline or repo not found)"
  echo "     Manual: Repos → Branches → main → Branch policies → Build Validation → nhsnlink-pr-validation"
fi

echo ""

# ─── 5. Summary ───────────────────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════"
echo "  Bootstrap complete!"
echo ""
echo "  Remaining MANUAL steps (require ADO UI):"
echo ""
echo "  1. Create service connections:"
echo "     Project Settings → Service connections → New → Azure Resource Manager"
echo "     → App registration (manual) → name: azure-nhsnlink-dev"
echo "     → App registration (manual) → name: azure-nhsnlink-prod"
echo ""
echo "  2. Add prod environment approvers:"
echo "     Pipelines → Environments → nhsnlink-prod → Approvals and checks"
echo ""
echo "  3. After infra deploy, update ACR values in nhsnlink-onboarding-common:"
echo "     Pipelines → Library → nhsnlink-onboarding-common"
echo "     Set ACR_NAME and ACR_LOGIN_SERVER to your actual ACR values"
echo "════════════════════════════════════════════════════════"
