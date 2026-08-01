---
phase: 05-q-a-submission-validation
verified: 2026-08-01T04:30:00Z
status: human_needed
score: 4/5 must-haves verified (SC2 partially delivered by design; all confirmed deliverables verified)
re_verification: true
  previous_status: human_needed
  previous_score: 4/5
  gaps_closed:
    - "Gap A (Q&A Mgmt no questions / UAT Test 2): UAT-OPP-001 and UAT-OPP-002 re-parented under mainProgramId (General Grant Programs) via UPDATE on existing rows; no orphan 'UAT Federal Agency'/'UAT Grant Program' entities; OpportunitiesIndex now fetches via Promise.all over all programs so grantor sees both opportunities"
    - "Gap B (Locked workspace fields editable / UAT Test 6): isLocked prop threaded from WorkspacePage → WorkspaceSectionPanel → SectionFormPanel + BudgetBuilder + AttachmentManager; read-only notice rendered when locked; handleFieldBlur returns early when isLocked; all budget Add/Remove/input controls and all attachment Upload/Link/Delete controls disabled={isLocked}; server-side DELETE budget line-item (line 537) and DELETE attachment (line 630) now carry is_locked guard returning HTTP 423"
    - "Code review B1 fix (DELETE budget line-item is_locked guard): confirmed at workspaces.ts:537"
    - "Code review B2 fix (DELETE attachment is_locked guard): confirmed at workspaces.ts:630"
    - "Code review W1 fix (mainProgramId null-guard in seed.ts): confirmed at seed.ts:84"
    - "Code review W2 fix (AbortController cleanup in OpportunitiesIndex): confirmed at OpportunitiesIndex.tsx:34-61"
    - "Code review W3 fix (isLocked gate on task/comment controls in WorkspaceSectionPanel): confirmed at lines 135, 192"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Post-submission workspace is locked and read-only end-to-end (UAT Test 6)"
    expected: "After successful submission, workspace shows locked-state banner with receipt link. All section form fields, budget add/remove/input controls, and attachment upload/link/delete controls are disabled or read-only."
    why_human: "Code prerequisites fully verified — is_locked=true DB state proven by integration test (workspaceSubmission.test.ts:328); isLocked prop threading proven by code review; all control disabled={isLocked} confirmed in source. Remaining item is a full browser E2E session: login → fill all sections → certify as AR → submit → return to workspace URL."
  - test: "CertificationPanel renders for AR user on direct workspace navigation (W2 — advisory only)"
    expected: "An AR-role user navigating directly to /applicant/workspaces/:id sees the Certification panel with legal text and checkbox when the certifications section is selected. Panel appears within 2–3 seconds. No persistent absent-panel state."
    why_human: "useIsAuthorizedRep is prop-based (orgId from workspaceQuery.data) so stale-read flash is eliminated. Human confirmation is now advisory UX sign-off only — not a correctness concern."
  - test: "SC2 addenda/deadline notification scope acceptance"
    expected: "Evaluator confirms partial SC2 delivery (Q&A notifications wired; addenda/deadline notifications deferred to Phase 6) is acceptable for Phase 5 sign-off."
    why_human: "Scope acceptance decision — not a code correctness question. Addenda/deadline notification functions exist in notificationService.ts but are not wired from addendaService/deadlineService routes. Explicitly deferred to Phase 6 per design."
---

# Phase 5: Q&A, Submission & Validation — Verification Report (Re-verification #3)

**Phase Goal:** Grantors can manage public Q&A and addenda with an auditable history; applicants experience continuous validation during drafting and can submit a fully certified, immutable application that is locked post-submission
**Verified:** 2026-08-01T04:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plans 05-09 and 05-10 (gap-closure-3 wave); code review fixer commits 053ee29 and bf64f87

---

## Gate Evidence (Mandatory Input — Not Re-litigated)

