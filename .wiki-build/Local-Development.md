# Local Development

The entire stack runs via a single `docker compose up` command. This includes all link-cloud services (Kafka, SQL Server, Redis, all microservices) plus the two new onboarding services.

## Quick Start

```bash
# 1. Clone both repos side by side
# C:\projects\link-cloud\
# C:\projects\TenantOnboardingDashboard\

# 2. From TenantOnboardingDashboard root:
cd C:\projects\TenantOnboardingDashboard

# 3. First-time build + start (~5-10 min to pull all images)
docker compose up --build

# 4. Subsequent runs (uses cached images, ~1-2 min)
docker compose up
```

## Access Points

| Service | URL | Notes |
|---|---|---|
| **Admin page** | http://localhost:4200/admin | Generate onboarding URLs here |
| **Onboarding app** | http://localhost:4200/onboarding/{token} | Facility-facing wizard |
| **API (direct)** | http://localhost:5100/openapi/v1.json | OpenAPI docs |
| link-cloud Admin UI | http://localhost:8066 | Existing link-cloud dashboard |
| Grafana | http://localhost:3000 | Logs and metrics |
| Kafka UI | http://localhost:9095 | Kafka topic browser |

## How It Works

`docker-compose.yml` at the repo root uses Docker Compose `include` to pull in the entire link-cloud stack:

```yaml
include:
  - path: ../link-cloud/docker-compose.yml
    project_directory: ../link-cloud
```

The two onboarding services are added on top:
- **onboarding-service** (port 5100) — ASP.NET Core 10, proxies to link-cloud services
- **onboarding-web** (port 4200) — Angular 21 served by nginx

## Rebuilding Only the Onboarding Services

If you change backend or frontend code and don't want to rebuild all of link-cloud:

```bash
docker compose build onboarding-service onboarding-web
docker compose up -d onboarding-service onboarding-web
```

## Environment Variables

All variables are in `.env` at the repo root. Secrets (SQL password, Kafka credentials, etc.) use the same values as link-cloud's `.env` file — they're shared through the `include` mechanism.

## Database

The onboarding service uses a separate database `link-onboarding` on the shared SQL Server instance. EF Core migrations run automatically on startup — no manual DB setup needed.

## API_URL Injection

The Angular app calls `/api/*` which nginx proxies to the backend. In Docker, nginx uses `API_URL=http://onboarding-service:5100` (set in docker-compose.yml) to resolve the backend container by name on the shared `link-nw` network.

## Common Issues

**Port 4200 already in use** — The Angular dev server or another app is using the port. Stop it or change the port mapping in `docker-compose.yml`.

**Docker Desktop not in Linux containers mode** — Right-click the tray icon and switch. All images require Linux.

**`link-cloud` directory not found** — Both repos must be siblings: `C:\projects\link-cloud\` and `C:\projects\TenantOnboardingDashboard\`. The `include` path uses `../link-cloud/`.
