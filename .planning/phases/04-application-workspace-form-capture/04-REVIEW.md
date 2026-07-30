---
phase: 4
status: issues_found
blockers: 2
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
reviewed_at: 2026-07-30T15:25:56Z
iteration: 3
---

# Phase 4 Code Review — Gap Closure Iteration (Plans 04-10 + 04-11)

## BLOCKERs

### B1: Three pre-existing `formFields.spec.ts` tests navigate directly to `/applicant/applications` without login and will always redirect to `/login` in a clean browser context
- **File:** `e2e/formFields.spec.ts`:26, 49, 74
- **Category:** bug (test reliability / false-pass by unconditional skip)
- **Evidence:**
  Tests `'text field triggers onBlur save'` (line 23), `'required field shows error message when left blank'` (line 47), and the newly added `'blurring a text field shows Saving… indicator'` (line 67) all call `page.goto('/applicant/applications')` after either no login at all (lines 26, 49) or a `page.goto('/login')` sequence followed by a second full-reload `page.goto('/applicant/applications')` (line 74).

  `ApplicantLayout` auth-guards every `/applicant/*` route with `if (!accessToken) return <Navigate to="/login" replace />` where `accessToken` lives **only in Zustand in-memory state** (confirmed `authStore.ts:14` — no persistence). A `page.goto(...)` triggers a full browser navigation which destroys the current JS heap, zeroing the Zustand store. After the full reload the `accessToken` is `null` and the guard fires, redirecting to `/login`.

  For the **new** auto-save indicator test (line 67): the user _does_ log in (line 68-72) and then waits for `**/applicant/**`, but then calls `page.goto('/applicant/applications')` at line 74 which causes a new full-page reload that clears the token. The `ApplicantLayout` guard redirects to `/login`. The `/login` page has no `[data-testid="workspace-card"]`, so `cards.count()` returns 0, the test hits `test.skip(true, 'No workspaces seeded…')` at line 79, and the **entire Saving… / Saved ✓ assertion block (lines 83–109) is never reached**. The plan 04-11 goal — verifying the auto-save indicator — is never actually tested.

  For lines 26 and 49: no login attempt at all — same redirect-to-login outcome.

  This is a BLOCKER because the primary UAT deliverable of plan 04-11 (auto-save visual feedback) is verified by a test that silently skips instead of asserting.
- **Fix direction:** Replace the `page.goto('/applicant/applications')` calls with the `history.pushState` + `PopStateEvent` in-SPA navigation pattern already applied in `workspace-layout-fixes.spec.ts` (lines 43-46 of that file). The login sequence must precede the SPA navigation. Apply the same fix to all three affected tests in `formFields.spec.ts`.

**Resolution:** fixed (91cac16) — Added login sequence to the two tests that previously had none, then replaced every `page.goto('/applicant/applications')` call with the `history.pushState` + `PopStateEvent` SPA-navigation pattern. All four tests now preserve the in-memory Zustand token and will reach their assertion blocks. `tsc --noEmit` clean.

---

### B2: `Saved ✓` indicator persists indefinitely after the first successful save — never clears between field blurs
- **File:** `client/src/components/workspace/SectionFormPanel.tsx`:102-110
- **Category:** bug (incorrect UI state — misleading persistent indicator)
- **Evidence:**
  TanStack Query v5 mutation state (`"@tanstack/react-query": "^5.101.4"` confirmed in `client/package.json:14`) keeps `isSuccess === true` after a mutation completes and **never resets it automatically**. The only reset vectors are: (a) calling `saveMutation.reset()`, (b) calling `saveMutation.mutate()` again (which transitions to `isPending=true` first), or (c) component unmount/remount. No `saveMutation.reset()` call exists anywhere in `SectionFormPanel.tsx` (confirmed by full file read and grep).

  Concrete sequence:
  1. User blurs field A → `saveMutation.mutate()` → `isPending=true` → "Saving…" shown.
  2. Mutation resolves → `isSuccess=true`, `isPending=false` → "Saved ✓" shown. **Correct.**
  3. User types in field B (no blur yet) → `isSuccess` remains `true` → "Saved ✓" still shown. **Misleading — field B is not yet saved.**
  4. User blurs field B → `saveMutation.mutate()` again → during the new in-flight window `isPending=true` so "Saving…" is shown, "Saved ✓" hidden. **Correct briefly.**
  5. After field B resolves → "Saved ✓" shown again. **Correct.**

  The problem is step 3: "Saved ✓" remains visible while the user is actively editing a different field whose changes have not been saved. This violates the PRD-INTAKE-038 intent of showing feedback "after save completes" (implying transient feedback, not a sticky banner). The `!saveMutation.isPending` guard on line 102 only hides the "Saved ✓" during an active save, but does not clear it between user interactions.

  Additionally, the `onSuccess` callback at line 54 calls `refetch()` which causes a query invalidation re-render. After the refetch, `isSuccess` stays `true` because TanStack Query v5 does not auto-reset mutation state on query refetch.
