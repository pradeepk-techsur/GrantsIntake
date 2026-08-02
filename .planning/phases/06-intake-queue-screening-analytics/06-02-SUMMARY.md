---
phase: 06-intake-queue-screening-analytics
plan: 02
subsystem: ui
tags: [notifications, react, uswds, playwright, react-query, applicant-portal]

# Dependency graph
requires:
  - phase: 06-intake-queue-screening-analytics
    provides: notification_records table + GET /notifications + PUT /notifications/:id/read (06-01)
provides:
  - NotificationsPage: USWDS applicant page listing notification records with mark-read support
  - Route /applicant/notifications registered in App.tsx
  - Sidebar link "Notifications" in ApplicantSidebar with data-testid="nav-notifications"
  - Playwright e2e tests: 4 tests covering sidebar link, list render, empty state, mark-read
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useQuery for GET /notifications; useMutation + invalidateQueries for mark-read
    - data?.data?.notifications Array.isArray shape guard (Axios response wrapping)
    - Playwright e2e: single consolidated route handler mocking both GET and PUT on notifications/**

key-files:
  created:
    - client/src/pages/applicant/NotificationsPage.tsx
    - e2e/notifications.spec.ts
  modified:
    - client/src/components/nav/ApplicantSidebar.tsx
    - client/src/App.tsx

key-decisions:
  - "Array.isArray shape guard in NotificationsPage handles both raw array and { notifications: [] } API response shapes"
  - "Single Playwright route handler dispatches on method+URL to handle both GET notifications and PUT mark-read in test 4"

patterns-established:
  - "Notification list pattern: useQuery(['notifications']) + useMutation for markRead + invalidateQueries on success"

# Metrics
duration: 11min
completed: 2026-08-02
---

# Phase 6 Plan 2: Applicant Notifications UI Summary

**NotificationsPage with USWDS styling, mark-read mutation, empty state, and 4 passing Playwright e2e tests — closes UAT Test 7 gap (PRD-INTAKE-062)**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-02T17:40:34Z
- **Completed:** 2026-08-02T17:52:05Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments
- NotificationsPage fetches from GET /api/v1/notifications via intakeQueueApi.getNotifications; renders title, body, timestamp, and mark-read button per notification; shows USWDS empty state when no notifications
- useMutation wraps markRead, invalidates ['notifications'] query on success; unread notifications show border-left-05 unread indicator
- Route /applicant/notifications registered in App.tsx applicant route block
- Notifications sidebar link added to ApplicantSidebar with data-testid="nav-notifications"
- All 4 Playwright tests pass: sidebar visibility, list render with title/body/mark-read, empty state, mark-read button interaction

## Task Commits

Each task was committed atomically:

1. **Task 1: NotificationsPage + route + sidebar link** - `941d59f` (feat)
2. **Task 2: Playwright e2e tests for NotificationsPage** - `7ed1b83` (feat)

3. **Build fix: remove JSX.Element return type** - `229e44a` (fix)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `client/src/pages/applicant/NotificationsPage.tsx` — Applicant notifications list page, USWDS styled
- `client/src/components/nav/ApplicantSidebar.tsx` — Added Notifications NavLink with data-testid="nav-notifications"
- `client/src/App.tsx` — Added NotificationsPage import and Route path="notifications"
- `e2e/notifications.spec.ts` — 4 Playwright e2e tests for notifications page

## Decisions Made
- Array.isArray shape guard: `data?.data` can be a flat array or `{ notifications: [] }` — guard handles both to avoid runtime errors if API shape changes
- Consolidated route handler in Playwright test 4 dispatches on method + URL pattern to mock both GET (return notification list) and PUT (return success) in a single handler — avoids LIFO ordering issues with multiple page.route() calls

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Remove JSX.Element return type annotation (TS2503)**
- **Found during:** Post-task build verification
- **Issue:** `export function NotificationsPage(): JSX.Element` caused TS2503 "Cannot find namespace 'JSX'" — React types not globally available in this project's tsconfig setup (other pages use implicit return types)
- **Fix:** Removed explicit `): JSX.Element` return type annotation to match project convention
- **Files modified:** client/src/pages/applicant/NotificationsPage.tsx
- **Verification:** `npm run build` exits 0 ✅
- **Committed in:** 229e44a

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix required for correct compilation. No scope creep.

## Known Stubs

None found.

## Issues Encountered

- Client node_modules was empty on initial run — `@vitejs/plugin-react` not installed, causing Vite dev server to fail. Fixed by running `npm install --include=dev` in client/. [Rule 3 - Blocking, auto-fixed]
- Database had no tables (empty) — migrations and seed needed before Playwright login tests could work. Ran `npm run migrate` + `npm run seed` to initialize DB. [Blocking environment setup, auto-fixed]

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UAT Test 7 gap closed: applicant can navigate to /applicant/notifications via sidebar and view disposition notifications
- Notification infrastructure complete (backend 06-01 + UI 06-02)
- Ready for next Phase 6 plans (corrections, handoffs, analytics)

---
*Phase: 06-intake-queue-screening-analytics*
*Completed: 2026-08-02*

## Self-Check: PASSED

Files verified:
- ✅ client/src/pages/applicant/NotificationsPage.tsx — exists, exports NotificationsPage
- ✅ client/src/components/nav/ApplicantSidebar.tsx — contains data-testid="nav-notifications"
- ✅ client/src/App.tsx — contains Route path="notifications" element={<NotificationsPage />}
- ✅ e2e/notifications.spec.ts — exists, 4 tests, all pass

Commits verified:
- ✅ 941d59f — Task 1 (NotificationsPage + route + sidebar link)
- ✅ 7ed1b83 — Task 2 (Playwright e2e tests)
- ✅ 229e44a — Fix (remove JSX.Element return type, TS2503)

Build check: `npm run build --prefix client` → exit 0 ✅
Playwright tests: `npx playwright test e2e/notifications.spec.ts` → 4/4 pass ✅
Known stubs: None
