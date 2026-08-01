---
phase: 5
status: fixed
blockers: 2
warnings: 3
files_reviewed: 10
files_reviewed_list:
  - src/db/seed.ts
  - src/routes/workspaces.ts
  - src/routes/programs.ts
  - src/routes/opportunities.ts
  - client/src/pages/grantor/OpportunitiesIndex.tsx
  - client/src/pages/applicant/WorkspacePage.tsx
  - client/src/components/workspace/WorkspaceSectionPanel.tsx
  - client/src/components/workspace/SectionFormPanel.tsx
  - client/src/components/workspace/BudgetBuilder.tsx
  - client/src/components/workspace/AttachmentManager.tsx
  - e2e/workspaceLocked.spec.ts
reviewed_at: 2026-08-01T03:18:12Z
iteration: 1
---

# Phase 5 Code Review

## BLOCKERs

### B1: DELETE budget line-item route missing `is_locked` guard — submitted workspace data can be mutated via direct API call

- **File:** `src/routes/workspaces.ts`:532–542
- **Category:** security
- **Evidence:**
  ```ts
  // DELETE /workspaces/:id/budget/line-items/:lineId — remove line item
  workspacesRouter.delete('/workspaces/:id/budget/line-items/:lineId', async (req, res) => {
    …
    const workspace = await workspaceService.getWorkspace(id);
    if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    // ← NO is_locked check here
    const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
    …
    const deleted = await budgetService.deleteLineItem(lineId);
    …
  });
  ```
  The POST (add) route at line 500 and PUT (update) route at line 516 both correctly check `if (workspace.is_locked) return res.status(423)` before proceeding. The DELETE route at line 532 does **not**. An authenticated org member can therefore remove existing budget line items from a submitted, locked workspace by sending `DELETE /api/v1/workspaces/:id/budget/line-items/:lineId` directly — bypassing the UI's `disabled` button entirely. This corrupts the immutable submitted record.
- **Fix direction:** Add `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });` immediately after the workspace existence check (before the `isMember` check) in the DELETE budget line-items route, consistent with the POST and PUT routes above it.

**Resolution:** fixed (053ee29) — added `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });` at `workspaces.ts` line 537, between workspace existence check and `isMember` check; `tsc --noEmit` clean, 256/256 tests pass.

---

### B2: DELETE attachment route missing `is_locked` guard — submitted workspace attachments can be soft-deleted via direct API call

- **File:** `src/routes/workspaces.ts`:624–634
- **Category:** security
- **Evidence:**
  ```ts
  // DELETE /workspaces/:id/attachments/:attachmentId — soft delete
  workspacesRouter.delete('/workspaces/:id/attachments/:attachmentId', async (req, res) => {
    …
    const workspace = await workspaceService.getWorkspace(id);
    if (!workspace) return res.status(404).json({ error: 'WORKSPACE_NOT_FOUND' });
    // ← NO is_locked check here
    const isMember = await workspaceService.verifyWorkspaceMember(id, req.user!.user_id);
    …
    const deleted = await attachmentService.deactivate(attachmentId);
    …
  });
  ```
  The POST (upload/link) route at line 590 has `if (workspace.is_locked) return res.status(423)`, but the DELETE route at line 624 does not. An authenticated org member can soft-delete any attachment on a submitted workspace by calling the API directly. The UI disables the Delete button when `isLocked=true`, but the enforcement is UI-only for this mutation.
- **Fix direction:** Add `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });` immediately after the workspace existence check in the DELETE attachments route, parallel to the POST route guard at line 595.

**Resolution:** fixed (053ee29) — added `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });` at `workspaces.ts` line 630, between workspace existence check and `isMember` check; both B1 and B2 landed in the same atomic commit since they are in the same file; `tsc --noEmit` clean, 256/256 tests pass.

---

## WARNINGs

### W1: `mainProgramId` in seed.ts may be `undefined` — UPDATE silently NULLs `program_id` on existing UAT opportunity rows

- **File:** `src/db/seed.ts`:79–83 and 317–320
- **Evidence:**
  ```ts
  // line 83 — typed string | undefined
  const mainProgramId = mainProgramResult.rows[0]?.program_id;
  
  // line 317-320 — no null-guard before UPDATE
  await pool.query(
    `UPDATE opportunities SET program_id = $1 WHERE opportunity_id = $2`,
    [mainProgramId, uatOpportunityId],   // mainProgramId may be undefined → NULL
  );
  ```
  In practice this cannot happen in a correctly seeded database (the program is inserted or found in the same transaction, just above). However, if the SELECT at line 80 returned 0 rows for any reason (race condition, incorrect `orgId`, prior data corruption), `mainProgramId` would be `undefined`, `pg` would serialize it as SQL `NULL`, and the UPDATE would set `program_id = NULL` — violating intent and potentially a NOT NULL FK constraint, causing an undiagnosed silent data corruption or a cryptic postgres FK error.
- **Severity note:** Low probability in practice (program was just upserted), but the lack of a null-guard means failure mode is data corruption rather than a clear error. A guard of the form `if (!mainProgramId) throw new Error('mainProgramId missing after upsert')` would make this fail loudly.

**Resolution:** fixed (bf64f87) — added `if (!mainProgramId) throw new Error('mainProgramId missing after upsert — General Grant Programs not found');` immediately after line 83 in seed.ts; fails loudly instead of propagating undefined as SQL NULL.

---

### W2: `OpportunitiesIndex` multi-program fetch has no AbortController / cleanup — stale state update on unmount

