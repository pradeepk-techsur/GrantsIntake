---
phase: 4
status: issues_found
blockers: 2
warnings: 3
files_reviewed: 7
files_reviewed_list:
  - client/src/pages/applicant/OpportunityDetailPage.tsx
  - client/src/pages/applicant/WorkspacePage.tsx
  - client/src/components/workspace/ReadinessDashboard.tsx
  - e2e/workspacePreview.spec.ts
  - client/src/components/workspace/AttachmentManager.tsx
  - client/src/components/workspace/BudgetBuilder.tsx
  - src/db/seed.ts
reviewed_at: 2026-07-28T03:23:16Z
iteration: 1
---

# Phase 4 Code Review

## BLOCKERs

### B1: `workspace-status` route always returns `"start"` for users with existing workspaces — "Continue Application" CTA is permanently broken

- **File:** `src/routes/publicOpportunities.ts`:214
- **Category:** bug
- **Evidence:**
  ```sql
  SELECT workspace_id FROM application_workspaces
  WHERE opportunity_id = $1 AND applicant_user_id = $2
  ```
  The column `applicant_user_id` does not exist on the `application_workspaces` table. The schema (`src/db/migrations/012_workspace_schema.sql`) defines the table with columns `workspace_id`, `opportunity_id`, `org_id`, `track_id`, `status`, `visibility`, `is_locked`, `created_by`, `created_at`, `updated_at` — there is no `applicant_user_id`. PostgreSQL will throw `ERROR: column "applicant_user_id" does not exist` every time this query runs.

  The surrounding code catches all errors silently and falls through to `res.json({ status: 'start' })`:
  ```ts
  } catch {
    // Table may not exist yet (Phase 3) — fall through to 'start'
  }
  res.json({ status: 'start' });
  ```
  This means every authenticated user with an existing workspace for an opportunity will see "Start Application" instead of "Continue Application". Clicking "Start Application" then hits the 409 DUPLICATE_WORKSPACE error, which (see B2) also silently fails. The user is stuck — they cannot navigate to their existing workspace from the opportunity detail page.

  The integration test at `tests/integration/publicOpportunities.test.ts:324` passes because it only asserts `res.status === 200` and `['start', 'continue', 'closed'].includes(res.body.status)` — `'start'` satisfies both conditions even though the correct answer would be `'continue'`.

- **Fix direction:** Replace `applicant_user_id` with a join through `org_roles` to find the user's `org_id`, then match on `org_id`. Mirror the pattern used in `workspaceService.listWorkspacesForOrg` which joins `org_roles` to derive `org_id` from `userId`. The correct query is:
  ```sql
  SELECT aw.workspace_id FROM application_workspaces aw
  JOIN org_roles orr ON orr.org_id = aw.org_id
  WHERE aw.opportunity_id = $1
    AND orr.user_id = $2
    AND orr.revoked_at IS NULL
  LIMIT 1
  ```

---

### B2: 409 `DUPLICATE_WORKSPACE` response body omits `workspace_id` — silent no-op instead of navigation to existing workspace

- **File:** `client/src/pages/applicant/OpportunityDetailPage.tsx`:129-132 and `src/routes/workspaces.ts`:115-117
- **Category:** integration
- **Evidence:**
  The frontend `onError` handler expects the 409 response body to include a `workspace_id` field:
  ```ts
  const anyErr = err as { response?: { data?: { error_code?: string; workspace_id?: string } } };
  if (anyErr?.response?.data?.error_code === 'DUPLICATE_WORKSPACE' && anyErr?.response?.data?.workspace_id) {
    navigate(`/applicant/workspaces/${anyErr.response.data.workspace_id}`);
  }
  ```
  The backend route sends the error via `sendError`:
  ```ts
  // src/routes/workspaces.ts:68
  function sendError(res: Response, status: number, error: string, message?: string) {
    res.status(status).json({ error, message });
  }
  // ...
  return sendError(res, 409, 'DUPLICATE_WORKSPACE', 'A workspace already exists...');
  ```
  The 409 response body is `{ "error": "DUPLICATE_WORKSPACE", "message": "..." }` — no `workspace_id` field at all. Additionally, the service layer (`src/services/workspace/workspaceService.ts:67-70`) throws a bare `Error` with no `workspace_id` property attached — the route has no way to include a workspace ID even if it wanted to.

  Consequence: `anyErr?.response?.data?.workspace_id` is always `undefined`, the `if` condition is false, and the `onError` callback exits without navigating. The user clicks "Start Application", gets a silent no-op (no feedback, no navigation), and cannot reach their existing workspace. This condition is compounded by B1 (workspace-status never returns `'continue'`), so B2 is the second line of defense that also fails.

- **Fix direction:** (1) In `workspaceService.createWorkspace`, when catching the `23505` unique violation, look up the existing workspace ID via a SELECT and attach it to the error object. (2) In the route handler, include `workspace_id` in the 409 JSON response: `res.status(409).json({ error: 'DUPLICATE_WORKSPACE', workspace_id: e.workspace_id })`. Alternatively, the `onError` handler could call the `workspace-status` endpoint to discover the existing ID, but fixing the backend response is cleaner.

---

## WARNINGs

### W1: E2E test "preview page does not contain internal comments" runs without authentication — always skips or tests unauthenticated redirect page

