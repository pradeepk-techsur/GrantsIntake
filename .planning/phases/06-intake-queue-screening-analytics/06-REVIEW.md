---
phase: 6
status: fixed
blockers: 1
warnings: 2
files_reviewed: 4
files_reviewed_list:
  - client/src/pages/applicant/NotificationsPage.tsx
  - client/src/components/nav/ApplicantSidebar.tsx
  - client/src/App.tsx
  - e2e/notifications.spec.ts
reviewed_at: 2026-08-02T17:57:43Z
iteration: 1
---

# Phase 6 Code Review

## BLOCKERs

### B1: `markReadCalled` flag set but never asserted — test 4 cannot verify the markRead API was called
- **File:** `e2e/notifications.spec.ts:126–160`
- **Category:** bug
- **Evidence:**
  ```ts
  let markReadCalled = false;
  // ... route handler sets markReadCalled = true on PUT ...
  await markReadBtn.click();
  await page.waitForTimeout(500);
  // ← No assertion on markReadCalled exists anywhere in the test body
  const errorAlert = page.locator('.usa-alert--error');
  await expect(errorAlert).not.toBeVisible();
  ```
  The test is named `"mark as read button calls markRead API"` and the plan explicitly requires verifying the PUT was made. However the `markReadCalled` boolean is set but the test only checks that no error alert appeared. That assertion would pass even if the button click did nothing — e.g., if the Axios request was silently swallowed or the route handler was never entered. The test provides zero signal that `intakeQueueApi.markRead` was actually invoked. A passing test here gives false confidence that the mark-read flow works end-to-end.
- **Fix direction:** Add `expect(markReadCalled).toBe(true)` after `page.waitForTimeout(500)`, or replace the flag with `page.waitForRequest(r => r.method() === 'PUT' && r.url().includes('/read'))` before clicking to guarantee the network call occurs.

**Resolution:** fixed (1632243) — added `expect(markReadCalled).toBe(true)` after `page.waitForTimeout(500)` in test 4; all 4 e2e tests pass.

---

## WARNINGs

### W1: `getNotifications` return type is untyped — `data?.data` is `unknown`, causing the shape guard cast to be unchecked
- **File:** `client/src/pages/applicant/NotificationsPage.tsx:31–36`
- **Category:** bug
- **Evidence:**
  ```ts
  // intakeQueueApi.getNotifications returns apiClient.get('/notifications', { params })
  // apiClient.get has no generic type argument here → AxiosResponse<unknown>
  // Therefore data (the useQuery result) is AxiosResponse<unknown>
  const raw = data?.data;   // raw: unknown
  const notifications: Notification[] = Array.isArray(raw)
    ? raw                   // raw narrowed to unknown[], cast to Notification[] — unsafe
    : Array.isArray((raw as { notifications?: Notification[] })?.notifications)
      ? (raw as { notifications: Notification[] }).notifications
      : [];
  ```
  `apiClient.get('/notifications', ...)` has no `<T>` generic argument, so `data.data` is typed as `unknown`. The cast `(raw as { notifications: Notification[] })` is unchecked; if the API ever returns a field with the wrong shape (e.g., `title` as `null` when the type declares `string`), TypeScript provides no safety net and runtime errors (e.g., `notification.title.length`) would surface only in the browser. This is not a crash today because the backend always returns the correct shape, but it is a latent type-safety gap.
- **Fix direction:** Type the call as `apiClient.get<{ notifications: Notification[]; total: number }>('/notifications', { params })` in `intakeQueueApi.ts`, then access `data.data.notifications` directly without the Array.isArray guard in `NotificationsPage`.

**Resolution:** fixed (22426f4) — added `NotificationsResponse` interface to `types/intakeQueue.ts`, typed `getNotifications` with `apiClient.get<NotificationsResponse>`, replaced unsafe shape-guard cast in `NotificationsPage.tsx` with `data?.data?.notifications ?? []`; `tsc -b` passes.

### W2: `usa-alert--info` empty-state block is missing the required `usa-alert__heading` element (USWDS compliance gap)
- **File:** `client/src/pages/applicant/NotificationsPage.tsx:52–62`
- **Category:** bug
- **Evidence:**
  ```tsx
  <div className="usa-alert usa-alert--info" role="status" data-testid="notifications-empty">
    <div className="usa-alert__body">
      <p className="usa-alert__text">You have no notifications yet.</p>
    </div>
  </div>
  ```
  USWDS `usa-alert` components require a heading element (`<h4 className="usa-alert__heading">`) inside `usa-alert__body` for correct visual hierarchy and screen-reader announcement. All other `usa-alert--info` blocks elsewhere in the codebase (e.g., `OpportunitiesIndex.tsx:75–81`, `QAManagementPage.tsx:103–108`) include `usa-alert__heading`. The `usa-alert--error` block on line 44 also omits the heading, though the same pattern appears in `IntakeQueueDetailPage.tsx:115–117` and may be an established repo exception for error alerts. The missing heading on the info alert is the more visible deviation since it is the primary informational state for applicants with no notifications.
- **Fix direction:** Add `<h4 className="usa-alert__heading">No notifications</h4>` (or equivalent) immediately before the `<p className="usa-alert__text">` line inside `usa-alert__body`, matching the pattern used in `OpportunitiesIndex.tsx`.

**Resolution:** fixed (ce12aa0) — added `<h4 className="usa-alert__heading">No notifications</h4>` before the `<p>` text inside the `usa-alert__body`, matching the codebase pattern; `tsc -b` passes.

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `ApplicantSidebar.tsx` → `NavLink to="/applicant/notifications"` → `App.tsx` `Route path="notifications"` | OK — path matches, route is inside `/applicant` parent |
| `NotificationsPage.tsx` → `intakeQueueApi.getNotifications()` → `apiClient.get('/notifications')` → `intakeQueueRouter.get('/notifications')` mounted at `/api/v1` | OK — full URL resolves to `GET /api/v1/notifications`; authenticate middleware present |
| `NotificationsPage.tsx` → `intakeQueueApi.markRead(id)` → `apiClient.put('/notifications/:id/read')` → `intakeQueueRouter.put('/notifications/:notificationId/read')` | OK — URL template matches; authenticate + ownership guard in service present |
| `Notification` type (`types/intakeQueue.ts`) fields vs fields rendered in `NotificationsPage.tsx` (`notification_id`, `title`, `body`, `created_at`, `is_read`) | OK — all rendered fields are present in the interface |
| `ApplicantLayout` auth guard wraps `/applicant` route block including `/applicant/notifications` | OK — `accessToken` check redirects to `/login` before `NotificationsPage` renders |
| IDOR: `getNotifications` backend scopes WHERE to `recipient_user_id = $1` from JWT | OK — server-derived, not query-param controlled |
| IDOR: `markNotificationRead` scopes UPDATE to `WHERE notification_id=$1 AND recipient_user_id=$2` | OK — ownership enforced server-side |
| XSS: `notification.title` and `notification.body` rendered as React text nodes (not `dangerouslySetInnerHTML`) | OK — JSX string interpolation HTML-escapes output |
| e2e mock response shape matches `{ notifications: Notification[], total: number }` expected by `NotificationsPage` shape guard | OK — mocks return `{ notifications: [...], total: N }` |
| `markReadCalled` assertion in test 4 | **FIXED (B1)** — `expect(markReadCalled).toBe(true)` added after click |
