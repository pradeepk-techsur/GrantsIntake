---
phase: 04-application-workspace-form-capture
verified: 2026-07-30T15:50:00.000Z
status: passed
score: 15/15 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 10/10 (plans 04-01 through 04-09 + code review fixes)
  gaps_closed:
    - "Login as applicant navigates to /applicant/applications (LoginPage.tsx:26 + App.tsx:52)"
    - "WorkspacePage 3-column grid-col-3 + grid-col-6 + grid-col-3 = 12 (fills 100% of parent)"
    - "No double usa-prose nesting — ApplicantLayout <main> has no usa-prose; WorkspaceSectionPanel root div has no usa-prose"
    - "SectionFormPanel renders Saving… usa-hint span (save-status-saving) when saveMutation.isPending"
    - "SectionFormPanel renders Saved ✓ usa-hint span (save-status-saved) when saveMutation.isSuccess; clears after 2s via saveMutation.reset()"
  gaps_remaining: []
  regressions: []
---

# Phase 4: Application Workspace — Final Re-Verification (Plans 04-01 through 04-11)

**Phase Goal:** Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission.

**Verified:** 2026-07-30T15:50:00Z
**Status:** PASSED
**Re-verification:** Yes — gap closure round covering plans 04-10 (login redirect, grid restore, double usa-prose fix) and 04-11 (Saving…/Saved ✓ auto-save indicators), plus code review iteration 2 fixes (B1: formFields.spec.ts SPA navigation, B2: saveMutation.reset() 2s timeout).
**Prior verification:** Passed (plans 04-01 through 04-09, score 10/10).

---

## Gate Evidence (Mandatory Input)

Gate evidence read from `.planning/phases/04-application-workspace-form-capture/04-GATE.md` and `04-REVIEW.md`.

| Gate | Result | Details |
|------|--------|---------|
| Build | ✓ pass | `npm run build` → `tsc` exits 0 (clean, live-confirmed in this run) |
| Tests | ✓ pass | **220/220 tests pass** — live-confirmed in this run (14.09s) |
| Boot smoke | ✓ pass | Ports 3000 + 5173 bind, HTTP 200, no fatal markers (GATE.md `## Boot Smoke Gate — Post 04-10/11`) |
| Code review (04-10/11) | ✓ clean | Iteration 2 — 0 blockers; B1 (formFields.spec.ts page.goto replaced, commit 91cac16) and B2 (saveMutation.reset() 2s timeout, commit 66e13bc) both resolved |
| Gap redrive (04-10/11) | ✓ all 5 closed | GATE.md `## Gap Redrive Results (04-10/11)` — all 5 rows show ✓ closed with file+line evidence |
| Prior gates (04-01 through 04-09) | ✓ carried | `gate_status: passed`, `review_status: clean`, 220/220 from prior GATE.md entries |

`gate_status: passed`, `review_status: clean`, `review_blockers_open: 0`, `boot_smoke: pass` — all confirmed from GATE.md frontmatter.

### Live Spot-Checks (This Run)

```
$ npm run build (2026-07-30T15:47:xx)
> tsc
Exit code: 0 (clean — no output)

$ npm test (2026-07-30T15:39:58)
Test Files  24 passed (24)
     Tests  220 passed (220)
  Duration  14.09s
Exit code: 0
```

---

## Observable Truths — Plans 04-10 and 04-11 (5 New Gap Closures)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 11 | Login as applicant navigates to `/applicant/applications` (not `/applicant/profile`) | ✓ VERIFIED | `LoginPage.tsx:26` — `navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/applications', { replace: true })` |
| 12 | `/applicant` index route redirects to `/applicant/applications` | ✓ VERIFIED | `App.tsx:52` — `<Route index element={<Navigate to="/applicant/applications" replace />} />` |
| 13 | WorkspacePage 3-column layout columns sum to 12 (`grid-col-3 + grid-col-6 + grid-col-3`) | ✓ VERIFIED | `WorkspacePage.tsx:116` → `grid-col-3` (sidebar); `:123` → `grid-col-6` (content); `:132` → `grid-col-3` (readiness). No `grid-col-2` or `grid-col-5` found (grep confirmed clean) |
| 14 | No double `usa-prose` nesting — `ApplicantLayout <main>` and `WorkspaceSectionPanel` root div both absence-confirmed | ✓ VERIFIED | `ApplicantLayout.tsx:85` — `className="usa-layout-docs__main desktop:grid-col-9"` (no usa-prose); `WorkspaceSectionPanel.tsx:63` — `<div data-testid="workspace-section-panel">` (no usa-prose). Both grep checks return empty. |
| 15 | `SectionFormPanel` renders `Saving…` / `Saved ✓` `usa-hint` indicators; `Saved ✓` auto-clears after 2s | ✓ VERIFIED | `SectionFormPanel.tsx:103-115` — `saveMutation.isPending → [data-testid="save-status-saving"]`; `saveMutation.isSuccess && !saveMutation.isPending → [data-testid="save-status-saved"]`; `:59` — `setTimeout(() => saveMutation.reset(), 2000)` in `onSuccess` |

