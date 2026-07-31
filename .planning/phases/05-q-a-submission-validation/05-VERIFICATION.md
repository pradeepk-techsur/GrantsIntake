---
phase: 05-q-a-submission-validation
verified: 2026-07-31T05:20:00Z
status: human_needed
score: 4/5 must-haves verified (SC2 partially delivered by design; all confirmed deliverables verified)
re_verification: false
human_verification:
  - test: "Post-submission workspace is locked and read-only"
    expected: "After successful submission, workspace shows locked-state banner with receipt link. No edits can be made — all section inputs are disabled or hidden."
    why_human: "UAT Test 6 was skipped (prerequisite flow couldn't complete in original UAT). Gap-closure plans fixed prerequisites. Needs end-to-end flow confirmation by human."
  - test: "CertificationPanel renders for AR user on direct workspace navigation"
    expected: "An AR-role user navigating directly to /applicant/workspaces/:id (without visiting OrgProfilePage) sees the Certification panel with legal text and checkbox — not just Tasks/Internal Comments."
    why_human: "W2 (stale-read flash) in code review: panel may briefly appear absent before org-roles query resolves. Human needed to confirm panel appears within normal interaction time and the flash is not disorienting."
  - test: "Addenda and deadline-change notifications not triggered (SC2 partial)"
    expected: "When a grantor publishes an addendum or changes a deadline, applicant workspaces should receive NOTIFICATION_SENT audit events. Currently only Q&A updates trigger notifications — addenda/deadline wiring is Phase 6 scope."
    why_human: "Evaluator should decide whether SC2 partial delivery (QA ✓, addenda/deadline ✗) blocks phase sign-off or is accepted as explicitly deferred."
---

# Phase 5: Q&A, Submission & Validation — Verification Report

**Phase Goal:** Grantors can manage public Q&A and addenda with an auditable history; applicants experience continuous validation during drafting and can submit a fully certified, immutable application that is locked post-submission
**Verified:** 2026-07-31T05:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification (no previous VERIFICATION.md)

---

## Gate Evidence (Mandatory Input — Not Re-litigated)

| Gate | Status | Evidence |
|------|--------|----------|
| Build (`npm run build`) | ✅ pass | Gate wave gap-closure: tsc exit 0 |
| Tests (`npm test`) | ✅ pass | 256/256 tests, 28 files — confirmed re-run live: 256 passed |
| Boot smoke | ✅ pass | API :3000 returning 200 OK |
| Code review BLOCKERs | ✅ 0 | 05-REVIEW.md: blockers: 0 |
| W1 fix (max_length→max_chars) | ✅ fixed | Commit `7e089d2`: `src/db/seed.ts` — all 9 `validation_config` entries now use `max_chars`; grep confirms zero `max_length` occurrences in seed.ts |
| W2 (AR panel flash) | ⚠️ advisory | Code review: "functionally correct … panel does appear"; no code change required. Human verification item below. |

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC1 | Grantor can enable Q&A, publish responses visible to all applicants; Q&A, addenda, date changes preserved in immutable auditable history | ✓ VERIFIED | `qaService.ts` (158L), `qa.ts` routes (5 endpoints, audit via `getAuditHistory`), migration 015 DDL, 10 integration tests pass |
| SC2 | Applicants receive in-app and email notifications within 15 minutes of addenda, deadline changes, or Q&A updates | ⚠️ PARTIAL | QA update notifications wired (`qaService.publishAnswer` → `notificationService.notifyWorkspacesOfQAUpdate`); addenda/deadline wiring NOT wired — functions exist in `notificationService.ts` but not called from `addendaService`/`deadlineService`. Explicitly deferred to Phase 6 per SUMMARY decision log. |
| SC3 | Validation errors classified blocking/warning/informational with USWDS; blocking errors surfaced continuously on blur; Submit disabled until cleared | ✓ VERIFIED | `validationService.ts` (172L, three-tier), `useValidation.ts` (500ms debounce), `ValidationBanner.tsx` (usa-alert--error/warning/info), ReadinessDashboard `aria-disabled` gate; 6 validation integration tests pass |
| SC4 | Authorized representative can certify (legal text, checkbox); only AR can initiate final submission | ✓ VERIFIED | `certificationService.ts` (127L, SHA-256 hash, CERTIFICATION_COMPLETED audit, AR role JSONB check `roles @> '["authorized_representative"]'::jsonb`); `CertificationPanel.tsx` (201L, checkbox `data-testid=certification-checkbox`); `CertifySubmitPage.tsx` AR checklist item; 8 certification tests pass |
| SC5 | Immutable snapshot with GI-YEAR-8digit, UTC receipt, human-readable + machine-readable packages; application locked; no edits without withdrawal | ✓ VERIFIED | `submissionService.ts` (348L): confirmation# `GI-{year}-{8digit}` pattern; `submission_snapshots` immutability trigger in migration 015; workspace `is_locked=true`; locked-banner + receipt link in `WorkspacePage.tsx`; 12 submission tests pass (live: `GI-2026-00000002` generated) |