| Gate | Status | Evidence |
|------|--------|----------|
| Build (`npm run build`) | ✅ pass | GATE.md gap-closure-3: tsc exit 0 |
| Tests (`npm test`) | ✅ pass | GATE.md: 256/256 tests pass; confirmed live re-run: 256 passed in 15.47s |
| Boot smoke | ✅ pass | GATE.md gap-closure-3: API :3000 → GET /health → 200 OK |
| Code review BLOCKERs | ✅ 0 | REVIEW.md iteration 2: blockers: 0; all B1/B2/W1/W2/W3 verified fixed |
| B1 fix (DELETE budget line-item is_locked guard) | ✅ confirmed | commit 053ee29; workspaces.ts:537 `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' })` |
| B2 fix (DELETE attachment is_locked guard) | ✅ confirmed | commit 053ee29; workspaces.ts:630 identical guard |
| W1 fix (mainProgramId null-guard in seed.ts) | ✅ confirmed | commit bf64f87; seed.ts:84 throws loudly if General Grant Programs not found |
| W2 fix (AbortController cleanup in OpportunitiesIndex) | ✅ confirmed | commit bf64f87; OpportunitiesIndex.tsx:35-60 full cleanup confirmed |
| W3 fix (isLocked gate on task/comment controls) | ✅ confirmed | commit bf64f87; WorkspaceSectionPanel.tsx:135, 192 |
| Gap-closure-3 wave gate | ✅ pass | GATE.md: 256/256 tests pass, tsc exit 0, boot smoke pass, fix_attempts: 0 |

---

## Re-verification: Gap Status (gap-closure-3)

| Gap | Previous Status | Closure Action | Current Status |
|-----|----------------|----------------|----------------|
| Gap A: Q&A Mgmt no questions (UAT Test 2) | human_needed (UAT skipped) | OpportunitiesIndex multi-program fetch (05-09); seed re-parents UAT-OPP-001/002 under mainProgramId (05-10) | ✓ CLOSED — code verified; GATE.md confirms POST /questions → 201, GET /questions → 1 question visible to grantor token |
| Gap B: Locked workspace fields editable (UAT Test 6) | human_needed (prereqs pending) | isLocked prop threading (05-09); DELETE route guards (05-09 code review fix) | ⬇ DOWNGRADED to advisory human_needed — all code prerequisites fully verified; only browser E2E remains |
| B1 review blocker (DELETE budget is_locked) | BLOCKER | workspaces.ts:537 guard added (053ee29) | ✓ CLOSED — code verified |
| B2 review blocker (DELETE attachment is_locked) | BLOCKER | workspaces.ts:630 guard added (053ee29) | ✓ CLOSED — code verified |

**All code-behavior gaps confirmed closed. Review BLOCKERs B1+B2 resolved. No regressions detected.**

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC1 | Grantor can enable Q&A, publish responses visible to all applicants; Q&A, addenda, date changes preserved in immutable auditable history | ✓ VERIFIED | `qaService.ts` (158L), `qa.ts` routes (7 endpoints incl. GET /my-questions), migration 015 DDL audit tables, 10 integration tests pass; OpportunitiesIndex now shows ALL opportunities via Promise.all across all programs |
| SC2 | Applicants receive in-app and email notifications within 15 minutes of addenda, deadline changes, or Q&A updates | ⚠️ PARTIAL | Q&A update notifications wired (`qaService.publishAnswer` → `notificationService.notifyWorkspacesOfQAUpdate`); addenda/deadline wiring NOT wired — functions exist in `notificationService.ts` but not called from `addendaService`/`deadlineService`. Explicitly deferred to Phase 6 per SUMMARY decision log. |
| SC3 | Validation errors classified blocking/warning/informational with USWDS; blocking errors surfaced continuously on blur; Submit disabled until cleared | ✓ VERIFIED | `validationService.ts` (172L, three-tier), `useValidation.ts` (500ms debounce), `ValidationBanner.tsx` (usa-alert--error/warning/info), ReadinessDashboard `aria-disabled` gate; 6 validation integration tests pass |
| SC4 | Authorized representative can certify (legal text, checkbox); only AR can initiate final submission | ✓ VERIFIED | `certificationService.ts` (127L, SHA-256 hash, CERTIFICATION_COMPLETED audit, AR role JSONB check); `CertificationPanel.tsx` (201L); `useIsAuthorizedRep` prop-based (orgId from workspaceQuery.data — reactive); 8 certification tests + 10 readiness tests pass |
| SC5 | Immutable snapshot with GI-YEAR-8digit, UTC receipt, human-readable + machine-readable packages; application locked; no edits without withdrawal | ✓ VERIFIED | `submissionService.ts` (348L): GI-{year}-{8digit} pattern; `submission_snapshots` immutability trigger in migration 015; `is_locked=true` set DB-side (integration test proves it: workspaceSubmission.test.ts:328); locked-banner (`data-testid=locked-banner`) + receipt link in WorkspacePage.tsx:150-162; `isLocked` prop threading disables all edit controls in SectionFormPanel, BudgetBuilder, AttachmentManager; DELETE routes guarded with HTTP 423; 12 submission tests pass |

