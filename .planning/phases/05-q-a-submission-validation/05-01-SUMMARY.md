---
phase: 05-q-a-submission-validation
plan: 01
subsystem: qa
tags: [qa, notifications, audit, uswds, react-query, zod, postgres]

requires:
  - phase: 04-application-workspace-form-capture
    provides: application_workspaces table, workspace routes, OpportunityDetailPage, App.tsx routing
  - phase: 02-eligibility-intake-rules-configuration
    provides: addenda schema (migration 009), addendaService, publicOpportunitiesRouter
provides:
  - qa_items table for Q&A questions and answers
  - certifications table for authorized representative certification records
  - submission_snapshots table with immutability triggers
  - qaService (listPublished, listAll, submitQuestion, publishAnswer, getAuditHistory)
  - notificationService (notifyWorkspacesOfQAUpdate, notifyWorkspacesOfAddendum, notifyWorkspacesOfDeadlineChange)
  - qaRouter mounted at /api/v1 with 5 endpoints
  - QASubmitPage at /applicant/opportunities/:id/qa
  - QAManagementPage at /grantor/opportunities/:id/qa
  - Q&A section on OpportunityDetailPage with published items and Submit link
affects: [06-notification-delivery, 05-02-validation-submission]

tech-stack:
  added: []
  patterns: [notification-via-audit-events, qa-window-enforcement-via-qa_config-jsonb]

key-files:
  created:
    - src/db/migrations/015_qa_certifications_submissions_schema.sql
    - src/services/opportunity/qaService.ts
    - src/services/opportunity/notificationService.ts
    - src/routes/qa.ts
    - tests/integration/qa.test.ts
    - client/src/types/qa.ts
    - client/src/api/qaApi.ts
    - client/src/pages/applicant/QASubmitPage.tsx
    - client/src/pages/grantor/QAManagementPage.tsx
    - e2e/qa.spec.ts
  modified:
    - src/server.ts
    - client/src/App.tsx
    - client/src/pages/applicant/OpportunityDetailPage.tsx

key-decisions:
  - "audit_events column is 'payload' (not 'metadata') — aligned to existing schema from Phase 1"
  - "organizations table uses legal_name/entity_type columns — matched existing schema for test data setup"
  - "org_roles uses roles JSONB column (not singular 'role') — matched existing schema"
  - "Notification stored as NOTIFICATION_SENT audit_event with console.log email simulation for dev — Phase 6 adds real email delivery"
  - "Q&A window enforcement via opportunity.qa_config JSONB — no additional migration needed since qa_config column existed from Phase 1"

patterns-established:
  - "Notification via audit_events: NOTIFICATION_SENT events per workspace with payload containing notification_type, IDs, and workspace_link"
  - "Q&A window enforcement: qa_config JSONB on opportunities with enabled, question_window_open, question_window_close fields"
  - "Grantor Q&A management per-opportunity (not global inbox): /grantor/opportunities/:id/qa"

duration: 13min
completed: 2026-07-31
---

# Phase 5 Plan 1: Q&A, Notifications, and Phase 5 Schema Summary