**Score: 4/5 verified** (SC2 partially delivered by design)

---

## Required Artifacts

### Backend

| Artifact | Lines | Status | Details |
|----------|-------|--------|---------|
| `src/db/migrations/015_qa_certifications_submissions_schema.sql` | — | ✓ VERIFIED | qa_items, certifications, submission_snapshots DDL + immutability triggers |
| `src/services/opportunity/qaService.ts` | 158 | ✓ VERIFIED | listPublished, listAll, submitQuestion, publishAnswer, getAuditHistory |
| `src/services/opportunity/notificationService.ts` | 104 | ✓ VERIFIED | notifyWorkspacesOfQAUpdate (wired), notifyWorkspacesOfAddendum + notifyWorkspacesOfDeadlineChange (Phase 6) |
| `src/routes/qa.ts` | — | ✓ VERIFIED | 5 endpoints with auth/role guards and Zod validation |
| `src/services/workspace/validationService.ts` | 172 | ✓ VERIFIED | Three-tier classification: blocking/warning/informational |
| `src/services/workspace/certificationService.ts` | 127 | ✓ VERIFIED | SHA-256 hash, CERTIFICATION_COMPLETED audit, AR role enforcement |
| `src/services/workspace/submissionService.ts` | 348 | ✓ VERIFIED | Full pipeline: validate→confirm#→snapshot→lock→audit |
| `tests/integration/qa.test.ts` | — | ✓ VERIFIED | 10 tests pass live |
| `tests/integration/workspaceValidation.test.ts` | — | ✓ VERIFIED | 6 tests pass live |
| `tests/integration/workspaceCertification.test.ts` | — | ✓ VERIFIED | 8 tests pass live |
| `tests/integration/workspaceSubmission.test.ts` | — | ✓ VERIFIED | 12 tests pass live |

### Frontend

| Artifact | Lines | Status | Details |
|----------|-------|--------|---------|
| `client/src/pages/applicant/QASubmitPage.tsx` | 201 | ✓ VERIFIED | Applicant question submission |
| `client/src/pages/grantor/QAManagementPage.tsx` | 221 | ✓ VERIFIED | Grantor Q&A management, filter tabs, answer publishing |
| `client/src/pages/applicant/CertifySubmitPage.tsx` | 267 | ✓ VERIFIED | Pre-submission checklist (4 items), gated confirm button |
| `client/src/pages/applicant/SubmissionReceiptPage.tsx` | 184 | ✓ VERIFIED | Confirmation number, submitted_at, download links |
| `client/src/components/workspace/ValidationBanner.tsx` | — | ✓ VERIFIED | usa-alert--error/warning/info three-tier display |
| `client/src/components/workspace/CertificationPanel.tsx` | 201 | ✓ VERIFIED | Legal text, checkbox `data-testid=certification-checkbox`, AR-only guard |
| `client/src/hooks/useValidation.ts` | — | ✓ VERIFIED | 500ms debounce on field blur |
| `client/src/hooks/useIsAuthorizedRep.ts` | — | ✓ VERIFIED | Reads `localStorage.applicant_org_id`, queries org roles |

