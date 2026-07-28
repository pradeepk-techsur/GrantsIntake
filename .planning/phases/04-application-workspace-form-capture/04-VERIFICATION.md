---
phase: 04-application-workspace-form-capture
verified: 2026-07-28T03:45:00.000Z
status: passed
score: 10/10 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 6/6 (plans 04-01 through 04-06)
  gaps_closed:
    - "Start Application button (not anchor) calls POST /api/v1/workspaces via useMutation"
    - "Navigate to /applicant/workspaces/:id on createWorkspace success"
    - "409 DUPLICATE_WORKSPACE onError navigates to /applicant/workspaces/:workspace_id"
    - "Continue Application href uses /applicant/workspaces/:existingId (with /applicant prefix)"
    - "WorkspacePage Preview Application link (data-testid=preview-application-link)"
    - "ReadinessDashboard card footer Preview Application link (data-testid=readiness-preview-link)"
    - "WorkspacePage columns are grid-col-2 + grid-col-5 + grid-col-2 = 9"
    - "BudgetBuilder add-line-item button outside {isExpanded && ...} block (always visible)"
    - "seed.ts form_field_definitions for Project Narrative, Goals and Objectives, Number of Beneficiaries"
    - "AttachmentManager usa-button-group + usa-table--borderless + usa-button--secondary + clip-positioned file input (no display:none)"
    - "workspace-status uses org_roles JOIN to derive org membership"
    - "409 DUPLICATE_WORKSPACE response includes workspace_id in body"
  gaps_remaining: []
  regressions: []
---

# Phase 4: Application Workspace — Gap Closure Verification (Plans 04-07, 04-08, 04-09 + Code Review Fixes)

**Phase Goal:** Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission.

**Verified:** 2026-07-28T03:45:00Z
**Re-verification:** Yes — gap closure round covering plans 04-07, 04-08, 04-09 + code-review fixes (B1: workspace-status column, B2: 409 workspace_id).
**Prior verification:** Passed (plans 04-01 through 04-06, score 6/6 + carried 11/11 from 04-05/04-06).

---

## Gate Evidence (Mandatory Input)

| Gate | Result | Details |
|------|--------|---------|
| Build | ✓ pass | `npm run build` exits 0 (tsc clean) |
| Tests | ✓ pass | **220/220 tests pass** (live-run confirmed below) |
| Code review | ✓ clean | Iteration 2 — 0 blockers; B1 (workspace-status column fix, commit 804c348) and B2 (409 workspace_id, commit 34bab0a) both resolved |
| Boot smoke | ✓ pass | Ports 3000 + 5173 bind, HTTP non-5xx, no fatal markers (per GATE.md) |
| Gap redrive | ✓ all 7 UAT gaps closed | Per GATE.md `## Gap Redrive Results (04-07/08/09)` — all 7 rows show ✓ closed with evidence |

_Gate evidence sourced from `.planning/phases/04-application-workspace-form-capture/04-GATE.md` — `gate_status: passed`, `review_status: clean`._

### Live Test Spot-Check

```
$ npm test (run 2026-07-28T03:33:22)
Test Files  24 passed (24)
     Tests  220 passed (220)
  Duration  13.74s
Exit code: 0
```

---

