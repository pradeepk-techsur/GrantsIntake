---
phase: 04-application-workspace-form-capture
verified: 2026-07-30T17:00:00.000Z
status: passed
score: 20/20 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 15/15 (plans 04-01 through 04-11)
  gaps_closed:
    - "UAT-OPP-002 seeded as published opportunity with NO application_workspaces row (enables Start Application UAT Test 2)"
    - "WorkspacePage.tsx opportunityQuery (useQuery queryKey=['opportunity-title'...]) fetches GET /api/v1/opportunities/:id; renders opportunityQuery.data ?? workspace.opportunity_id"
    - "WorkspacePage.tsx grid-col-6 content div has style={{ overflow: 'hidden' }} (prevents wide table overflow)"
    - "AttachmentManager.tsx usa-table wrapped in <div style={{ overflowX: 'auto' }}>"
    - "ReadinessDashboard.tsx loading state uses plain <div> (no usa-prose class)"
  gaps_remaining: []
  regressions: []
---

# Phase 4: Application Workspace — Final Re-Verification (Plans 04-01 through 04-13)

**Phase Goal:** Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission.

**Verified:** 2026-07-30T17:00:00Z
**Status:** PASSED
**Re-verification:** Yes — gap closure round covering plans 04-12 (UAT-OPP-002 seed) and 04-13 (WorkspacePage opportunityQuery + overflow fixes + ReadinessDashboard loading state).
**Prior verification:** Passed (plans 04-01 through 04-11 + all code review fixes, score 15/15).

---

## Gate Evidence (Mandatory Input)

Gate evidence read from `.planning/phases/04-application-workspace-form-capture/04-GATE.md` and `04-REVIEW.md`.

| Gate | Result | Details |
|------|--------|---------|
| Build | ✓ pass | `npm run build` → `tsc` exits 0 (confirmed in gate; carried from prior run) |
| Tests | ✓ pass | **220/220 tests pass** — confirmed in prior gate run (14.09s); gate_status: passed |
| Boot smoke | ✓ pass | Ports 3000 + 5173 bind, HTTP 200, no fatal markers (GATE.md `## Boot Smoke Gate — Post 04-10/11`) |
| Code review (04-10/11) | ✓ clean | Iteration 2 — 0 blockers; B1 and B2 both resolved (commits 91cac16, 66e13bc) |
| Code review (04-12/13) | ✓ carried | No new code review required for 04-12/13 per orchestrator context; gate_status: passed, review_blockers_open: 0 |
| Prior gates (04-01 through 04-11) | ✓ carried | All gate waves documented in GATE.md — all green |

`gate_status: passed`, `review_status: clean`, `review_blockers_open: 0`, `boot_smoke: pass` — confirmed from GATE.md frontmatter.

---

## Observable Truths — Plans 04-12 and 04-13 (5 New Truths)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 16 | A second published opportunity `UAT-OPP-002` ('UAT Community Health Grant 2') exists in `seed.ts` with **no** `application_workspaces` row — enabling Start Application CTA for UAT Test 2 | ✓ VERIFIED | `seed.ts:371–401` — idempotent insert for `UAT-OPP-002` with `status='published'` and title `'UAT Community Health Grant 2'`; no `INSERT INTO application_workspaces` references `UAT-OPP-002` or any derived variable. Comment at line 371: `"NO workspace seeded, enables Start Application UAT Test 2"` |
| 17 | `WorkspacePage.tsx` declares `opportunityQuery` (`useQuery` with `queryKey: ['opportunity-title', ...]`) fetching `GET /api/v1/opportunities/:id` | ✓ VERIFIED | `WorkspacePage.tsx:27–38` — `queryKey: ['opportunity-title', workspaceQuery.data?.opportunity_id]`; `queryFn` fetches `/api/v1/opportunities/${oppId}`; `enabled: !!workspaceQuery.data?.opportunity_id` |
| 18 | `WorkspacePage.tsx` renders `opportunityQuery.data ?? workspace.opportunity_id` (title not raw UUID when available) | ✓ VERIFIED | `WorkspacePage.tsx:113` — `Opportunity: {opportunityQuery.data ?? workspace.opportunity_id}` inside `<p className="usa-hint">` |
| 19 | `WorkspacePage.tsx` grid-col-6 content div has `style={{ overflow: 'hidden' }}` to prevent wide tables from overflowing Readiness Dashboard | ✓ VERIFIED | `WorkspacePage.tsx:139` — `<div className="grid-col-6" data-testid="workspace-section-content" style={{ overflow: 'hidden' }}>` |
| 20 | `AttachmentManager.tsx` wraps `usa-table` in `<div style={{ overflowX: 'auto' }}>` | ✓ VERIFIED | `AttachmentManager.tsx:155–156` — `<div style={{ overflowX: 'auto' }}>` directly wraps `<table className="usa-table usa-table--borderless" ...>` |
| 21 | `ReadinessDashboard.tsx` loading state uses plain `<div>` (no `usa-prose` class) | ✓ VERIFIED | `ReadinessDashboard.tsx:37–41` — `if (isLoading) { return (<div><p className="usa-hint">Loading readiness…</p></div>); }` — no `usa-prose` class anywhere in the loading branch |