**Score (new truths): 5/5**

---

## Observable Truths — Plans 04-01 through 04-09 (Carried from Prior Verification, Regression-Checked)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | "Start Application" is a `<button>` calling POST `/api/v1/workspaces` via `useMutation`, navigating to `/applicant/workspaces/:id` on success | ✓ VERIFIED (carried) | `OpportunityDetailPage.tsx:119–134, 265–276` — `useMutation` with `workspaceApi.createWorkspace`, `navigate` in `onSuccess` |
| 2 | "Continue Application" `href` uses `/applicant/workspaces/:existingId` (with `/applicant` prefix) | ✓ VERIFIED (carried) | `OpportunityDetailPage.tsx:252–262` — `<a href={\`/applicant/workspaces/${workspaceId}\`}>` |
| 3 | WorkspacePage header has Preview Application link (`data-testid="preview-application-link"`) | ✓ VERIFIED (carried) | `WorkspacePage.tsx:103–109` — `<Link data-testid="preview-application-link">` |
| 4 | ReadinessDashboard card footer has Preview Application link (`data-testid="readiness-preview-link"`) | ✓ VERIFIED (carried) | `ReadinessDashboard.tsx:180–187` |
| 5 | WorkspacePage routing lives at `/applicant/workspaces/:workspaceId` and App.tsx index redirect now points to `/applicant/applications` | ✓ VERIFIED (regression-checked) | `App.tsx:52, 57` — index → `/applicant/applications`; workspaces route → `WorkspacePage` |
| 6 | BudgetBuilder add-line-item button is outside the `{isExpanded && ...}` block | ✓ VERIFIED (carried) | `BudgetBuilder.tsx:258–273` |
| 7 | `src/db/seed.ts` has `form_field_definitions` inserts for "Project Narrative", "Goals and Objectives", "Number of Beneficiaries" | ✓ VERIFIED (carried) | `seed.ts:465–519` |
| 8 | `AttachmentManager` uses `usa-button-group`, `usa-table--borderless`, `usa-button--secondary`; file input clip-positioned (no `display:none`) | ✓ VERIFIED (carried) | `AttachmentManager.tsx:113, 155, 195, 145` |
| 9 | `workspace-status` route uses `org_roles JOIN` (not non-existent `applicant_user_id` column) | ✓ VERIFIED (carried) | `publicOpportunities.ts:212–219` |
| 10 | 409 `DUPLICATE_WORKSPACE` response includes `workspace_id` in body | ✓ VERIFIED (carried) | `workspaces.ts:115–121`; `workspaceService.ts:63–84` |

**Combined Score: 15/15 truths verified**

---

## Required Artifacts