### Gap-Closure Artifacts

| Artifact | Change | Status | Details |
|----------|--------|--------|---------|
| `client/src/pages/applicant/OpportunityDetailPage.tsx` | id="qa-section" + sidebar jump link + isError state | ✓ VERIFIED | `data-testid=qa-section` (line 491), `data-testid=jump-to-qa-link` (line 608), `publishedQAQuery.isError` branch with usa-alert--error (line 494) |
| `client/src/pages/grantor/opportunities/OpportunityBuilder.tsx` | 'qa' added to BuilderSection + Q&A tab | ✓ VERIFIED | `BuilderSection` union includes `'qa'` (line 23), `data-testid=tab-qa` (line 345), `data-testid=open-qa-management-link` (line 397) |
| `client/src/pages/grantor/opportunities/CompletenessChecklist.tsx` | Phase 2 placeholder items removed | ✓ VERIFIED | grep confirms 0 occurrences of "Phase 2", `phaseNote`, `isPhase2` in file |
| `client/src/pages/applicant/WorkspacePage.tsx` | useEffect populates `localStorage.applicant_org_id` | ✓ VERIFIED | `useEffect(() => { if (workspaceQuery.data?.org_id) localStorage.setItem('applicant_org_id', ...) }, [workspaceQuery.data?.org_id])` at lines 55-59 |
| `src/db/seed.ts` | form_field_definitions for 5 sections | ✓ VERIFIED | SECTION_FIELDS map: org_profile (2 fields), eligibility (1), workplan (2), performance_measures (2), review_submit (1); all use `max_chars` (W1 fixed via commit 7e089d2) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `OpportunityDetailPage.tsx` | `#qa-section` | `href="#qa-section"` sidebar link | ✓ WIRED | Both `id="qa-section"` (line 491) and `href="#qa-section"` (line 608) confirmed |
| `OpportunityBuilder.tsx` | `QAManagementPage` | Q&A tab → Link to `/grantor/opportunities/:id/qa` | ✓ WIRED | Tab at line 345; Link at line 397; route in App.tsx line 76 |
| `WorkspacePage.tsx` | `useIsAuthorizedRep` | `localStorage.applicant_org_id` via useEffect | ✓ WIRED | useEffect seeds localStorage; hook reads same key |
| `SectionFormPanel.tsx` | `useValidation` | `onFieldBlur` → `triggerValidation` | ✓ WIRED | `SectionFormPanel` line 100 calls `onFieldBlur()` on blur; `WorkspaceSectionPanel` passes it through (line 88); `WorkspacePage` wires `triggerValidation` |
| `ReadinessDashboard.tsx` | `CertifySubmitPage` | `navigate(/certify-submit)` | ✓ WIRED | Line 210: `navigate(\`/applicant/workspaces/${workspaceId}/certify-submit\`)` |
| `qaService.publishAnswer` | `notificationService.notifyWorkspacesOfQAUpdate` | direct call | ✓ WIRED | Line 138: `await notificationService.notifyWorkspacesOfQAUpdate(qa.opportunity_id, qa.qa_id)` |
| `addendaService` | `notificationService.notifyWorkspacesOfAddendum` | (unwired) | ⚠️ NOT WIRED | Function exists in notificationService; not called from addendaService or addenda routes. Phase 6 scope per plan design. |
| `seed.ts SECTION_FIELDS` | `FormFieldRenderer.tsx` `vc.max_chars` | `validation_config.max_chars` | ✓ WIRED | Commit 7e089d2 renamed all 9 occurrences from `max_length` → `max_chars`; FormFieldRenderer reads `vc.max_chars` for maxLength attribute and character counter |
| `submission_snapshots` table | immutability | DB trigger `trg_submission_snapshots_no_update` | ✓ WIRED | Migration 015 DDL lines 79-85; live test confirms `GI-2026-00000002` generated without UPDATE |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| PRD-INTAKE-044 (Q&A question submission) | ✓ SATISFIED | QASubmitPage + qaService.submitQuestion + qa_items table |
| PRD-INTAKE-045 (Grantor Q&A management) | ✓ SATISFIED | QAManagementPage + QA tab in OpportunityBuilder + qaService.publishAnswer |
| PRD-INTAKE-047 (Addenda/change notifications) | ⚠️ PARTIAL | Q&A notifications wired; addenda/deadline wiring deferred to Phase 6 |
| PRD-INTAKE-048 (Continuous validation) | ✓ SATISFIED | useValidation (blur-triggered), validationService, ValidationBanner |
| PRD-INTAKE-049 (Validation classification) | ✓ SATISFIED | Three-tier: blocking/warning/informational |
| PRD-INTAKE-050 (Submit blocking) | ✓ SATISFIED | ReadinessDashboard aria-disabled gate |
| PRD-INTAKE-051 (AR certification) | ✓ SATISFIED | certificationService + CertificationPanel (SHA-256, legal text, checkbox) |
| PRD-INTAKE-052 (Immutable submission snapshot) | ✓ SATISFIED | submission_snapshots + immutability trigger + DB-enforced constraint |
| PRD-INTAKE-053 (Confirmation number) | ✓ SATISFIED | GI-{YEAR}-{8digit-seq} format; live test emitted `GI-2026-00000002` |
| PRD-INTAKE-054 (Post-submission lock) | ✓ SATISFIED | `is_locked=true`, locked-banner, receipt link |
| PRD-INTAKE-055 (Human/machine readable) | ✓ SATISFIED | Paths pre-computed: `/submissions/human-readable/{#}.html`, `/submissions/machine-readable/{#}.json` (actual file generation is Phase 6 S3/storage) |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/services/opportunity/completenessService.ts` | 133-134 | `// TODO Phase 2: At least one eligibility rule…` | ℹ️ Info | Commented-out, explicitly scoped to Phase 2. Not enforced. Not a Phase 5 concern. |
| `client/src/App.tsx` | 77 | `qa-inbox` redirect to `/grantor/opportunities` | ℹ️ Info | Intentional decision per 05-04 SUMMARY: canonical path is now OpportunityBuilder Q&A tab. No broken navigation. |

