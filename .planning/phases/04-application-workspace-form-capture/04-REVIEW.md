---
phase: 4
status: issues_found
blockers: 0
warnings: 3
files_reviewed: 11
files_reviewed_list:
  - client/src/pages/applicant/OpportunityDetailPage.tsx
  - client/src/pages/applicant/WorkspacePage.tsx
  - client/src/components/workspace/ReadinessDashboard.tsx
  - e2e/workspacePreview.spec.ts
  - client/src/components/workspace/AttachmentManager.tsx
  - client/src/components/workspace/BudgetBuilder.tsx
  - src/db/seed.ts
  - src/routes/publicOpportunities.ts
  - src/services/workspace/workspaceService.ts
  - src/routes/workspaces.ts
  - src/db/migrations/010_org_profile_schema.sql
reviewed_at: 2026-07-28T03:28:55Z
iteration: 2
---

# Phase 4 Code Review

## BLOCKERs

_None._

---

## B1 — RESOLVED ✓

**commit 804c348** — `workspace-status` uses `org_roles` JOIN instead of non-existent `applicant_user_id` column.

**Verification:** The fix at `publicOpportunities.ts:212-219` replaces the invalid `applicant_user_id = $2` predicate with:
```sql
SELECT aw.workspace_id FROM application_workspaces aw
JOIN org_roles orr ON orr.org_id = aw.org_id
WHERE aw.opportunity_id = $1
  AND orr.user_id = $2
  AND orr.revoked_at IS NULL
LIMIT 1
```
Schema confirmed: `org_roles` (migration 010) has `org_id`, `user_id`, `revoked_at` exactly as required. Fix is correct and complete.

---

## B2 — RESOLVED ✓

**commit 34bab0a** — three coordinated changes:

1. **`workspaceService.ts:63-84`** — On `23505` unique violation, the inner transaction client is now in an aborted state; the fix correctly uses the pool (not the aborted `client`) to SELECT the existing `workspace_id`, attaches it to the thrown error as `dupErr.workspace_id`. The thrown `dupErr` propagates to the outer `catch` at line 111 which issues a `ROLLBACK` (benign on an already-aborted transaction) then `client.release()`. Control flow is correct.

2. **`workspaces.ts:115-121`** — The 409 response is now `{ error: 'DUPLICATE_WORKSPACE', message: '...', workspace_id: dupErr.workspace_id }`, exposing the ID to callers. If `existingWorkspaceId` was not found (inner SELECT failed), `workspace_id` is `undefined`, which serialises to omission in JSON — the `onError` condition then evaluates false and silently does nothing, which is the documented fallback behaviour.

3. **`OpportunityDetailPage.tsx:129-131`** — `error_code` → `error`, matching the backend field name. Field alignment between the 409 JSON (`error`, `workspace_id`) and the frontend type annotation (`{ error?: string; workspace_id?: string }`) is now correct.

**Verification:** All three seams checked end-to-end. No regression introduced.

---

## WARNINGs

### W1: E2E test "preview page does not contain internal comments" runs without authentication — always skips in CI

- **File:** `e2e/workspacePreview.spec.ts`:30-46
- **Evidence:**
  The test navigates directly to `/applicant/applications` at line 31 without calling the login flow. `ApplicantLayout` auth-guards this route and redirects unauthenticated users to `/login`. The resulting `/login` page contains no `[data-testid="workspace-card"]` elements, so `cards.count()` returns 0 and the test unconditionally hits `test.skip(true, ...)`. The test never verifies that internal comments are absent from the preview page. The first and third tests in the same file correctly perform a login sequence before navigating.
- **Fix direction:** Add the same login sequence (lines 4-8 of the first test) at the beginning of this test before navigating to `/applicant/applications`.

---

### W2: USWDS inner grid columns sum to 9 of 12 — 3 columns unused in workspace layout

