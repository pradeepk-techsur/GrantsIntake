---
phase: 5
status: clean
blockers: 0
warnings: 0
files_reviewed: 11
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
reviewed_at: 2026-08-01T04:05:00Z
iteration: 2
---

# Phase 5 Code Review — Iteration 2 (Re-review)

All five findings from iteration 1 (B1, B2, W1, W2, W3) have been verified fixed. No regressions
introduced by the fixer's commits (053ee29, bf64f87). `tsc --noEmit` exits clean on both server
and client. Status: **clean**.

---

## Previous Findings — Verification

### B1 ✅ FIXED: DELETE budget line-item route missing `is_locked` guard

- **Commit:** 053ee29
- **File:** `src/routes/workspaces.ts`:537
- **Evidence:** `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });`
  inserted at line 537, between the workspace existence check (line 536) and the `isMember` check
  (line 538). Placement is identical to the POST route (line 505) and PUT route (line 521). Fix is
  exact and complete.

### B2 ✅ FIXED: DELETE attachment route missing `is_locked` guard

- **Commit:** 053ee29
- **File:** `src/routes/workspaces.ts`:630
- **Evidence:** `if (workspace.is_locked) return res.status(423).json({ error: 'WORKSPACE_LOCKED' });`
  inserted at line 630, between the workspace existence check (line 629) and the `isMember` check
  (line 631). Parallel to the POST attachment guard (line 596). Fix is exact and complete.

### W1 ✅ FIXED: `mainProgramId` null-guard in seed.ts

- **Commit:** bf64f87
- **File:** `src/db/seed.ts`:84
- **Evidence:** `if (!mainProgramId) throw new Error('mainProgramId missing after upsert — General Grant Programs not found');`
  added at line 84 immediately after the `const mainProgramId = …` assignment. Fails loudly instead
  of propagating `undefined` as SQL `NULL`. Fix is exact and complete.

### W2 ✅ FIXED: AbortController cleanup in OpportunitiesIndex

- **Commit:** bf64f87
- **File:** `client/src/pages/grantor/OpportunitiesIndex.tsx`:34–61
- **Evidence:**
  - `const controller = new AbortController()` at line 35.
  - `{ signal: controller.signal }` passed to both the `/programs` GET (line 38) and each
    `/programs/:id/opportunities` GET (line 51).
  - `if (!controller.signal.aborted) setOpportunities(...)` guards the `Promise.all` result path
    (line 56) and the `.catch()` path (line 58).
  - `if (!controller.signal.aborted) setLoading(false)` in `.finally()` (line 59).
  - Cleanup function `return () => controller.abort()` at line 60.
- **Regression check — `setOpportunities([])`/`setProgramId` in `.then()` early-return path
  (lines 42, 46):** These two calls are inside `.then()`, which is only entered after axios
  resolves the request successfully (not after abort). axios 1.x rejects with `CanceledError` on
  abort, routing to `.catch()`, not `.then()`. Therefore these two unguarded calls cannot fire
  post-abort in any non-pathological scenario. Not a defect.

### W3 ✅ FIXED: `isLocked` gate on task/comment controls in WorkspaceSectionPanel

- **Commit:** bf64f87
- **File:** `client/src/components/workspace/WorkspaceSectionPanel.tsx`:135, 192
- **Evidence:**
  - Task toggle button: `disabled={updateTaskMutation.isPending || isLocked}` (line 135).
  - Post Comment button: `disabled={!commentText.trim() || postCommentMutation.isPending || isLocked}` (line 192).
- **Regression check — `handlePostComment` no `isLocked` check (line 58–62):** The function only
  runs when invoked by the button's `onClick`. With the button `disabled` when `isLocked`, the
  handler cannot fire via normal interaction. No security implication (comments are internal staff
  notes; the server-side comment route has no `is_locked` guard and this is a pre-existing known
  omission, not introduced by this fix).
- **Regression check — `<textarea>` not `disabled`/`readOnly` when locked (line 178–187):** The
  textarea remains editable when `isLocked=true`; only the submit button is gated. The user can
  type but not submit. This is a minor UX inconsistency but not a correctness defect — mutation
  cannot fire, so no data is changed. Confirmed within scope of the W3 fix as stated (button gates
  only). Not promoted to a finding.
- **Pre-existing server-side gap — `PUT /workspaces/:id/tasks/:taskId` lacks `is_locked` guard:**
  `workspaceIodGuard` (lines 80–100) does not check `workspace.is_locked`; task status can be
  toggled post-submission via direct API call. This was explicitly noted as out-of-scope in the W3
  iteration-1 resolution comment. Not introduced by the fixer; pre-existing and carried forward.

---

## BLOCKERs

_None._

## WARNINGs

_None._

---

## Cross-file seams checked (iteration 2)

- **`workspaces.ts` DELETE budget line-item ↔ POST/PUT symmetry**: OK — all three mutating budget
  routes now share identical `is_locked` guard placement.
- **`workspaces.ts` DELETE attachment ↔ POST symmetry**: OK — both mutating attachment routes
  now share identical `is_locked` guard placement.
- **`OpportunitiesIndex` abort signal ↔ axios 1.x CanceledError behaviour**: OK — abort causes
  rejection (`.catch()`), not resolution (`.then()`); abort guards are on the correct paths.
- **`WorkspaceSectionPanel` `isLocked` prop ↔ button `disabled` expressions**: OK — both controls
  correctly OR the `isLocked` boolean into their existing `disabled` conditions.
- **`seed.ts` null-guard ↔ downstream `mainProgramId` consumers**: OK — guard throws before any
  downstream `UPDATE`/`INSERT` that uses `mainProgramId` executes.
- **`tsc --noEmit` (server + client)**: Clean — no type errors introduced by fixer changes.