**Score (new truths): 6/6** _(Truth 16 covers UAT-OPP-002 existence + no-workspace guarantee; Truths 17+18 together cover the opportunityQuery + render; Truth 19 = grid overflow; Truth 20 = table overflow; Truth 21 = loading state)_

**Regression check on modified files:**
- `WorkspacePage.tsx`: Grid columns still `grid-col-3` + `grid-col-6` + `grid-col-3` (lines 132, 139, 148) — ✓ no regression
- `WorkspacePage.tsx`: `preview-application-link` at line 122 — ✓ no regression
- `AttachmentManager.tsx`: `usa-button-group` (line 113), `usa-table--borderless` (line 156), `usa-button--secondary` (line 196), clip-positioned input (line 145) — ✓ no regression
- `ReadinessDashboard.tsx`: `readiness-preview-link` at line 184 — ✓ no regression

---

## Observable Truths — Plans 04-10 and 04-11 (Carried from Prior Verification)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 11 | Login as applicant navigates to `/applicant/applications` (not `/applicant/profile`) | ✓ VERIFIED (carried) | `LoginPage.tsx:26` — `navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/applications', { replace: true })` |
| 12 | `/applicant` index route redirects to `/applicant/applications` | ✓ VERIFIED (carried) | `App.tsx:52` — `<Route index element={<Navigate to="/applicant/applications" replace />} />` |
| 13 | WorkspacePage 3-column layout columns sum to 12 (`grid-col-3 + grid-col-6 + grid-col-3`) | ✓ VERIFIED (carried + regression-checked) | `WorkspacePage.tsx:132, 139, 148` — confirmed still present after 04-13 changes |
| 14 | No double `usa-prose` nesting — `ApplicantLayout <main>` and `WorkspaceSectionPanel` root div both absence-confirmed | ✓ VERIFIED (carried) | `ApplicantLayout.tsx:85` — no usa-prose; `WorkspaceSectionPanel.tsx:63` — no usa-prose |
| 15 | `SectionFormPanel` renders `Saving…` / `Saved ✓` `usa-hint` indicators; `Saved ✓` auto-clears after 2s | ✓ VERIFIED (carried) | `SectionFormPanel.tsx:103-115` — `saveMutation.isPending/isSuccess`; `:59` — `setTimeout(() => saveMutation.reset(), 2000)` |

---

