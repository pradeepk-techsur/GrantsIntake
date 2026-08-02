---
phase: 06-intake-queue-screening-analytics
plan: 01
subsystem: api
tags: [intake-queue, dispositions, notifications, postgres, react, uswds, playwright]

# Dependency graph
requires:
  - phase: 05-q-a-submission-validation
    provides: submission_snapshots table with immutability triggers (migration 015)
provides:
  - Migration 016: 6 Phase 6 tables (intake_queue_entries, intake_dispositions, correction_requests, review_handoffs, notification_records, export_jobs)
  - intakeQueueService with IDOR-safe queue listing, detail, disposition, and notification methods
  - REST API: GET /intake-queue, GET /intake-queue/:entryId, POST /intake-queue/:entryId/disposition, GET /notifications, PUT /notifications/:notificationId/read
  - submissionService.submit() auto-creates intake_queue_entries row + SUBMISSION_RECEIVED audit event
  - IntakeQueuePage (sortable/filterable table with 7 disposition status filters)
  - IntakeQueueDetailPage (snapshot detail + disposition form + history)
affects: [07-corrections, 08-handoffs, 09-exports, 10-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IDOR guard via server-derived grantorOrgId (grantor_roles JOIN, never client-supplied)
    - Immutable disposition history (append-only intake_dispositions, no UPDATE/DELETE)
    - Notification fan-out via org_roles lookup on disposition application
    - Route handler consolidation in Playwright e2e (single wildcard handler with URL dispatch)

key-files:
  created:
    - src/db/migrations/016_intake_queue_schema.sql
    - src/services/intake/intakeQueueService.ts
    - src/routes/intakeQueue.ts
    - tests/integration/intakeQueue.test.ts
    - client/src/types/intakeQueue.ts
    - client/src/api/intakeQueueApi.ts
    - client/src/pages/grantor/IntakeQueuePage.tsx
    - client/src/pages/grantor/IntakeQueueDetailPage.tsx
    - e2e/intakeQueue.spec.ts
  modified:
    - src/services/workspace/submissionService.ts
    - src/server.ts
    - client/src/App.tsx
    - client/src/pages/grantor/QAManagementPage.tsx

key-decisions:
  - "Disposition history is append-only: each POST creates a new intake_dispositions row; UPDATE only sets entry status and disposition_id pointer (no modification of existing disposition rows)"
  - "grantorOrgId server-derived via grantor_roles JOIN (never from request body/params) — consistent with T-02-01 IDOR pattern established in Phase 1"
  - "Notification fan-out non-blocking: try/catch around org_roles lookup so disposition still succeeds even if notification insert fails"
  - "Playwright e2e uses single consolidated route handler per test to avoid ordering issues with multiple page.route() calls"
  - "Removed required attribute from rationale textarea; client-side JS validation runs in onSubmit handler to avoid browser native validation intercepting form submission"

patterns-established:
  - "Intake IDOR guard: server looks up grantor_org_id via grantor_roles JOIN in every intake-queue handler"
  - "Notification delivery: createNotification called from applyDisposition service method, wrapped in try/catch"

# Metrics
duration: 20min
completed: 2026-08-02
---

# Phase 6 Plan 1: Intake Queue Foundation Summary

**Migration 016 (6 Phase 6 tables), intakeQueueService with IDOR guards, REST intake queue API, and grantor UI (IntakeQueuePage + IntakeQueueDetailPage) wired into App.tsx with submission auto-routing**

## Performance

- **Duration:** 20 min
- **Started:** 2026-08-02T14:56:10Z
- **Completed:** 2026-08-02T15:16:37Z
- **Tasks:** 2 completed
- **Files modified:** 13

## Accomplishments
- Migration 016 creates all 6 Phase 6 tables: intake_queue_entries, intake_dispositions, correction_requests, review_handoffs, notification_records, export_jobs with FK constraints, indexes, and circular FK resolution (disposition_id added via ALTER TABLE after both tables exist)
- submissionService.submit() now auto-creates intake_queue_entries row with status=pending_screening + SUBMISSION_RECEIVED audit event after snapshot INSERT
- Full REST API with IDOR guards: grantor can only see entries for their org's opportunities; non-acceptance dispositions require rationale (RATIONALE_REQUIRED 422); notification fan-out to all applicant org members on disposition
- IntakeQueuePage: sortable/filterable USWDS table with 7 disposition status filters, pagination, 30s React Query refetch
- IntakeQueueDetailPage: Application Summary + Validation + Org Profile cards, disposition form (pending_screening only), immutable disposition history, submission snapshots list
- All 12 integration tests + 7 Playwright e2e tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 016 + intake queue service + routes** - `e0edf2b` (feat)
2. **Task 2: Intake Queue UI + App.tsx wiring** - `4697809` (feat)

## Files Created/Modified

- `src/db/migrations/016_intake_queue_schema.sql` — All 6 Phase 6 tables with indexes and FK constraints
- `src/services/intake/intakeQueueService.ts` — IntakeQueueService class: getQueueEntries, getEntryDetail, applyDisposition, createNotification, getNotifications, markNotificationRead
- `src/routes/intakeQueue.ts` — intakeQueueRouter: 6 endpoints with authenticate + requireRole middleware
- `src/services/workspace/submissionService.ts` — Added intake queue auto-routing after snapshot INSERT
- `src/server.ts` — Registered intakeQueueRouter
- `tests/integration/intakeQueue.test.ts` — 12-test integration suite (all pass)
- `client/src/types/intakeQueue.ts` — DispositionStatus, QueueEntrySummary, QueueListResponse, QueueEntryDetail, Notification types
- `client/src/api/intakeQueueApi.ts` — intakeQueueApi with listEntries, getEntryDetail, applyDisposition, listSnapshots, getNotifications, markRead
- `client/src/pages/grantor/IntakeQueuePage.tsx` — Sortable/filterable queue table
- `client/src/pages/grantor/IntakeQueueDetailPage.tsx` — Full detail view with disposition form
- `client/src/App.tsx` — Replaced placeholder with live IntakeQueuePage + IntakeQueueDetailPage routes
- `client/src/pages/grantor/QAManagementPage.tsx` — Fixed pre-existing unused variable TS error
- `e2e/intakeQueue.spec.ts` — 7 Playwright e2e tests (all pass)

## Decisions Made
- Disposition history is append-only: each POST creates a new intake_dispositions row; no modification of existing rows (T-06-06 repudiation mitigation)
- grantorOrgId server-derived via grantor_roles JOIN (never from request body/params) — consistent with T-02-01 IDOR pattern
- Notification fan-out non-blocking: try/catch around org_roles lookup so disposition still succeeds even if notification insert fails
- Playwright e2e uses single consolidated route handler per test to avoid ordering issues with multiple page.route() calls (Playwright registers routes LIFO, last wins)
- Removed HTML `required` attribute from rationale textarea; JS validation runs in onSubmit handler before API call (browser native validation would intercept form submission preventing onSubmit)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong table name: plan referenced `grantor_memberships`, actual table is `grantor_roles`**
- **Found during:** Task 1 (intakeQueueRouter creation)
- **Issue:** Plan spec said "JOIN grantor_memberships gm ON gm.org_id=go.org_id" but the actual DB table (migration 001) is `grantor_roles` with column `grantor_org_id`
- **Fix:** Updated getGrantorOrgIdForUser() to use `grantor_roles gr JOIN grantor_organizations go ON go.org_id = gr.grantor_org_id WHERE gr.user_id = $1 AND gr.revoked_at IS NULL`
- **Files modified:** src/routes/intakeQueue.ts
- **Verification:** All 12 integration tests pass including grantor role-based access tests
- **Committed in:** e0edf2b

**2. [Rule 1 - Bug] Pre-existing TypeScript error in QAManagementPage.tsx**
- **Found during:** Task 2 (client build)
- **Issue:** `const accessToken = useAuthStore(...)` declared but never read — TS6133 error blocks build
- **Fix:** Changed to `useAuthStore((s) => s.accessToken)` without assignment (already used by apiClient interceptor)
- **Files modified:** client/src/pages/grantor/QAManagementPage.tsx
- **Verification:** `npm run build` succeeds
- **Committed in:** 4697809

**3. [Rule 1 - Bug] Browser native validation intercepted form submission in Playwright tests**
- **Found during:** Task 2 (e2e test execution)
- **Issue:** Rationale textarea had HTML `required` attribute; browser shows native validation UI preventing onSubmit handler from firing, so React error state alert never appeared
- **Fix:** Changed `required` to `aria-required="true"` — accessibility preserved, JS validation handles the error state
- **Files modified:** client/src/pages/grantor/IntakeQueueDetailPage.tsx
- **Verification:** All 7 Playwright tests pass including "disposition form requires rationale" test
- **Committed in:** 4697809

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Known Stubs

- `client/src/App.tsx:70` — Applicant dashboard placeholder (`<div data-testid="applicant-dashboard-placeholder">`) — **Cosmetic**. Plan spec explicitly requested this: "Also add the applicant dashboard placeholder route (placeholder only — full implementation in Plan 03)"

## Issues Encountered

- Playwright e2e required system library installation (`npx playwright install-deps chromium`) before browser tests could run — missing `libnspr4.so` and related dependencies
- Vite dev server process management: needed `setsid` to prevent process group death when spawned from bash subshell
- Playwright route ordering: `page.route()` calls are LIFO (last registered wins), so multiple specific+wildcard routes required consolidation into single handler with URL-based dispatch

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 6 tables created: intake_queue_entries, intake_dispositions, correction_requests, review_handoffs, notification_records, export_jobs
- Disposition lifecycle complete (apply, history, IDOR)
- Notification infrastructure in place (notification_records + createNotification service method)
- Ready for Plan 02: Correction requests (needs entry_id + correction_requests table from this plan)
- Ready for Plan 03: Accepted application routing to review_handoffs (needs accepted disposition + review_handoffs table)

---
*Phase: 06-intake-queue-screening-analytics*
*Completed: 2026-08-02*

## Self-Check: PASSED

Files verified:
- ✅ src/db/migrations/016_intake_queue_schema.sql — exists
- ✅ src/services/intake/intakeQueueService.ts — exists
- ✅ src/routes/intakeQueue.ts — exists
- ✅ tests/integration/intakeQueue.test.ts — exists (12 tests, all pass)
- ✅ client/src/types/intakeQueue.ts — exists
- ✅ client/src/api/intakeQueueApi.ts — exists
- ✅ client/src/pages/grantor/IntakeQueuePage.tsx — exists
- ✅ client/src/pages/grantor/IntakeQueueDetailPage.tsx — exists
- ✅ e2e/intakeQueue.spec.ts — exists (7 tests, all pass)

Commits verified:
- ✅ e0edf2b — Task 1 (migration, service, routes, tests)
- ✅ 4697809 — Task 2 (UI pages, types, API client, e2e)

Build check: `npm run build` (client) → exit 0 ✅
Integration tests: `npx vitest run tests/integration/intakeQueue.test.ts` → 12/12 pass ✅
E2e tests: `npx playwright test e2e/intakeQueue.spec.ts` → 7/7 pass ✅
