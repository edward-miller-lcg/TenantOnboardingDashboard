# API Reference

Base URL: `http://localhost:5100` (local) or `https://{containerapp-fqdn}` (Azure)

All endpoints return `application/json`. Onboarding endpoints validate the token against the database — invalid tokens return `404`.

---

## Admin Endpoints

### Create Onboarding Session
`POST /api/admin/sessions`

Creates a new onboarding session and returns the unique URL to send to the facility user.

**Request:**
```json
{ "nhsnOrgId": "12345", "healthSystemName": "My Health System" }
```

**Response:**
```json
{
  "token": "abc123...",
  "onboardingUrl": "https://.../onboarding/abc123...",
  "sessionId": "guid",
  "nhsnOrgId": "12345",
  "healthSystemName": "My Health System",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### List All Sessions
`GET /api/admin/sessions`

Returns all sessions with step progress and status.

---

## Onboarding Endpoints

All paths are prefixed with `/api/onboarding/{token}`.

### Get Session
`GET /api/onboarding/{token}`

Returns the full session state including step completions and stored form data.

**Response:**
```json
{
  "id": "guid",
  "token": "...",
  "nhsnOrgId": "12345",
  "healthSystemName": "My Health System",
  "facilityId": "12345",
  "ehrVendor": "Epic",
  "status": "InProgress",
  "stepProgress": {
    "ComplianceAttestation": true,
    "FacilityInfo": true,
    "ServerInfo": false
  },
  "formData": {
    "FhirBaseUrl": "https://...",
    "EhrVendor": "Epic"
  }
}
```

---

### Step Completion Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/compliance-attestation` | Mark attestation complete |
| `POST` | `/facility-info` | Save form + create tenant in link-cloud |
| `POST` | `/server-info` | Save FHIR URL + vendor |
| `POST` | `/authorization` | Mark authorization confirmed |
| `POST` | `/connection-test` | Test FHIR `/metadata` endpoint |
| `POST` | `/patients-of-interest` | Save POI data (Epic or Cerner) |
| `POST` | `/location-type-mapping` | Mark HSLOC confirmed |
| `GET` | `/encounter-type-mapping` | Get saved encounter map |
| `POST` | `/encounter-type-mapping` | Save encounter type map |
| `POST` | `/poi-compiling` | Trigger POI compilation |
| `POST` | `/verify-poi` | Confirm POI |
| `POST` | `/complete` | Mark onboarding complete |

---

### Connection Test
`POST /api/onboarding/{token}/connection-test`

**Request:**
```json
{ "patientFhirId": "ea03377b-..." }
```

**Response (always HTTP 200):**
```json
{ "success": true }
// or
{ "success": false, "errorDetails": "Unable to reach FHIR server at ..." }
```

---

### Reports
| Method | Path | Notes |
|---|---|---|
| `GET` | `/reports` | List all test reports |
| `POST` | `/reports` | Generate new test report |
| `GET` | `/reports/{reportId}` | Get prequalification report detail |

**Generate report request:**
```json
{ "startDate": "2025-01-01T00:00:00Z", "endDate": "2025-01-31T00:00:00Z" }
```

---

### Normalizations
| Method | Path | Notes |
|---|---|---|
| `GET` | `/normalizations` | List all normalizations |
| `POST` | `/normalizations/code-map` | Create code map |
| `PUT` | `/normalizations/code-map/{id}` | Update code map |
| `POST` | `/normalizations/copy-property` | Create copy property |
| `PUT` | `/normalizations/copy-property/{id}` | Update copy property |
| `POST` | `/normalizations/conditional` | Create conditional transformation |
| `PUT` | `/normalizations/conditional/{id}` | Update conditional transformation |
| `DELETE` | `/normalizations/{id}` | Delete normalization |

---

## Health Check

`GET /health`

Returns HTTP 200 with a JSON health report when the service and database are reachable. Used by Docker health checks and the smoke test stage.
