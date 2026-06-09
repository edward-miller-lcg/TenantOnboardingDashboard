# Normalization Power-User UX — Design Proposal

> Status: **proposed** — not yet implemented. This documents the target experience for a future sprint once the wizard-style flow (Phase 1) is stable.

---

## Context

The current onboarding portal uses a wizard flow for normalization configuration: guided steps for Location and Encounter mapping, then a list page for custom additions. This works well for hospital IT staff doing initial setup.

A power-user grid experience is needed for:
- **LCG admins** managing normalization operations across many facilities
- **Technical implementers** doing bulk configuration, reordering sequences, or configuring vendor-scoped operations
- **Iterative debugging** — quickly toggling, reordering, and testing individual operations without navigating multiple pages

---

## Proposed Power-User Interface

### Entry Point

A toggle in the top-right of the Normalizations list page:

```
[ Guided View ]  [ Power-User View ]   ← toggle persisted in localStorage per user
```

The guided view remains the default. Power-user view is opt-in.

---

### Layout: Split-Panel Grid

```
┌─────────────────────────────────────────────────────────────────────┐
│  Filters: [Resource Type ▾] [Operation Type ▾] [□ Show disabled]   │
├────────┬──────────────────┬────────────┬──────────┬────────┬────────┤
│  Seq ↕ │ Name             │ Type       │ Resource │ Status │ Actions│
├────────┼──────────────────┼────────────┼──────────┼────────┼────────┤
│   10   │ Map Encounter... │ Code Map   │ Encounter│ ●      │ ⋮      │
│   20   │ Set Enc. Status  │ Conditional│ Encounter│ ●      │ ⋮      │
│   10   │ Map Location...  │ Code Map   │ Location │ ●      │ ⋮      │
│   20   │ Copy Location... │ Copy Loc.  │ Location │ ●      │ ⋮      │
│   30   │ Custom op        │ Copy Prop  │ Patient  │ ○      │ ⋮      │
└────────┴──────────────────┴────────────┴──────────┴────────┴────────┘
```

**Columns:**
| Column | Notes |
|---|---|
| Seq | Editable inline — click to type a new number. Gaps of 10 recommended. Sorted per resource type. |
| Name | Click to expand detail panel (see below) |
| Type | Read-only badge |
| Resource | Badge per resource type; multi-resource ops show multiple |
| Status | ● enabled / ○ disabled — click to toggle without leaving the grid |
| Actions | ⋮ menu: Edit, Duplicate, Disable/Enable, Delete, Test |

---

### Inline Detail Panel

Clicking a row name expands a detail panel below it (accordion, not a new page):

```
▼ Map Encounter Type to SNOMED                             [Edit] [Close]
  ─────────────────────────────────────────────────────────────────────
  FHIRPath:  Encounter.type.coding
  Scope:     Facility-specific  (fac-12345)

  Code System Maps
  ┌─────────────────────────────┬──────────────────────────────────────┐
  │ Source System               │ http://open.epic.com/encounter-type  │
  │ Target System               │ http://snomed.info/sct               │
  ├─────────────────────────────┴──────────────────────────────────────┤
  │ AMB  →  11429006  (Consultation)                                   │
  │ IMP  →  32485007  (Hospital admission)                             │
  │ EMER →  50849002  (Emergency room admission)                       │
  └────────────────────────────────────────────────────────────────────┘

  Operation JSON  [Copy to clipboard]
  { "OperationType": "CodeMap", "FhirPath": "Encounter.type.coding", ... }
```

---

### Sequence Reordering

Two modes:

1. **Inline edit**: Click a sequence number cell → type new value → blur to save (calls `POST /api/normalization/operationsequence` with the updated ordering for that facility + resource type).
2. **Drag-to-reorder**: Hold the `⠿` handle on the left of a row and drag. Sequences are recalculated in gaps of 10 on drop. Confirmation toast: *"Sequence updated"*.

Sequences are scoped per **resource type** — reordering Encounter operations does not affect Location operations.

---

### Bulk Operations

Checkbox column on the left enables bulk actions:

```
[☑] Select all   Actions: [Disable selected] [Delete selected] [Export JSON]
```

**Export JSON** downloads the selected operations as a JSON array matching the normalization service's `PostOperationModel` shape — useful for copying configurations between environments or building vendor presets.

---

### Test Operation Panel

From the ⋮ menu → **Test**: opens a right-side drawer:

```
┌─────────────────────────── Test Operation ───────────────────────────┐
│ Operation: Map Encounter Type to SNOMED                              │
│                                                                      │
│ Paste a sample FHIR resource (JSON):                                 │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ { "resourceType": "Encounter", "type": [...] }                   │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ [Run Test]                                                           │
│                                                                      │
│ Result: ● Success                                                    │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ { "resourceType": "Encounter", "type": [{ "coding": [           │ │
│ │   { "system": "http://snomed.info/sct", "code": "11429006" }    │ │
│ │ ]}]}                                                             │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Calls `POST /api/normalization/operations/test` (or `POST /api/normalization/operations/{id}/test`).

Diff view (before/after) is preferred over raw output — highlight changed fields in green.

---

### Add Operation Flow (Power-User)

Instead of navigating to a separate page, a modal/side-drawer opens inline:

1. Select operation type (dropdown)
2. Form fields render for that type — same field definitions as the wizard but more compact
3. Resource type multi-select (populated from `/api/normalization/resource/resources`)
4. Sequence number auto-assigned (max + 10) — editable
5. Facility ID pre-filled from session; can be cleared for vendor-scoped operations (admin only)
6. Save → row appears in grid without page reload

---

### Vendor Scope (Admin-Only Section)

When a user has an admin role, a secondary tab appears:

```
[ Facility Operations ]  [ Vendor Operations ]
```

The Vendor Operations tab shows operations scoped to the selected vendor, with a vendor picker at the top. This is where LCG admins configure the Epic/Cerner presets that all facilities inherit.

> Note: Vendor preset infrastructure exists in the normalization service but no seed data has been populated yet. This tab should be gated behind a feature flag (`FEATURE_VENDOR_PRESETS=true`) until vendor data is available.

---

## Implementation Notes

### Angular

- Use `@angular/cdk/drag-drop` (`CdkDropList`, `CdkDrag`) for row reordering — already a dependency via `@angular/cdk`.
- Grid is a standalone component: `NormalizationGridComponent` under `onboarding/normalizations/grid/`.
- The existing `NormalizationsComponent` becomes a shell that renders either the guided list or the grid based on a `viewMode` signal.

### API calls needed (already exist)

| Action | Endpoint |
|---|---|
| List operations | `GET /api/normalization/operations?facilityId=X` |
| Create | `POST /api/normalization/operations` |
| Update / toggle disable | `PUT /api/normalization/operations` |
| Delete | `DELETE /api/normalization/operations/facility/{id}?operationId=X` |
| Reorder sequences | `POST /api/normalization/operationsequence` |
| Test | `POST /api/normalization/operations/test` |

### Auth

Same bearer-forwarding pattern used by `NormalizationServiceClient`. No new auth work needed.

---

## What's Deliberately Excluded

- **CopyLocation** and **RemoveExtensions** in the wizard — these are too technical for hospital IT and should only appear in the power-user grid (or be applied via vendor presets). Add a `// TODO: expose CopyLocation/RemoveExtensions in power-user grid` marker in the add-operation modal component when built.
- **Vendor preset management UI** — deferred until vendor seed data exists in the normalization service.
- **FHIRPath autocomplete** — desirable but requires either a Terminology service integration or a static FHIR element catalog. Document as a follow-on.