**No blockers, no warnings.** Both anti-patterns are benign documented decisions.

---

## Behavioral Spot-Checks

| Check | Command | Result |
|-------|---------|--------|
| All 256 tests pass | `npm test` | ✅ `256 passed (256)` in 15.43s |
| Submission tests live | `npx vitest run tests/integration/workspaceSubmission.test.ts` | ✅ `12 passed` — output: `GI-2026-00000002` confirmation number generated |
| QA tests live | `npx vitest run tests/integration/qa.test.ts` | ✅ `10 passed` |
| Certification tests live | `npx vitest run tests/integration/workspaceCertification.test.ts` | ✅ `8 passed` |
| Validation tests live | `npx vitest run tests/integration/workspaceValidation.test.ts` | ✅ `6 passed` |
| TypeScript compile | `npx tsc --noEmit` | ✅ exit 0, no errors |
| W1 seed fix | `grep -n 'max_chars\|max_length' src/db/seed.ts` | ✅ All 9 entries use `max_chars`; zero `max_length` occurrences |
| Q&A anchor wired | grep for `id="qa-section"` and `href="#qa-section"` | ✅ Both present (lines 491, 608) |
| Q&A tab wired | grep for `'qa'` in BuilderSection + `tab-qa` testid | ✅ Both present (lines 23, 345) |
| localStorage useEffect | grep WorkspacePage | ✅ `useEffect(...localStorage.setItem('applicant_org_id'...)` lines 55-59 |
| Phase 2 placeholders removed | grep CompletenessChecklist | ✅ 0 occurrences of "Phase 2", `phaseNote`, `isPhase2` |

