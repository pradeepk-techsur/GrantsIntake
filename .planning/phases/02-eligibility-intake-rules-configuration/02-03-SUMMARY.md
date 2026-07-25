---
phase: 02-eligibility-intake-rules-configuration
plan: 03
subsystem: api, ui
tags: [postgres, express, react, uswds, playwright, full-text-search, gin-index]

requires:
  - phase: 02-eligibility-intake-rules-configuration
    provides: eligibility_rules table (002-01), attachment_requirements and screening_criteria tables (02-02)
provides:
  - Addenda table with immutability constraint and compound idx_addenda_published_at index
  - PublicationService with public_slug generation and OPPORTUNITY_PUBLISHED audit event
  - AddendaService with immutable append-only addenda and version_number auto-increment
  - SearchService with GIN full-text search, faceted filtering, 3 sort modes, and pagination
  - publicOpportunitiesRouter: GET /opportunities (search), GET /opportunities/:id (detail), GET /opportunities/:id/workspace-status (auth)
  - addendaRouter: GET /opportunities/:id/addenda (public), POST (grantor_admin/program_officer), DELETE returns 405
  - OpportunityListPage React component at /opportunities (no auth required)
  - OpportunityDetailPage React component at /opportunities/:slug (no auth required)
  - OpportunityCard, SearchFilters, AddendaTimeline React components
  - "Find Opportunities" nav link in GrantorLayout header
affects: ["03-applicant-workspace", "04-application-form", "phase-3-applicant-portal"]

tech-stack:
  added: []
  patterns:
    - "Public routes mounted before grantor routes to allow unauthenticated access to GET /opportunities"
    - "Optional auth: publicOpportunitiesRouter reads Authorization header optionally (import verifyAccessToken) for unpublished access without breaking public requests"
    - "XSS safety: AddendaTimeline renders all DB text via React JSX text interpolation (no dangerouslySetInnerHTML)"
    - "Keyword truncated to 200 chars before plainto_tsquery (T-02-14 DoS mitigation)"
    - "Unpublished opportunities return 404 (not 403) to prevent org enumeration (T-02-13)"
    - "criterion_value JSONB excluded from public eligibility_rules response (T-02-18)"
    - "Active filter chips pattern: chip per applied filter, × button removes single filter and re-fetches"
    - "Migration 009 (not 008): 008 was taken by conditional_and_intake_schema"

key-files:
  created:
    - src/db/migrations/009_addenda_schema.sql
    - src/services/opportunity/publicationService.ts
    - src/services/opportunity/addendaService.ts
    - src/services/opportunity/searchService.ts
    - src/routes/publicOpportunities.ts
    - src/routes/addenda.ts
    - tests/integration/publicOpportunities.test.ts
    - tests/integration/addenda.test.ts
    - client/src/pages/applicant/OpportunityListPage.tsx
    - client/src/pages/applicant/OpportunityDetailPage.tsx
    - client/src/pages/applicant/components/OpportunityCard.tsx
    - client/src/pages/applicant/components/SearchFilters.tsx
    - client/src/pages/applicant/components/AddendaTimeline.tsx
    - e2e/opportunity-portal.spec.ts
  modified:
    - src/server.ts
    - client/src/App.tsx
    - client/src/layouts/GrantorLayout.tsx

key-decisions:
  - "Migration numbered 009: slots 001-008 already occupied (008_conditional_and_intake_schema needed to be recorded in schema_migrations table first)"
  - "publicOpportunitiesRouter mounted BEFORE opportunitiesRouter in server.ts: public GET /opportunities/:id takes priority over authenticated grantor route for the same path pattern"
  - "GIN index already existed from prior migration (uses executive_summary + eligibility_summary, not description): SearchService uses the same fields"
  - "Optional auth on GET /opportunities/:id via dynamic import of verifyAccessToken: avoids requiring authenticate middleware on public route while still allowing grantor preview of drafts"
  - "AddendaTimeline renders date_change type with before/after parsing via regex on ISO date format"
  - "E2E test written as Playwright file; execution deferred to verify phase (per execute phase protocol)"