**Score: 4/5 verified** (SC2 partially delivered by design — explicit Phase 6 deferral)

---

## Required Artifacts — Gap-Closure-3 (05-09, 05-10 + code review fixes)

| Artifact | Change | Status | Key Evidence |
|----------|--------|--------|--------------|
| `src/db/seed.ts` | UAT-OPP-001/002 under `mainProgramId` (General Grant Programs); UPDATE re-parents existing rows; no 'UAT Federal Agency'/'UAT Grant Program' entities; mainProgramId null-guard at line 84 | ✓ VERIFIED | Lines 78-84 (null-guard), 309-395 (UAT opp seeding with `mainProgramId`); grep confirms zero 'UAT Federal Agency'/'UAT Grant Program' strings |
| `client/src/pages/grantor/OpportunitiesIndex.tsx` | Multi-program fetch: GET /programs → Promise.all over all programs for /programs/:id/opportunities; AbortController cleanup | ✓ VERIFIED | Lines 34-61; `const controller = new AbortController()` (line 35); `Promise.all(programs.map(...))` (lines 48-55); `return () => controller.abort()` (line 60); guard `if (!controller.signal.aborted)` on both success (line 56) and error (line 58) paths |
| `client/src/pages/applicant/WorkspacePage.tsx` | Passes `isLocked={workspace?.is_locked ?? false}` to WorkspaceSectionPanel | ✓ VERIFIED | Line 180: `isLocked={workspace?.is_locked ?? false}`; line 150-162: locked-banner with `data-testid="locked-banner"` |
| `client/src/components/workspace/WorkspaceSectionPanel.tsx` | `isLocked` prop (line 13); read-only notice when locked (lines 81-87); threads to SectionFormPanel (line 98), BudgetBuilder (line 91), AttachmentManager (line 94); task button `disabled` (line 135); comment button `disabled` (line 192) | ✓ VERIFIED | Full file read confirmed all six isLocked wiring points |
| `client/src/components/workspace/SectionFormPanel.tsx` | `disabled={isLocked}` on FormFieldRenderer (line 135); `handleFieldBlur` returns early when `isLocked` (line 84) | ✓ VERIFIED | Lines 83-84: `if (isLocked) return;`; line 135: `disabled={isLocked}` |
| `client/src/components/workspace/BudgetBuilder.tsx` | `isLocked` disables Add button (line 270), Remove button (line 316), all inline form inputs (lines 349, 363, 376, 390, 406, 420, 433, 447, 464, 475, 489) | ✓ VERIFIED | Full file read; isLocked=false default; every mutating control has `disabled={isLocked}` or `disabled={...|| isLocked}` |
| `client/src/components/workspace/AttachmentManager.tsx` | `isLocked` disables Upload button (line 121), Link from Library (line 135), file input (line 151), Delete button (line 203), confirm-delete button (line 237) | ✓ VERIFIED | Full file read confirms all 5 disable points |
| `src/routes/workspaces.ts` | DELETE budget line-item has `is_locked` guard at line 537 (HTTP 423); DELETE attachment has `is_locked` guard at line 630 (HTTP 423) | ✓ VERIFIED | `grep -n "is_locked"` output: lines 431, 505, 521, **537**, 596, **630** — all 6 mutating routes now guarded symmetrically |
| `e2e/workspaceLocked.spec.ts` | Advisory Playwright spec — 3 tests (form fields, budget controls, attachment controls) with advisory fallback when workspace not pre-locked | ✓ VERIFIED | 156-line file present; tests check `[data-testid="locked-banner"]` and iterate all `add-line-item-btn-*` + `upload-attachment-btn` controls |

