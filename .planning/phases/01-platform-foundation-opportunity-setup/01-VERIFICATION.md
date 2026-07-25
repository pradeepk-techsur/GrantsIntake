---
phase: 01-platform-foundation-opportunity-setup
verified: 2026-07-25T13:35:00Z
status: human_needed
score: 5/5 must-haves verified (all SC pass automated checks; 4 UI behaviors require human eyes)
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "TemplateLibrary silent create failure (funding_amount_max: 0 failing z.number().positive() — gap 01-06): fixed by (1) making funding_amount_max .optional() in createOpportunitySchema, (2) removing field from TemplateLibrary payload, (3) migration 005 dropping NOT NULL DB constraint, (4) USWDS error alert added to catch block. POST /api/v1/programs/:id/opportunities without funding_amount_max → HTTP 201 status=draft confirmed."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Opportunity Builder UI renders and all metadata fields are editable with auto-save on blur"
    expected: "In the Opportunity Builder, all metadata fields are present and populated. Editing a field (e.g. Title) and clicking away triggers auto-save — a 'Changes saved' success toast appears momentarily."
    why_human: "OpportunityBuilder renders inside a React SPA. Auto-save on blur is client-side behavior (MetadataForm.tsx handleBlur → onSave → PATCH). Cannot assert visual rendering or toast timing via grep."

  - test: "GuidancePanel collapsible toggle works and displays seeded guidance content"
    expected: "Clicking 'Writing Guidance' accordion button collapses/expands the panel. Panel shows prompt text, example, and USWDS tips for executive_summary and eligibility_summary fields."
    why_human: "GuidancePanel fetches from /api/v1/guidance-prompts and renders based on fieldId match. Toggle state uses sessionStorage. Visual accordion expand/collapse and content rendering require browser."

  - test: "DeadlineForm date fields are interactive and show validation errors on invalid sequences"
    expected: "Deadlines tab shows open/close date pickers, LOI checkbox (LOI deadline appears when checked), rolling review checkbox (cadence appears when checked). Setting close before open shows red error 'Close date must be after open date'."
    why_human: "DeadlineForm client-side validation fires on blur with validateDeadlines(). Error messages use USWDS usa-error-message class. Error display and conditional field reveal are UI behaviors requiring browser."

  - test: "CompletenessChecklist sidebar and Publish flow with remediation checklist"
    expected: "A sticky sidebar shows Publication Readiness checklist. For a freshly created draft, items with ✗ appear. Clicking 'Check Readiness' shows blockers from the API. Publish button is disabled until all required items are complete. Once completed, Publish button works and sidebar shows 'Published' badge."
    why_human: "Checklist derives state from opportunity prop client-side (deriveChecklistItems). Publish button disabled state, 'Check Readiness' API call, and status badge transitions require browser interaction."
---

# Phase 01: Platform Foundation & Opportunity Setup — Verification Report

**Phase Goal:** Grantors can authenticate, access a role-appropriate portal, and create well-structured, validated funding opportunities from templates
**Verified:** 2026-07-25T13:35:00Z
**Status:** HUMAN_NEEDED — all automated checks pass; 4 UI interaction behaviors require human verification
**Re-verification:** Yes — after gap closure (01-06: TemplateLibrary silent create fix + migration 005)

## Re-verification Summary

| Item | Previous | Current |
|------|----------|---------|
| Score | 5/5 | 5/5 |
| Status | human_needed | human_needed |
| Gaps closed | — | 1 (01-06: TemplateLibrary silent create fix) |
| Gaps remaining | 0 | 0 |
| Regressions | — | None |
| Tests | 86/86 | 86/86 (re-confirmed) |

### Gap 01-06: Closed ✓

**Root cause:** `TemplateLibrary.tsx` sent `funding_amount_max: 0` in the create payload. The Zod schema had `z.number().positive()` which rejects `0`, causing a 422 validation error that was silently swallowed by a bare `catch {}` block. Even with Zod fixed to `.optional()`, the DB column had a `NOT NULL` constraint — requiring migration 005 to make it nullable.

**Fixes applied and verified in codebase:**

