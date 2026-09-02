---
phase: 8
status: issues_found
blockers: 0
warnings: 1
files_reviewed: 8
files_reviewed_list:
  - src/routes/externalOpportunities.ts
  - src/services/external/importService.ts
  - client/src/api/externalOpportunitiesApi.ts
  - client/src/types/externalOpportunity.ts
  - client/src/pages/applicant/WorkspaceListPage.tsx
  - client/src/pages/applicant/ExternalOpportunityDetailPage.tsx
  - tests/integration/externalOpportunities.test.ts
  - e2e/externalOpportunities.spec.ts
reviewed_at: 2026-09-02T00:00:00Z
iteration: 2
---

# Phase 8 Code Review

Re-review (iteration 2) after the code-fixer applied iteration-1 findings. Scope:
the previously reviewed 8 files plus the fixer-touched files (identical set).
Fixer commits verified: `61baa32` (B1), `86cc586` (W1), `8fe5586` (W2),
`b5d8844` (docs). Diff read via `git diff 057974b..HEAD`.

## Verification of iteration-1 findings

### B1 (BLOCKER, IDOR) — RESOLVED ✓
`GET /external-opportunities/imported` now scopes to the authenticated caller.
- Route reads `req.user!.user_id` and threads it into
  `listImportedOpportunities(actorUserId)` (routes:67-72) — the `_req` sink is gone.
- Service WHERE clause adds `AND o.created_by = $3` with `$3 = actorUserId`
  (importService:183-185) — **parameterized, no injection**.
- Scoped column is correct: the write path stamps `created_by = actorUserId`
  in `insertOpportunity` (importService:304), and `actorUserId` is the applicant's
  `req.user!.user_id` threaded route(226) → `importOpportunity`(79) →
  `insertOpportunity`(256). Confirmed NOT scoped by the system-org column — an
  applicant's own `user_id` is what is written and what is filtered.
- Single-user happy path preserved: happy-path test (test.ts:483-508) and the
  idempotency test (510-538) still pass under the scoped query (both operate as
  the importing user).
- New two-user test (test.ts:540-576) is a **real, live assertion** (not
  skipped/`it.skip`/quieted): imports as user A, asserts A sees it (`.toBe(true)`
  line 564) and B does NOT (`.toBe(false)` line 575). Test scaffolding adds
  applicant B user/token and extends teardown to include `applicantBUserId`
  (cleanup by `ANY($1)` over all three ids) — no leak.
- The misleading "not per-applicant scoped … all imported opportunities are
  returned" comment was replaced with an accurate per-caller description
  (importService:151-158).

### W1 (dead `'not_yet_open'` union member) — RESOLVED ✓
Dropped from `ImportedOpportunityListItem.status_badge` in both backend
(importService:27) and client (externalOpportunity.ts:96). `deriveStatusBadge`
only emits `open|closing_soon|closed`, so the narrowing is exact.
Correctly left untouched: the **separate** publication `StatusBadge` type in
`OpportunityDetailPage.tsx` / `OpportunityCard.tsx` still carries
`not_yet_open` (its own deriver does produce it) — no cross-contamination.
Remaining `not_yet_open` grep hits are only that distinct type plus the stale
`client/dist` bundle (build artifact, not source).

### W2 (no error surface on imported query) — RESOLVED ✓
WorkspaceListPage now renders an `importedQuery.isError` branch
(WorkspaceListPage:212-230): `gf-alert--error`, `role="alert"`,
`data-testid="imported-error"`, and a Retry button wired to
`importedQuery.refetch()`. The empty-state is gated on
`!importedQuery.isError` (line 232), so a failed load no longer masquerades as
"You have no imported opportunities yet". Consistent with the sibling
workspaces error handling.

## Regression checks (fixes introduced no new breakage)
- Backend `tsc --noEmit`: exit 0. Client `tsc --noEmit`: exit 0 — the union
  narrowing broke no consumer.