### Pre-existing Verified Artifacts (carried from previous VERIFICATION.md — no regressions)

| Artifact | Status |
|----------|--------|
| `src/db/migrations/015_qa_certifications_submissions_schema.sql` | ✓ VERIFIED |
| `src/services/opportunity/qaService.ts` (core + listMyQuestions) | ✓ VERIFIED |
| `src/services/opportunity/notificationService.ts` | ✓ VERIFIED |
| `src/routes/qa.ts` (7 endpoints including GET /my-questions) | ✓ VERIFIED |
| `src/services/workspace/validationService.ts` | ✓ VERIFIED |
| `src/services/workspace/certificationService.ts` (marks section complete) | ✓ VERIFIED |
| `src/services/workspace/submissionService.ts` | ✓ VERIFIED |
| `src/services/workspace/readinessService.ts` (attachment auto-complete) | ✓ VERIFIED |
| `client/src/pages/applicant/QASubmitPage.tsx` (with myQuestionsQuery) | ✓ VERIFIED |
| `client/src/pages/grantor/QAManagementPage.tsx` (with titleQuery) | ✓ VERIFIED |
| `client/src/pages/applicant/CertifySubmitPage.tsx` | ✓ VERIFIED |
| `client/src/pages/applicant/SubmissionReceiptPage.tsx` | ✓ VERIFIED |
| `client/src/components/workspace/ValidationBanner.tsx` | ✓ VERIFIED |
| `client/src/components/workspace/CertificationPanel.tsx` | ✓ VERIFIED |
| `client/src/hooks/useValidation.ts` | ✓ VERIFIED |
| `client/src/hooks/useIsAuthorizedRep.ts` (prop-based, no localStorage read) | ✓ VERIFIED |
| Gap-closure-1 artifacts (OpportunityDetailPage, OpportunityBuilder, CompletenessChecklist, seed SECTION_FIELDS) | ✓ VERIFIED |

---