- **File:** `e2e/workspacePreview.spec.ts`:30-46
- **Evidence:**
  The test navigates directly to `/applicant/applications` at line 31 without calling the login flow. `ApplicantLayout` auth-guards this route and redirects unauthenticated users to `/login`. The resulting `/login` page contains no `[data-testid="workspace-card"]` elements, so `cards.count()` returns 0 and the test hits `test.skip(true, ...)` every time. The test never actually verifies that internal comments are absent from the preview page — it unconditionally skips in any realistic CI environment. The first test (`'preview page shows DRAFT PREVIEW banner'`) and third test (`'preview application link in workspace page navigates to preview'`) correctly perform a login sequence before navigating.

- **Fix direction:** Add the same login sequence (lines 4-8 of the first test) at the beginning of this test before navigating to `/applicant/applications`.

---

### W2: USWDS inner grid columns sum to 9 of 12 — 3 columns are permanently unused in the workspace three-column layout

- **File:** `client/src/pages/applicant/WorkspacePage.tsx`:115-134
- **Evidence:**
  The `grid-row` at line 115 is a child of the `desktop:grid-col-9` main content area rendered by `ApplicantLayout`. In USWDS, a nested `grid-row` creates a new full 12-column grid context — children should sum to 12 to fill the container. The fix changes `grid-col-3+grid-col-6+grid-col-3=12` to `grid-col-2+grid-col-5+grid-col-2=9`, leaving 3 out of 12 inner columns empty (a 25% width gap at the right edge of the workspace layout). While the plan claims the original 3+6+3=12 caused visual overlap, the USWDS grid inside a parent `desktop:grid-col-9` should not overflow if column widths are percentage-based — the previous 12-column sum was actually correct USWDS usage. The result of the fix is that the workspace uses only ~75% of available horizontal space, making the content panel narrower than necessary.

  I cannot definitively confirm the visual behaviour without running the app, and the plan describes the prior layout as causing "visual overlap," so I am flagging this as a WARNING rather than a BLOCKER. If the layout issue was real, the root cause may be the `usa-prose` `max-width` constraint on the `<main>` element rather than column overflow.

- **Fix direction:** Revert to `grid-col-3+grid-col-6+grid-col-3` (or `grid-col-2+grid-col-7+grid-col-3`) to fill 12 columns. If the `usa-prose` max-width on `<main>` was causing overflow, the fix belongs there (remove `usa-prose` from the layout element, or move it to specific section panels) rather than reducing inner column counts.

---

### W3: `BudgetBuilder` "Add Line Item" button disappears when accordion is collapsed while add-form is open, with no visible cancel affordance

- **File:** `client/src/components/workspace/BudgetBuilder.tsx`:258-273, 276, 334
- **Evidence:**
  The "Add Line Item" button renders when `{!isAdding}` (line 258). The add form renders inside `{isExpanded && (...)}` (line 276) when `isAdding` is true. If a user:
  1. Clicks the add button → `addingCategory` is set, accordion expands, form appears ✓
  2. Clicks the accordion header to collapse it → `isExpanded` becomes false
  3. The add form is hidden (correct), BUT the "Add Line Item" button is also hidden (`isAdding` is still true) — the accordion header is now the only interactive element visible for this category, and clicking it re-expands without warning the user that partially entered data is waiting
  
  The user's only recovery path is to expand the accordion again, then click "Cancel" inside the hidden form. The `formState` is preserved across the collapse (no data loss), but discoverability is poor: the "Add" button being hidden while the form is invisible is confusing. This is a real UX defect introduced by the 04-08 fix.

- **Fix direction:** When the accordion is collapsed (`toggleCategory` calls `next.delete(cat)`) and `addingCategory === category`, also call `setAddingCategory(null)` and `setFormState(emptyForm)` to cleanly abort the in-progress add. Alternatively, always render a minimal cancel affordance outside the `{isExpanded}` gate when `isAdding` is true.

---

## Cross-file seams checked

- `workspaceApi.createWorkspace` → `POST /api/v1/workspaces` → route OK; response shape `{ workspace, sections }` matches client expectation → **OK**
- `OpportunityDetailPage` 409 `DUPLICATE_WORKSPACE` handler reads `response.data.workspace_id` ↔ backend `sendError` emits `{ error, message }` (no `workspace_id`) → **BLOCKER B2**
- `WorkspacePage` preview link `to="/applicant/workspaces/${workspaceId}/preview"` ↔ `ReadinessDashboard` same path ↔ `WorkspacePreviewPage` registered at that route → **OK**
- `data-testid="preview-application-link"` in `WorkspacePage.tsx:106` ↔ E2E locator `[data-testid="preview-application-link"]` at `workspacePreview.spec.ts:68` → **OK**
- `data-testid="draft-preview-banner"` in `WorkspacePreviewPage.tsx:50` ↔ E2E assertion at `workspacePreview.spec.ts:21` → **OK**
- `workspace-status` route queries `applicant_user_id` ↔ `application_workspaces` schema has no `applicant_user_id` column → **BLOCKER B1**
- `form_field_definitions` seed uses `uatOpportunityId` (FK to `opportunities`) and `narrativeSectionId` (FK to `application_sections`) — both resolved correctly from prior seed steps → **OK**
- `BudgetBuilder` `add-line-item-btn-${category}` testid ↔ no E2E test directly exercises this button (no integration risk) → **OK**
- `AttachmentManager` `usa-button-group ul > li` markup + clip-positioned file input → no downstream consumer mismatch → **OK**
- E2E test 2 (`preview page does not contain internal comments`) missing login → unconditionally skips → **WARNING W1**
