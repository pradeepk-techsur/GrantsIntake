---
phase: 03-organization-profile-eligibility-pre-screening
verified: 2026-07-26T17:35:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Org profile pre-populates future application forms"
    expected: "When an applicant with a saved org profile navigates to a future application form, legal name, entity type, address, contact name/email should be pre-filled"
    why_human: "Application workspace forms are Phase 4. The org profile is stored and the organizationService.getOrgIdForUser() linkage exists to derive org_id server-side, but no application form yet exists to exercise the pre-population flow. Verify in Phase 4 when workspace forms are built."
  - test: "Credential warning banners appear on org profile page for expired/expiring SAM"
    expected: "Set a past SAM expiration date and save — red 'expired' banner appears. Set a date 30 days from now — yellow 'expiring soon' banner appears. Fresh profile with no date — no banner."
    why_human: "Service-side logic and UI rendering are present (computeExpirationStatus + OrgProfilePage credential-status-section). API auto-check confirms GET /organizations/:id/credential-status returns correct structure. Banner rendering requires visual browser verification."
  - test: "Role-based access enforced at section and submission levels"
    expected: "A contributor cannot submit on behalf of an org. Only org_admin or authorized_representative can submit. Section-level restrictions for finance_contributor apply."
    why_human: "org_admin guard is enforced on PUT /organizations/:id and POST roles. Application section-level RBAC is a Phase 4 concern (workspace forms not yet built). The Phase 3 contract only requires role assignment, not enforcement at section/submission level (those come in Phase 4 when workspaces are built)."
  - test: "ALREADY_SUBMITTED guard (Test 10 from UAT)"
    expected: "Submit pre-screen for an opportunity. Navigate back to the pre-screen page and submit again. Expect 409 — result page loads from stored result via my-result API."
    why_human: "Integration test confirms 409 ALREADY_SUBMITTED fires. PrescreenPage 409 handler now navigates to result page with state:null. PrescreenResultPage fetches getMyResult(). End-to-end flow through browser needed to confirm UX: that navigating to result page after 409 shows the stored result rather than error state."
---

# Phase 3: Organization Profile & Eligibility Pre-Screening — Verification Report

**Phase Goal:** Applicants can create a reusable organization profile with credentials and team roles, and run an eligibility pre-screen to get a clear, explained determination before investing effort in an application

**Verified:** 2026-07-26T17:35:00Z
**Status:** ✅ PASSED
**Re-verification:** No — initial verification

---

## Gate Evidence (pre-established)

- `gate_status: passed` — documented in 03-GATE.md
- `boot_smoke: pass` — ports 3000 and 5173 bound
- `tests: 164/164 pass` — confirmed live run during this verification session
- `build: pass` — npm run build succeeded

Gate findings are cited, not re-litigated.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Applicant org profile can be created (legal name, entity type, UEI, SAM, tax status, contacts, banking readiness, documents) | ✓ VERIFIED | `010_org_profile_schema.sql` — full DDL with all required columns. `organizationService.createOrg()` + `POST /organizations` — substantive, creates org + assigns org_admin role + audit event. `OrgProfilePage.tsx` — complete form with all fields rendered and wired to `organizationsApi.createOrg`. `profile_completeness_pct` computed and displayed as progress bar. |
| 2 | System warns when credentials are expired or within 60-day window (org profile) | ✓ VERIFIED | `computeExpirationStatus()` in `organizationService.ts` (lines 30–43) implements exact 60-day window. `GET /organizations/:id/credential-status` returns `credentials[]` array with `status: 'expired' \| 'expiring_soon' \| 'valid'`. `OrgProfilePage.tsx` (lines 279–315) renders USWDS `usa-alert--error` for expired, `usa-alert--warning` for expiring_soon. Covers SAM expiration + 5 document credential types. |
| 3 | Org admin can assign team members to roles; role enforcement exists | ✓ VERIFIED | `010_org_profile_schema.sql` — `org_roles` table with JSONB `roles` array. `POST /organizations/:id/roles` — `assignRoleSchema` validates UUID + role enum, `verifyOrgAdmin()` guard. `OrgRolesPage.tsx` — UUID_REGEX client-side guard (line 9, 99) closes UAT gap. All 6 roles assignable: org_admin, proposal_lead, contributor, finance_contributor, authorized_representative, external_contributor. Revoke guard prevents self-revoke (T-03-08). |
| 4 | Pre-screen result shows one of four USWDS-styled states with plain-language explanation | ✓ VERIFIED | `prescreeningEvaluationService.ts` — four-state logic: hard blockers → ineligible; ≥3 advisories → needs_attention; ≥1 advisory → likely_eligible; none → eligible. `PrescreenResultPage.tsx` — `alertConfig` maps each state to correct USWDS class: `usa-alert--success`, `--info`, `--warning`, `--error`. `data-testid="prescreen-result-alert"` present. Blocker and advisory sections are separate (lines 132–173). |
| 5 | Pre-screen responses stored in intake record and accessible | ✓ VERIFIED | `011_eligibility_responses_schema.sql` — `eligibility_responses` table with `opportunity_id`, `org_id`, `question_id`, `rule_evaluation_result`, `overall_result`, unique constraint `uq_elig_response`. `evaluateResponses()` INSERTs one row per question (lines 216–231). `GET /workspaces/:id/eligibility-responses` endpoint returns stored responses. `GET /opportunities/:id/prescreening/my-result` endpoint returns reconstructed `EligibilityResult` from stored rows. Integration test confirms rows inserted (Test 8 in applicantPrescreening.test.ts). |

