---
phase: 03-organization-profile-eligibility-pre-screening
plan: "03"
subsystem: api
tags: [eligibility, prescreening, postgres, supertest, vitest, react, uswds, playwright]

# Dependency graph
requires:
  - phase: 03-organization-profile-eligibility-pre-screening
    provides: organizations table, organizationService.getOrgIdForUser, org_id FK
  - phase: 02-eligibility-intake-rules-configuration
    provides: prescreening_questionnaires, prescreening_questions, prescreening_options, eligibility_rules tables
provides:
  - Migration 011: eligibility_responses table with uq_elig_response constraint and two indexes
  - prescreeningEvaluationService.evaluateResponses: four-state result logic, ALREADY_SUBMITTED guard, transaction INSERT
  - POST /api/v1/opportunities/:id/prescreening/submit (applicant submit route)
  - GET /api/v1/opportunities/:id/prescreening/applicant (applicant questionnaire route)
  - GET /api/v1/workspaces/:id/eligibility-responses (admin stub, Phase 4 completes)
  - PrescreenPage: conditional questionnaire UI with yes_no/multiple_choice/text support
  - PrescreenResultPage: four-state USWDS alert display with blocker-section and advisory-section
  - App.tsx routes: /applicant/opportunities/:opportunityId/prescreen and /prescreen/result
  - Check Eligibility link in OpportunityDetailPage (data-testid=check-eligibility-link)
affects: [phase-4-application-workspace]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "prescreeningEvaluationService.evaluateResponses: server-side only evaluation — client submits option_ids, server looks up rule linkage from DB (T-03-19 accepted)"
    - "ALREADY_SUBMITTED guard: SELECT COUNT(*) before INSERT; DB UNIQUE constraint backs it up at storage layer"
    - "Conditional question rendering: show_if.depends_on_question_id + trigger_response_value maps prescreening_questions.conditional_display JSONB"
    - "yes_no question handling: response_text stores 'yes'/'no' for conditional matching; selected_option_id stores the matching option for rule trigger detection"
    - "EligibilityResult four-state: no triggers → eligible; hard_blocker → ineligible; 1-2 advisory → likely_eligible; 3+ advisory → needs_attention"

key-files:
  created:
    - src/db/migrations/011_eligibility_responses_schema.sql
    - src/services/eligibility/prescreeningEvaluationService.ts
    - client/src/api/prescreeningApi.ts
    - client/src/pages/applicant/PrescreenPage.tsx
    - client/src/pages/applicant/PrescreenResultPage.tsx
    - tests/integration/applicantPrescreening.test.ts
    - e2e/prescreen.spec.ts
  modified:
    - src/routes/prescreening.ts
    - client/src/App.tsx
    - client/src/pages/applicant/OpportunityDetailPage.tsx

key-decisions:
  - "applicant GET questionnaire uses /prescreening/applicant route (not the existing grantor /prescreening route) — grantor route requires grantor_roles membership; applicant route uses authenticate only and returns preview (no rule_outcome)"
  - "yes_no question type: stores response_text='yes'/'no' for conditional logic matching; also stores selected_option_id to find mapped_rule_id; plan specified single_choice/boolean but actual DB schema uses yes_no"
  - "workspace_id FK in migration 011 deferred: declared as UUID with no FK reference — comment documents Phase 4 will add REFERENCES application_workspaces(workspace_id)"
  - "Playwright tests written but deferred to verify phase — per test execution boundary no E2E tests run during execute"
  - "Grantor login order fixed in test: role assigned BEFORE login so JWT contains grantor_admin role (requireRole middleware checks JWT claims)"

patterns-established:
  - "isQuestionVisible(): pure function — question visible if no conditional constraint, or parent response matches trigger_response_value"
  - "Four-state alert mapping: Record<EligibilityResult['overall_result'], alertConfig> — exhaustive TypeScript mapping prevents missed states"

# Metrics
duration: 9min
completed: 2026-07-26
---

# Phase 3 Plan 03: Eligibility Pre-Screen Summary

**Migration 011 (eligibility_responses), prescreeningEvaluationService with four-state result logic, applicant submit + GET routes, PrescreenPage/PrescreenResultPage with conditional questions and USWDS four-state alerts, and 9 passing integration tests**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-26T14:06:11Z
- **Completed:** 2026-07-26T14:15:13Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Migration 011 applied with eligibility_responses table, uq_elig_response UNIQUE constraint, two indexes; workspace_id nullable without FK (Phase 4 will add FK)
- prescreeningEvaluationService.evaluateResponses: evaluates submitted option_ids against prescreening_options.mapped_rule_id → eligibility_rules.severity; produces four-state result; stores all responses in a single transaction; 409 ALREADY_SUBMITTED check
- Extended prescreening.ts with applicant GET (questionnaire preview, auth required), POST submit (org_id derived server-side from user_id), admin stub GET eligibility-responses
- PrescreenPage: conditional question rendering using show_if.depends_on_question_id; yes_no/multiple_choice/text input types with USWDS classes
- PrescreenResultPage: four USWDS alert states (success/info/warning/error), hard blocker list in blocker-section, advisory list in advisory-section
- 164 total tests passing (9 new — up from 155)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 011 + prescreeningEvaluationService + submit route + integration tests** - `02d5e1a` (feat)
2. **Task 2: PrescreenPage + PrescreenResultPage UI + App.tsx routing + Playwright tests** - `b931fa5` (feat)