- **File:** `client/src/pages/applicant/WorkspacePage.tsx`:115-134
- **Evidence:**
  The `grid-row` is a child of the `desktop:grid-col-9` main content area. In USWDS, a nested `grid-row` creates a new 12-column context; children should sum to 12 to fill the container. The 04-08 fix changes `grid-col-3+grid-col-6+grid-col-3=12` to `grid-col-2+grid-col-5+grid-col-2=9`, leaving 3 of 12 inner columns permanently empty — approximately 25% of available horizontal space is unused. If the prior "visual overlap" was real, the root cause may be the `usa-prose` `max-width` constraint on `<main>` rather than USWDS column overflow; reducing child column counts is not the correct USWDS remedy.
- **Fix direction:** Revert to `grid-col-3+grid-col-6+grid-col-3` (sum=12). If `usa-prose` max-width was causing overflow, remove `usa-prose` from the layout wrapper element or move it to specific section panels only.

---

### W3: `BudgetBuilder` "Add Line Item" button disappears with no cancel affordance when accordion collapses while add-form is open

- **File:** `client/src/components/workspace/BudgetBuilder.tsx`:258-276
- **Evidence:**
  The "Add Line Item" button renders when `{!isAdding}` (line 258). The add form renders inside `{isExpanded && (...)}` (line 276) when `isAdding` is true. If a user: (1) clicks the add button → `isAdding=true`, accordion expands, form appears; (2) clicks the accordion header to collapse it → `isExpanded=false`. The add form is hidden (correct), but the "Add Line Item" button is also hidden (`isAdding` is still `true`). The accordion header is now the only interactive element; clicking it re-expands without warning the user that partially entered data is waiting. The user's only recovery is to expand the accordion and click "Cancel" inside the re-revealed form — a discoverability failure introduced by the 04-08 fix.
- **Fix direction:** When the accordion is collapsed (`toggleCategory` causes `isExpanded` to become false) and `addingCategory === category`, also call `setAddingCategory(null)` and `setFormState(emptyForm)` to abort the in-progress add. Alternatively, render a minimal cancel affordance outside the `{isExpanded}` gate when `isAdding` is true.

---

## Cross-file seams checked

- `workspaceApi.createWorkspace` → `POST /api/v1/workspaces` → response shape `{ workspace, sections }` matches client expectation → **OK**
- `OpportunityDetailPage` 409 `DUPLICATE_WORKSPACE` handler reads `response.data.error` + `response.data.workspace_id` ↔ backend now emits `{ error, message, workspace_id }` → **RESOLVED (was B2)**
- `workspace-status` route queries `org_roles JOIN application_workspaces` on `user_id` ↔ `org_roles` schema confirmed to have `org_id`, `user_id`, `revoked_at` columns → **RESOLVED (was B1)**
- `workspaceService.createWorkspace` uses `pool` (not aborted `client`) for the duplicate workspace_id SELECT → control flow ROLLBACK → release is correct → **OK**
- `WorkspacePage` preview link `to="/applicant/workspaces/${workspaceId}/preview"` ↔ `ReadinessDashboard` same path ↔ `WorkspacePreviewPage` registered at that route → **OK**
- `data-testid="preview-application-link"` in `WorkspacePage.tsx:106` ↔ E2E locator `[data-testid="preview-application-link"]` at `workspacePreview.spec.ts:68` → **OK**
- `data-testid="draft-preview-banner"` in `WorkspacePreviewPage.tsx:50` ↔ E2E assertion at `workspacePreview.spec.ts:21` → **OK**
- `form_field_definitions` seed uses `uatOpportunityId` (FK to `opportunities`) and `narrativeSectionId` (FK to `application_sections`) — both resolved correctly from prior seed steps → **OK**
- `BudgetBuilder` `add-line-item-btn-${category}` testid ↔ no E2E test directly exercises this button (no integration risk) → **OK**
- `AttachmentManager` `usa-button-group ul > li` markup + clip-positioned file input → no downstream consumer mismatch → **OK**
- E2E test 2 (`preview page does not contain internal comments`) missing login → unconditionally skips → **WARNING W1 (unchanged)**
