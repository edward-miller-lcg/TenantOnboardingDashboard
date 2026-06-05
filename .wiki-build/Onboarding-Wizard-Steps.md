# Onboarding Wizard Steps

All 11+ steps of the NHSNLink guided onboarding wizard, in sequence.

## Step Flow

```
Landing/Compliance Attestation
    ↓
Overview (Checklist)
    ↓
[Configuration]
Facility Info → Server Info → Authorization → Connection Test
    → Patients of Interest → Location.type Mapping → Encounter.type Mapping
    ↓
POI Lists Compiling (status page)
    ↓
Verify Patients of Interest
    ↓
[Validation]
Run Test Report → Test Reports List ←→ Normalizations
    ↓ (when a report has 0 unacceptable issues)
Operations (success page)
```

## Step Details

### Compliance Attestation
**Route:** `/onboarding/{token}`
**Backend:** `POST /api/onboarding/{token}/compliance-attestation`

Facility user reads the compliance statement and checks "I Agree". Also shows the ServiceNow link for starting the onboarding process. Subsequent visits redirect to the Overview page.

---

### Overview (Checklist)
**Route:** `/onboarding/{token}/overview`

Shows all steps as a checklist. Steps are:
- **Clickable** if already completed or is the next step in sequence
- **Grayed out** if not yet reached
- **Checked** (☑) if completed

Sections: Compliance Attestation | Configuration | Validation | Operations

---

### Facility Info
**Route:** `/onboarding/{token}/facility-info`
**Backend:** `POST /api/onboarding/{token}/facility-info`

| Field | Required | Notes |
|---|---|---|
| NHSN Org ID | Display only | Pre-populated from admin session creation |
| Health System Name | Display only | Pre-populated from admin session creation |
| Organization Name(s) | ✅ | Free text, comma-separated for multiple |
| Time Zone | ✅ | US timezones only (IANA codes) |
| Physical Address | ✅ | Free text |
| Technical Contact Phone | No | Format: `###-###-####` |

On save, creates the facility record in link-cloud's Tenant service using the NHSN Org ID as the facility ID.

---

### Server Info
**Route:** `/onboarding/{token}/server-info`
**Backend:** `POST /api/onboarding/{token}/server-info`

| Field | Required | Notes |
|---|---|---|
| FHIR R4 Rest Base URL (Production) | ✅ | Must start with `http://` or `https://` |
| EHR Vendor | ✅ | Epic, Cerner (active); PCC, Meditech (disabled/future) |

The selected vendor is stored and drives conditional rendering on Authorization and Patients of Interest pages.

---

### Authorization
**Route:** `/onboarding/{token}/authorization`
**Backend:** `POST /api/onboarding/{token}/authorization`

Vendor-conditional confirmation checkbox:
- **Epic:** "I have completed all EPIC set up requirements."
- **Cerner:** "I have completed all Cerner set up requirements."

Save & continue is disabled until the checkbox is checked.

---

### Connection Test
**Route:** `/onboarding/{token}/connection-test`
**Backend:** `POST /api/onboarding/{token}/connection-test`

| Field | Notes |
|---|---|
| Patient FHIR ID | A valid patient ID from the EHR system |

The backend fetches `{fhirBaseUrl}/metadata` (FHIR CapabilityStatement) to verify connectivity. Returns `{ success: true/false, errorDetails?: string }`. Always HTTP 200 — the Angular app reads the `success` field.

**Success:** Green checkmark, Continue button appears.
**Failure:** Error icon, error details shown, "Go back" to retry.

---

### Patients of Interest
**Route:** `/onboarding/{token}/patients-of-interest`
**Backend:** `POST /api/onboarding/{token}/patients-of-interest`

**Epic variant:**
| Field | Notes |
|---|---|
| Patient List IDs (comma separated) | FHIR IDs of patient lists; minimum 6 required |

**Cerner variant:**
| Field | Notes |
|---|---|
| sFTP URL | URL where the sFTP server can be reached |
| sFTP Username | Username NHSNLink uses to connect |
| sFTP Password | Password (masked with `**`) |

---

### Location.type Mapping
**Route:** `/onboarding/{token}/location-type-mapping`
**Backend:** `POST /api/onboarding/{token}/location-type-mapping`

Confirmation checkbox: "I have completed the HSLOC code map in the NHSN app."

The actual HSLOC mapping is done externally in the NHSN application. This step confirms it's been completed.

---

### Encounter.type Mapping
**Route:** `/onboarding/{token}/encounter-type-mapping`
**Backend:** `POST/GET /api/onboarding/{token}/encounter-type-mapping`

Dynamic form for mapping local encounter codes to SNOMED codes:
- Fixed read-only fields: Resource Type = `Encounter`, FHIR Path = `type`
- One or more **Code System Maps**, each with:
  - Source System (local code system URL)
  - Target System (fixed: `http://snomed.info/sct`)
  - Code rows: Source Code → Target Code (SNOMED dropdown, auto-fills Display)

---

### POI Lists Compiling
**Route:** `/onboarding/{token}/poi-compiling`
**Backend:** `POST /api/onboarding/{token}/poi-compiling`

Status page — no user input. Notifies the user that the patients of interest list is being compiled (takes a few days) and to watch for an email.

---

### Verify Patients of Interest
**Route:** `/onboarding/{token}/verify-poi`
**Backend:** `POST /api/onboarding/{token}/verify-poi`

Shows a "View patients of interest" link and asks the user to confirm the compiled list looks correct. Single confirmation button: "I confirm that the patients of interest are correct."

---

### Test Reports
**Route:** `/onboarding/{token}/test-reports`
**Backend:** `GET /api/onboarding/{token}/reports`

Table of all test reports with columns: Reporting Period, Result (SUCCESS/FAILED/IN_PROGRESS), Unacceptable Issues, Acceptable Issues, Total Patients.

- **View** link → Prequalification Report detail
- **Run New Report** button → Run Test Report page
- **Normalizations** button → Normalization sub-flow
- When a report has 0 unacceptable issues: success banner + **Complete Onboarding** button

---

### Normalizations (sub-flow)
**Route:** `/onboarding/{token}/normalizations`

List of all normalizations with Edit/Delete buttons. "Add new normalization" dropdown with three types:

| Type | Route | Key Fields |
|---|---|---|
| **Code Map** | `/normalizations/code-map` | Name, Resource Type, FHIR Path, Code System Maps |
| **Copy Property** | `/normalizations/copy-property` | Name, Resource Type, Source FHIR Path, Target FHIR Path, Enabled |
| **Conditional Transformation** | `/normalizations/conditional` | Name, Resource Type, Target FHIR Path, Target Value, Conditions |

HSLOC Code Map and Encounter.type normalization cannot be deleted.

---

### Operations (Complete)
**Route:** `/onboarding/{token}/operations`

Final success page. Shows all steps checked (☑) with a success banner "NHSNLink is successfully configured!" and a Submission Dashboard button.