**Score:** 5/5 truths verified

---

### Required Artifacts — Existence, Substance, Wiring

| Artifact | Status | Evidence |
|----------|--------|----------|
| `src/db/migrations/010_org_profile_schema.sql` | ✓ VERIFIED | 92 lines, full DDL for organizations, org_contacts, org_roles, org_attachments |
| `src/db/migrations/011_eligibility_responses_schema.sql` | ✓ VERIFIED | 17 lines, eligibility_responses table with unique constraint |
| `src/services/organization/organizationService.ts` | ✓ VERIFIED | 550 lines — createOrg, updateOrg, getCredentialStatus (60-day logic), uploadDocument, listRoles all implemented |
| `src/routes/organizations.ts` | ✓ VERIFIED | 529 lines — full CRUD for org profile, roles (assign/update/revoke), documents, credential-status. UUID_REGEX guard on all routes |
| `src/services/eligibility/prescreeningEvaluationService.ts` | ✓ VERIFIED | 252 lines — evaluateResponses with all 11 steps, four-state logic, DB INSERT |
| `src/routes/prescreening.ts` | ✓ VERIFIED | 465 lines — applicant GET questionnaire, POST submit, GET my-result, admin eligibility-responses endpoint |
| `client/src/pages/applicant/OrgProfilePage.tsx` | ✓ VERIFIED | 747 lines — full form with all fields, completeness progress bar, credential banners, create/update mutations |
| `client/src/pages/applicant/OrgRolesPage.tsx` | ✓ VERIFIED | 254 lines — UUID_REGEX guard on line 9 + 99 (gap closure confirmed), role table, assign/revoke |
| `client/src/pages/applicant/OrgDocumentsPage.tsx` | ✓ VERIFIED | 405 lines — upload form, base64 conversion, document type slots, expiration badges, version history modal |
| `client/src/pages/applicant/PrescreenPage.tsx` | ✓ VERIFIED | 299 lines — questionnaire render, conditional question logic, yes_no/multiple_choice/text types, 409 handler navigates to result page (gap closure) |
| `client/src/pages/applicant/PrescreenResultPage.tsx` | ✓ VERIFIED | 201 lines — four-state alertConfig, fetching fallback via getMyResult (gap closure), blocker + advisory sections |
| `client/src/layouts/ApplicantLayout.tsx` | ✓ VERIFIED | Auth guard redirects unauthenticated to /login. Sidebar with My Profile, Find Opportunities, My Applications |
| `client/src/api/prescreeningApi.ts` | ✓ VERIFIED | getQuestionnaire, submitResponses, getMyResult — all wired |
| `tests/integration/applicantPrescreening.test.ts` | ✓ VERIFIED | 551 lines — Tests 1–8 + Test 6 (409 ALREADY_SUBMITTED). 164/164 tests pass |