## Observable Truths — Plans 04-01 through 04-09 (Carried from Prior Verification)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | "Start Application" is a `<button>` calling POST `/api/v1/workspaces` via `useMutation`, navigating to `/applicant/workspaces/:id` on success | ✓ VERIFIED (carried) | `OpportunityDetailPage.tsx:119–134, 265–276` |
| 2 | "Continue Application" `href` uses `/applicant/workspaces/:existingId` (with `/applicant` prefix) | ✓ VERIFIED (carried) | `OpportunityDetailPage.tsx:252–262` |
| 3 | WorkspacePage header has Preview Application link (`data-testid="preview-application-link"`) | ✓ VERIFIED (carried + regression-checked) | `WorkspacePage.tsx:122` — confirmed still present after 04-13 changes |
| 4 | ReadinessDashboard card footer has Preview Application link (`data-testid="readiness-preview-link"`) | ✓ VERIFIED (carried + regression-checked) | `ReadinessDashboard.tsx:184` — confirmed still present after 04-13 changes |
| 5 | WorkspacePage routing lives at `/applicant/workspaces/:workspaceId` and App.tsx index redirect now points to `/applicant/applications` | ✓ VERIFIED (carried) | `App.tsx:52, 57` |
| 6 | BudgetBuilder add-line-item button is outside the `{isExpanded && ...}` block | ✓ VERIFIED (carried) | `BudgetBuilder.tsx:258–273` |
| 7 | `src/db/seed.ts` has `form_field_definitions` inserts for "Project Narrative", "Goals and Objectives", "Number of Beneficiaries" | ✓ VERIFIED (carried + regression-checked) | `seed.ts:497–525` — confirmed still present after 04-12 seed additions |
| 8 | `AttachmentManager` uses `usa-button-group`, `usa-table--borderless`, `usa-button--secondary`; file input clip-positioned (no `display:none`) | ✓ VERIFIED (carried + regression-checked) | `AttachmentManager.tsx:113, 156, 196, 145` — confirmed still present after 04-13 overflow wrapper change |
| 9 | `workspace-status` route uses `org_roles JOIN` (not non-existent `applicant_user_id` column) | ✓ VERIFIED (carried) | `publicOpportunities.ts:212–219` |
| 10 | 409 `DUPLICATE_WORKSPACE` response includes `workspace_id` in body | ✓ VERIFIED (carried) | `workspaces.ts:115–121`; `workspaceService.ts:63–84` |

**Combined Score: 20/20 truths verified** _(Truths 1–15 carried; Truths 16–21 new — numbered 16–21 above, counted as 6 new truths making total 21 truth entries, but the score reflects 20 distinct must-haves as Truths 17+18 are one atomic must-have split into two evidence rows)_

> **Clarification on score:** The 5 new must-haves from plans 04-12/13 correspond exactly to the 5 bullet points in the prompt. The verification table uses 6 rows (17+18 split into two lines for clarity) but represents 5 atomic must-haves. Combined with 15 prior must-haves: **20/20**.

---

## Required Artifacts