| Artifact | Check | Status | Details |
|----------|-------|--------|---------|
| `client/src/pages/auth/LoginPage.tsx` | `navigate('/applicant/applications')` for non-grantor on line 26 | ✓ VERIFIED | Line 26 confirmed verbatim; stale JSDoc comment on line 7 still says `"redirects to /grantor/dashboard"` (W2 advisory — non-blocking) |
| `client/src/App.tsx` | Index route `Navigate to='/applicant/applications'` | ✓ VERIFIED | Line 52 confirmed |
| `client/src/pages/applicant/WorkspacePage.tsx` | `grid-col-3` (×2) + `grid-col-6` (×1) on three column divs; no `grid-col-2`/`grid-col-5` | ✓ VERIFIED | Lines 116, 123, 132; grep for old values returns empty |
| `client/src/layouts/ApplicantLayout.tsx` | `<main>` className does NOT contain `usa-prose` | ✓ VERIFIED | Line 85: `className="usa-layout-docs__main desktop:grid-col-9"` — grep for usa-prose returns empty |
| `client/src/components/workspace/WorkspaceSectionPanel.tsx` | Root `<div>` at line 63 does NOT contain `usa-prose` | ✓ VERIFIED | `<div data-testid="workspace-section-panel">` — no usa-prose; grep returns empty |
| `client/src/components/workspace/SectionFormPanel.tsx` | `saveMutation.isPending` in JSX render; `saveMutation.isSuccess` in JSX render; `saveMutation.reset()` in `onSuccess` | ✓ VERIFIED | Lines 103, 108, 59 — all four conditions verified |
| `e2e/workspace-layout-fixes.spec.ts` | Playwright tests for login redirect + grid columns + no usa-prose | ✓ VERIFIED | File exists; tests use SPA-navigation pattern (no `page.goto` to protected routes) |
| `e2e/formFields.spec.ts` | 4 tests; all use SPA-navigation (no `page.goto('/applicant/applications')`); includes `blurring a text field shows Saving… indicator` test | ✓ VERIFIED | Lines 13-16, 41-44, 76-79, 109-112 — all four SPA-navigation blocks confirmed; `page.goto('/applicant/applications')` appears only in comments (lines 11, 107) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `LoginPage.tsx` | `/applicant/applications` | `navigate()` on successful non-grantor login | ✓ WIRED | Line 26 — `navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/applications', { replace: true })` |
| `App.tsx` | `/applicant/applications` | `<Navigate>` on `/applicant` index route | ✓ WIRED | Line 52 — `<Route index element={<Navigate to="/applicant/applications" replace />} />` |
| `WorkspacePage.tsx` | 3-col grid `3+6+3=12` | USWDS `grid-col-N` class attributes | ✓ WIRED | Lines 116/123/132 — data-testids `workspace-section-sidebar`/`workspace-section-content`/`workspace-readiness-panel` carry the correct col classes |
| `SectionFormPanel.tsx` | `save-status-saving` span | `saveMutation.isPending` conditional render | ✓ WIRED | Lines 103-106 — span is inside render return, not just declared; data-testid matches formFields.spec.ts:144 |
| `SectionFormPanel.tsx` | `save-status-saved` span | `saveMutation.isSuccess && !saveMutation.isPending` conditional render | ✓ WIRED | Lines 108-115 — isSuccess guard correct; `saveMutation.reset()` at line 59 clears it after 2s |
| `formFields.spec.ts` | `[data-testid="save-status-saving"]` | `expect(savingIndicator).toBeVisible()` assertion at line 145 | ✓ WIRED | Structural match confirmed (REVIEW.md line 76); test reachable (SPA-navigation pattern, no unconditional skip) |
| `OpportunityDetailPage` | `POST /api/v1/workspaces` | `useMutation → workspaceApi.createWorkspace` | ✓ WIRED (carried) | `onSuccess` → `navigate('/applicant/workspaces/:id')`; `onError` handles `DUPLICATE_WORKSPACE` |
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
| **Login redirect to /applicant/applications (not /applicant/profile)** | 04-10 | ✓ Satisfied |
| **WorkspacePage grid 3+6+3=12 (fills 100% of desktop:grid-col-9 parent)** | 04-10 | ✓ Satisfied |
| **No double usa-prose nesting in ApplicantLayout → WorkspaceSectionPanel path** | 04-10 | ✓ Satisfied |
| **Auto-save Saving…/Saved ✓ indicators in SectionFormPanel (USWDS usa-hint)** | 04-11 | ✓ Satisfied |
| **Saved ✓ indicator clears after 2s (saveMutation.reset() setTimeout)** | code-review fix (B2) | ✓ Satisfied |
| **formFields.spec.ts uses SPA-navigation (no page.goto to protected routes)** | code-review fix (B1) | ✓ Satisfied |

---

## Anti-Patterns Scanned

Files scanned: `LoginPage.tsx`, `App.tsx`, `WorkspacePage.tsx`, `ApplicantLayout.tsx`, `WorkspaceSectionPanel.tsx`, `SectionFormPanel.tsx`, `formFields.spec.ts`, `workspace-layout-fixes.spec.ts`.

| File | Finding | Severity | Impact |
|------|---------|----------|--------|
| `LoginPage.tsx` line 7 | Stale JSDoc `"redirects to /grantor/dashboard"` — actual logic routes non-grantor to `/applicant/applications` | ⚠️ Warning (W2 from code review) | Documentation only — does not affect runtime behaviour; reviewer documented as non-blocking |
| `WorkspaceSectionPanel.tsx` line 174 | `placeholder="Internal comment (not visible to grantors)…"` | ℹ️ Info | HTML `<textarea placeholder>` attribute — NOT a stub pattern; functional textarea with full implementation |
| `e2e/workspace-layout-fixes.spec.ts` / `e2e/formFields.spec.ts` | SPA-navigation via `history.pushState` + `PopStateEvent` depends on `@remix-run/router` internals | ⚠️ Warning (W3 from code review) | Implementation-detail dependency; long-term fix is Playwright `storageState` with httpOnly refresh cookie. Documented as non-blocking advisory. |
| `e2e/workspacePreview.spec.ts` | "preview page does not contain internal comments" test navigates without login → always skips in CI | ⚠️ Warning (W1 from code review) | Test coverage gap — pre-existing; does not block goal |
| `BudgetBuilder.tsx` | W3 (prior code review): Button disappears with no cancel affordance when accordion collapses while `isAdding=true` | ⚠️ Warning | UX edge case — add-button always visible when `!isAdding`; carried from prior verification |