---

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| `PrescreenPage.tsx` | `prescreeningApi.ts` | `prescreeningApi.getQuestionnaire(opportunityId)` | ✓ WIRED — line 47 |
| `PrescreenPage.tsx` | `prescreeningApi.ts` | `prescreeningApi.submitResponses(opportunityId, responsesArray)` | ✓ WIRED — line 114 |
| `PrescreenPage.tsx` | `PrescreenResultPage.tsx` | `navigate(…/prescreen/result, { state: result })` + 409 navigate with `state: null` | ✓ WIRED — lines 118, 123 |
| `PrescreenResultPage.tsx` | `prescreeningApi.getMyResult` | `useEffect` → `prescreeningApi.getMyResult(opportunityId).then(setResult)` | ✓ WIRED — lines 61–70 |
| `prescreening.ts` (submit route) | `prescreeningEvaluationService.evaluateResponses` | `prescreeningEvaluationService.evaluateResponses(opportunity_id, orgId, parsed.data.responses)` | ✓ WIRED — line 295 |
| `prescreeningEvaluationService.ts` | `eligibility_rules` table | `pool.query SELECT FROM eligibility_rules WHERE opportunity_id` | ✓ WIRED — line 75 |
| `prescreeningEvaluationService.ts` | `eligibility_responses` table | `INSERT INTO eligibility_responses` in transaction | ✓ WIRED — line 216 |
| `OrgRolesPage.tsx` | UUID_REGEX guard | `UUID_REGEX.test(newUserId.trim())` before API call | ✓ WIRED — lines 9, 99 (gap closure confirmed) |
| `OrgProfilePage.tsx` | `organizationsApi.getCredentialStatus` | `useQuery({ queryFn: () => organizationsApi.getCredentialStatus(orgId!) })` | ✓ WIRED — lines 106–111 |
| `LoginPage.tsx` | role-based routing | `const isGrantorAdmin = result.user?.roles?.includes('grantor_admin'); navigate(isGrantorAdmin ? '/grantor/dashboard' : '/applicant/profile')` | ✓ WIRED — lines 24–26 (gap closure confirmed) |

---

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| PRD-INTAKE-019 (org profile creation) | ✓ SATISFIED | organizations table + POST /organizations + OrgProfilePage |
| PRD-INTAKE-020 (credential expiration warnings) | ✓ SATISFIED | getCredentialStatus() 60-day logic + credential banners in UI |
| PRD-INTAKE-021 (team roles) | ✓ SATISFIED | org_roles table + roles API + OrgRolesPage |
| PRD-INTAKE-022 (document library) | ✓ SATISFIED | org_attachments table + documents API + OrgDocumentsPage |
| PRD-INTAKE-023 (authorized representatives) | ✓ SATISFIED | authorized_representative role in org_roles; org_contacts with contact_type |
| PRD-INTAKE-024 (banking readiness) | ✓ SATISFIED | banking_readiness field in organizations table + form field |
| PRD-INTAKE-025 (pre-screen questionnaire) | ✓ SATISFIED | PrescreenPage with conditional logic + submit flow |
| PRD-INTAKE-026 (four-state result) | ✓ SATISFIED | alertConfig with 4 USWDS alert classes + data-testid="prescreen-result-alert" |
| PRD-INTAKE-027 (blocker explanation) | ✓ SATISFIED | All hard blockers shown in separate section (not just first); advisory section separate |
| PRD-INTAKE-029 (stored responses) | ✓ SATISFIED | eligibility_responses table + INSERT in evaluateResponses + GET my-result endpoint |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `client/src/App.tsx` | 71 | `<div><h1>Intake Queue</h1><p>Coming in Phase 6.</p></div>` | ℹ️ Info | Expected — intake queue is Phase 6 scope. Admin API endpoint for eligibility responses exists (`GET /workspaces/:id/eligibility-responses`). UI placeholder is intentional per ROADMAP. |
| `client/src/App.tsx` | 58 | `<p>Coming in Phase 4.</p>` (My Applications) | ℹ️ Info | Expected — application workspace is Phase 4 scope. |
| `return null` usages | Various | `return null` in getStoredOrgId(), null coercion | ℹ️ Info | All are legitimate null-guards (missing org → redirect, no expiration date → null, not found → null). Not stubs. |