| Artifact | Check | Status | Details |
|----------|-------|--------|---------|
| `src/db/seed.ts` | UAT-OPP-002 insert (lines 371–401); no application_workspaces link to it | ✓ VERIFIED | Lines 371–401: idempotent `INSERT INTO opportunities` for `UAT-OPP-002`; workspace insert at lines 444–460 targets `uatOpportunityId` (UAT-OPP-001 only) |
| `client/src/pages/applicant/WorkspacePage.tsx` | `opportunityQuery` useQuery at lines 27–38; render at line 113; `style={{ overflow: 'hidden' }}` on grid-col-6 at line 139 | ✓ VERIFIED | All three confirmed by direct file read |
| `client/src/components/workspace/AttachmentManager.tsx` | `<div style={{ overflowX: 'auto' }}>` wrapper on usa-table at lines 155–156 | ✓ VERIFIED | Confirmed by direct file read and grep |
| `client/src/components/workspace/ReadinessDashboard.tsx` | Loading state `<div>` (no usa-prose) at lines 37–41 | ✓ VERIFIED | `if (isLoading) { return (<div>` — no usa-prose class |
| `client/src/pages/auth/LoginPage.tsx` | `navigate('/applicant/applications')` for non-grantor on line 26 | ✓ VERIFIED (carried) | Line 26 confirmed |
| `client/src/App.tsx` | Index route `Navigate to='/applicant/applications'` | ✓ VERIFIED (carried) | Line 52 confirmed |
| `client/src/components/workspace/SectionFormPanel.tsx` | `saveMutation.isPending/isSuccess` in JSX; `saveMutation.reset()` in `onSuccess` | ✓ VERIFIED (carried) | Lines 103, 108, 59 |
| `e2e/workspace-layout-fixes.spec.ts` | Playwright tests for login redirect + grid columns + no usa-prose | ✓ VERIFIED (carried) | File exists; SPA-navigation pattern |
| `e2e/formFields.spec.ts` | 4 tests; SPA-navigation pattern; `blurring a text field shows Saving… indicator` test | ✓ VERIFIED (carried) | Lines 13-16, 41-44, 76-79, 109-112 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `seed.ts` UAT-OPP-002 block | No `application_workspaces` row | Absence of any workspace INSERT referencing OPP-002 | ✓ VERIFIED | `uatOpportunityId` (OPP-001) is used in workspace INSERT at line 454; OPP-002 block (lines 371–401) inserts only into `opportunities` table; grep confirms no `uatOpportunityId2` variable exists |
| `WorkspacePage.tsx` opportunityQuery | `GET /api/v1/opportunities/:id` | `fetch('/api/v1/opportunities/${oppId}')` in queryFn at line 31 | ✓ WIRED | `enabled` guard ensures query only fires when `workspaceQuery.data?.opportunity_id` is truthy |
| `WorkspacePage.tsx` opportunityQuery.data | `<p className="usa-hint">` render | `{opportunityQuery.data ?? workspace.opportunity_id}` at line 113 | ✓ WIRED | Fallback to raw UUID if title fetch fails — graceful degradation confirmed |
| `AttachmentManager.tsx` overflow wrapper | `usa-table` inside div | `<div style={{ overflowX: 'auto' }}>` directly wraps `<table>` at lines 155–156 | ✓ WIRED | No intermediate elements; wrapper applies only when `displayAttachments.length > 0` (correct — empty state shows `<p>` instead) |
| `LoginPage.tsx` | `/applicant/applications` | `navigate()` on successful non-grantor login | ✓ WIRED (carried) | Line 26 |
| `App.tsx` | `/applicant/applications` | `<Navigate>` on `/applicant` index route | ✓ WIRED (carried) | Line 52 |
| `WorkspacePage.tsx` | 3-col grid `3+6+3=12` | USWDS `grid-col-N` class attributes | ✓ WIRED (carried) | Lines 132/139/148 — regression-checked after 04-13 |
| `SectionFormPanel.tsx` | `save-status-saving/saved` spans | `saveMutation.isPending/isSuccess` conditional render | ✓ WIRED (carried) | Lines 103-115 |
| `OpportunityDetailPage` | `POST /api/v1/workspaces` | `useMutation → workspaceApi.createWorkspace` | ✓ WIRED (carried) | `onSuccess` → `navigate('/applicant/workspaces/:id')` |
| `workspace-status` route | `application_workspaces` | `JOIN org_roles` | ✓ WIRED (carried) | `publicOpportunities.ts:212–219` |
| `workspaces.ts` 409 handler | `workspaceService` thrown error | `dupErr.workspace_id` in response JSON | ✓ WIRED (carried) | `workspaces.ts:115–121` |

---

## Requirements Coverage

| Criterion | Plan | Status |
|-----------|------|--------|
| One workspace per org per opportunity, 9 sections, completion tracking | 04-01 | ✓ Satisfied |
| Section ownership, tasks, private comments (grantor-blocked) | 04-01, 04-02 | ✓ Satisfied |
| Readiness dashboard with completion %, blocking errors | 04-02 | ✓ Satisfied |
| Structured form fields (11 types), budget with ceiling + match validation | 04-03, 04-05 | ✓ Satisfied |
| Attachments with version history, submission package preview | 04-04 | ✓ Satisfied |
| Start Application CTA → POST /workspaces; Continue Application → `/applicant/` prefix | 04-07 | ✓ Satisfied |
| Preview Application links (WorkspacePage header + ReadinessDashboard footer) | 04-07 | ✓ Satisfied |
| BudgetBuilder add-button always visible (outside accordion gate) | 04-08 | ✓ Satisfied |
| seed.ts narrative form_field_definitions (3 UAT fields) | 04-08 | ✓ Satisfied |
| AttachmentManager USWDS conformance (usa-button-group, usa-table--borderless, usa-button--secondary, clip-positioned input) | 04-09 | ✓ Satisfied |
| workspace-status org_roles JOIN (correct column usage) | code-review fix | ✓ Satisfied |
| 409 DUPLICATE_WORKSPACE includes workspace_id | code-review fix | ✓ Satisfied |
| Login redirect to /applicant/applications (not /applicant/profile) | 04-10 | ✓ Satisfied |
| WorkspacePage grid 3+6+3=12 (fills 100% of desktop:grid-col-9 parent) | 04-10 | ✓ Satisfied |
| No double usa-prose nesting in ApplicantLayout → WorkspaceSectionPanel path | 04-10 | ✓ Satisfied |
| Auto-save Saving…/Saved ✓ indicators in SectionFormPanel (USWDS usa-hint) | 04-11 | ✓ Satisfied |
| Saved ✓ indicator clears after 2s (saveMutation.reset() setTimeout) | code-review fix (B2) | ✓ Satisfied |
| formFields.spec.ts uses SPA-navigation (no page.goto to protected routes) | code-review fix (B1) | ✓ Satisfied |
| **UAT-OPP-002 seeded as published opportunity with no pre-created workspace (enables Start Application UAT Test 2)** | 04-12 | ✓ Satisfied |
| **WorkspacePage displays opportunity title (not raw UUID) via secondary useQuery** | 04-13 | ✓ Satisfied |
| **WorkspacePage grid-col-6 content div overflow:hidden (prevents wide table overflow)** | 04-13 | ✓ Satisfied |
| **AttachmentManager usa-table wrapped in overflowX:auto div** | 04-13 | ✓ Satisfied |
| **ReadinessDashboard loading state uses plain `<div>` (no usa-prose)** | 04-13 | ✓ Satisfied |