1. **`src/routes/opportunities.ts` line 29:** `funding_amount_max: z.number().positive(...).optional()` — confirmed via grep (both createOpportunitySchema and updateOpportunitySchema now have `.optional()`)
2. **`client/src/pages/grantor/opportunities/TemplateLibrary.tsx`:** `funding_amount_max` not present in payload (grep returns no output for field in TemplateLibrary); `createError` state + USWDS error alert added to catch block (lines 39, 80, 83, 86, 153–161)
3. **`client/src/hooks/useOpportunity.ts` line 72:** `CreateOpportunityPayload.funding_amount_max?: number` — optional in client type
4. **`src/db/migrations/005_funding_amount_max_nullable.sql`:** `ALTER TABLE opportunities ALTER COLUMN funding_amount_max DROP NOT NULL;` — confirmed present
5. **Gate evidence:** `POST /api/v1/programs/:id/opportunities` without `funding_amount_max` → HTTP 201 `status=draft` (GATE.md wave gap 01-06)

---

## Gate Evidence Summary

*Citing gate findings (not re-litigating):*
- Gate: PASSED — 86/86 tests, clean build, boot smoke pass
- Gap 01-05 redrive: programs seed fix — GET /programs → 1 program; POST /programs/:id/opportunities → HTTP 201 — **closed**
- Gap 01-06 redrive: POST without `funding_amount_max` → HTTP 201 `status=draft` — **closed**
- UAT Tests 1–2: PASS (login, RBAC portal shell)
- UAT Test 3: CLOSED via gap plan 01-05 + 01-06
- UAT Tests 4–7: SKIPPED during UAT (couldn't reach Opportunity Builder) — API auto-checks verified server behavior; UI rendering requires human (see below)

---

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Grantor user can log in and see a role-appropriate dashboard with RBAC-enforced navigation (WCAG 2.1 AA) | ✓ VERIFIED | Live: POST /auth/login → JWT issued. GET /auth/me → roles: ['grantor_admin']. GrantorLayout.tsx has `<a className="usa-skipnav">`, `role="banner"`, `aria-label`, `tabIndex={-1}` on `<main>`. GrantorSidebar.tsx gates nav items per role (grantor_admin, program_officer, intake_administrator). requireRole middleware enforces server-side. |
| 2 | Grantor can create a funding opportunity from a template library (all 5 template types, all required metadata fields) | ✓ VERIFIED | Live (gate 01-06): POST /api/v1/programs/:id/opportunities without funding_amount_max → HTTP 201 status=draft. GET /api/v1/opportunity-templates → 5 templates. MetadataForm.tsx (585 lines) has all required fields. TemplateLibrary.tsx (251 lines, grown from 233): payload no longer sends funding_amount_max: 0; USWDS error alert surfaces failures; navigate to /grantor/opportunities/:id on 201. |
| 3 | Grantor can configure intake windows, pre-application deadlines, LOI deadlines, and rolling review periods | ✓ VERIFIED | DeadlineForm.tsx (418 lines): application_open/close dates, pre_application_deadline, loi_required toggle + loi_deadline (conditional), rolling_review_enabled + cadence_days (conditional), deadline_timezone select. Live: PATCH with valid dates → 200 OK. |
| 4 | System blocks publication of an opportunity with missing required metadata and shows a clear remediation checklist | ✓ VERIFIED | Live: POST /opportunities/:id/publish?dry_run=true on draft → {"is_ready":false,"blockers":[...]}. CompletenessChecklist.tsx (314 lines) derives real-time status. Publish button gated: `disabled={!allRequiredComplete}`. completenessService.ts checks 10 metadata fields + federal ALN + deadlines + LOI. |
| 5 | Every published opportunity modification creates a new immutable version snapshot with modification reason and audit trail | ✓ VERIFIED | Live: PATCH on published without modification_reason → 400 MODIFICATION_REASON_REQUIRED. PATCH with reason → 200. GET /versions → 2 versions. DB trigger `prevent_version_mutation()` BEFORE UPDATE OR DELETE raises exception. audit_events table immutable (migration 001). |

**Score:** 5/5 truths verified at the automated level

---

### Required Artifacts

| Artifact | Description | Status | Evidence |
|----------|-------------|--------|---------|
| `client/src/pages/auth/LoginPage.tsx` | USWDS login form with error handling | ✓ VERIFIED | 102 lines, substantive form with email/password, aria-live error alert, navigates to /grantor/dashboard on success |
| `client/src/layouts/GrantorLayout.tsx` | Auth-gated layout with WCAG skip nav | ✓ VERIFIED | 81 lines, usa-skipnav, role=banner, RBAC sidebar, Outlet for pages |
| `client/src/components/nav/GrantorSidebar.tsx` | Role-restricted nav | ✓ VERIFIED | 118 lines, hasRole() logic gating Opportunities, Settings (admin only), Q&A Inbox per role |
| `client/src/pages/grantor/Dashboard.tsx` | Role-appropriate dashboard | ✓ VERIFIED | 124 lines, branching on isProgramOfficerOrAdmin / isIntakeAdmin, USWDS cards |
| `client/src/pages/grantor/OpportunitiesIndex.tsx` | Opportunities list with template library trigger | ✓ VERIFIED | 98 lines, canCreate role check, useFirstProgramId() fetches /programs, showTemplateLibrary && programId gates modal, no-programs-warning with heading |
| `client/src/pages/grantor/opportunities/TemplateLibrary.tsx` | Template selection modal | ✓ VERIFIED | 251 lines (+18 from gap-06 fix): fetches templates, groups by market, createError state + USWDS error alert, select → navigate to /grantor/opportunities/:id |
| `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` | Main builder with tabs | ✓ VERIFIED | 300 lines, MetadataForm + DeadlineForm + VersionHistory tabs, modification reason modal for published opps, CompletenessChecklist sidebar |
| `client/src/pages/grantor/opportunities/MetadataForm.tsx` | All metadata fields with auto-save | ✓ VERIFIED | 585 lines, 17 fields, auto-save on blur via handleBlur, client-side + server-side error handling, GuidancePanel + ReadabilityIndicator wired |
| `client/src/pages/grantor/opportunities/DeadlineForm.tsx` | Deadline and intake window config | ✓ VERIFIED | 418 lines, all deadline fields, client-side validation mirrors server rules, auto-save on blur |
| `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` | Real-time readiness sidebar | ✓ VERIFIED | 314 lines, deriveChecklistItems(), Check Readiness → dry_run API call, Publish button disabled until allRequiredComplete |
| `client/src/pages/grantor/opportunities/VersionHistory.tsx` | Immutable version table | ✓ VERIFIED | 112 lines, fetches /versions, renders table with version_number, modification_reason, delta summary, timestamps |
| `client/src/components/guidance/ReadabilityIndicator.tsx` | Flesch-Kincaid grade indicator | ✓ VERIFIED | Full FK grade level implementation with countSyllables(), debounced 300ms, advisory label |
| `client/src/pages/grantor/opportunities/GuidancePanel.tsx` | Collapsible writing guidance | ✓ VERIFIED | React Query fetch from /guidance-prompts, sessionStorage toggle persistence, USWDS accordion |
| `src/middleware/requireRole.ts` | Server-side RBAC enforcement | ✓ VERIFIED | 27 lines, checks req.user.roles array, returns 403 PERMISSION_DENIED |
| `src/middleware/authenticate.ts` | JWT authentication middleware | ✓ VERIFIED (via live tests, 86 passing tests) | Login → JWT → /auth/me pattern works end-to-end |
| `src/routes/opportunities.ts` | POST create, GET, PATCH, POST publish, GET versions | ✓ VERIFIED | 496 lines, all 5 routes; createOpportunitySchema.funding_amount_max now .optional() (gap-06 fix line 29); IDOR protection, deadline validation, versioning |
| `src/services/opportunity/completenessService.ts` | Publication blocking logic | ✓ VERIFIED | 143 lines, real DB query, 10 metadata checks + federal ALN + deadlines + LOI |
| `src/services/opportunity/versioningService.ts` | Immutable version snapshots | ✓ VERIFIED | 132 lines, delta computation, DB INSERT with NOT NULL modification_reason, audit event write |
| `src/db/migrations/004_opportunity_versions_schema.sql` | Immutability DB trigger | ✓ VERIFIED | prevent_version_mutation() trigger BEFORE UPDATE OR DELETE raises exception |
| `src/db/migrations/005_funding_amount_max_nullable.sql` | Drop NOT NULL from funding_amount_max | ✓ VERIFIED | `ALTER TABLE opportunities ALTER COLUMN funding_amount_max DROP NOT NULL;` — new artifact added by gap-06 |
| `src/db/seed.ts` | Idempotent seed with programs row | ✓ VERIFIED | Line 57-76: SELECT-then-INSERT for 'General Grant Programs'. Live: GET /programs → 1 program |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| LoginPage.tsx | /api/v1/auth/login | useAuth() hook → POST | ✓ WIRED | Login → navigate('/grantor/dashboard') on success |
| GrantorLayout.tsx | GrantorSidebar | prop: grantor_memberships | ✓ WIRED | useCurrentUser() → grantor_memberships passed to sidebar |
| OpportunitiesIndex.tsx | TemplateLibrary modal | programId truthy + showTemplateLibrary | ✓ WIRED | useFirstProgramId() → GET /programs → modal mounts |
| TemplateLibrary.tsx | /api/v1/programs/:id/opportunities | createOpportunity.mutateAsync(payload) — no funding_amount_max | ✓ WIRED | navigate to /grantor/opportunities/:id on 201 response; setCreateError on failure (gap-06) |
| createOpportunitySchema | funding_amount_max | z.number().positive().optional() | ✓ WIRED | line 29 in opportunities.ts — consistent with updateOpportunitySchema (line 51) |
| migration 005 | opportunities.funding_amount_max | DROP NOT NULL | ✓ WIRED | 005_funding_amount_max_nullable.sql applied; DB column now nullable |
| OpportunityBuilder.tsx | MetadataForm / DeadlineForm | onSave → useUpdateOpportunity.mutateAsync() → PATCH | ✓ WIRED | handleSave dispatches to PATCH /opportunities/:id |
| PATCH /opportunities/:id | versioningService.createSnapshot | status === 'published' && modification_reason | ✓ WIRED | opportunities.ts lines 321-329: snapshot created on every published PATCH |
| POST /publish | completenessService.check | is_ready check before status update | ✓ WIRED | opportunities.ts lines 395-410: blocks with 422 if not ready |
| CompletenessChecklist.tsx | /publish?dry_run=true | useCheckReadiness.mutateAsync() | ✓ WIRED | checkReadiness mutation → setServerResult with blockers |
| VersionHistory.tsx | /opportunities/:id/versions | useOpportunityVersions() React Query | ✓ WIRED | versions fetched and rendered in DESC order |
| seed.ts | programs table | SELECT-then-INSERT 'General Grant Programs' | ✓ WIRED | Live verified: GET /programs → 1 program |

---

### Requirements Coverage

| Success Criterion | Status | Notes |
|-------------------|--------|-------|
| SC1: RBAC login + role-appropriate portal (WCAG 2.1 AA) | ✓ SATISFIED | Server RBAC + client role gating + WCAG signals verified |
| SC2: Template library (5 types) + structured metadata | ✓ SATISFIED | 5 templates seeded; all required fields in MetadataForm; create path now correct (gap-06) |
| SC3: Intake windows, pre-application deadlines, LOI deadlines, rolling review | ✓ SATISFIED | All deadline types in DeadlineForm with validation |
| SC4: Block publication on missing required metadata + remediation checklist | ✓ SATISFIED | dry_run returns blockers; Publish button disabled client-side |
| SC5: Immutable version snapshot on modification with audit trail | ✓ SATISFIED | DB trigger enforces immutability; modification_reason enforced server-side |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/services/opportunity/completenessService.ts` | 133–134 | `// TODO Phase 2: At least one eligibility rule` | ℹ️ Info | Intentional — Phase 2 items. Not blockers. Commented correctly as deferred. |
| `client/src/App.tsx` | 42–44 | `<div><h1>Intake Queue</h1><p>Coming in Phase 6.</p></div>` | ℹ️ Info | Intentional placeholders for routes not in Phase 1 scope. Phase 1 goal does not include intake queue or QA inbox. |

**No blockers found.** Phase 2 TODOs are correctly scoped comments, not blocking stubs.

---

### Human Verification Required

#### 1. Opportunity Builder UI Renders and Auto-Save on Blur Works

**Test:** Log in as admin@example.gov. From Opportunities page, click "Create New Opportunity". In the template modal, select "Federal Notice of Funding Opportunity (NOFO)" and click "Create Opportunity". The Opportunity Builder should open at `/grantor/opportunities/:id`.
- Edit the "Opportunity Title" field and click outside (blur). A green "Changes saved" toast should appear momentarily.
- Scroll through the form to verify all metadata fields are present (Title, Opportunity Number, Funding Source, Announcement Type, Program Area, Max Award Amount, Min Award Amount, Executive Summary, Eligibility Summary, Contact Name, Contact Email).
**Expected:** Builder opens, all fields visible, auto-save on blur shows toast and does not navigate away.
**Why human:** React SPA rendering and blur event / toast timing cannot be verified by static analysis.

#### 2. Guidance Panel Toggle and Content Display

**Test:** In the Opportunity Builder on the Metadata tab, scroll to "Executive Summary". A "Writing Guidance" accordion should appear below the textarea.
- Click "Writing Guidance" to expand it — it should show: prompt text, an Example block, and a Tips list.
- Click again to collapse it. Reload the page — it should remember the collapsed state.
**Expected:** Accordion expands/collapses; guidance content (from seeded guidance_prompts table) is visible; sessionStorage persists toggle state.
**Why human:** GuidancePanel uses React Query + sessionStorage. Content visibility and accordion interaction require browser.

#### 3. DeadlineForm Fields and Validation

**Test:** Click the "Deadlines & Intake Window" tab in the Opportunity Builder.
- Set Application Close Date earlier than Application Open Date (e.g. open = Nov 1, close = Sep 1). Blur the close date field.
- Expect a red error message: "Close date must be after open date".
- Check the "LOI Required" checkbox — a "LOI Deadline" date field should appear.
- Check "Enable Rolling Review" — a "Rolling Review Cadence (days)" number field should appear.
**Expected:** Conditional fields appear/hide correctly; date sequence validation shows USWDS error message; valid dates auto-save with "Deadline settings saved" toast.
**Why human:** Client-side form interactions, conditional rendering, error display, and toast animations require browser.

#### 4. Completeness Checklist Sidebar + Publish Flow

**Test:** In the Opportunity Builder, observe the "Publication Readiness" sidebar on the right.
- On a freshly created draft (before completing fields), the sidebar should show ✗ for incomplete items and the Publish button should be disabled.
- Fill in all required fields (including ALN if federal). The ✗ items should change to ✓ as you save.
- Click "Check Readiness" — should show blockers if any remain, or "Ready to publish" if all complete.
- With all required fields complete, click "Publish Opportunity". The opportunity status badge should change from "Draft" to "Published".
- Make an edit to any field after publishing — a "Modification Reason Required" modal should appear.
**Expected:** Checklist reflects real-time state, Publish button enables when all required fields complete, modification reason modal appears post-publication.
**Why human:** React state-driven UI behavior, status badge transitions, modal triggers, and full end-to-end publish flow require browser.

> **Note on UAT Test 3 (Create Opportunity):** This item was previously marked as a human verification item in the UAT doc and a gap in the gap plan. The gap is now **closed** — POST without `funding_amount_max` → HTTP 201 confirmed via gate. The 4 items above are the remaining human-only checks (items 4–7 from the UAT doc: Opportunity Builder interactions, GuidancePanel, DeadlineForm, Publish flow).

---

## Gaps Summary

No gaps remain. All five success criteria are satisfied by substantive, wired implementations verified against the live codebase and running application.

**Gap 01-06 closure confirmed:** The TemplateLibrary silent create failure (the only automated gap discovered post-initial-verification) is fully closed. Three layers of fix are verified in code: Zod schema `.optional()`, payload field removal, and DB migration 005 dropping NOT NULL. USWDS error alert is wired in catch block. Gate evidence: HTTP 201 on create without `funding_amount_max`.

**No regressions introduced:** 86/86 tests pass (re-confirmed). TemplateLibrary.tsx grew from 233 to 251 lines (18 lines of error handling added). All other key artifact line counts unchanged.

**Key evidence summary:**
- 86/86 tests pass (gate citation + re-confirmed)
- Live API (gate): POST /auth/login → JWT; GET /auth/me → grantor_admin role; GET /programs → 1 program; POST /programs/:id/opportunities → 201 draft; dry_run → blockers; PATCH with ALN+dates → OK; POST /publish → published; PATCH without reason → MODIFICATION_REASON_REQUIRED; PATCH with reason → OK; GET /versions → 2 versions (v1+v2); immutability trigger in DB migration
- All 21 required artifacts exist (migration 005 added), are substantive (no stubs), and are wired
- 4 human verification items remain: UI rendering, auto-save, field interactions, and publish flow — expected human verification items for a UI-heavy phase, not blockers

---

_Verified: 2026-07-25T13:35:00Z_
_Verifier: Claude (pivota_spec-verifier)_