## Key Link Verification — Gap-Closure-3 Specific

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `OpportunitiesIndex.tsx` | all programs' opportunities | `GET /programs` → `Promise.all` `GET /programs/:id/opportunities` | ✓ WIRED | Lines 37-55; UAT-OPP-001+002 will appear because seed places them under `mainProgramId` which is admin's org's program |
| `seed.ts` UAT-OPP-001 | `mainProgramId` (General Grant Programs) | INSERT with `mainProgramId` OR `UPDATE SET program_id = mainProgramId` | ✓ WIRED | Lines 309-347; both new-insert and existing-row paths use `mainProgramId` |
| `seed.ts` UAT-OPP-002 | `mainProgramId` (General Grant Programs) | INSERT with `mainProgramId` OR `UPDATE SET program_id = mainProgramId` | ✓ WIRED | Lines 359-394; both paths |
| `WorkspacePage.tsx` | `WorkspaceSectionPanel` | `isLocked={workspace?.is_locked ?? false}` | ✓ WIRED | Line 180 |
| `WorkspaceSectionPanel` | `SectionFormPanel` | `isLocked={isLocked}` | ✓ WIRED | Line 98 |
| `WorkspaceSectionPanel` | `BudgetBuilder` | `isLocked={isLocked}` | ✓ WIRED | Line 91 |
| `WorkspaceSectionPanel` | `AttachmentManager` | `isLocked={isLocked}` | ✓ WIRED | Line 94 |
| `SectionFormPanel` handleFieldBlur | early return | `if (isLocked) return` | ✓ WIRED | Line 84 |
| `SectionFormPanel` FormFieldRenderer | `disabled` prop | `disabled={isLocked}` | ✓ WIRED | Line 135 |
| `workspaces.ts` DELETE budget line-item | HTTP 423 | `if (workspace.is_locked) return res.status(423)` | ✓ WIRED | Line 537 |
| `workspaces.ts` DELETE attachment | HTTP 423 | `if (workspace.is_locked) return res.status(423)` | ✓ WIRED | Line 630 |
| `submissionService` POST /submit | `is_locked=true` DB state | `UPDATE application_workspaces SET is_locked=true` | ✓ WIRED | Proven by integration test workspaceSubmission.test.ts:323-328 |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| PRD-INTAKE-044 (Q&A question submission) | ✓ SATISFIED | QASubmitPage + qaService.submitQuestion + listMyQuestions |
| PRD-INTAKE-045 (Grantor Q&A management) | ✓ SATISFIED | QAManagementPage + OpportunitiesIndex (multi-program) now shows UAT-OPP-001+002 |
| PRD-INTAKE-047 (Addenda/change notifications) | ⚠️ PARTIAL | Q&A notifications wired; addenda/deadline wiring deferred to Phase 6 |
| PRD-INTAKE-048 (Continuous validation) | ✓ SATISFIED | useValidation (blur-triggered, 500ms debounce), validationService, ValidationBanner |
| PRD-INTAKE-049 (Validation classification) | ✓ SATISFIED | Three-tier: blocking/warning/informational |
| PRD-INTAKE-050 (Submit blocking) | ✓ SATISFIED | ReadinessDashboard aria-disabled gate; certifications section marks complete post-certify |
| PRD-INTAKE-051 (AR certification) | ✓ SATISFIED | certificationService + CertificationPanel (SHA-256, legal text, checkbox); useIsAuthorizedRep prop-based |
| PRD-INTAKE-052 (Immutable submission snapshot) | ✓ SATISFIED | submission_snapshots + immutability trigger + DB-enforced constraint |
| PRD-INTAKE-053 (Confirmation number) | ✓ SATISFIED | GI-{YEAR}-{8digit-seq} format; live test emitted `GI-2026-00000002` |
| PRD-INTAKE-054 (Post-submission lock) | ✓ SATISFIED (code) | `is_locked=true` DB state integration-test proven; locked-banner + receipt link code-verified; all edit controls `disabled={isLocked}` code-verified; all DELETE routes HTTP 423 guarded. Full E2E browser session is human_needed item. |
| PRD-INTAKE-055 (Human/machine readable) | ✓ SATISFIED | Paths pre-computed; file generation is Phase 6 S3/storage scope |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `client/src/components/workspace/AttachmentManager.tsx` | 133 | `alert('Org document library linking...')` | ⚠️ Warning | "Link from Library" stub — shows browser alert. Button is `disabled={isLocked}` in locked state. Pre-existing; not introduced by gap-closure-3. Not a Phase 5 correctness defect — Phase 5 scope is upload, not library linking. |
| `src/services/opportunity/completenessService.ts` | 133-134 | `// TODO Phase 2: At least one eligibility rule…` | ℹ️ Info | Explicitly Phase 2 scope. Not a Phase 5 concern. |
| `client/src/App.tsx` | 77 | `qa-inbox` redirect to `/grantor/opportunities` | ℹ️ Info | Intentional decision per 05-04 SUMMARY. No broken navigation. |

**No blockers. No new anti-patterns introduced in gap-closure-3.**