---

## Anti-Patterns Scanned

Files scanned (new): `seed.ts` (UAT-OPP-002 block), `WorkspacePage.tsx`, `AttachmentManager.tsx`, `ReadinessDashboard.tsx`.

| File | Finding | Severity | Impact |
|------|---------|----------|--------|
| `LoginPage.tsx` line 7 | Stale JSDoc `"redirects to /grantor/dashboard"` — actual logic routes non-grantor to `/applicant/applications` | ⚠️ Warning (W2 from code review) | Documentation only — does not affect runtime behaviour; reviewer documented as non-blocking |
| `WorkspaceSectionPanel.tsx` line 174 | `placeholder="Internal comment (not visible to grantors)…"` | ℹ️ Info | HTML `<textarea placeholder>` attribute — NOT a stub pattern; functional textarea with full implementation |
| `e2e/workspace-layout-fixes.spec.ts` / `e2e/formFields.spec.ts` | SPA-navigation via `history.pushState` + `PopStateEvent` depends on `@remix-run/router` internals | ⚠️ Warning (W3 from code review) | Implementation-detail dependency; long-term fix is Playwright `storageState`. Documented as non-blocking advisory. |
| `e2e/workspacePreview.spec.ts` | "preview page does not contain internal comments" test navigates without login → always skips in CI | ⚠️ Warning (W1 from code review) | Test coverage gap — pre-existing; does not block goal |
| `BudgetBuilder.tsx` | Button disappears with no cancel affordance when accordion collapses while `isAdding=true` | ⚠️ Warning | UX edge case — carried from prior verification |
| `AttachmentManager.tsx` line 131–133 | `alert()` for "Link from Library" feature | ℹ️ Info | Placeholder alert for a known future feature — non-blocking; no stub classification impact on existing functionality |
| `seed.ts` UAT-OPP-002 block | `uatOpportunityId2` variable not declared — OPP-002 insert does not capture RETURNING id | ℹ️ Info | Intentional: no downstream code needs OPP-002's ID in seed; idempotent `IF NOT EXISTS` approach is correct for a no-workspace seed scenario |

**No blockers found.** All findings are advisory warnings or informational notes.

---

## Human Verification Required

The following items require human verification and are not blocking automated status:

### 1. UAT Test 2 — Start Application CTA on UAT-OPP-002
**Test:** Log in as `applicant@example.com` / `TestPass123!`, navigate to the opportunity detail page for 'UAT Community Health Grant 2', confirm the "Start Application" button is present (not "Continue Application") and clicking it creates a new workspace.
**Expected:** POST /api/v1/workspaces succeeds; user is redirected to `/applicant/workspaces/:newId`.
**Why human:** Requires live seed execution and browser interaction; UAT-OPP-002 workspace absence can't be confirmed in live DB without running the seed.

### 2. Opportunity title display on WorkspacePage
**Test:** Navigate to an existing workspace (`/applicant/workspaces/:id`). Observe the "Opportunity:" line in the page header.
**Expected:** Shows the opportunity title (e.g., "UAT Community Health Innovation Grant"), not a raw UUID.
**Why human:** Requires both seed data and a live API response from `GET /api/v1/opportunities/:id`; opportunityQuery fallback behavior (`?? workspace.opportunity_id`) needs visual confirmation.

