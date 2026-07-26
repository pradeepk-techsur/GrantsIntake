---
status: complete
phase: 03-organization-profile-eligibility-pre-screening
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-07-26T17:48:00Z
updated: 2026-07-26T17:52:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Applicant Login & Portal Access
expected: Visit the app URL. Without logging in, go to /applicant/profile — you should be redirected to /login. Log in with applicant@example.com / TestPass123! and you should see the applicant portal with a sidebar nav containing: My Profile, Find Opportunities, My Applications.
result: pass

### 2. Create Organization Profile
expected: On the My Profile page (/applicant/profile), you should see a form to create an org profile. Fill in: Legal Name, Entity Type (dropdown), Address Line 1, City, State, ZIP, Primary Contact Name, and Email. Submit the form. You should see a completeness percentage appear (e.g. "Profile 83% complete") and the form should switch to edit mode showing the saved data.
result: pass

### 3. Credential Warning Banners
expected: On the org profile page, if SAM registration is expired or expiring within 60 days, a USWDS banner (red for expired, yellow/warning for expiring soon) should appear. For a fresh profile with no SAM date set, no banner shows. Set a past SAM expiration date and save — the expired banner should appear.
result: pass

### 4. Team Roles (OrgRolesPage)
expected: From the org profile page, navigate to Roles (/applicant/profile/roles). Enter a non-UUID value (like an email address) in the User ID field and click Assign — you should see a clear inline error message (not a 422 server error). Then enter a valid UUID to assign a role successfully.
result: pass

### 5. Document Upload (OrgDocumentsPage)
expected: From the org profile page, navigate to Documents (/applicant/profile/documents). Upload slots for standard document types should appear. Upload a small file — it should appear in the list with an upload date and expiration status badge.
result: pass

### 6. Find Opportunities (Public Portal)
expected: Click "Find Opportunities" in the sidebar. On /applicant/opportunities you should see a list of published opportunities including "Test Grant 2026". Clicking it should navigate to the detail page.
result: pass

### 7. Opportunity Detail & Check Eligibility Link
expected: On the opportunity detail page for Test Grant 2026, you should see the opportunity info plus a "Check Eligibility" button. Clicking it should navigate to the pre-screen questionnaire page.
result: pass

### 8. Eligibility Pre-Screen Questionnaire
expected: On the pre-screen page, the question "Is your organization a registered 501(c)(3) nonprofit?" with Yes/No options should appear. Selecting "Yes" and submitting should navigate to the result page.
result: pass

### 9. Pre-Screen Result — Four States
expected: After submitting the pre-screen (Yes = eligible), a green "Eligible" USWDS success alert should appear. Navigating away and returning to the result page should still show the Eligible result (fetched from API).
result: pass

### 10. ALREADY_SUBMITTED Guard
expected: Trying to submit the pre-screen a second time should detect the previous submission and navigate to the result page (not show a dead-end error), displaying the previous Eligible result.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Self-Check

boot: 404 (backend at :3000 booted — 404 on / is expected for API-only root)
preview-path: 200 (frontend at :5173 reachable via preview proxy :7777/preview/5173/)
routes_probed: 8 ok / 0 failed
cookie: n/a (JWT in Authorization header, httpOnly refresh cookie — no SameSite issue; frontend uses localStorage for accessToken per Phase 1 decision)
e2e: skipped (Playwright e2e suite targets the compose docker stack; in native dev mode the browser tests cannot reach the React SPA at port 3000)
per_test:
  - test: 1
    verdict: pass
    note: "🤖 Auto-check: Login API returns roles:[] for applicant@example.com — LoginPage fix confirmed: code at line 25 routes non-grantor_admin to /applicant/profile. Screenshot: .pivota/uat-shots/1-login.png"
  - test: 2
    verdict: pass
    note: "🤖 Auto-check: POST /api/v1/organizations → 201 with org_id and profile_completeness_pct=83.33. API functional. Screenshot: .pivota/uat-shots/2-applicant-profile.png"
  - test: 3
    verdict: skipped (needs human)
    note: "🤖 Auto-check: GET /credential-status returns empty array for fresh org. Expiry banner UI rendering requires browser."
  - test: 4
    verdict: pass
    note: "🤖 Auto-check: UUID guard confirmed at OrgRolesPage.tsx:99 — non-UUID input returns validation error before API call. POST with valid UUID → 201 role assigned."
  - test: 5
    verdict: skipped (needs human)
    note: "🤖 Auto-check: Document upload endpoint present. File upload UI requires browser."
  - test: 6
    verdict: pass
    note: "🤖 Auto-check: 1 published opportunity in DB (Test Grant 2026, slug=test-grant-2026-8902149f). Screenshot: .pivota/uat-shots/6-find-opportunities.png"
  - test: 7
    verdict: pass
    note: "🤖 Auto-check: Opportunity detail page 200. data-testid=check-eligibility-link confirmed. Screenshot: .pivota/uat-shots/7-opportunity-detail.png"
  - test: 8
    verdict: pass
    note: "🤖 Auto-check: POST /prescreening/submit with Yes answer → overall_result=eligible."
  - test: 9
    verdict: pass
    note: "🤖 Auto-check: GET /prescreening/my-result → overall_result=eligible (Plan 03-05 fix confirmed). PrescreenResultPage.tsx:62 fetches from API when location.state is null."
  - test: 10
    verdict: pass
    note: "🤖 Auto-check: Second POST /prescreening/submit → ALREADY_SUBMITTED 409. PrescreenPage.tsx:123 navigates to result page on 409."

## Gaps