**No blockers found.** All findings are advisory warnings documented in code review iterations 1 and 2.

---

## Human Verification Required

The following items require human verification and are not blocking automated status:

### 1. Stale JSDoc comment in LoginPage.tsx (W2)
**Test:** Read `LoginPage.tsx` line 7. Note the comment says `"redirects to /grantor/dashboard"`.
**Expected:** Comment updated to: `On success: grantor_admin → /grantor/dashboard; applicants → /applicant/applications.`
**Why human:** Cosmetic documentation fix; does not affect tests or runtime. Can be fixed in a future minor patch without phase impact.

### 2. BudgetBuilder accordion collapse edge case (W3)
**Test:** Open a category accordion, click "+ Add" to enter add-mode, then collapse the accordion by clicking the header. Observe add-button / cancel affordance.
**Expected:** Either the add-button reappears, or a cancel affordance is shown outside the collapsed accordion.
**Why human:** State interaction requires browser rendering; code review documents as discoverability failure but not a blocker.

### 3. Preview page internal-comments exclusion (W1)
**Test:** Log in as `applicant@example.com`, navigate to workspace, click Preview Application link, verify internal comments are absent from preview.
**Expected:** Preview shows only public-facing application content; grantor comments are hidden.
**Why human:** The E2E test (`workspacePreview.spec.ts` test 2) unconditionally skips in CI due to missing login sequence (pre-existing defect, not in this phase's change set).

### 4. SPA-navigation robustness (W3)
**Test:** After a future `@remix-run/router` dependency upgrade, run Playwright E2E suite and confirm `workspace-layout-fixes.spec.ts` and `formFields.spec.ts` tests still navigate correctly.
**Expected:** All SPA-navigation blocks succeed; `waitForURL` assertions pass.
**Why human:** Depends on undocumented React Router internals; fragility is a future maintenance concern, not a current failure.

---

## Gap Redrive Summary (04-10 / 04-11)

All 5 gaps from prior UAT rounds are confirmed closed by code evidence in this run:

| Gap | Evidence |
|-----|---------|
| Login redirect → `/applicant/applications` | `LoginPage.tsx:26` + `App.tsx:52` — both navigate to `/applicant/applications`; live-confirmed |
| WorkspacePage grid 3+6+3=12 | `WorkspacePage.tsx:116,123,132` — `grid-col-3`/`grid-col-6`/`grid-col-3`; no `grid-col-2` or `grid-col-5` found by grep |
| No double usa-prose nesting | `ApplicantLayout.tsx:85` — no usa-prose on `<main>`; `WorkspaceSectionPanel.tsx:63` — no usa-prose on root div; both grep checks return empty |
| Auto-save Saving…/Saved ✓ indicators | `SectionFormPanel.tsx:103-115` — both spans with correct data-testids rendered conditionally on `isPending`/`isSuccess` |
| Saved ✓ clears after 2s | `SectionFormPanel.tsx:59` — `setTimeout(() => saveMutation.reset(), 2000)` in `onSuccess`; REVIEW.md B2 confirmed closed in commit `66e13bc` |

---

## Overall Verdict

**Status: PASSED** — All 15 must-haves verified across the full Phase 4 change set (plans 04-01 through 04-11 + all code review fixes).

- **Build:** clean (`tsc` exits 0, live-confirmed)
- **Tests:** 220/220 pass (live-confirmed, 14.09s)
- **Code review:** clean after 2 iterations (0 open blockers)
- **Boot smoke:** pass (ports 3000 + 5173 HTTP 200)
- **Gate evidence:** all green (GATE.md `gate_status: passed`, `review_status: clean`, `review_blockers_open: 0`, `boot_smoke: pass`)
- **Regressions from prior verification:** none — all 10 truths from plans 04-01/04-09 remain verified

> Applicants have a collaborative, structured workspace for building their application — with configurable forms, a structured budget builder, attachment management, and a readiness dashboard — all kept grantee-private until submission. ✓

---

_Verified: 2026-07-30T15:50:00Z_
_Verifier: Claude (pivota_spec-verifier)_
_Plans covered: 04-01 through 04-11 + all code review fixes (commits 804c348, 34bab0a, 91cac16, 66e13bc)_
