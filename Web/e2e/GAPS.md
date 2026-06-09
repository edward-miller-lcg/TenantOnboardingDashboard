# Acceptance Criteria Gaps vs Current Implementation

Source: `Guided_Onboarding_Requirements.xls Sept 12.xlsx`
Generated: 2026-06-09

This file documents items from the requirements spreadsheet that are either:
- **Not yet implemented** (gap — needs a ticket)
- **Out of scope** (pre-onboarding or external system)
- **Adapted** (intent preserved but implementation changed)

---

## 🔴 Not Yet Implemented

### 1. "Cannot delete" protection on HSLOC and Encounter.type normalizations
**Story:** Validation/Normalizations  
**AC:** "cannot delete HSLOC Code map or Encounter.type"  
**Current state:** All normalization operations have `canDelete: true`. The normalization service has no concept of a "protected" operation.  
**Needed:** Either tag the operations created during Location/Encounter mapping steps as non-deletable (via a convention e.g. name prefix or a session flag), or add a `isProtected` field to the normalization service `OperationModel` and surface it in the onboarding response.

---

### 2. "Save" button (save without navigating)
**Stories:** Facility Info, Server Info  
**AC:** "Add save Button — will save data and user can comeback later to complete"  
**Current state:** Only "Save & Continue" exists. There is no secondary save action.  
**Needed:** A secondary `Save` button that POSTs the form data and stays on the current page. Session `FormData` is already persisted — just needs the button and a success toast.

---

### 3. Tool tips not applied
**Source:** Tool Tips sheet  
**AC:** All fields should have tooltip text (? icon)  
**Current state:** A few fields have tooltips (`?` with `title` attribute) but most are missing.  
**Fields that need tooltip text (from spreadsheet):**

| Screen | Field | Tooltip text |
|---|---|---|
| Facility Info | Organization Name(s) | "Name(s) of the facility associated with the NHSN Org ID" |
| Facility Info | Time Zone | "Facility's local time zone" |
| Facility Info | Physical Address | "Facility's address" |
| Facility Info | Technical Contact Phone Number | "Point of contact for technical issues" |
| Connection Test | Patient FHIR ID | "Patient ID that can be reached through FHIR API" |
| POI (Epic) | Patient List IDs | "FHIR IDs of the lists created above" |
| POI (Cerner) | sFTP URL | "URL where the sFTP server can be reached" |
| POI (Cerner) | sFTP Username | "Username that NHSNLink will use to connect to the sFTP server" |
| POI (Cerner) | sFTP Password | "Password that NHSNLink will use to connect the sFTP server" |
| Encounter Mapping | Source System | "Local code system that will be mapped" |
| Code Map | Name | "Name for the facility to identify this code map" |
| Code Map | Description | "Description of what this code map is used for" |
| Code Map | Resource Type | "Resource type that this code map will apply to" |
| Code Map | FHIR Path | "Path to the property that will be mapped" |
| Code Map | Source System | "Local code system that will be mapped" |
| Code Map | Target System | "Target code system for this code map" |
| Copy Property | Name | "Name that the facility will use to identify this normalization" |
| Copy Property | Description | "Description of what this normalization is used for" |
| Copy Property | Resource Type | "Resource type that this normalization will apply to" |
| Copy Property | Source FHIR Path | "Path to the property that will be copied from" |
| Copy Property | Target FHIR Path | "Path that the property will be copied to" |
| Copy Property | Enabled | "Whether the normalization will run or not during a report creation" |
| Conditional Transform | Name | "Name that the facility will use to identify this normalization" |
| Conditional Transform | Description | "Description of what this normalization is used for" |
| Conditional Transform | Resource Type | "Resource type that this normalization will apply to" |
| Conditional Transform | Target FHIR Path | "Path to the property that this transformation will apply to" |
| Conditional Transform | Target Value | "Value that the property will be set to" |
| Conditional Transform | FHIR Path (condition) | "Path to the property that this condition will be checked against" |
| Conditional Transform | Value (optional) | "Optional value that this condition will be checked against" |
| Conditional Transform | Enabled | "Whether the normalization will run or not during a report creation" |

**Note:** Fields marked "REMOVE — determined not needed" in the spreadsheet (Server Info FHIR URL, EHR Vendor, Conditional Transform Operator) should NOT have tooltips.

---

### 4. Error message format standardization
**Source:** Error Messaging sheet  
**AC:**
- Required field: `"{Field} is required, please populate with needed information"`
- Incorrect format: `"{Field} format is incorrect please correct to move to the next screen"`
**Current state:** Error messages are ad-hoc strings per component.  
**Needed:** Centralize error messages to match these templates. Angular reactive forms validators should produce messages in this format.

---

### 5. PCC and Meditech in EHR Vendor dropdown (grayed out, not selectable)
**Story:** Configuration/Server Information  
**AC:** "Keep PCC and Meditech in gray text and not clickable"  
**Current state:** Unknown — need to verify the dropdown options.

---

### 6. Breadcrumb shows only completed steps up to current, not future steps
**Story:** Configuration/Breadcrumbs  
**AC:** "The current step user is on will display in Black text, with no additional steps after"  
**Current state:** Need to verify breadcrumb component behaviour.

---

### 7. POI Epic — minimum 6 Patient List IDs validation
**Story:** Configuration/Census/Epic  
**AC:** "Minimum of 6 IDs needed"  
**Current state:** No minimum count validation on the Patient List IDs field.

---

### 8. Conditional Transformation editor — no story written
**Current state:** The editor exists and works but was not written as a story in the spreadsheet.  
**Needed:** Write a Jira story for this screen; the existing `conditional-transformation.spec.ts` tests cover it but there's no formal AC.

---

## ⚠️ Adapted (Intent Preserved, Implementation Changed)

### A. Location.type Mapping — checkbox → guided HSLOC code map
**Story:** Configuration/Location.type Mapping  
**Original AC:** Checkbox: "I have completed the HSLOC code map in the NHSN app."  
**Current implementation:** Full guided form where the user enters the Epic location identifier system URI and maps Epic location codes to HSLOC codes. Two normalization operations are created automatically (CodeMap + CopyLocation).  
**Rationale:** Option A was chosen to capture the mappings directly in the portal rather than relying on an external NHSN app step. This is a deliberate product decision, not a gap.  
**Tests:** `normalizations/location-mapping.spec.ts` reflects the new implementation.

### B. Encounter.type FHIRPath
**Story:** Configuration/Encounter.type Map  
**Original AC:** FHIR Path displays "Type" (not editable)  
**Current implementation:** FHIR Path is `Encounter.type.coding` (updated to match the normalization service's CodeMapOperation requirement).

---

## ⛔ Out of Scope

### S1. NHSN left-nav entry point
**Story:** Engage/Compliance Attestation (first story)  
**Reason:** Describes embedding within the NHSN application's left nav. The portal is standalone; NHSN nav integration is a separate external integration.

### S2. Superuser ServiceNow request form
**Story:** Engage/Compliance Attestation (second story)  
**Reason:** Pre-onboarding step handled outside the portal (ServiceNow + Kelly Schultz templates).

### S3. ServiceNow template creation
**Story:** Configurations/Service now button  
**Reason:** Operations/backend work with Kelly Schultz. The "Contact Support" link is implemented; the template behind it is out of scope for the portal.
