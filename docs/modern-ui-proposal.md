# Modernized Onboarding UI — Proposal

> Status: **Phases 1-5 implemented.** See [Phase 4](#phase-4-implementation-notes) and [Phase 5](#phase-5-implementation-notes) notes below for what shipped vs. what remains as follow-on work.

## Why

The current portal is built as an embedded NHSN/CDC-branded micro-frontend: fixed CDC banner, NHSN top bar, NHSN-styled form controls (sharp corners, NHSN navy/blue palette), and a strictly linear wizard (one step per page, "Continue" button gating progress per `STEP_ORDER`).

We now have the freedom to ship this as a **standalone application** with its own branding. That removes the constraint of matching NHSN visual standards and lets us modernize both the look and the navigation model.

This proposal does **not** discard the existing UI — see [Preserving the Existing UI](#preserving-the-existing-ui).

---

## New Shell

Replace `NhsnHeaderComponent` / `NhsnNavComponent` with a new `AppShellComponent` built on Angular Material (`MatSidenav` + `MatToolbar`), already partially set up via `mat.theme(...)` in `styles.scss`.

```
┌──────────────────────────────────────────────────────────────────┐
│  ☰  NHSNLink Onboarding          [Facility: Mercy General ▾]  👤  │  ← toolbar
├───────────────┬──────────────────────────────────────────────────┤
│ ▸ Setup        │                                                  │
│   ✓ Compliance │                                                  │
│   ✓ Facility   │              <router-outlet>                    │
│   ○ Server     │                                                  │
│   ○ Auth       │                                                  │
│   ...          │                                                  │
│                │                                                  │
│ ▸ Manage       │                                                  │
│   Mappings     │                                                  │
│   Normalizations│                                                 │
│   Operations   │                                                  │
│   Reports      │                                                  │
└───────────────┴──────────────────────────────────────────────────┘
```

- **New product identity**: drop the CDC seal / NHSN top bar entirely. Toolbar shows product name (e.g. "NHSNLink Onboarding" — name TBD), current facility/tenant context, and a user/session menu.
- **New palette/typography**: define a custom Material theme (replace the placeholder `azure` palette with a real brand palette) — modern, rounded controls, consistent spacing scale. `nhsn-*` SCSS variables and classes (`.nhsn-btn`, `.nhsn-form-group`, `.nhsn-table`, etc.) get a parallel `app-*` set, OR are restyled in place once the new shell is the default (see rollout).
- **Responsive**: collapsible sidenav for narrower viewports.

---

## Navigation Model: Hybrid

**Phase A — Guided setup (first-time / incomplete tenants)**
Keep the existing linear, gated flow (`STEP_ORDER`, `isStepAccessible`, "Continue" CTA) — it's well-suited to first-time hospital IT users and already encodes the right business sequencing. This becomes a **stepper-style** experience inside the new shell (Material `MatStepper` or a custom progress rail in the sidenav) instead of full standalone pages with a separate breadcrumb component.

**Phase B — Management dashboard (once `session.status === 'Completed'`, or any time via "Manage" nav section)**
Once initial setup is done, the sidenav exposes a **"Manage"** section giving direct access to:
- Facility/Server/Auth settings (edit anytime, no longer gated)
- Patients of Interest / mapping configuration
- Normalizations (this is where the existing [normalization power-user grid proposal](normalization-power-user-ux.md) plugs in — the grid view becomes the default "Manage → Normalizations" page in the new shell)
- Operations
- Test Reports / Prequalification reports

The session/step-progress model (`SessionService`, `STEP_ORDER`, `OnboardingFormData`) doesn't need to change — it continues to gate the "Setup" flow. "Manage" pages are simply ungated routes that become visible once accessible per existing `isStepAccessible` rules (or always visible to admins).

---

## Route Structure & Preserving the Existing UI

**Implementation note (Phase 1):** rather than a parallel `/workspace/:token` route tree, the new shell is implemented as a **shell-mode toggle within the existing `/onboarding/:token/...` routes**. This was simpler and lower-risk than a parallel route tree: ~40 internal `routerLink`/`router.navigate` calls across step components are hardcoded to `/onboarding/:token/...`, so duplicating routes would have required rewriting all of them to be shell-aware. A toggle avoids that entirely — same URLs, same components, different chrome.

- `OnboardingShellComponent` now renders **either** the legacy NHSN/CDC chrome (`NhsnHeaderComponent` + `NhsnNavComponent`) **or** the new `WorkspaceToolbarComponent` + `WorkspaceNavComponent` (Material sidenav), based on `UiPreferenceService.shellMode` (`'legacy' | 'modern'`, persisted to `localStorage`, **defaults to `legacy`**).
- All routed step components (`FacilityInfoComponent`, `NormalizationsComponent`, etc.) are rendered unchanged inside whichever shell is active via the same `<router-outlet>` — no route duplication, no link rewriting.
- **Legacy → Modern**: a "Try the new workspace ▶" link in the existing NHSN sidebar nav (`nhsn-nav.component.html`).
- **Modern → Legacy**: a "Switch to classic view" button in the new workspace toolbar.
- Nothing is deleted; `NhsnHeaderComponent`/`NhsnNavComponent` are untouched aside from the one added toggle link.

New files added:
- `Web/src/app/services/ui-preference.service.ts` — shell-mode signal + localStorage persistence.
- `Web/src/app/core/workspace-toolbar/` — Material toolbar (brand, facility name, "Switch to classic view").
- `Web/src/app/core/workspace-nav/` — Material sidenav content: **Setup** (linear, gated, mirrors `STEP_ORDER`) + **Manage** (ungated direct links to all configuration/reporting pages).
- `styles.scss` — Material theme primary palette changed from `azure` to `violet` for the new shell (legacy `$nhsn-*` SCSS variables/classes are untouched and unaffected, since the legacy UI doesn't use Material components).
- `index.html` — added Roboto font link (required for Material typography to render correctly).

This keeps the change low-risk and incremental: shell + nav model first, then restyle individual step pages over subsequent passes (Phase 4).

---

## Documentation Updates

If this proceeds:
- `docs/modern-ui-proposal.md` (this file) becomes the source of truth for the new IA — update as decisions are finalized.
- `docs/normalization-power-user-ux.md` gets a note that its "Power-User View" becomes the default Normalizations experience under `/workspace/:token/normalizations` (toggle between guided/grid retained).
- Add a short `Web/README.md` (or update existing) section documenting the two shells (`/onboarding` legacy, `/workspace` modern) and the rollout flag/toggle, so future devs know both exist intentionally.

---

## Suggested Phasing

1. ~~**Shell + theme**: shell-mode toggle (`UiPreferenceService`), Material sidenav/toolbar, new brand palette, "Try the new workspace" / "Switch to classic view" toggle.~~ **Done.**
2. ~~**Guided setup in new shell**: horizontal `WorkspaceStepperComponent` showing the Setup sequence (done/current/locked states, click-to-navigate for accessible steps), shown above the routed step content on Setup pages only. Legacy `OnboardingBreadcrumbComponent` is now suppressed in modern mode (it's redundant with the stepper + sidenav).~~ **Done.**
3. ~~**Manage dashboard**: sidenav "Manage" section already links to ungated versions of mapping/normalization/operations/report pages — verify access control/visibility rules with product.~~ **Done.**
4. ~~**Per-page restyle**: incrementally update individual step templates/SCSS to the new visual language.~~ **Done.**
5. ~~**Normalization power-user grid** under Manage → Normalizations, per the existing grid proposal.~~ **Done (initial cut).**

### Phase 2 implementation notes

- New shared constants: `Web/src/app/core/workspace-nav/setup-steps.ts` exports `SETUP_STEPS` (linear gated sequence) and `MANAGE_ITEMS` (ungated links) — used by both `WorkspaceNavComponent` and the new `WorkspaceStepperComponent`.
- New component: `Web/src/app/core/workspace-stepper/` — horizontal step rail rendered in `OnboardingShellComponent` above `<router-outlet>`, only when the active route matches a `SETUP_STEPS` path (`isSetupPage` computed from `Router` events).
- Note: the "Overview" entry (`path: ''`, step `ComplianceAttestation`) routes to the root `/onboarding/:token/` page (the ComplianceAttestation component), **not** the separate `/overview` dashboard page — this mirrors the existing legacy breadcrumb's convention and isn't part of `STEP_ORDER`'s linear flow, so the stepper doesn't appear on `/overview`. Pre-existing naming quirk, not introduced by this change.

### Phase 3 implementation notes

- `MANAGE_ITEMS` (in `setup-steps.ts`) now carries a `step` field per entry, reusing the same `SessionService.isStepAccessible(step)` gating as `SETUP_STEPS`. A Manage page only becomes a live link once a tenant could reach the equivalent point in the guided Setup flow — e.g. "Manage → Server Info" unlocks once `ServerInfo` is accessible (i.e. `FacilityInfo` is complete).
- "Normalizations" has no dedicated `STEP_ORDER` entry, so it's gated on `EncounterTypeMapping` (the last mapping step it depends on) — it unlocks alongside "Encounter.type Mapping".
- `WorkspaceNavComponent`'s template now mirrors the Setup section's accessible/locked branching for Manage: accessible items render as `mat-list-item` links, locked items render as `<div class="workspace-nav__disabled workspace-nav__disabled--flush">` (a flush variant without the checkmark-column indent used by Setup).
- Verified via Playwright screenshots against two mocked sessions: an early-stage session (only `ComplianceAttestation` done) shows just "Manage → Facility Info" unlocked with the rest grayed out; a later-stage session (through `EncounterTypeMapping` done) shows all earlier Manage items unlocked, with "Test Reports"/"Operations" still locked pending those steps.

### Phase 4 implementation notes

Rather than rewriting each of the ~12 step components' templates/SCSS individually, the restyle is delivered as a set of override rules in `Web/src/styles.scss`, scoped under `.workspace-content` (the modern shell's content area):

- `.nhsn-btn` / `.nhsn-btn-primary` / `.nhsn-btn-danger`: rounded pill buttons using `--mat-sys-primary` / `--mat-sys-error`, Roboto type.
- `.nhsn-form-group` inputs/selects/textareas: rounded corners, Material outline color, violet focus ring.
- `.nhsn-success-msg` / `.nhsn-error-msg` / `.field-error`: recolored to Material `--mat-sys-primary` / `--mat-sys-error`.
- `.nhsn-table`, `.norm-grid` headers: Material surface-variant background.
- `.norm-badge` / `.norm-badge--resource`: rounded "chip" look using `--mat-sys-secondary-container`.
- `.add-dropdown`, `.view-toggle__btn--active`: shadow + primary-color accents.

Because every step component (`FacilityInfoComponent`, `ServerInfoComponent`, `NormalizationsComponent`, etc.) already uses these shared `.nhsn-*`/`.norm-*` classes, this single stylesheet change restyles all ~12 step pages consistently when viewed in the modern shell — with **zero changes to legacy mode**, since `.workspace-content` only exists in the modern shell's DOM. Verified via Playwright screenshots of "Facility Info" in both shells: legacy renders unchanged (NHSN navy, sharp corners); modern renders with the violet palette, rounded buttons/inputs, and Roboto type.

Remaining/optional follow-on: a handful of pages have bespoke layout (e.g. `code-map`, `category-details`, `prequalification-report`) that may benefit from page-specific layout tweaks beyond the shared-class restyle — lower priority, can be done incrementally per page as needed.

### Phase 5 implementation notes

Implements the entry point and core grid from [normalization-power-user-ux.md](normalization-power-user-ux.md):

- `UiPreferenceService` gained `normalizationView: 'guided' | 'grid'` (signal + `localStorage`, **defaults to `guided`** per the proposal — "guided view remains the default, power-user view is opt-in").
- `NormalizationsComponent` now renders a `[ Guided View ] [ Power-User View ]` toggle next to the page title and conditionally renders either the existing guided list or the new `NormalizationGridComponent`.
- New component `Web/src/app/onboarding/normalizations/grid/normalization-grid.component.*`: a table view with columns Seq / Name / Type / Resource / Status / Actions, plus a "Resource type" filter dropdown and a "Show disabled" checkbox. Edit/Delete actions reuse `NormalizationsComponent`'s existing `edit()`/`delete()` handlers — no new API surface needed.
- "Seq" is a **display-only** sequential number (10, 20, 30, ...) reflecting the current sort/filter order — it is not yet backed by the `/api/normalization/operationsequence` endpoint.

**Deliberately deferred** (per the "What's Deliberately Excluded" section of the grid proposal, plus these additions — all require either new API wiring or a CDK drag-drop implementation):
- Inline sequence editing and drag-to-reorder (`@angular/cdk/drag-drop`, `POST /api/normalization/operationsequence`).
- Inline status toggle (enable/disable from the grid) — currently display-only; would call `PUT /api/normalization/operations`.
- Inline detail/expand panel, Test Operation drawer (`POST /api/normalization/operations/test`).
- Bulk select/disable/delete/export.
- Vendor-scoped operations admin tab (blocked on vendor preset seed data, as already noted in the proposal).

A note linking to `docs/normalization-power-user-ux.md` is shown at the bottom of the grid view so users/devs know these are coming.

---

## Decisions Made (Phase 1)

- **Default landing**: `legacy` (NHSN/CDC chrome) remains the default for all users; the modern shell is opt-in via the toggle and persisted per-browser in `localStorage`. Revisit once Phases 2-4 are further along.
- **Product name / branding, brand palette, icons**: placeholders used for now ("NHSNLink Workspace" toolbar title, Material `violet` palette, no icon set). Per request, these will be revisited later — not blocking for the shell scaffolding.