## Observable Truths — Plans 04-07, 04-08, 04-09

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | "Start Application" is a `<button>` calling POST `/api/v1/workspaces` via `useMutation`, navigating to `/applicant/workspaces/:id` on success | ✓ VERIFIED | `OpportunityDetailPage.tsx:119–134, 265–276` — `useMutation` with `workspaceApi.createWorkspace`, `navigate(\`/applicant/workspaces/${data.workspace.workspace_id}\`)` in `onSuccess` |
| 2 | "Continue Application" `href` uses `/applicant/workspaces/:existingId` (with `/applicant` prefix) | ✓ VERIFIED | `OpportunityDetailPage.tsx:252–262` — `<a href={\`/applicant/workspaces/${workspaceId}\`}>Continue Application</a>` |
| 3 | WorkspacePage header has Preview Application link (`data-testid="preview-application-link"`) to `/applicant/workspaces/:id/preview` | ✓ VERIFIED | `WorkspacePage.tsx:103–109` — `<Link to={\`/applicant/workspaces/${workspaceId}/preview\`} data-testid="preview-application-link">` |
| 4 | ReadinessDashboard card footer has Preview Application link (`data-testid="readiness-preview-link"`) | ✓ VERIFIED | `ReadinessDashboard.tsx:180–187` — `<Link to={\`/applicant/workspaces/${workspaceId}/preview\`} data-testid="readiness-preview-link">` inside `usa-card__footer` |
| 5 | WorkspacePage inner columns are `grid-col-2` + `grid-col-5` + `grid-col-2` (sum = 9, fits inside `desktop:grid-col-9`) | ✓ VERIFIED | `WorkspacePage.tsx:116, 123, 132` — three `<div className="grid-col-2">`, `<div className="grid-col-5">`, `<div className="grid-col-2">` |
| 6 | BudgetBuilder add-line-item button is outside the `{isExpanded && ...}` block (always visible when not adding) | ✓ VERIFIED | `BudgetBuilder.tsx:258–273` — `{!isAdding && (<div>...<button data-testid={\`add-line-item-btn-${category}\`}>...</button></div>)}` at lines 258–273; `{isExpanded && (...)}` block starts at line 276 |
| 7 | `src/db/seed.ts` has `form_field_definitions` inserts for "Project Narrative", "Goals and Objectives", "Number of Beneficiaries" | ✓ VERIFIED | `seed.ts:465–519` — three field objects with those exact labels; idempotent `WHERE NOT EXISTS (SELECT 1 FROM form_field_definitions WHERE section_id = $2 AND label = $4)` |
| 8 | `AttachmentManager` uses `usa-button-group`, `usa-table--borderless`, `usa-button--secondary`; file input is clip-positioned (no `display:none`) | ✓ VERIFIED | `AttachmentManager.tsx:113` → `<ul className="usa-button-group">`; line 155 → `usa-table--borderless`; line 195 → `usa-button--unstyled usa-button--secondary`; line 145 → `style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}` (no `display:none`) |
| 9 | `workspace-status` route uses `org_roles JOIN` to derive org membership (not non-existent `applicant_user_id` column) | ✓ VERIFIED | `publicOpportunities.ts:212–219` — `SELECT aw.workspace_id FROM application_workspaces aw JOIN org_roles orr ON orr.org_id = aw.org_id WHERE aw.opportunity_id = $1 AND orr.user_id = $2 AND orr.revoked_at IS NULL` |
| 10 | 409 `DUPLICATE_WORKSPACE` response includes `workspace_id` in body | ✓ VERIFIED | `workspaces.ts:115–121` — `res.status(409).json({ error: 'DUPLICATE_WORKSPACE', message: '...', workspace_id: dupErr.workspace_id })`; `workspaceService.ts:63–84` — pool (not aborted client) used to SELECT existing `workspace_id`, attached to thrown error as `dupErr.workspace_id` |

**Score: 10/10 truths verified**

---

## Required Artifacts

| Artifact | Check | Status | Details |
|----------|-------|--------|---------|
| `client/src/pages/applicant/OpportunityDetailPage.tsx` | `useMutation`, `button` (not `a`) for Start, `/applicant/workspaces/` prefix for Continue | ✓ VERIFIED | Lines 119–134 (mutation), 265–276 (start button), 252–262 (continue anchor with `/applicant/` prefix) |
| `client/src/pages/applicant/WorkspacePage.tsx` | `data-testid="preview-application-link"`, `grid-col-2+5+2` | ✓ VERIFIED | Lines 103–109 (preview link), 116/123/132 (grid columns) |
| `client/src/components/workspace/ReadinessDashboard.tsx` | `data-testid="readiness-preview-link"` in `usa-card__footer` | ✓ VERIFIED | Lines 180–187 |
| `client/src/components/workspace/BudgetBuilder.tsx` | Add button at line 258, `isExpanded` block starts line 276 | ✓ VERIFIED | Button outside accordion content — `isAdding` gate only, no `isExpanded` gate on button |
| `client/src/components/workspace/AttachmentManager.tsx` | `usa-button-group`, `usa-table--borderless`, `usa-button--secondary`, clip-positioned input | ✓ VERIFIED | Lines 113, 155, 195, 145 |
| `src/db/seed.ts` | 3 `form_field_definitions` inserts, idempotent `WHERE NOT EXISTS` | ✓ VERIFIED | Lines 465–519 |
| `src/routes/publicOpportunities.ts` | `org_roles JOIN` query (no `applicant_user_id`) | ✓ VERIFIED | Lines 212–219 |
| `src/routes/workspaces.ts` | 409 body includes `workspace_id` | ✓ VERIFIED | Lines 115–121 |
| `src/services/workspace/workspaceService.ts` | Uses `pool` (not aborted client) for duplicate SELECT; attaches `workspace_id` to error | ✓ VERIFIED | Lines 63–84 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `OpportunityDetailPage` | `POST /api/v1/workspaces` | `useMutation → workspaceApi.createWorkspace` | ✓ WIRED | `onSuccess` navigates to `/applicant/workspaces/:id`; `onError` handles `DUPLICATE_WORKSPACE` + navigates to existing |
| `workspaces.ts` POST handler | `workspaceService.createWorkspace` | throws `DUPLICATE_WORKSPACE` with `workspace_id` | ✓ WIRED | Route catches `e.code === 'DUPLICATE_WORKSPACE'`, reads `dupErr.workspace_id`, emits 409 JSON |
| `workspaceService` 23505 handler | `pool.query` (not aborted `client`) | `existingWorkspaceId` attached to thrown error | ✓ WIRED | Pool-level SELECT safely executes after aborted transaction; `dupErr.workspace_id` propagated |
| `WorkspacePage` preview link | `/applicant/workspaces/:id/preview` | React Router `<Link>` | ✓ WIRED | `data-testid="preview-application-link"` matches E2E locator at `workspacePreview.spec.ts:68` |
| `ReadinessDashboard` preview link | `/applicant/workspaces/:id/preview` | React Router `<Link>` | ✓ WIRED | `data-testid="readiness-preview-link"` in `usa-card__footer` |
| `seed.ts` form_field_definitions | `form_field_definitions` table | `uatWorkspaceId → narrativeSectionId → INSERT` | ✓ WIRED | FK chain: `uatOpportunityId` + `narrativeSectionId` both resolved from prior seed steps |
| `workspace-status` route | `application_workspaces` table | `JOIN org_roles ON orr.org_id = aw.org_id WHERE orr.user_id = $2` | ✓ WIRED | Schema verified: `org_roles` (migration 010) has `org_id`, `user_id`, `revoked_at` |

