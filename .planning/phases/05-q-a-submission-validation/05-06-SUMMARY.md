---
phase: 05-q-a-submission-validation
plan: "06"
subsystem: api, ui
tags: [qa, react-query, typescript, express, postgresql, uswds]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: "qa_items table, qa routes, QASubmitPage/QAManagementPage scaffolding from 05-01"
provides:
  - "GET /opportunities/:id/my-questions route (authenticated, returns user's own questions)"
  - "qaService.listMyQuestions() method for applicant-facing question fetch"
  - "qaApi.listMyQuestions() client method with auth headers and typed error"
  - "QASubmitPage 'Your Submitted Questions' section with Awaiting Answer badge"
  - "QAManagementPage opportunity title display (fetched from public endpoint)"
  - "QAManagementPage error alert on 401/403 listAll failures"
  - "qa_config.enabled=true seeded on UAT-OPP-001"
affects: [05-q-a-submission-validation, UAT-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "submitter_user_id from req.user!.user_id (JWT-verified) — never from query params or request body (T-05-06-01 IDOR mitigation)"
    - "WHERE submitter_user_id = $1 parameterized query prevents cross-user leakage (T-05-06-02)"
    - "queryClient.invalidateQueries on both qa-published and qa-my-questions after submit for immediate refresh"

key-files:
  created: []
  modified:
    - src/routes/qa.ts
    - src/services/opportunity/qaService.ts
    - client/src/api/qaApi.ts
    - client/src/pages/applicant/QASubmitPage.tsx
    - client/src/pages/grantor/QAManagementPage.tsx
    - src/db/seed.ts

key-decisions:
  - "GET /my-questions route uses only authenticate middleware (no requireRole) — any authenticated user can fetch their own questions"
  - "listAll() error in qaApi.ts now throws typed error with status + code — enables grantor UI to distinguish 401/403 from other errors"
  - "titleQuery uses public /api/v1/opportunities/:id endpoint with staleTime=5min — opportunity title is public data (T-05-06-03 accepted risk)"
  - "Idempotent seed UPDATE: only sets qa_config when NULL or enabled IS NOT TRUE — safe across restarts with persistent volumes"

patterns-established:
  - "Pattern: my-questions pattern — authenticated endpoint returning user's own subset of a shared resource table"
  - "Pattern: titleQuery with public endpoint + UUID fallback — graceful degradation if opportunity not found"

# Metrics
duration: 3min
completed: 2026-07-31
---

# Phase 5 Plan 06: Q&A UAT Gap Closure Summary

**GET /my-questions endpoint and applicant pending questions list; QAManagementPage opportunity title fetch and 401/403 error alert; UAT-OPP-001 qa_config.enabled seeded**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-31T19:52:00Z
- **Completed:** 2026-07-31T19:54:36Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments

- Added `GET /opportunities/:id/my-questions` backend route (authenticated, IDOR-safe via JWT submitter_user_id)
- Added `qaService.listMyQuestions()` and `qaApi.listMyQuestions()` with typed error propagation
- Added "Your Submitted Questions" section to QASubmitPage with "Awaiting Answer" badge for pending items
- Updated `listAll()` in qaApi to throw typed error with HTTP status so QAManagementPage can distinguish auth failures
- QAManagementPage now fetches and displays opportunity title instead of raw UUID
- QAManagementPage renders `usa-alert--error` with permission message when listAll returns 401/403
- seed.ts idempotently enables qa_config.enabled on UAT-OPP-001 so applicants can submit questions

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend endpoint + client API + QASubmitPage + seed** - `fc2dada` (feat)
2. **Task 2: QAManagementPage title + error alert** - `a73e918` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/routes/qa.ts` — Added GET /opportunities/:id/my-questions route with authenticate middleware
- `src/services/opportunity/qaService.ts` — Added `listMyQuestions(opportunityId, submitterUserId)` method
- `client/src/api/qaApi.ts` — Added `listMyQuestions()` method; updated `listAll()` to throw typed error with HTTP status
- `client/src/pages/applicant/QASubmitPage.tsx` — Added myQuestionsQuery + "Your Submitted Questions" section with Awaiting Answer badge; invalidates both queries on submit success
- `client/src/pages/grantor/QAManagementPage.tsx` — Added useAuthStore import, titleQuery (public endpoint), updated header to show title, added error alert on questionsQuery.isError
- `src/db/seed.ts` — Idempotent UPDATE sets qa_config='{"enabled":true}' on UAT-OPP-001

## Decisions Made

- GET /my-questions uses only `authenticate` middleware (no `requireRole`) — any authenticated user may fetch their own questions; submitter_user_id comes from JWT (`req.user!.user_id`), not query params
- `listAll()` error now propagates `status` and `code` from HTTP response so grantor UI can render targeted 401/403 messages
- titleQuery hits public `/api/v1/opportunities/:id` endpoint (opportunity title is public data per T-05-06-03 accepted risk); UUID shown as fallback when fetch fails
- Seed UPDATE is idempotent: `WHERE qa_config IS NULL OR (qa_config->>'enabled')::boolean IS NOT TRUE` — safe across volume-persisted restarts

## Deviations from Plan

None — plan executed exactly as written. Note: Task 1's `listAll()` update (adding typed error with status) was included in Task 1's commit alongside `listMyQuestions`, since qaApi.ts was already modified. Task 2's verify step confirmed `STATUS PROPAGATION OK` on three qaApi methods.

## Known Stubs

None found — all implementations are real (no hardcoded returns, no empty handlers, no swallowed errors).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Q&A round-trip (submit → grantor sees pending question → publishes answer → applicant sees answered question) is now fully visible in UI
- UAT-OPP-001 has qa_config.enabled=true so UAT Test 1 can proceed without QA_DISABLED error
- QAManagementPage shows opportunity title and surfaces auth errors clearly
- Phase 5 UAT Tests 1 and 2 should now pass end-to-end

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*

## Self-Check: PASSED

- `src/routes/qa.ts` ✅ (exists, contains /my-questions route)
- `src/services/opportunity/qaService.ts` ✅ (exists, contains listMyQuestions)
- `client/src/api/qaApi.ts` ✅ (exists, contains listMyQuestions + updated listAll)
- `client/src/pages/applicant/QASubmitPage.tsx` ✅ (exists, contains "Your Submitted Questions" section)
- `client/src/pages/grantor/QAManagementPage.tsx` ✅ (exists, contains titleQuery + error alert)
- `src/db/seed.ts` ✅ (exists, contains qa_config enabled UPDATE)
- Commits: `fc2dada` ✅, `a73e918` ✅
- Build check: `npx tsc -p tsconfig.json --noEmit` → SERVER TS CLEAN; `npx tsc --noEmit` (client) → CLIENT TS CLEAN
- Known Stubs: None (only HTML placeholder attributes found, not code stubs)