patterns-established:
  - "Public routes must be mounted before authenticated routes sharing the same path pattern"
  - "Filter chips: one chip per active filter, × button resets single filter + triggers re-fetch"
  - "Status badge: calculated at query time via PublicationService.getStatusBadge() based on application_open_date and application_close_date"

duration: 10min
completed: 2026-07-25
---

# Phase 2 Plan 3: Public Opportunity Portal, Publication Service, Addenda, and Search Summary

**Applicant-facing opportunity portal with GIN full-text search, faceted filtering, immutable addenda timeline, and context-aware CTAs — powered by Migration 009 addenda schema, PublicationService (slug + audit), SearchService (GIN + facets + pagination), AddendaService (immutable), and USWDS React components for OpportunityListPage and OpportunityDetailPage**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-25T21:46:18Z
- **Completed:** 2026-07-25T21:57:08Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Migration 009: addenda table with immutability (no UPDATE, no DELETE grants by design), compound idx_addenda_published_at index for efficient reverse-chron queries
- PublicationService: unique public_slug (slugify+UUID prefix, collision-safe retry), OPPORTUNITY_PUBLISHED audit event, status badge calculation (open/closing_soon/closed/not_yet_open)
- AddendaService: immutable append-only addenda with auto-incremented version_number; DELETE returns 405 at route layer (T-02-15)
- SearchService: full-text keyword search via existing GIN index (plainto_tsquery, injection-safe, 200-char truncation), 7 facet filters, 3 sort modes, pagination
- Public API: GET /opportunities (unauthenticated, published-only), GET /opportunities/:id (public detail, 404 for unpublished), GET /opportunities/:id/workspace-status (auth required)
- React UI: OpportunityListPage at /opportunities with SearchFilters accordion, OpportunityCard USWDS cards with status badges, pagination, empty state; OpportunityDetailPage at /opportunities/:slug with breadcrumbs, eligibility severity grouping, attachment table, AddendaTimeline, context-aware CTA
- "Find Opportunities" link added to GrantorLayout header nav
- 19 integration tests all passing (11 publicOpportunities + 8 addenda)
- Playwright e2e test file written for 6 scenarios (execution deferred to verify phase)

## Task Commits

Each task was committed atomically:

1. **Task 1: Addenda migration, publication service, search service, and public API routes** - `20760a7` (feat)
2. **Task 2: Applicant portal UI — opportunity list, detail page, and addenda timeline** - `b20cb00` (feat)

**Plan metadata:** (docs commit after SUMMARY)

_Note: Playwright e2e tests written as artifact — execution deferred to verify phase per execute-plan protocol._

## Files Created/Modified

- `src/db/migrations/009_addenda_schema.sql` — Addenda table, immutability note, compound index
- `src/services/opportunity/publicationService.ts` — publish() with completeness gate, slug, audit; getStatusBadge()
- `src/services/opportunity/addendaService.ts` — list(), create() with version_number auto-increment, no delete
- `src/services/opportunity/searchService.ts` — Full-text + faceted search with GIN index + pagination
- `src/routes/publicOpportunities.ts` — 3 public endpoints with optional auth, IDOR protection
- `src/routes/addenda.ts` — GET (public), POST (grantor_admin/program_officer), DELETE → 405
- `src/server.ts` — publicOpportunitiesRouter + addendaRouter mounted before opportunitiesRouter
- `tests/integration/publicOpportunities.test.ts` — 11 integration tests
- `tests/integration/addenda.test.ts` — 8 integration tests
- `client/src/pages/applicant/OpportunityListPage.tsx` — Search + card grid + pagination page
- `client/src/pages/applicant/OpportunityDetailPage.tsx` — Detail page with CTA logic
- `client/src/pages/applicant/components/OpportunityCard.tsx` — USWDS card with status badge
- `client/src/pages/applicant/components/SearchFilters.tsx` — Filter accordion + active chips
- `client/src/pages/applicant/components/AddendaTimeline.tsx` — Reverse-chron addenda with badges
- `client/src/App.tsx` — Added /opportunities and /opportunities/:slug routes (no auth guard)
- `client/src/layouts/GrantorLayout.tsx` — Added "Find Opportunities" nav link
- `e2e/opportunity-portal.spec.ts` — 6 Playwright scenarios