The "Link from Library" alert stub is pre-existing and noted but not a blocker — the button is correctly disabled when the workspace is locked, and file upload (the primary attachment path) works correctly.

---

## Behavioral Spot-Checks

| Check | Command | Result |
|-------|---------|--------|
| Full test suite (live run) | `npm test` | ✅ `256 passed (256)` in 15.47s — confirmed live |
| DELETE budget line-item is_locked guard | `grep -n "is_locked" src/routes/workspaces.ts` | ✅ Line 537: `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' })` |
| DELETE attachment is_locked guard | Same grep | ✅ Line 630: identical guard |
| Total is_locked guards in workspaces.ts | Same grep | ✅ 6 occurrences: lines 431, 505, 521, 537, 596, 630 — all mutating routes guarded |
| AbortController in OpportunitiesIndex | Read file | ✅ Lines 35-60: controller created, signal passed, cleanup `return () => controller.abort()` at line 60 |
| Promise.all multi-program fetch | Read file | ✅ Lines 48-55: `await Promise.all(programs.map(p => apiClient.get(...)))` |
| seed.ts mainProgramId null-guard | Read file | ✅ Line 84: `if (!mainProgramId) throw new Error(...)` |
| UAT-OPP-001 under mainProgramId | grep seed.ts | ✅ Lines 319-320: UPDATE re-parents; lines 332: INSERT uses mainProgramId |
| UAT-OPP-002 under mainProgramId | grep seed.ts | ✅ Lines 391-393: UPDATE re-parents; line 373: INSERT uses mainProgramId |
| No 'UAT Federal Agency' in seed.ts | grep seed.ts | ✅ Zero occurrences |
| No 'UAT Grant Program' in seed.ts | grep seed.ts | ✅ Zero occurrences |
| WorkspacePage isLocked threading | grep WorkspacePage.tsx | ✅ Line 180: `isLocked={workspace?.is_locked ?? false}` |
| WorkspaceSectionPanel read-only notice | Read file | ✅ Lines 81-87: `{isLocked && <div ...>This section is read-only...</div>}` |
| SectionFormPanel isLocked early return | Read file | ✅ Line 84: `if (isLocked) return;` |
| SectionFormPanel disabled={isLocked} | Read file | ✅ Line 135: `disabled={isLocked}` passed to FormFieldRenderer |
| BudgetBuilder Add button disabled | Read file | ✅ Line 270: `disabled={isLocked}` |
| BudgetBuilder Remove button disabled | Read file | ✅ Line 316: `disabled={deleteLineItemMutation.isPending \|\| isLocked}` |
| AttachmentManager Upload disabled | Read file | ✅ Line 121: `disabled={uploadMutation.isPending \|\| isLocked}` |
| AttachmentManager Delete disabled | Read file | ✅ Line 203: `disabled={isLocked}` |
| is_locked=true set post-submission | grep tests/integration | ✅ workspaceSubmission.test.ts:328: `expect(result.rows[0].is_locked).toBe(true)` — integration test proves DB state |
| locked-banner data-testid | grep WorkspacePage.tsx | ✅ Line 151: `data-testid="locked-banner"` |
| e2e/workspaceLocked.spec.ts exists | ls e2e/ | ✅ Present; 156 lines; advisory structure confirmed |
| TypeScript compile | GATE.md (not re-run) | ✅ tsc exit 0 — GATE.md gap-closure-3 confirms |

---

## Human Verification Required

### 1. Post-Submission Workspace Lock — End-to-End Browser Session (UAT Test 6)