- **File:** `client/src/pages/grantor/OpportunitiesIndex.tsx`:34–59
- **Evidence:**
  The new `useEffect` fires an async `Promise.all` across N programs. There is no cleanup function returned from `useEffect` and no `AbortController` to cancel in-flight requests. If the grantor user navigates away while the batch is in flight, React 18 will drop the `setOpportunities` call silently (no crash), but `setLoading(false)` in `finally` will still execute on the stale closure, leaving `loading=true` on whichever component instance is now mounted. In a fast-nav scenario the user could see a permanent "Loading…" spinner.
- **Severity note:** Unlikely in normal usage (the fetch completes in < 1 s) but the pattern is broken: the previous `useFirstProgramId` hook had the same issue, so this is not a regression per se. It is worth noting given the new async pattern is longer-lived.

**Resolution:** fixed (bf64f87) — added `AbortController`; both the `/programs` GET and each `/programs/:id/opportunities` GET now receive `{ signal: controller.signal }`; `setOpportunities`, `setOpportunities([])`, and `setLoading(false)` are all guarded with `if (!controller.signal.aborted)`; cleanup function returns `controller.abort()`.

---

### W3: `WorkspaceSectionPanel` task and comment controls not gated on `isLocked` — inconsistent UI read-only enforcement

- **File:** `client/src/components/workspace/WorkspaceSectionPanel.tsx`:126–138 (task toggle) and 188–195 (Post Comment button)
- **Evidence:**
  ```tsx
  // Task toggle — line 135: disabled={updateTaskMutation.isPending}  ← no isLocked
  <button … disabled={updateTaskMutation.isPending}>
    {task.status === 'open' ? 'Mark complete' : 'Reopen'}
  </button>
  
  // Post Comment — line 192: disabled={!commentText.trim() || postCommentMutation.isPending}  ← no isLocked
  <button … disabled={!commentText.trim() || postCommentMutation.isPending}>
    Post Comment
  </button>
  ```
  Both controls remain fully interactive after submission even though `isLocked=true` is in scope in the same component. The server-side `PUT /workspaces/:id/tasks/:taskId` also lacks an `is_locked` check, meaning task status can be toggled post-submission at both UI and API layers. Internal comments may be intentionally left open (they are staff-only notes), but the plan's stated goal is "all fields are read-only" — task toggling produces observable state change on a locked workspace. The omission is an **incomplete lockdown** of interactive elements in this component, not a security hole (task status is not application content), but it contradicts the read-only guarantee shown in the locked-banner notice.

**Resolution:** fixed (bf64f87) — task toggle button `disabled` changed to `disabled={updateTaskMutation.isPending || isLocked}`; Post Comment button `disabled` changed to `disabled={!commentText.trim() || postCommentMutation.isPending || isLocked}`. Note: server-side `PUT /workspaces/:id/tasks/:taskId` still lacks `is_locked` guard (out of scope per scope-boundary — recorded here for next review cycle).

---

## Cross-file seams checked

- **`/programs` GET → `OpportunitiesIndex` fetch**: OK — server scopes to `req.user`'s grantor org (no IDOR). Client passes program_id list received from server back to `/programs/:programId/opportunities`, which re-validates each program_id belongs to the same org — double-checked and correct.
- **`/programs/:id/opportunities` GET → client multi-fetch**: OK — each per-program fetch re-checks program ownership server-side (line 129–136 in `opportunities.ts`).
- **`WorkspacePage` → `WorkspaceSectionPanel` `isLocked` prop**: OK — `workspace?.is_locked ?? false` correctly defaults to `false` when workspace is undefined; the `??` is correct (not `||`).
- **`WorkspaceSectionPanel` → `SectionFormPanel`, `BudgetBuilder`, `AttachmentManager` `isLocked` thread**: OK — all three consumer components accept and apply the prop.
- **`SectionFormPanel` `handleFieldBlur` early-return guard**: OK — `if (isLocked) return;` at line 84 correctly prevents save/validate mutations when locked.
- **`BudgetBuilder` "Add Line Item" button**: OK — `disabled={isLocked}` (line 270). The inline "Add Line Item" confirm button: OK — `disabled={… || isLocked}` (line 497).
- **`AttachmentManager` "Yes, delete" confirm button**: OK — `disabled={deleteMutation.isPending || isLocked}` (line 237). The hidden `<input type="file">`: OK — `disabled={isLocked}` (line 151).
- **Server-side `is_locked` enforcement — PUT field**: OK (line 431). **POST budget line-item**: OK (line 505). **PUT budget line-item**: OK (line 521). **POST attachment**: OK (line 595). **DELETE budget line-item**: **MISSING → B1**. **DELETE attachment**: **MISSING → B2**.
- **`seed.ts` UAT-OPP-001/002 re-parenting**: Logically correct — existing row SELECTs then UPDATEs `program_id`; new row INSERTs use `mainProgramId`. FK chain (workspace → opportunity → program) is preserved. Gap: `mainProgramId` null safety → W1.
- **`seed.ts` removal of `UAT Federal Agency` / `UAT Grant Program`**: No orphan risk — the blocks are simply deleted; any existing rows in those tables from prior seeds remain (they are not deleted), but the new code no longer inserts them. On a fresh DB they simply won't exist. No cascade drop is attempted.
- **`e2e/workspaceLocked.spec.ts` `data-testid` references**: `locked-banner` (WorkspacePage line 151) ✓, `workspace-page` (WorkspacePage line 119) ✓, `workspace-section-sidebar` (WorkspacePage line 166) ✓, `section-form-panel` (SectionFormPanel line 109) ✓, `budget-builder` (BudgetBuilder line 164) ✓, `attachment-manager` (AttachmentManager line 92) ✓, `upload-attachment-btn` (AttachmentManager line 119) ✓, `link-library-btn` (AttachmentManager line 130) ✓. `data-testid^="add-line-item-btn-"` prefix matches `add-line-item-btn-${category}` (BudgetBuilder line 264) ✓.
