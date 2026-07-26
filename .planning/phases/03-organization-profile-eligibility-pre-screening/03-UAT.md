---
status: diagnosed
phase: 03-organization-profile-eligibility-pre-screening
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-07-26T14:30:00Z
updated: 2026-07-26T14:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Login & Portal Access
expected: Visit the app URL. Without logging in, go to /applicant/profile — you should be redirected to /login. Log in with applicant@example.com / TestPass123! and you should see the applicant portal with a sidebar nav containing: My Profile, Find Opportunities, My Applications.
result: issue
reported: "I am able to access the Grantor portal, but upon accessing do not find any of the options mentioned. I only see Intake Queue in the left sidebar navigation."
severity: major

### 2. Create Organization Profile
expected: On the My Profile page (/applicant/profile), you should see a form to create an org profile. Fill in: Legal Name, Entity Type (dropdown), Address, City, State, ZIP, Primary Contact Name, Email, and Phone. Submit the form. You should see a completeness percentage appear (e.g. "Profile 42% complete") and the form should switch to edit mode showing the saved data.
result: pass

### 3. Credential Warning Banners
expected: On the org profile page, if SAM registration is expired or expiring within 60 days, a USWDS banner (red for expired, yellow/warning for expiring soon) should appear. For a fresh profile with no SAM expiration date set, no banner should show. Set a past SAM expiration date and save — the expired banner should appear.
result: pass

### 4. Team Roles (OrgRolesPage)
expected: From the org profile page, click the "Roles" link to go to /applicant/profile/roles. You should see a table of team members. There should be an option to assign a role (org_admin, proposal_lead, contributor, finance_contributor, authorized_representative, read_only). Assigning a role should add a row to the table.
result: issue
reported: "Request failed with status code 422 when adding a new user"
severity: major

### 5. Document Upload (OrgDocumentsPage)
expected: From the org profile page, click the "Documents" link to go to /applicant/profile/documents. You should see upload slots for standard document types (IRS Determination Letter, Articles of Incorporation, etc.). Upload a small file (any type under 25 MB). The document should appear in the list with an upload date and an expiration status badge.
result: pass

### 6. Find Opportunities (Public Portal)
expected: Click "Find Opportunities" in the sidebar. You should see /applicant/opportunities with a searchable list of published opportunities. If no opportunities are published yet, you should see an empty state or "No opportunities found" message — not an error.
result: pass

### 7. Opportunity Detail & Check Eligibility Link
expected: From the opportunities list, click on a published opportunity. On the detail page (/applicant/opportunities/:slug), you should see a "Check Eligibility" button or link (data-testid="check-eligibility-link"). Clicking it should navigate to the pre-screen questionnaire page for that opportunity.
result: pass

### 8. Eligibility Pre-Screen Questionnaire
expected: On the pre-screen page for an opportunity, you should see a questionnaire with yes/no, multiple-choice, or text questions. Conditional questions (those dependent on a previous answer) should only appear when their trigger condition is met. All questions must be answered before submitting.
result: pass

### 9. Pre-Screen Result — Four States
expected: After submitting the pre-screen questionnaire, you should be taken to /applicant/prescreen/result showing one of four USWDS-styled result states: Eligible (green success alert), Likely Eligible (blue info alert), Needs Attention (yellow warning alert), or Ineligible (red error alert). The result should include a plain-language explanation of which responses triggered any blocker or warning rules.
result: issue
reported: "did not see any state"
severity: major

### 10. ALREADY_SUBMITTED Guard
expected: Try to submit the pre-screen questionnaire for the same opportunity a second time (navigate back to the pre-screen page and submit again). The system should return a "Already submitted" error (409 conflict) and prevent duplicate submission — the previous result should remain stored.
result: skipped
reason: Could not reach test 9 result page due to ALREADY_SUBMITTED from test API call that consumed the submission slot; test 9 issue diagnosed instead

## Summary

total: 10
passed: 6
issues: 4
pending: 0
skipped: 1

## Self-Check

boot: 404 (backend at :3000 booted — 404 on / is expected for API-only root)
preview-path: 200 (frontend at :5173 reachable via preview proxy at :7777/preview/5173/)
routes_probed: 4 ok / 0 failed
cookie: n/a (JWT in Authorization header, httpOnly refresh cookie — no SameSite issue for API-first flow; frontend uses localStorage for accessToken per Phase 1 decision)
e2e: skipped (Playwright config targets localhost:3000 but native dev frontend is at 5173 — e2e tests designed for docker compose where backend serves built frontend; in native dev mode the browser tests cannot reach the React SPA at 3000)
per_test:
  - test: 1
    verdict: advisory
    note: "🤖 Auto-check: GET http://127.0.0.1:5173/applicant/profile returned 200 (SPA serves page); redirect logic is client-side (React Router + Zustand auth guard). Cannot verify redirect without browser. Screenshot captured: .pivota/uat-shots/2-applicant-profile.png"
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: POST /api/v1/organizations with valid fields (legal_name, entity_type=nonprofit_501c3, ein=9-digits, uei=12-alphanum, address, contact fields) → 201 with org_id and profile_completeness_pct=100. API functional."
  - test: 3
    verdict: skipped (needs human)
    note: "🤖 Auto-check: GET /api/v1/organizations/:id/credential-status returns {credentials:[]} for fresh org. UI banner rendering requires browser."
  - test: 4
    verdict: skipped (needs human)
    note: "🤖 Auto-check: GET /api/v1/organizations/:id/roles returns role rows. UI table rendering requires browser."
  - test: 5
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Document upload endpoint present. File upload and version history UI requires browser."
  - test: 6
    verdict: advisory
    note: "🤖 Auto-check: GET /api/v1/opportunities?status=published → empty array (0 published opportunities in DB). Find Opportunities page will show empty state — not an error."
  - test: 7
    verdict: advisory
    note: "🤖 Auto-check: No published opportunities exist. Cannot verify Check Eligibility link without a published opportunity. The OpportunityDetailPage source confirms data-testid=check-eligibility-link is implemented."
  - test: 8
    verdict: advisory
    note: "🤖 Auto-check: No opportunities or prescreening questionnaires in DB. Pre-screen flow cannot be exercised via API without seed data."
  - test: 9
    verdict: advisory
    note: "🤖 Auto-check: prescreeningEvaluationService confirmed implemented with four-state logic. Cannot test end-to-end without a published opportunity + questionnaire."
  - test: 10
    verdict: advisory
    note: "🤖 Auto-check: POST /api/v1/opportunities/:id/prescreening/submit returns 409 ALREADY_SUBMITTED on duplicate (integration tests confirm). Requires opportunity + questionnaire data to test."