**Test:** Login as `applicant@example.com / TestPass123!`. Complete all workspace sections in the UAT opportunity (org_profile, eligibility, workplan, performance_measures, review_submit), certify as authorized representative (checkbox + legal text in certifications section), submit via CertifySubmitPage. Return to the workspace URL after submission.
**Expected:**
- A locked-state banner ("Application Submitted and Locked") appears (`data-testid="locked-banner"`)
- Receipt link navigates to `/applicant/workspaces/:id/receipt`
- All section form fields are read-only — inputs, textareas, selects all have `disabled` attribute
- A "This section is read-only" notice appears inside each section panel
- Budget "Add Line Item" buttons are all disabled
- Attachment "Upload New File" and "Link from Library" buttons are both disabled
- Attachment "Delete" buttons are disabled
**Why human:** All code prerequisites fully verified — `is_locked=true` DB state is integration-test proven, isLocked prop threading is code-verified end-to-end, all `disabled={isLocked}` wiring is code-verified, DELETE routes return HTTP 423. What remains is confirming the complete browser session flows without error and that React renders the disabled state correctly at runtime.

### 2. CertificationPanel AR Visibility — Final UX Confirmation (Advisory)

**Test:** Login as `applicant@example.com / TestPass123!` (this user has `authorized_representative` role in seed). Navigate directly to `/applicant/workspaces/:id` without visiting OrgProfilePage first. Select the "Certifications" section from the sidebar.
**Expected:** CertificationPanel with legal certification text and checkbox appears within 2–3 seconds (after workspace data loads). No persistent absent-panel state.
**Why human (advisory):** useIsAuthorizedRep is prop-based (orgId from workspaceQuery.data), stale-read flash eliminated. This is low-risk UX sign-off only.

### 3. SC2 Addenda/Deadline Notification Scope Acceptance

**Test:** Not a functional test — scope acceptance decision.
**Context:** Q&A update notifications are wired. `notifyWorkspacesOfAddendum` and `notifyWorkspacesOfDeadlineChange` exist in `notificationService.ts` but are not wired from addendaService/deadlineService routes — explicitly deferred to Phase 6.
**Expected:** Evaluator confirms partial delivery is acceptable for Phase 5 sign-off, or flags for Phase 6 inclusion.
**Why human:** Scope acceptance decision.

---

## Summary

Phase 5 goal is **fully achieved at the code level**. All gap-closure waves (05-01 through 05-10) and all code review fixes (B1, B2, W1, W2, W3) have been executed and verified in the codebase. The gap-closure-3 wave (plans 05-09 and 05-10) specifically addressed:

**UAT Test 2 (Q&A Management shows questions):** ✓ CLOSED
- `OpportunitiesIndex.tsx` now fetches opportunities across all programs via `Promise.all` — grantor sees UAT-OPP-001 and UAT-OPP-002
- `seed.ts` re-parents both UAT opportunities under `mainProgramId` (General Grant Programs) — idempotently handles both new and existing rows
- No orphan 'UAT Federal Agency' or 'UAT Grant Program' entities remain in seed

**UAT Test 6 (Locked workspace fields disabled):** ✓ CLOSED at code level
- `isLocked` prop fully threaded: WorkspacePage → WorkspaceSectionPanel → SectionFormPanel + BudgetBuilder + AttachmentManager
- Read-only notice rendered in each locked section panel
- All edit controls (`disabled={isLocked}`) verified in source for SectionFormPanel, BudgetBuilder, AttachmentManager
- Server-side DELETE budget line-item (line 537) and DELETE attachment (line 630) now carry `is_locked` HTTP 423 guard (B1+B2 code review fixes confirmed)
- DB-level `is_locked=true` post-submission proven by integration test

**Gates:** All green across all waves — 256/256 tests, tsc exit 0, boot smoke pass, 0 code review BLOCKERs.

The three human_verification items remain open:
1. UAT Test 6 end-to-end browser session (all code is verified; needs runtime confirmation)
2. CertificationPanel UX sign-off (W2 flash eliminated; advisory only)
3. SC2 addenda/deadline scope acceptance (scope decision)

---

_Verified: 2026-08-01T04:30:00Z_
_Verifier: Claude (pivota_spec-verifier) — re-verification #3 after gap-closure-3 wave (plans 05-09, 05-10) and code review fixer commits (053ee29, bf64f87)_
