---
phase: 8
status: issues_found
blockers: 1
warnings: 2
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
reviewed_at: 2026-09-02T13:21:32Z
iteration: 1
---

# Phase 8 Code Review

Scope: the single gap-closure plan 08-07 (gap_ref uat/5, PRD-INTAKE-019C) — the
new `GET /external-opportunities/imported` read surface and its client wiring.
Diff established from `git diff 5190eb9..HEAD` (first 08-07 commit is `c89c890`).

## BLOCKERs

### B1: GET /external-opportunities/imported returns every user's imports — no per-caller scoping (IDOR / broken "my imports" view)
- **File:** src/routes/externalOpportunities.ts:64-76; src/services/external/importService.ts:159-203
- **Category:** security (IDOR pattern) / integration (correctness vs. PRD intent)
- **Evidence:**
  The route authenticates the caller but then discards their identity:
  ```ts
  authenticate,
  async (_req: Request, res: Response) => {          // _req — user_id never read
    const items = await externalOpportunityImportService.listImportedOpportunities();
  ```
  The service query filters only on source/status, never on the importing user:
  ```sql
  WHERE o.source = $1 AND o.status = $2   -- 'grants_gov_import', 'imported'
  ORDER BY o.created_at DESC
  ```
  Every other authenticated endpoint in this same file derives ownership
  server-side from `req.user!.user_id` (`/saved` line 51-53, `/alerts` line
  84-86, `/:id/save` line 181, `/import` line 224). This endpoint breaks that
  established phase-8 pattern.

  Concrete failure: User A imports opportunity X. User B — who has imported
  nothing — logs in and lands on `/applicant/applications`; WorkspaceListPage's
  `['imported-opportunities']` query returns A's import, so B sees "Imported
  from Grants.gov: [A's opportunity]" as if it were their own. In any
  multi-applicant deployment the "My imported opportunities" list is a single
  global pool, and it grows without bound with every user's imports.

  The write path already records ownership: `insertOpportunity` writes
  `created_by = actorUserId` (importService.ts:272, 302), and `opportunities`
  has a NOT NULL `created_by` FK (migration 002). Per-user scoping is therefore
  available and was simply omitted — this is a missing `AND o.created_by = $3`
  (or `AND created_by = actorUserId`) rather than a schema limitation. The code
  comment ("not per-applicant scoped, so all imported opportunities are
  returned") documents the defect as if intended, but it contradicts the plan's
  own signature (`listImportedOpportunities(actorUserId)`) and the PRD framing
  of a per-applicant post-import surface.

  Mitigating fact (why not higher-severity data breach, but still a blocker):
  the leaked *fields* (title, funder_name, program_area, award amount, close
  date) are public Grants.gov metadata also served unauthenticated via
  `GET /external-opportunities`. The exposure is the cross-user visibility of
  *whose/which* imports exist plus a broken per-user view — a correctness/IDOR
  defect on the phase's user-facing goal, not disclosure of confidential data.

  Neither test would catch this: the integration "double-import" test
  (test.ts:499-527) uses one user, and the e2e (spec.ts:264-367) mocks
  `/imported` to a fixed single item — so the missing scoping is unverified.
- **Fix direction:** Thread the authenticated `req.user!.user_id` into
  `listImportedOpportunities(actorUserId)` and add `AND o.created_by = $3` to
  the WHERE clause, mirroring the `/saved` and `/alerts` ownership derivation.
  Add a two-user integration assertion (user B must NOT see user A's import).

## WARNINGs

### W1: `status_badge` union declares `'not_yet_open'` but the deriver can never produce it
- **File:** src/services/external/importService.ts:27,53-65 (and client type at client/src/types/externalOpportunity.ts:96)
- **Evidence:** `ImportedOpportunityListItem['status_badge']` includes
  `'not_yet_open'`, but `deriveStatusBadge` only ever returns `'open' |
  'closing_soon' | 'closed'` (no branch inspects an open/start date, and no
  `'not_yet_open'` literal is returned anywhere). A forecasted/not-yet-open
  imported opportunity is mislabeled `'open'`. Degraded rather than broken —
  the badge is cosmetic and the imported flow currently only imports posted
  opps — so a WARNING, but the dead union member will mislead future consumers.
- **Fix direction:** Either drop `'not_yet_open'` from the union, or derive it
  from the opportunity's open/start date when available.

### W2: Imported-opportunities query has no error surface on the applications page
- **File:** client/src/pages/applicant/WorkspaceListPage.tsx:48-51,208-223
- **Evidence:** `importedQuery` is consumed only via `isLoading` and
  `data?.items ?? []`; `importedQuery.isError` is never handled. If
  `GET /imported` fails (500/network), the section silently renders the
  "You have no imported opportunities yet" empty state, which is misleading
  immediately after a successful import redirect. Non-critical path (the import
  itself succeeded and its own success alert fired on the detail page), so a
  WARNING. The sibling workspaces query does render an error alert (lines
  131-135) — inconsistent handling.
- **Fix direction:** Add an `importedQuery.isError` branch rendering a small
  retry/error notice, consistent with the workspaces error alert.

## Cross-file seams checked
- Route order `/imported` (routes:64) precedes `/:id/versions` (142) and bare `/:id` (242), and sits among the other static authenticated paths — OK, literal segment not swallowed by `:id`.
- SQL in `listImportedOpportunities` uses parameterized `$1/$2` for source/status; no string interpolation — OK, no injection.
- Client `externalOpportunitiesApi.listImported()` → `GET /external-opportunities/imported` matches backend route path and `{ items }` response shape — OK.
- `ImportedOpportunityListItem` client type (types:89-99) mirrors backend interface (importService:20-30) field-for-field — OK (except the never-emitted `not_yet_open`, see W1).
- Navigation seam: DetailPage `navigate('/applicant/applications', { state: { importedFromGrantsGov: true } })` (DetailPage:82-84) ↔ WorkspaceListPage `useLocation().state.importedFromGrantsGov` banner (WorkspaceListPage:37-41); App.tsx route `applications → WorkspaceListPage` (App.tsx:66) — OK.
- Cache invalidation `['imported-opportunities']` on import success (DetailPage:80) matches the query key used by WorkspaceListPage (WorkspaceListPage:49) — OK.
- Import write path (`importOpportunity`/`insertOpportunity`/BEGIN-COMMIT-ROLLBACK) unchanged by this diff (git diff shows zero touched lines in that region) — OK, no regression to the existing import writer.
