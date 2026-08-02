---
status: diagnosed
phase: 06-intake-queue-screening-analytics
source: [06-01-SUMMARY.md]
started: 2026-08-02T16:10:00Z
updated: 2026-08-02T16:22:00Z
---

## Current Test

[testing complete]



## Tests

### 1. Intake Queue Page Loads
expected: After logging in as admin@example.gov (password TestPassword123!), click "Intake Queue" in the grantor sidebar. The page loads a sortable/filterable USWDS table with disposition status filter buttons (All, Pending Screening, Accepted, Returned for Correction, Ineligible, Withdrawn, and at least one more). With no submitted applications yet, an empty state is shown.
result: pass

### 2. Submit Application — Appears in Queue
expected: As applicant@example.com (TestPass123!), open the workspace for "Community Health Innovation Grant", complete the certification step, and submit the application. Then log back in as admin@example.gov and navigate to Intake Queue — the newly submitted application appears as a row with status "Pending Screening".
result: pass

### 3. Queue Entry Detail View
expected: Click on the submission row in the Intake Queue. The detail page shows: Application Summary card (applicant org, opportunity title, submitted date, confirmation number), Validation Summary card (blocking/warning/info counts), and Org Profile card (org name and type). A disposition form is visible (only for pending_screening entries) with a dropdown for status and a rationale textarea.
result: pass

### 4. Apply Disposition — Accepted
expected: On the IntakeQueueDetailPage for a pending_screening entry, select "Accepted" from the disposition dropdown. Click Submit. The disposition is applied — the entry's status changes to "Accepted" on the detail page. The disposition history section below shows the new "accepted" entry with timestamp, administrator name, and rationale.
result: pass

### 5. Rationale Required for Non-Acceptance
expected: On a pending_screening detail page, select "Returned for Correction" (or "Ineligible") from the disposition dropdown and click Submit WITHOUT entering a rationale. An inline error appears requiring rationale to be entered before submission can proceed. After entering a rationale and submitting, the disposition is applied successfully.
result: skipped

### 6. Disposition History is Immutable (Append-Only)
expected: After applying one or more dispositions to a queue entry, the disposition history section always shows ALL historical dispositions — none are deleted or overwritten. Each row in history shows the status, timestamp, administrator, and rationale. The history grows with each new disposition.
result: skipped

### 7. Notifications Delivered on Disposition
expected: After applying a disposition to a submitted application, log in as applicant@example.com. A notification is visible (either in a notifications section or via the /api/v1/notifications endpoint returning a notification record) indicating the disposition action was applied to their application.
result: issue
reported: "I do not see a notification on the UI"
severity: major

## Summary

total: 7
passed: 4
issues: 1
pending: 0
skipped: 2

## Self-Check

boot: 404 (API server — expected, 3000)
preview-path: 404 (same as direct — no host rejection)
compose: db healthy, redis healthy
e2e: expected=7 unexpected=0 skipped=0 (intakeQueue.spec.ts — green)
routes_probed: GET /api/v1/intake-queue → 401 (correct auth guard); GET /api/v1/notifications → 401 (correct)
nav: /grantor/intake-queue linked in GrantorSidebar.tsx:69 — reachable by navigation
screenshots: .pivota/uat-shots/06-grantor-intake-queue.png, 06-grantor-login.png
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: /grantor/intake-queue screenshot captured (.pivota/uat-shots/06-grantor-intake-queue.png). Sidebar link confirmed present. E2E suite 7/7 green — IntakeQueuePage renders with filter buttons per Playwright test."
  - test: 2
    verdict: skipped (needs human)
    note: "🤖 Auto-check: No submissions exist in the DB yet (seed doesn't include a submitted workspace). Intake queue API returns total=0. You'll need to complete the submission flow as applicant to create a queue entry for tests 2-7. The submission service auto-creates an intake_queue_entries row per the SUMMARY."
  - test: 3
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Requires a live queue entry from test 2 first."
  - test: 4
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Requires a live queue entry. E2E Playwright test covers this flow and passes."
  - test: 5
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Rationale-required validation covered by Playwright e2e test (passes). Requires live queue entry for human verification."
  - test: 6
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Append-only disposition history verified by integration tests (12/12 pass). Requires live queue entries for human observation."
  - test: 7
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/notifications → 401 (auth guard correct). Notification fan-out implemented as non-blocking try/catch in applyDisposition service method. No way to verify delivery without a live disposition being applied."

## Gaps

- truth: "After a disposition is applied to a submitted application, the applicant sees a notification about the disposition action"
  status: failed
  reason: "User reported: I do not see a notification on the UI"
  severity: major
  test: 7
  source: user
  root_cause: "Notification backend is complete (notification_records populated, GET /api/v1/notifications returns the record for the applicant), but no UI component exists to display notifications to the applicant. The Notification type (client/src/types/intakeQueue.ts:58) and API client method (intakeQueueApi.getNotifications, client/src/api/intakeQueueApi.ts:29) were built but no page, panel, or indicator consumes them. ApplicantSidebar and App.tsx have no notifications route or bell icon."
  artifacts:
    - path: "client/src/types/intakeQueue.ts"
      issue: "Notification type defined but unused by any UI component"
    - path: "client/src/api/intakeQueueApi.ts"
      issue: "getNotifications() and markRead() methods exist but not called from any React page"
    - path: "client/src/App.tsx"
      issue: "No /applicant/notifications route registered"
    - path: "client/src/components/nav/ApplicantSidebar.tsx"
      issue: "No notifications link or badge"
  missing:
    - "Applicant NotificationsPage or notification bell component that calls intakeQueueApi.getNotifications and renders the list"
    - "Route in App.tsx: /applicant/notifications → NotificationsPage"
    - "Link in ApplicantSidebar (or header badge) navigating to notifications"
  debug_session: ""