**Migration 015 with qa_items/certifications/submission_snapshots (immutability-triggered), Q&A backend service with window enforcement, notification service storing audit events, USWDS-styled Q&A pages for applicant submission and grantor answer publishing**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-31T02:09:53Z
- **Completed:** 2026-07-31T02:23:23Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Migration 015 creates all Phase 5 schema: qa_items, certifications, submission_snapshots with DB-level immutability triggers
- Full Q&A flow: applicants submit questions (with qa_config window enforcement), grantors publish answers, all actions audited
- Notification service creates NOTIFICATION_SENT audit_events for every applicant workspace on the opportunity
- QASubmitPage and QAManagementPage wired into App.tsx with Q&A section on OpportunityDetailPage
- All STRIDE mitigations implemented: auth guards (T-05-01, T-05-02), IDOR prevention via getOrgIdForUser (T-05-01), Zod validation (T-05-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 015 + Q&A backend service + notification service + qaRouter** - `8848804` (feat)
2. **Task 2: Q&A frontend pages wired into App.tsx and OpportunityDetailPage** - `ce418e0` (feat)

## Files Created/Modified
- `src/db/migrations/015_qa_certifications_submissions_schema.sql` — qa_items, certifications, submission_snapshots DDL with immutability triggers
- `src/services/opportunity/qaService.ts` — Q&A service: listPublished, listAll, submitQuestion, publishAnswer, getAuditHistory
- `src/services/opportunity/notificationService.ts` — Notification service: notifyWorkspacesOfQAUpdate, notifyWorkspacesOfAddendum, notifyWorkspacesOfDeadlineChange
- `src/routes/qa.ts` — 5 REST endpoints with auth/role guards and Zod validation
- `src/server.ts` — qaRouter import and mount at /api/v1
- `tests/integration/qa.test.ts` — 10 integration tests covering CRUD, window enforcement, auth, audit
- `client/src/types/qa.ts` — QAItem TypeScript interface
- `client/src/api/qaApi.ts` — Client-side API for Q&A operations
- `client/src/pages/applicant/QASubmitPage.tsx` — Applicant question submission with USWDS styling
- `client/src/pages/grantor/QAManagementPage.tsx` — Grantor Q&A management with filter tabs and answer publishing
- `client/src/pages/applicant/OpportunityDetailPage.tsx` — Added Q&A section with published items and Submit link
- `client/src/App.tsx` — New routes for QASubmitPage and QAManagementPage
- `e2e/qa.spec.ts` — 5 Playwright e2e tests for Q&A navigation and rendering

## Decisions Made
- audit_events column is `payload` (not `metadata`) — aligned to existing schema from Phase 1
- organizations table uses `legal_name`/`entity_type` columns — matched existing schema for test data setup
- org_roles uses `roles` JSONB column (not singular `role`) — matched existing schema
- Notification stored as NOTIFICATION_SENT audit_event with console.log email simulation — Phase 6 adds real email delivery
- Q&A window enforcement via opportunity.qa_config JSONB — no additional migration needed since column existed from Phase 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed audit_events column name: payload not metadata**
- **Found during:** Task 1 (qaService, notificationService, test setup)
- **Issue:** Plan's code used `metadata` column name but actual audit_events table uses `payload`
- **Fix:** Changed all INSERT/SELECT statements to use `payload` instead of `metadata`
- **Files modified:** src/services/opportunity/qaService.ts, src/services/opportunity/notificationService.ts, tests/integration/qa.test.ts
- **Verification:** All 10 integration tests pass
- **Committed in:** 8848804 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed organizations table column names and org_roles schema**
- **Found during:** Task 1 (test setup)
- **Issue:** Plan's test used `org_name`/`org_type`/`status` columns but actual table has `legal_name`/`entity_type` with required address fields; org_roles uses `roles` JSONB not `role` varchar
- **Fix:** Updated test INSERT to use correct column names and provide all required NOT NULL fields
- **Files modified:** tests/integration/qa.test.ts
- **Verification:** All 10 integration tests pass
- **Committed in:** 8848804 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Playwright text locator strictness**
- **Found during:** Task 2 (e2e tests)
- **Issue:** `text=Submit a Question` matched both breadcrumb and heading elements, causing Playwright strict mode violation
- **Fix:** Changed to `page.locator('h1').filter({ hasText: 'Submit a Question' })` for unique targeting
- **Files modified:** e2e/qa.spec.ts
- **Verification:** All 5 e2e tests pass
- **Committed in:** ce418e0 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 × Rule 1 bugs)
**Impact on plan:** All fixes necessary for correctness — aligned code to actual database schema. No scope creep.

## Known Stubs

None found.

## Issues Encountered
None

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Q&A foundation complete, ready for validation engine and submission workflow (Plans 05-02+)
- Notification service in place (audit_event-based) — Phase 6 adds real email delivery
- certifications and submission_snapshots tables ready for Plans implementing F51-F54

## Self-Check: PASSED

- All 10 key files verified present on disk
- Both task commits verified in git history (8848804, ce418e0)
- Backend TypeScript check passed (npx tsc --noEmit → exit 0)
- Client build passed (npm run build --prefix client → exit 0)
- No blocking stubs found
- Known Stubs section present: "None found"

---
*Phase: 05-q-a-submission-validation*
*Completed: 2026-07-31*