No blockers found.

---

### UAT Gap Status (from 03-UAT.md + re-drives)

| Gap | Status | Evidence |
|-----|--------|----------|
| Test 1: Login routing to applicant portal | ✅ CLOSED | `LoginPage.tsx` line 24–26: `isGrantorAdmin` check routes applicants to `/applicant/profile`. Commit confirmed in git log. |
| Test 4: OrgRoles 422 on email input | ✅ CLOSED | `OrgRolesPage.tsx` UUID_REGEX guard lines 9, 99 — fires before API call with user-friendly message. Re-driven confirmation from prompt. |
| Test 9: Pre-screen result not displayed | ✅ CLOSED | `PrescreenResultPage.tsx` fetches `getMyResult` in useEffect when `location.state` is null. `GET /opportunities/:id/prescreening/my-result` endpoint in `prescreening.ts` (lines 320–421) reconstructs EligibilityResult from stored rows. `PrescreenPage.tsx` 409 handler navigates to result page instead of dead-end error. Re-driven confirmation from prompt. |

---

### Human Verification Required

#### 1. Profile Pre-Population in Application Forms

**Test:** Create an org profile. Proceed to Phase 4 application workspace form.
**Expected:** Legal name, entity type, address, and contact fields should pre-populate from the stored org profile.
**Why human:** Application workspace forms are Phase 4 artifacts. The org profile storage and `getOrgIdForUser()` linkage exist, but no application form is available yet to verify pre-population.

#### 2. Credential Warning Banners (Visual)

**Test:** Set `sam_expiration_date` to yesterday → save → reload org profile. Then set to 30 days from now → save → reload.
**Expected:** Red USWDS error alert for expired. Yellow USWDS warning alert for expiring soon.
**Why human:** API logic and UI rendering are both present but visual rendering requires browser verification.

#### 3. Section/Submission RBAC Enforcement

**Test:** Log in as a contributor (not org_admin). Attempt to update an org profile.
**Expected:** 403 PERMISSION_DENIED returned.
**Why human:** Application section-level RBAC is Phase 4. Phase 3 only requires role assignment. The server-side `verifyOrgAdmin` guard on `PUT /organizations/:id` is verified programmatically but full section/submission enforcement needs Phase 4 workspace context.

#### 4. ALREADY_SUBMITTED Guard — End-to-End Flow

**Test:** Submit pre-screen for an opportunity. Navigate back to `/applicant/opportunities/:id/prescreen` and submit again.
**Expected:** 409 fires server-side → client navigates to result page → `getMyResult` API fetches stored result → result state renders correctly.
**Why human:** Integration test confirms 409 ALREADY_SUBMITTED fires (Test 6 in applicantPrescreening.test.ts). The 409 navigation fix is code-confirmed in PrescreenPage.tsx lines 121–124. Full UX flow through browser confirms the stored result renders in PrescreenResultPage.

---

### Gaps Summary

No gaps found. All five success criteria are substantively implemented:

1. **Org profile creation** — Full schema, service, routes, and UI. Completeness percentage tracked. Profile linked to user via org_roles.

2. **Credential warnings** — 60-day window logic in organizationService; USWDS alert banners in OrgProfilePage. Workspace checklist component is Phase 4 (not in Phase 3 scope).

3. **Team roles** — Full role assignment with UUID validation (gap fixed), revoke with self-revoke guard. All 6 role types supported. org_admin gate on modification operations.

4. **Four-state pre-screen result** — Complete USWDS alert mapping, plain-language next_step text, separate blocker and advisory sections. Both navigation paths to result page work (fresh submit → location.state; 409 or direct access → getMyResult API).

5. **Responses stored and accessible** — eligibility_responses persisted per question. GET my-result reconstructs EligibilityResult for the applicant. Admin GET /workspaces/:id/eligibility-responses endpoint returns stored rows (intake queue UI deferred to Phase 6 per ROADMAP — the API endpoint is the Phase 3 deliverable).

---

_Verified: 2026-07-26T17:35:00Z_
_Verifier: Claude (pivota_spec-verifier)_
