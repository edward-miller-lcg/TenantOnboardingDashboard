# NHSNLink Tenant Onboarding — Wiki

Self-service tenant onboarding wizard for the NHSNLink system. Facility staff receive a unique URL and walk through a guided setup process to configure their EHR connection, map data types, run test reports, and complete onboarding.

---

## Navigation

### 🚀 Getting Started
- [[Prerequisites]] — Tools, Azure setup, provider registration
- [[Local Development]] — Running the full stack with Docker Compose

### 🏗️ Architecture
- [[Architecture]] — System overview, component diagram, data flow
- [[Backend]] — ASP.NET Core 10 service: entities, API, proxy clients
- [[Frontend]] — Angular 21 app: routing, components, services

### ☁️ Infrastructure
- [[Azure Deployment]] — Bicep deployment guide, cost breakdown, first-time setup
- [[Terraform]] — HCL alternative to Bicep (same resources, different toolchain)
- [[Troubleshooting]] — Every error encountered, with exact fixes

### 🔄 CI/CD
- [[CI CD Pipelines]] — Pipeline overview, stage flow, template reference
- [[ADO Setup]] — Service connections, variable groups, environments

### 📖 Reference
- [[Onboarding Wizard Steps]] — All 11+ steps documented with field details
- [[API Reference]] — All backend REST endpoints

---

## Quick Links

| I want to… | Go to |
|---|---|
| Run it locally right now | [[Local Development]] |
| Deploy to Azure | [[Azure Deployment]] |
| Set up ADO pipelines | [[ADO Setup]] |
| Fix a deployment error | [[Troubleshooting]] |
| Understand the wizard flow | [[Onboarding Wizard Steps]] |
| Call the API | [[API Reference]] |

---

## Repo Structure

```
TenantOnboardingDashboard/
├── DotNet/OnboardingService/   ← ASP.NET Core 10 backend
├── Web/                        ← Angular 21 frontend
├── infrastructure/             ← Bicep + Terraform
├── pipelines/                  ← Azure DevOps YAML pipelines
└── docker-compose.yml          ← Full local stack (includes link-cloud)
```
