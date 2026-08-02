---
phase: 6
status: clean
blockers: 0
warnings: 0
files_reviewed: 6
files_reviewed_list:
  - client/src/pages/applicant/NotificationsPage.tsx
  - client/src/components/nav/ApplicantSidebar.tsx
  - client/src/App.tsx
  - e2e/notifications.spec.ts
  - client/src/api/intakeQueueApi.ts
  - client/src/types/intakeQueue.ts
reviewed_at: 2026-08-02T18:45:00Z
iteration: 2
---

# Phase 6 Code Review

## BLOCKERs

_None._

## WARNINGs

_None._

---

## Previous findings — resolution verification

### B1 (resolved): `markReadCalled` flag set but never asserted
- **Fix commit:** `1632243`
- **Verification:** `e2e/notifications.spec.ts:158–159` — `expect(markReadCalled).toBe(true)` is now present immediately after `page.waitForTimeout(500)`, before the error-alert check. The route handler at line 129–146 intercepts `**/api/v1/notifications**`; because Playwright's `**` wildcard matches path separators, the PUT to `/api/v1/notifications/notif-001/read` is caught, the `method === 'PUT' && url.includes('/read')` guard on line 132 fires, and `markReadCalled` is set to `true`. The assertion is therefore live and meaningful. **Fix confirmed.**

### W1 (resolved): `getNotifications` return type untyped
- **Fix commits:** `22426f4` (api + page), `1632243` (types)
- **Verification:** `client/src/types/intakeQueue.ts:70–73` — `NotificationsResponse` interface (`{ notifications: Notification[]; total: number }`) added. `client/src/api/intakeQueueApi.ts:30` — call is now `apiClient.get<NotificationsResponse>(...)`, giving `AxiosResponse<NotificationsResponse>` as the return type. `client/src/pages/applicant/NotificationsPage.tsx:31` — access is `data?.data?.notifications ?? []`: `.data` unwraps the `AxiosResponse` wrapper (confirmed by reading `client/src/api/client.ts` — no response interceptor that strips the envelope), `.notifications` accesses the typed field. `npx tsc --noEmit` emits no errors. **Fix confirmed.**

### W2 (resolved): `usa-alert--info` empty-state missing `usa-alert__heading`
- **Fix commit:** `ce12aa0`
- **Verification:** `client/src/pages/applicant/NotificationsPage.tsx:54` — `<h4 className="usa-alert__heading">No notifications</h4>` is present immediately before the `<p className="usa-alert__text">` line inside `usa-alert__body`, matching the USWDS-compliant pattern used in `OpportunitiesIndex.tsx` and `QAManagementPage.tsx`. **Fix confirmed.**

---

## Cross-file seams checked

| Seam | Status |
|---|---|
| `ApplicantSidebar.tsx` → `NavLink to="/applicant/notifications"` → `App.tsx` `Route path="notifications"` | OK — path matches; route is nested inside the `/applicant` parent `ApplicantLayout` auth guard |
| `NotificationsPage.tsx` → `intakeQueueApi.getNotifications()` → `apiClient.get<NotificationsResponse>('/notifications')` | OK — typed end-to-end; `data?.data?.notifications` access chain is correct given `AxiosResponse` wrapper |
| `NotificationsPage.tsx` → `intakeQueueApi.markRead(id)` → `apiClient.put('/notifications/:id/read')` | OK — URL template matches server route; ownership guard present server-side |
| `Notification` type fields vs fields rendered in `NotificationsPage.tsx` | OK — all accessed fields (`notification_id`, `title`, `body`, `created_at`, `is_read`) present in interface |
| `NotificationsResponse` type vs e2e mock shape | OK — mock `MOCK_NOTIFICATIONS_RESPONSE = { notifications: [...], total: 1 }` matches interface exactly |
| `markReadCalled` assertion in test 4 | OK — `expect(markReadCalled).toBe(true)` added; glob pattern `**/api/v1/notifications**` covers the PUT URL |
| `ApplicantLayout` auth guard wraps `/applicant` route block including `/applicant/notifications` | OK — unauthenticated users redirected to `/login` before `NotificationsPage` renders |
| IDOR: `getNotifications` backend scopes to `recipient_user_id` from JWT | OK — server-derived, not query-param controlled |
| XSS: `notification.title` / `notification.body` rendered as React text nodes | OK — JSX string interpolation HTML-escapes output; no `dangerouslySetInnerHTML` |
| TypeScript build (`npx tsc --noEmit`) | OK — zero errors after fixes |