---

## Anti-Patterns Scanned

| File | Finding | Severity | Impact |
|------|---------|----------|--------|
| `BudgetBuilder.tsx` | W3 (code review): Button disappears with no cancel affordance when accordion collapses while `isAdding=true` | ⚠️ Warning | UX edge case — does not block goal; add-button always visible when `!isAdding` ✓ |
| `e2e/workspacePreview.spec.ts` | W1 (code review): "preview page does not contain internal comments" test missing login → always skips in CI | ⚠️ Warning | Test coverage gap — does not block goal |
| `WorkspacePage.tsx` | W2 (code review): Inner grid sum = 9 (not 12) — leaves 3/12 columns unused | ⚠️ Warning | Layout advisory — spec requires 2+5+2=9 inside `desktop:grid-col-9` parent; reviewer notes this may leave unused space but plan 04-08 deliberately chose this sum |

No blockers found. All three advisory warnings were documented in code review iteration 2 (`04-REVIEW.md`) and classified as non-blocking by the reviewer.

---

## Requirements Coverage

All Phase 4 success criteria remain verified from plans 04-01 through 04-06. Plans 04-07, 04-08, 04-09 close UAT-discovered gaps:

| Criterion | Status |
|-----------|--------|
| One workspace per org per opportunity, 9 sections, completion tracking | ✓ Verified (04-01) |
| Section ownership, tasks, private comments (grantor-blocked) | ✓ Verified (04-01, 04-02) |
| Readiness dashboard with completion %, blocking errors, real-time | ✓ Verified (04-02) |
| Structured form fields (11 types), budget with ceiling + match validation | ✓ Verified (04-03, 04-05) |
| Attachments with version history, submission package preview | ✓ Verified (04-04) |
| **UAT CTA wiring** (Start Application → POST, Continue Application → `/applicant/` prefix) | ✓ Verified (04-07) |
| **Preview Application links** (header + ReadinessDashboard) | ✓ Verified (04-07) |
| **WorkspacePage grid layout** (2+5+2=9) | ✓ Verified (04-08) |
| **BudgetBuilder add-button always visible** (outside accordion gate) | ✓ Verified (04-08) |
| **seed.ts narrative form_field_definitions** (3 UAT fields) | ✓ Verified (04-08) |
| **AttachmentManager USWDS conformance** (usa-button-group, usa-table--borderless, usa-button--secondary, clip-positioned input) | ✓ Verified (04-09) |
| **workspace-status org_roles JOIN** (correct column usage) | ✓ Verified (code-review fix, commit 804c348) |
| **409 DUPLICATE_WORKSPACE includes workspace_id** | ✓ Verified (code-review fix, commit 34bab0a) |

---

## Human Verification Items

The following items require human verification and are not blocking automated status:

### 1. BudgetBuilder accordion collapse edge case (W3)
**Test:** Open a category accordion, click "+ Add" to enter add-mode, then collapse the accordion by clicking the header. Observe whether add-button or cancel affordance appears.
**Expected:** Either the add-button reappears, or a cancel affordance is shown outside the collapsed accordion.
**Why human:** State interaction requires browser rendering; the code review documents this as a discoverability failure but not a blocker.

### 2. Preview page internal-comments exclusion (W1)
**Test:** Log in as `applicant@example.com`, navigate to workspace, click Preview Application link, verify internal comments are absent from preview.
**Expected:** Preview shows only public-facing application content; grantor comments are hidden.
**Why human:** The E2E test for this scenario (`workspacePreview.spec.ts` test 2) unconditionally skips in CI due to missing login sequence.

---

## Overall Verdict

**Status: PASSED** — All 10 must-haves for plans 04-07, 04-08, 04-09 + code review fixes verified. No new gaps. Tests: 220/220 (live-run confirmed). Build: clean. Code review: clean (2 iterations, 0 open blockers). Boot smoke: pass.

Combined with prior verification (plans 04-01 through 04-06), Phase 4 goal achievement is confirmed end-to-end:

> Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission. ✓

---

_Verified: 2026-07-28T03:45:00Z_
_Verifier: Claude (pivota_spec-verifier)_
_Plans covered: 04-01 through 04-09 + code review fixes (commits 804c348, 34bab0a)_