- **Fix direction:** Add a `useEffect` that calls `saveMutation.reset()` after a short delay (e.g., 2000 ms) once `saveMutation.isSuccess` becomes true, clearing the indicator back to neutral state. A `setTimeout` inside `onSuccess` calling `saveMutation.reset()` is the simplest approach.

**Resolution:** fixed (66e13bc) — Added `setTimeout(() => saveMutation.reset(), 2000)` inside the `onSuccess` handler of `saveMutation` in `SectionFormPanel.tsx`. "Saved ✓" now auto-clears 2 s after each successful save, returning to neutral state before the user reaches a new field. `tsc --noEmit` clean.

---

## WARNINGs

### W1 (carried from iteration 2 — unchanged): E2E test "preview page does not contain internal comments" runs without authentication — always skips in CI
- **File:** `e2e/workspacePreview.spec.ts`:30-46
- **Evidence:** Test navigates directly to `/applicant/applications` without login. `ApplicantLayout` redirects to `/login`; no workspace cards found; `test.skip` unconditionally fires. Not in this iteration's change set — flagged as pre-existing.

---

### W2 (carried from iteration 2 — now RESOLVED by plan 04-10): USWDS inner grid columns summing to 9 of 12
- **Status: RESOLVED.** `WorkspacePage.tsx` lines 116, 123, 132 now correctly use `grid-col-3 + grid-col-6 + grid-col-3 = 12`. W2 is closed.

---

### W3 (carried from iteration 2): `BudgetBuilder` "Add Line Item" button disappears with no cancel affordance when accordion collapses while add-form is open
- **File:** `client/src/components/workspace/BudgetBuilder.tsx`:258-276
- **Evidence:** Not touched in plans 04-10 or 04-11 — pre-existing defect, unchanged.

---

### W4: `LoginPage.tsx` JSDoc comment still says "redirects to /grantor/dashboard" after the routing change
- **File:** `client/src/pages/auth/LoginPage.tsx`:7
- **Evidence:**
  Line 7 reads `* On success: redirects to /grantor/dashboard.` The actual logic at line 26 routes non-grantor users to `/applicant/applications` and only grantor admins to `/grantor/dashboard`. The stale comment misleads anyone reading the contract.
- **Fix direction:** Update the JSDoc to: `On success: grantor_admin → /grantor/dashboard; applicants → /applicant/applications.`

---

