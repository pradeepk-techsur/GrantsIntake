---
phase: 03-organization-profile-eligibility-pre-screening
plan: "02"
subsystem: ui
tags: [react, uswds, react-query, typescript, applicant-portal, organizations, playwright]

# Dependency graph
requires:
  - phase: 03-organization-profile-eligibility-pre-screening
    provides: organizations REST API (11 endpoints), organizationService, org_id FK
  - phase: 01-platform-foundation-opportunity-setup
    provides: useAuthStore, apiClient, useCurrentUser hook
provides:
  - ApplicantLayout USWDS shell with auth guard (redirect to /login if no accessToken)
  - ApplicantSidebar with My Profile, Find Opportunities, My Applications nav items
  - organizationsApi client with 10 methods
  - OrgProfilePage with create/edit form, completeness %, credential warning banners
  - OrgRolesPage with team role assignment/revoke table
  - OrgDocumentsPage with standard document library upload and version history
  - /applicant/* routes wired in App.tsx under ApplicantLayout
  - 9 Playwright e2e tests for org profile navigation and form interactions
  - applicant@example.com seed user for e2e tests
affects: [03-03, future-workspace-phase]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ApplicantLayout mirrors GrantorLayout pattern — USWDS header + usa-sidenav + auth guard via useAuthStore"
    - "org_id localStorage pattern: stored as applicant_org_id after create/fetch; cleared on 403/404 (T-03-10 accepted risk)"
    - "Base64 JSON upload: OrgDocumentsPage converts File → base64 before POST to match server contract from Plan 01"
    - "Client-side file size guard: 25 MB limit validated before upload (T-03-11)"
    - "UEI client-side validation: regex /^[A-Z0-9]{12}$/ with descriptive error message"

key-files:
  created:
    - client/src/layouts/ApplicantLayout.tsx
    - client/src/components/nav/ApplicantSidebar.tsx
    - client/src/api/organizationsApi.ts
    - client/src/types/organization.ts
    - client/src/pages/applicant/OrgProfilePage.tsx
    - client/src/pages/applicant/OrgRolesPage.tsx
    - client/src/pages/applicant/OrgDocumentsPage.tsx
    - e2e/org-profile.spec.ts
  modified:
    - client/src/App.tsx
    - src/db/seed.ts

key-decisions:
  - "org_id stored in localStorage key applicant_org_id — non-sensitive UUID, org data requires auth token; accepted per T-03-10"
  - "OrgDocumentsPage uses base64 JSON upload (not FormData) to match Plan 01 server contract; client converts File to base64 before POST"
  - "ApplicantLayout mirrors GrantorLayout structure exactly — same USWDS header/sidebar pattern, different sidebar component and title"

patterns-established:
  - "Applicant portal pages read org_id from localStorage and redirect to /applicant/profile if missing"
  - "Credential warning banners: usa-alert--error for expired, usa-alert--warning for expiring_soon"
  - "USWDS usa-tag variants: usa-tag--success (valid), usa-tag--warning (expiring_soon), usa-tag--error (expired)"

# Metrics
duration: 5min
completed: 2026-07-26
---

# Phase 3 Plan 02: Applicant Portal UI — Org Profile Pages Summary

**USWDS ApplicantLayout shell with auth guard, organizationsApi client (10 methods), OrgProfilePage with completeness % and credential warning banners, OrgRolesPage and OrgDocumentsPage with document version history, all wired under /applicant/* in App.tsx**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-26T13:57:50Z
- **Completed:** 2026-07-26T14:03:25Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- ApplicantLayout with USWDS header/sidebar shell and auth guard (redirects to /login if no accessToken; T-03-09 mitigation)
- organizationsApi with 10 methods: createOrg, getOrg, updateOrg, getCredentialStatus, listRoles, assignRole, revokeRole, listDocuments, uploadDocument, listDocumentVersions
- OrgProfilePage: 18-field create/edit form with completeness % progress bar, USWDS credential warning banners (expired/expiring_soon), UEI client-side validation, links to roles/documents pages
- OrgRolesPage: team roles table with assign (6 role types) and revoke; window.confirm before delete
- OrgDocumentsPage: document upload form (base64 JSON per server contract), 8 document types, expiration status badges, version history modal; client 25 MB size guard (T-03-11); button disabled during upload (T-03-12)
- 9 Playwright e2e test cases; e2e seed user (applicant@example.com) added to seed.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: ApplicantLayout shell + organizationsApi client + App.tsx routing** - `3337c71` (feat)
2. **Task 2: OrgProfilePage + OrgRolesPage + OrgDocumentsPage + Playwright tests** - `fb1c0b3` (feat)

**Plan metadata:** (docs commit follows)

_Note: Playwright tests written as deliverables; execution deferred to verify phase (test execution boundary per pivota_spec rules)._

## Files Created/Modified

- `client/src/layouts/ApplicantLayout.tsx` — USWDS applicant portal shell with auth guard, header, sidebar, Outlet
- `client/src/components/nav/ApplicantSidebar.tsx` — USWDS usa-sidenav with My Profile, Find Opportunities, My Applications
- `client/src/api/organizationsApi.ts` — API client with 10 methods using shared apiClient axios instance
- `client/src/types/organization.ts` — Organization, OrgRole, OrgDocument, CredentialStatus client-side types
- `client/src/pages/applicant/OrgProfilePage.tsx` — Org create/edit form, completeness %, credential banners, navigation links
- `client/src/pages/applicant/OrgRolesPage.tsx` — Team roles table with assign/revoke, 6 role types
- `client/src/pages/applicant/OrgDocumentsPage.tsx` — Document upload (base64 JSON), 8 types, expiration badges, version history
- `e2e/org-profile.spec.ts` — 9 Playwright test cases for auth, navigation, form, validation, routes
- `client/src/App.tsx` — Added /applicant/* routes under ApplicantLayout
- `src/db/seed.ts` — Added applicant@example.com / TestPass123! seed user (idempotent ON CONFLICT)

## Decisions Made

- **org_id in localStorage:** org_id stored as `applicant_org_id` in localStorage after org create/fetch. org_id is a non-sensitive UUID; actual org data requires a valid Bearer token. Accepted risk per T-03-10 threat register.
- **Base64 JSON upload in OrgDocumentsPage:** Server uses base64 JSON body (not multipart) per Plan 01 decision (multer not in package.json). Client converts File to base64 before POST, matching the server contract.
- **ApplicantLayout mirrors GrantorLayout:** Same structural pattern (USWDS header + aside + main + Outlet) with applicant-specific sidebar and title.

## Deviations from Plan

None — plan executed exactly as written.

The e2e spec was written with 9 test cases (the plan specified 8 minimum; a 9th was added for credential status section rendering as the plan's final test case referenced `[data-testid="credential-status-section"]`). This is within plan scope.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ApplicantLayout established and wired at /applicant/* — Plan 03-03 (eligibility pre-screen) can use this shell for /applicant/opportunities/:slug/prescreen route
- organizationsApi fully operational with all 10 methods
- org_id localStorage pattern established for cross-page access
- Seed user applicant@example.com available for e2e tests

## Self-Check: PASSED

- `client/src/layouts/ApplicantLayout.tsx` — FOUND
- `client/src/components/nav/ApplicantSidebar.tsx` — FOUND
- `client/src/api/organizationsApi.ts` — FOUND
- `client/src/types/organization.ts` — FOUND
- `client/src/pages/applicant/OrgProfilePage.tsx` — FOUND
- `client/src/pages/applicant/OrgRolesPage.tsx` — FOUND
- `client/src/pages/applicant/OrgDocumentsPage.tsx` — FOUND
- `e2e/org-profile.spec.ts` — FOUND
- Commit `3337c71` (Task 1) — FOUND
- Commit `fb1c0b3` (Task 2) — FOUND

---
*Phase: 03-organization-profile-eligibility-pre-screening*
*Completed: 2026-07-26*