### 3. AttachmentManager horizontal scroll
**Test:** Upload an attachment with a long filename to a workspace. Observe the attachments table.
**Expected:** Table scrolls horizontally within its column without overflowing into the Readiness Dashboard column.
**Why human:** Visual overflow behavior requires browser rendering.

### 4. Stale JSDoc comment in LoginPage.tsx (W2)
**Test:** Read `LoginPage.tsx` line 7.
**Expected:** Comment updated to reflect actual routing logic.
**Why human:** Cosmetic documentation fix — can be fixed in a future minor patch without phase impact.

### 5. BudgetBuilder accordion collapse edge case (W3)
**Test:** Open a category accordion, click "+ Add" to enter add-mode, then collapse the accordion. Observe add-button / cancel affordance.
**Expected:** Either add-button reappears, or a cancel affordance is shown outside the collapsed accordion.
**Why human:** State interaction requires browser rendering.

### 6. Preview page internal-comments exclusion (W1)
**Test:** Log in as applicant, navigate to workspace, click Preview Application, verify internal comments are absent.
**Expected:** Preview shows only public-facing content; grantor comments are hidden.
**Why human:** The E2E test (`workspacePreview.spec.ts` test 2) unconditionally skips in CI due to missing login sequence.

### 7. SPA-navigation robustness (W3)
**Test:** After a future `@remix-run/router` dependency upgrade, run Playwright E2E suite.
**Expected:** All SPA-navigation blocks succeed; `waitForURL` assertions pass.
**Why human:** Depends on undocumented React Router internals.

---

## Gap Redrive Summary (04-12 / 04-13)

All 5 new must-haves from plans 04-12 and 04-13 confirmed closed by direct file read evidence:

| Gap | Evidence |
|-----|---------|
| UAT-OPP-002 seed (no workspace) | `seed.ts:371–401` — idempotent INSERT for UAT-OPP-002; workspace INSERT at line 454 targets OPP-001 only; log message at line 401 confirms intent |
| WorkspacePage opportunityQuery | `WorkspacePage.tsx:27–38` — `queryKey: ['opportunity-title', ...]`, `fetch('/api/v1/opportunities/${oppId}')`, `enabled: !!workspaceQuery.data?.opportunity_id` |
| WorkspacePage renders title not UUID | `WorkspacePage.tsx:113` — `{opportunityQuery.data ?? workspace.opportunity_id}` with graceful UUID fallback |
| WorkspacePage grid-col-6 overflow:hidden | `WorkspacePage.tsx:139` — `style={{ overflow: 'hidden' }}` on the content column div |
| AttachmentManager overflowX:auto wrapper | `AttachmentManager.tsx:155–156` — `<div style={{ overflowX: 'auto' }}>` wraps `<table className="usa-table usa-table--borderless">` |
| ReadinessDashboard loading state no usa-prose | `ReadinessDashboard.tsx:37–41` — `<div><p className="usa-hint">Loading readiness…</p></div>` — no usa-prose class |

---

## Overall Verdict

**Status: PASSED** — All 20 must-haves verified across the full Phase 4 change set (plans 04-01 through 04-13 + all code review fixes).

- **Build:** clean (`tsc` exits 0 — carried from gate)
- **Tests:** 220/220 pass (carried from gate)
- **Code review:** clean after 2 iterations (0 open blockers)
- **Boot smoke:** pass (ports 3000 + 5173 HTTP 200)
- **Gate evidence:** all green (`gate_status: passed`, `review_status: clean`, `review_blockers_open: 0`, `boot_smoke: pass`)
- **Regressions from prior verification (04-01/11):** none — all 15 prior truths remain verified; grid-col-6, preview links, usa-table USWDS classes, and form fields all confirmed intact after 04-12/13 file edits
- **New truths (04-12/13):** 5/5 verified by direct source read

> Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission. ✓

---

_Verified: 2026-07-30T17:00:00Z_
_Verifier: Claude (pivota_spec-verifier)_
_Plans covered: 04-01 through 04-13 + all code review fixes (commits 804c348, 34bab0a, 91cac16, 66e13bc)_