### W5: `history.pushState` + `PopStateEvent` SPA-navigation workaround does not reliably trigger React Router's URL update in all Chromium builds
- **File:** `e2e/workspace-layout-fixes.spec.ts`:24-27, 43-46, 89-92
- **Category:** bug (test reliability)
- **Evidence:**
  React Router v6 (`BrowserRouter`) listens to the `popstate` event on `window`, but the listener is registered by the internal `@remix-run/router` which wraps the native history API. Firing a raw `new PopStateEvent('popstate')` bypasses the router's own history wrapper — the event does reach the `window` listener, so React Router _does_ pick it up in most cases. However, the `pushState` call changes the browser's location but the router's internal `state` object (the second arg `{}`) does not carry the router-managed location state. In Chromium's Playwright implementation, `page.evaluate` runs synchronously and the `popstate` event dispatch is also synchronous, but React's state update is asynchronous (scheduled microtask/batched render). The test then immediately calls `await expect(page).toHaveURL(...)` without awaiting a React re-render.

  The `{ timeout: 5000 }` on the first test (line 28) gives React time to respond, making that test resilient. However, in the second and third tests (lines 47, 93), `await expect(page).toHaveURL(/applicant\/applications/)` has **no explicit timeout** — it falls back to the Playwright config default of `5000 ms` (playwright.config.ts line 8). With `fullyParallel: false` and `workers: 1` this is likely fine in practice, but the workaround is fragile: it depends on the `popstate` event reliably triggering React Router's internal history listener, which is an implementation detail of `@remix-run/router` not covered by Playwright's navigation primitives. If React Router changes its event subscription strategy (e.g., in a future v6 patch), these tests will silently fail or race.

  The more robust alternative — using Playwright's `storageState` / cookie-based auth persisted in `playwright.config.ts` — would make `page.goto` safe and eliminate the workaround entirely. The current approach is functional but brittle.
- **Fix direction:** This is a WARNING rather than a BLOCKER because the tests do pass today (as documented in the 04-10-SUMMARY.md). The long-term fix is to use Playwright's `storageState` with a persistent session cookie (the httpOnly refresh cookie IS written to browser storage and survives page reloads — only the in-memory Zustand token is lost). Alternatively, implement `localStorage`/`sessionStorage` persistence in `authStore.ts` behind an explicit test flag.

---

## Cross-file seams checked

- `LoginPage.tsx:26` `navigate('/applicant/applications')` ↔ `App.tsx:56` `<Route path="applications" element={<WorkspaceListPage />} />` — route registered, **OK**
- `App.tsx:52` `<Navigate to="/applicant/applications" replace />` on index ↔ same `applications` route — **OK**
- `WorkspacePage.tsx` `grid-col-3 + grid-col-6 + grid-col-3` — USWDS grid sum = 12, fills `desktop:grid-col-9` parent — **OK**
- `ApplicantLayout.tsx:85` `<main>` className — `usa-prose` absent, confirmed no output from grep — **OK**
- `WorkspaceSectionPanel.tsx:63` root `<div>` — `usa-prose` absent, confirmed no output from grep — **OK**
- `WorkspacePage.tsx` still uses `usa-prose` at lines 42, 88, 127 for loading state / page header / empty-state divs — these are targeted, non-layout wrappers; not double-nested with layout since `ApplicantLayout` no longer carries `usa-prose` on `<main>` — **OK**
- `SectionFormPanel.tsx:97` `saveMutation.isPending` → renders `[data-testid="save-status-saving"]` ↔ `formFields.spec.ts:104` asserts `[data-testid="save-status-saving"]` visibility — structural match, **OK** (test reliability is a separate issue, see B1)
- `SectionFormPanel.tsx:102` `saveMutation.isSuccess && !saveMutation.isPending` → renders `[data-testid="save-status-saved"]` ↔ `formFields.spec.ts:108` asserts `[data-testid="save-status-saved"]` — structural match, **OK** (persistent indicator is a separate issue, see B2)
- `e2e/workspace-layout-fixes.spec.ts:50` `waitForSelector('[data-testid="workspace-list"]')` ↔ `WorkspaceListPage.tsx:40,47` both branches emit `data-testid="workspace-list"` (empty-state div at line 40, card-group div at line 47) — **OK**
- `useAuth.ts:32-36` `login()` returns `response.data` (shape `{ user: { roles: string[] }, access_token, refresh_token }`) ↔ `LoginPage.tsx:25` reads `result.user?.roles?.includes('grantor_admin')` — type matches `AuthResponse.user.roles: string[]` — **OK**
- `authStore.ts` — in-memory only, no persistence — explains why `page.goto()` after login clears the token; root cause of B1 and W5 — **documented**