- Import write path (`importOpportunity`/`insertOpportunity`/BEGIN-COMMIT-ROLLBACK,
  audit event) unchanged by the fix diff — no touched lines in that region.
- Route ordering intact: `/saved`(46) `/imported`(64) `/alerts`(81)
  `/admin/refresh`(113) `/:id/versions`(144) precede bare `/:id`(244) — the
  literal `/imported` segment is still not swallowed by `:id`.
- Existing `/saved`, `/alerts`, `/import` handlers and the unrelated
  `/admin/refresh` `_req` handler are byte-for-byte unchanged.
- Client `listImported()` → `GET /external-opportunities/imported` and
  `ImportedListResponse` shape still match backend route + response.

## WARNINGs

### W3: A second applicant re-importing an already-imported opp can never see it in their own list (global idempotency vs. new per-user scoping)
- **File:** src/services/external/importService.ts:92-105 (idempotency) ↔
  159-186 (per-user list); observable via routes:215-241, 64-78
- **Category:** bug (correctness edge, non-critical path)
- **Evidence:** Import idempotency is keyed **globally** on
  `external_opportunity_id` (importService:93-96): the first importer's internal
  row is returned to any later importer with `already_imported: true`. That row's
  `created_by` is the **first** importer. After the B1 fix, the imported list is
  scoped by `created_by = actorUserId`. So if user A imports opp X, then user B
  POSTs `/:id/import` for X, B receives `already_imported:true` + a
  `workspace_url`, is redirected to `/applicant/applications` with the success
  banner — but X will **not** appear in B's `/imported` list (it is A's row).
  B sees the banner promising "It now appears in your imported opportunities
  below" and then an empty/absent entry.
  This is not a security regression (B correctly cannot see A's data — that is the
  intended IDOR fix); it is a UX/correctness inconsistency the B1 fix newly
  exposes. It was masked before the fix (everyone saw everything). Degraded, not
  broken: the primary uat/5 flow (a user importing a not-yet-imported opp) works
  correctly and is covered; cross-user re-import of the same FON is an uncommon
  path and no data is corrupted.
- **Fix direction:** Decide the intended semantics: either (a) make the imported
  list also include opps the caller imported-attempted (e.g. record per-user
  import intent, or surface via the audit `OPPORTUNITY_IMPORTED` events keyed by
  `actor_user_id`), or (b) keep global idempotency but adjust the post-import
  redirect/banner copy when `already_imported` came from another user's row so
  the UI does not promise a list entry that won't appear. No code change required
  to ship the phase's primary goal — flagging for product decision.

## Cross-file seams checked
- Route `/imported`(64) precedes `/:id/versions`(144) and bare `/:id`(244); sits among static authenticated paths — OK, literal segment not swallowed.
- SQL in `listImportedOpportunities` parameterized `$1/$2/$3`, incl. new `created_by = $3` — OK, no injection.
- Write→read column match: `insertOpportunity` writes `created_by = actorUserId`(304); list filters `o.created_by = $3 = actorUserId`(183-185) — OK, correct column.
- Client `externalOpportunitiesApi.listImported()` → `GET /external-opportunities/imported`, `{ items }` / `ImportedListResponse` shape — OK.
- `ImportedOpportunityListItem` client type (types:89-99) mirrors backend interface (importService:20-30) field-for-field, both with narrowed `status_badge` union — OK.
- Separate `StatusBadge` type (OpportunityDetailPage/OpportunityCard) retains `not_yet_open` intentionally — OK, distinct type, distinct deriver.
- WorkspaceListPage error/empty/loading/list branches now mutually exclusive (isLoading | isError | empty | items) — OK.
- Import success nav seam (DetailPage state → WorkspaceListPage banner) and cache key `['imported-opportunities']` unchanged — OK (see W3 for the already-imported-by-other-user copy edge).
- Two-user integration test asserts isolation and is not skipped; teardown covers all three users — OK.