---

## Human Verification Required

### 1. Post-Submission Workspace Lock (UAT Test 6)

**Test:** Login as `applicant@example.com / TestPass123!`. Complete all workspace sections in the UAT opportunity, certify as AR, then submit. Return to the workspace URL after submission.
**Expected:** A locked-state banner appears with a link to the submission receipt. All section form fields are read-only or hidden — no edit controls are active.
**Why human:** UAT Test 6 was skipped in original UAT (prerequisite flow blocked). Gap-closure plans 04 and 05 fixed those prerequisites. Needs fresh end-to-end validation.

### 2. CertificationPanel AR Visibility (W2 Flash)

**Test:** Login as `applicant@example.com / TestPass123!` (this user has `authorized_representative` role in seed). Navigate directly to `/applicant/workspaces/:id` without visiting OrgProfilePage first. Observe the Certifications section.
**Expected:** CertificationPanel with legal certification text and a checkbox is visible within 2–3 seconds of page load. A brief flash where the panel is absent (while org-roles query resolves) is acceptable, but the panel must appear.
**Why human:** W2 code review finding: stale-read window on cold-cache load causes a second network round-trip. The panel eventually appears correctly, but the flash could be confusing. Human needed to assess UX acceptability.

### 3. SC2 Notification Completeness Decision

**Test:** Not a functional test — a scope acceptance decision.
**Context:** Success Criterion 2 requires notifications "within 15 minutes of addenda, deadline changes, or Q&A updates." Q&A update notifications are wired and fire synchronously. Addenda and deadline-change notifications exist in `notificationService.ts` (`notifyWorkspacesOfAddendum`, `notifyWorkspacesOfDeadlineChange`) but are NOT called from `addendaService` or `deadlineService` routes — this wiring is explicitly deferred to Phase 6.
**Expected:** Evaluator confirms this partial delivery is acceptable for Phase 5 sign-off, or flags it as a gap requiring closure before Phase 6.
**Why human:** This is a scope acceptance decision, not a code correctness question. The Phase 5 plan (`05-01-PLAN.md`) only specified Q&A→notification wiring in `key_links`; addenda/deadline wiring was not in plan `done` criteria. Phase 6 is where `notification_records` table and delivery queue will be added.

---

## Summary

Phase 5 goal is **substantially achieved**. All five gap-closure plans (05-01 through 05-05) have been executed. All five UAT gaps confirmed closed in the prompt are verified in the codebase:

- **UAT Test 1:** `id="qa-section"` anchor, sidebar jump link, `isError` USWDS alert — all present in `OpportunityDetailPage.tsx` ✓
- **UAT Test 2:** Q&A tab (`'qa'` in BuilderSection, `tab-qa` testid, Link to QAManagementPage) in `OpportunityBuilder.tsx`; Phase 2 placeholders gone from `CompletenessChecklist.tsx` ✓
- **UAT Test 4:** `localStorage.applicant_org_id` useEffect in `WorkspacePage.tsx` seeds value from workspace data ✓
- **UAT Test 5+7:** `SECTION_FIELDS` in `seed.ts` seeds `form_field_definitions` for all 5 completable sections; all use `max_chars` (W1 fixed via commit `7e089d2`) ✓

The W1 code review finding is **confirmed fixed** — commit `7e089d2` renamed all 9 `max_length` → `max_chars` in `seed.ts`. W2 is an advisory flash, not a blocker.

The only open questions are human-verification items: post-submission lock UX (UAT Test 6 which was skipped), W2 CertificationPanel flash acceptability, and a scope-acceptance decision on SC2 addenda/deadline notification deferral.

Gates are green (build pass, 256/256 tests, boot smoke pass). No blockers.

---

*Verified: 2026-07-31T05:20:00Z*
*Verifier: Claude (pivota_spec-verifier)*