## Gaps

- truth: "After logging in as an applicant user, the user should land on the applicant portal with My Profile, Find Opportunities, and My Applications sidebar navigation"
  status: failed
  reason: "User reported: I am able to access the Grantor portal, but upon accessing do not find any of the options mentioned. I only see Intake Queue in the left sidebar navigation."
  severity: major
  test: 1
  source: user
  root_cause: "LoginPage.tsx always redirects to /grantor/dashboard on successful login (line 24: navigate('/grantor/dashboard')). There is no role-based routing — applicant users are sent to the grantor dashboard which shows the grantor sidebar (Intake Queue) instead of the applicant portal. Fix: update LoginPage to check user roles after login and navigate applicant users (no grantor_admin role) to /applicant/profile."
  artifacts:
    - path: "client/src/pages/auth/LoginPage.tsx"
      issue: "Line 24: navigate('/grantor/dashboard', {replace: true}) is hardcoded — no role check; applicant users land on the grantor portal"
  missing:
    - "Update LoginPage post-login redirect to check user.roles — if roles includes grantor_admin route to /grantor/dashboard, otherwise route to /applicant/profile"
  debug_session: ""
  fixed_in_commit: "39f45a9 — LoginPage now routes grantor_admin to /grantor/dashboard, others to /applicant/profile"

- truth: "Org admin can assign a role to another user on the team roles page"
  status: failed
  reason: "User reported: Request failed with status code 422 when adding a new user"
  severity: major
  test: 4
  source: user
  root_cause: "assignRoleSchema at src/routes/organizations.ts:58 validates user_id with z.string().uuid(). OrgRolesPage.tsx handleAssignSubmit (lines 90-102) only checks for empty string — no client-side UUID format validation. User typed an email address, server returned 422 with no actionable message surfaced in the UI."
  artifacts:
    - path: "src/routes/organizations.ts"
      issue: "Line 58: user_id: z.string().uuid() — rejects any non-UUID value with 422 VALIDATION_ERROR"
    - path: "client/src/pages/applicant/OrgRolesPage.tsx"
      issue: "Lines 90-102: handleAssignSubmit only checks for empty string — no client-side UUID regex validation before calling assignMutation.mutate"
  missing:
    - "Add client-side UUID regex validation in handleAssignSubmit (OrgRolesPage.tsx ~line 93) before API call — set formError with clear message if format is wrong"
    - "Consider adding GET /api/v1/users/lookup?email=... and updating form to accept email with server-side UUID resolution"
  debug_session: ""

- truth: "After submitting the pre-screen questionnaire, the user is taken to the result page showing one of four USWDS-styled result states (Eligible/Likely Eligible/Needs Attention/Ineligible)"
  status: failed
  reason: "User reported: did not see any state — result page showed fallback 'Result not available' message"
  severity: major
  test: 9
  source: user
  root_cause: "PrescreenResultPage receives EligibilityResult only via React Router location.state (set by PrescreenPage on successful submit). When the ALREADY_SUBMITTED 409 fires (e.g. duplicate submission or API test call consumed the slot), the submit handler shows an inline error and never navigates to the result page. Additionally, the result page has no fallback fetch — it cannot retrieve a previously stored result from the API, so users who navigate directly or whose session reloaded after submission see only the fallback. Fix: (1) add GET /api/v1/opportunities/:id/prescreening/my-result endpoint returning stored result for the authenticated user+org, (2) PrescreenResultPage fetches this on mount when location.state is null."
  artifacts:
    - path: "client/src/pages/applicant/PrescreenResultPage.tsx"
      issue: "Fallback path (no location.state) shows 'Result not available' with no API fetch — stored results are unretrievable"
    - path: "client/src/pages/applicant/PrescreenPage.tsx"
      issue: "409 ALREADY_SUBMITTED handler shows inline error but does not navigate to result — user cannot see their result after a reload"
    - path: "src/routes/prescreening.ts"
      issue: "No GET endpoint for applicant to retrieve their own stored eligibility result for an opportunity"
  missing:
    - "Add GET /api/v1/opportunities/:id/prescreening/my-result endpoint (authenticate, return stored eligibility_responses for user's org + opportunity)"
    - "Update PrescreenResultPage to fetch stored result via this endpoint when location.state is null"
    - "Update PrescreenPage 409 handler to navigate to result page (the result is still stored and retrievable)"
  debug_session: ""