## Decisions Made

- Migration numbered 009 (not 008): 008 was already occupied by `008_conditional_and_intake_schema.sql` but not recorded in `schema_migrations` table — had to INSERT the record manually first
- Public routes mounted BEFORE grantor routes: `publicOpportunitiesRouter` registered before `opportunitiesRouter` to give unauthenticated `GET /opportunities/:id` priority over the authenticated grantor route at the same path
- GIN index already existed from prior migration and uses `executive_summary + eligibility_summary` fields (not `description`): SearchService adapted to use these same columns
- Optional auth on public detail route via dynamic import of `verifyAccessToken`: clean way to allow both unauthenticated access (default) and grantor preview of unpublished drafts without middleware
- E2E tests written as artifacts per execute-phase protocol; execution deferred to verify phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration 008 not recorded in schema_migrations despite tables existing**
- **Found during:** Task 1 (applying migrations)
- **Issue:** `008_conditional_and_intake_schema.sql` tables already existed in DB from previous work but migration was not recorded in `schema_migrations` tracking table, causing migrate runner to fail with "relation already exists"
- **Fix:** Manually `INSERT INTO schema_migrations (version) VALUES ('008_conditional_and_intake_schema') ON CONFLICT DO NOTHING` to mark it applied, then re-ran migrate
- **Files modified:** Database state (schema_migrations table)
- **Verification:** npm run migrate completed successfully; migration 009 applied

**2. [Rule 1 - Bug] GIN index used executive_summary/eligibility_summary, not description column**
- **Found during:** Task 1 (creating SearchService)
- **Issue:** Plan specified `coalesce(description, '')` in GIN index but the opportunities table has `executive_summary` and `eligibility_summary` columns (no `description`); existing GIN index already used these
- **Fix:** SearchService and migration 009 comment adapted to use `executive_summary + eligibility_summary + program_area` to match the existing GIN index
- **Files modified:** src/services/opportunity/searchService.ts, src/db/migrations/009_addenda_schema.sql
- **Verification:** TypeScript compile: no errors; integration tests pass

**3. [Rule 3 - Blocking] publicOpportunitiesRouter routing conflict with opportunitiesRouter**
- **Found during:** Task 1 verification (integration tests returned 401 instead of 200 for public routes)
- **Issue:** `opportunitiesRouter` was mounted before `publicOpportunitiesRouter` in server.ts; `GET /opportunities/:id` with authenticate middleware was matched first, blocking unauthenticated requests
- **Fix:** Moved `publicOpportunitiesRouter` mount BEFORE `opportunitiesRouter` in server.ts
- **Files modified:** src/server.ts
- **Verification:** Integration tests: 19/19 pass

---

**Total deviations:** 3 auto-fixed (1 blocking/DB state, 1 bug/column names, 1 blocking/route ordering)
**Impact on plan:** All auto-fixes necessary for correct operation. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Public opportunity portal is live: `/opportunities` (list) and `/opportunities/:slug` (detail) accessible without authentication
- PublicationService and AddendaService ready for Phase 3 applicant workspace flows
- SearchService provides all search facets needed for PRD-INTAKE-014
- Playwright e2e tests await execution in verify phase
- Integration tests: 19 passing

## Self-Check: PASSED

All 14 key files present on disk. Both task commits verified in git log:
- `20760a7` feat(02-03): addenda migration, publication/search/addenda services, public API routes
- `b20cb00` feat(02-03): applicant opportunity portal UI — list, detail, addenda timeline, nav

---
*Phase: 02-eligibility-intake-rules-configuration*
*Completed: 2026-07-25*
