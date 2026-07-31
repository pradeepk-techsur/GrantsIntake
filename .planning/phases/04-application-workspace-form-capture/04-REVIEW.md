---
phase: 4
status: clean
blockers: 0
warnings: 3
files_reviewed: 8
files_reviewed_list:
  - client/src/pages/auth/LoginPage.tsx
  - client/src/App.tsx
  - client/src/pages/applicant/WorkspacePage.tsx
  - client/src/layouts/ApplicantLayout.tsx
  - client/src/components/workspace/WorkspaceSectionPanel.tsx
  - client/src/components/workspace/SectionFormPanel.tsx
  - e2e/workspace-layout-fixes.spec.ts
  - e2e/formFields.spec.ts
reviewed_at: 2026-07-30T16:00:00Z
iteration: 2
---

# Phase 4 Code Review — Iteration 2 (Fix Verification)

## Fix Verification

### B1 (RESOLVED): `formFields.spec.ts` — `page.goto()` after login destroyed in-memory Zustand token
- **Commit:** `91cac16`
- **Fix applied:** All four tests in `formFields.spec.ts` now use the `history.pushState({}, '', '/applicant/applications')` + `dispatchEvent(new PopStateEvent('popstate'))` SPA-navigation pattern instead of `page.goto()`. The two tests that previously had no login sequence (`'text field triggers onBlur save'` and `'required field shows error message when left blank'`) were also given full `/login` → fill → submit → `waitForURL('**/applicant/**')` sequences before the SPA navigation.
- **Verification:** All four occurrences of `page.goto('/applicant/applications')` are gone (confirmed by full read of `formFields.spec.ts`). The SPA-navigation block is identical in structure to the established pattern in `workspace-layout-fixes.spec.ts`. The `'blurring a text field shows Saving… indicator'` test now reaches its `expect(savingIndicator).toBeVisible()` and `expect(savedIndicator).toBeVisible()` assertions (lines 145, 149) rather than unconditionally skipping. **B1 is closed.**
- **Regression check:** No new `page.goto('/applicant/...')` calls introduced. `tsc --noEmit` clean.

---

### B2 (RESOLVED): `Saved ✓` indicator persisted indefinitely — never cleared between field blurs
- **Commit:** `66e13bc`
- **Fix applied:** `onSuccess` callback in `SectionFormPanel.tsx` (line 59) now calls `setTimeout(() => saveMutation.reset(), 2000)` immediately after `refetch()`. This resets TanStack Query v5 mutation state (`isSuccess` → `false`) 2 s after display, returning the indicator to neutral state before the user can reach a subsequent field.
- **Verification:** `saveMutation.reset()` call confirmed at line 59. The `isSuccess && !isPending` render guard at line 108 will correctly hide the `[data-testid="save-status-saved"]` span once `reset()` fires. **B2 is closed.**
- **Regression check (stale closure):** `setTimeout` captures the `saveMutation` reference from the render cycle in which `onSuccess` ran. In TanStack Query v5, `useMutation` returns an object whose `reset()` method is bound to the mutation's internal `MutationObserver`; it does not call React `setState` directly. If the component unmounts within the 2 s window the timer will still fire, calling `reset()` on a now-detached observer. TQ v5 handles detached-observer calls gracefully (no DOM write, no React warning). This is the standard TQ v5 pattern — **not a regression**.

---

## BLOCKERs

None.

---

## WARNINGs

The following warnings are unchanged from iteration 1; none were touched by the B1/B2 fixes.

### W1: E2E test `"preview page does not contain internal comments"` runs without authentication — always skips in CI
- **File:** `e2e/workspacePreview.spec.ts`:30-46
- **Evidence:** Test navigates directly to `/applicant/applications` without login. `ApplicantLayout` redirects to `/login`; no workspace cards found; `test.skip` unconditionally fires. Pre-existing defect, not in this phase's change set.

---

### W2: `LoginPage.tsx` JSDoc comment still says `"redirects to /grantor/dashboard"` after the routing change
- **File:** `client/src/pages/auth/LoginPage.tsx`:7
- **Evidence:** Line 7 reads `* On success: redirects to /grantor/dashboard.` The actual logic routes non-grantor users to `/applicant/applications` and only grantor admins to `/grantor/dashboard`. The stale comment misleads anyone reading the contract.
- **Fix direction:** Update to: `On success: grantor_admin → /grantor/dashboard; applicants → /applicant/applications.`

---

### W3: `history.pushState` + `PopStateEvent` SPA-navigation workaround is an implementation-detail dependency on `@remix-run/router`
- **File:** `e2e/workspace-layout-fixes.spec.ts`:24-27, 43-46, 89-92; `e2e/formFields.spec.ts`:13-16, 41-44, 76-79, 109-112
- **Evidence:** React Router v6 `BrowserRouter` listens to `popstate` on `window` via its internal `@remix-run/router` wrapper. Firing a raw `new PopStateEvent('popstate')` reaches that listener today, but the pattern depends on an undocumented implementation detail. A future `@remix-run/router` patch that changes its event subscription strategy could silently break all eight SPA-navigation blocks. The long-term robust alternative is Playwright `storageState` with a persistent session cookie (the httpOnly refresh cookie survives page reloads; only the in-memory Zustand token is lost).

---

## Cross-file seams checked

- `LoginPage.tsx:26` `navigate('/applicant/applications')` ↔ `App.tsx:56` `<Route path="applications" ...>` — route registered, **OK**
- `App.tsx:52` `<Navigate to="/applicant/applications" replace />` on index ↔ same `applications` route — **OK**
- `WorkspacePage.tsx` `grid-col-3 + grid-col-6 + grid-col-3` — USWDS grid sum = 12 — **OK**
- `ApplicantLayout.tsx:85` `<main>` — `usa-prose` absent (confirmed) — **OK**
- `WorkspaceSectionPanel.tsx:63` root `<div>` — `usa-prose` absent (confirmed) — **OK**
- `SectionFormPanel.tsx:103` `[data-testid="save-status-saving"]` ↔ `formFields.spec.ts:144` — structural match, **OK**
- `SectionFormPanel.tsx:108` `[data-testid="save-status-saved"]` ↔ `formFields.spec.ts:148` — structural match, **OK**
- `saveMutation.reset()` at line 59 — only call-site; no double-reset risk — **OK**
- `formFields.spec.ts` — all four `page.goto('/applicant/applications')` calls replaced; no remnants — **OK**