## Files Created/Modified

- `src/db/migrations/011_eligibility_responses_schema.sql` — eligibility_responses DDL with uq_elig_response, workspace_id nullable without FK
- `src/services/eligibility/prescreeningEvaluationService.ts` — PrescreeningEvaluationService with evaluateResponses(), EligibilityResult, SubmittedResponse interfaces
- `src/routes/prescreening.ts` — Extended with /prescreening/applicant GET, /prescreening/submit POST, /workspaces/:id/eligibility-responses GET stub; UUID guards throughout
- `client/src/api/prescreeningApi.ts` — prescreeningApi with getQuestionnaire and submitResponses
- `client/src/pages/applicant/PrescreenPage.tsx` — Multi-step questionnaire with conditional rendering
- `client/src/pages/applicant/PrescreenResultPage.tsx` — Four-state USWDS alert with blocker + advisory sections
- `client/src/App.tsx` — Added PrescreenPage and PrescreenResultPage routes under /applicant
- `client/src/pages/applicant/OpportunityDetailPage.tsx` — Added Check Eligibility button (data-testid=check-eligibility-link)
- `tests/integration/applicantPrescreening.test.ts` — 9 integration tests
- `e2e/prescreen.spec.ts` — 6 Playwright test cases

## Decisions Made

- **Applicant GET questionnaire uses separate /prescreening/applicant route:** The existing grantor GET route uses `verifyOpportunityAccess()` which requires grantor_roles membership. Rather than breaking grantor access, added a parallel applicant-facing route that uses `authenticate` only and calls `prescreeningService.preview()` (strips rule_outcome from options).
- **yes_no question type:** The actual DB schema uses `yes_no`/`multiple_choice`/`text` types (not the plan's `single_choice`/`boolean`). The implementation aligns with the actual schema. For yes_no, `response_text` stores `'yes'`/`'no'` for conditional matching AND `selected_option_id` stores the matching option for rule trigger detection.
- **workspace_id FK deferred:** Migration 011 declares `workspace_id UUID` with NO FK — application_workspaces doesn't exist until Phase 4. Comment documents the deferred FK.
- **Playwright tests deferred:** E2E tests written as artifact but not run per execute-phase test execution boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Grantor login order in integration test — JWT missing role**
- **Found during:** Task 1 (first integration test run)
- **Issue:** `grantorAccessToken` was obtained BEFORE inserting the `grantor_roles` row. The JWT's `roles` claim was empty. `requireRole('grantor_admin')` on the PUT route rejected with 403.
- **Fix:** Reordered test `beforeAll` to insert `grantor_roles` BEFORE calling `loginUser()` for the grantor user, so the access token includes the `grantor_admin` role.
- **Files modified:** tests/integration/applicantPrescreening.test.ts
- **Verification:** All 9 integration tests pass
- **Committed in:** 02d5e1a (Task 1 commit)

**2. [Rule 3 - Blocking] Migration 011 not applied — eligibility_responses table absent**
- **Found during:** Task 1 (first test run)
- **Issue:** `eligibility_responses` table didn't exist in the running database — the migrate script runs on app startup but the DB container already had the app at the previous state.
- **Fix:** Applied migration 011 directly via `pool.query()` and recorded in `schema_migrations`. The migration SQL itself is correct — this was a one-time apply.
- **Files modified:** Database state only (migration 011 already authored correctly)
- **Verification:** `eligibility_responses` table confirmed present via pg_tables query

**3. [Rule 1 - Bug] Plan used different field names than actual DB schema**
- **Found during:** Task 1 design (reading existing schema)
- **Issue:** Plan specified `triggers_rule_id` for options and `conditional_on_question_id`/`conditional_on_option_id` for questions. Actual schema has `mapped_rule_id` (options) and `conditional_display.depends_on_question_id`/`trigger_response_value` (questions JSONB).
- **Fix:** Aligned all implementation to actual schema. prescreeningApi.ts uses `show_if.depends_on_question_id` and `mapped_rule_id` as they come from `prescreeningService.preview()`.
- **Files modified:** src/services/eligibility/prescreeningEvaluationService.ts, client/src/api/prescreeningApi.ts, client/src/pages/applicant/PrescreenPage.tsx
- **Verification:** TypeScript compiles, integration tests pass with actual schema

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 complete: organizations schema + API (Plan 01), applicant portal UI (Plan 02), eligibility pre-screen flow (Plan 03)
- `eligibility_responses` table available for Phase 4 workspace pre-population
- GET /workspaces/:id/eligibility-responses stub ready for Phase 4 to add workspace membership check
- Playwright e2e tests written and deferred to verify phase

## Self-Check: PASSED

All 10 key files confirmed on disk. Both task commits (02d5e1a, b931fa5) confirmed in git log.

---
*Phase: 03-organization-profile-eligibility-pre-screening*
*Completed: 2026-07-26*
