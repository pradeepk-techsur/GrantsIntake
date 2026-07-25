---
phase: 02-eligibility-intake-rules-configuration
verified: 2026-07-25T23:35:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gate_evidence:
  gate_status: passed
  boot_smoke: pass
  test_count: 139
  waves_passed: 3
  gap_closure_plan: 02-04
  gaps_cited_from_uat:
    - "OpportunitiesIndex placeholder (never fetched opportunities) — CLOSED by plan 02-04"
    - "POST /opportunities/:id/publish bypassed publicationService (null public_slug) — CLOSED by plan 02-04"
    - "GET /programs/:programId/opportunities route missing — CLOSED during gap redrive"
---

# Phase 2: Eligibility, Intake Rules & Configuration Verification Report

**Phase Goal:** Grantors can define enforceable eligibility rules, configure pre-screening questionnaires, set attachment requirements and administrative screening criteria, and publish opportunities to an applicant-facing portal with search and discovery

**Verified:** 2026-07-25T23:35:00Z
**Status:** ✓ PASSED
**Re-verification:** No — this is a gap-closure re-run after plans 02-01, 02-02, 02-03 (initial) and 02-04 (gap closure). Gate confirms `gate_status: passed`, `boot_smoke: pass`, 139/139 tests pass.

---

## Gate Evidence (Mandatory Inputs)

| Signal | Value | Effect |
|--------|-------|--------|
| gate_status | **passed** | No blocker |
| boot_smoke | **pass** | No blocker |
| 02-REVIEW.md | Not present | No blocker — gate supersedes |
| review_blockers_open | 0 (no REVIEW.md) | No blocker |

All UAT gaps from 02-UAT.md were confirmed closed by plan 02-04 via gap-redrive API reproductions (GATE.md, wave gap1). No gate findings remain unresolved.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Grantor can define eligibility rules (applicant type, geography, entity status, UEI/SAM, match requirements, program-specific criteria) and designate as hard blocker or advisory | ✓ VERIFIED | `EligibilityRuleBuilder.tsx` renders all 10 rule types; `eligibilityService.ts` persists with IDOR guard; DB constraint `chk_enforcement_point` enforced at `eligibility_rules` level |
| 2 | Grantor can build pre-screening questionnaire with conditional question logic that maps responses to eligibility rule outcomes | ✓ VERIFIED | `PrescreeningBuilder.tsx` supports yes_no/multiple_choice/text; conditional_display JSONB in `prescreening_questions`; option-to-rule mapping via `mapped_rule_id` FK; preview modal calls `/prescreening/preview` |
| 3 | Grantor can configure conditional forms/sections, required attachment types by applicant type and stage, and administrative screening criteria | ✓ VERIFIED | `ConditionalSectionConfig.tsx`, `AttachmentRequirementsConfig.tsx`, `ScreeningCriteriaConfig.tsx` all wired in `OpportunityBuilder.tsx`; auto-criteria locked (403 on DELETE); migration 008 tables confirmed |
| 4 | Unauthenticated applicant can browse published opportunities with search/filters (funder, program area, geography, eligibility type, funding amount, deadline, keyword) and view public opportunity detail pages | ✓ VERIFIED | `/opportunities` route in `App.tsx`; `OpportunityListPage.tsx` fetches `GET /api/v1/opportunities`; `SearchFilters.tsx` has all 8 facet types; `publicOpportunitiesRouter` enforces status='published'; detail page at `/opportunities/:slug` with breadcrumbs; `OpportunityCard.tsx` with status badges |
| 5 | Applicants with in-progress applications see opportunity changes, addenda, Q&A updates, and deadline changes displayed on opportunity page | ✓ VERIFIED | `AddendaTimeline.tsx` fetches `/api/v1/opportunities/:id/addenda`; renders reverse-chron with "Updated" badge (14-day window), "Required Change" banner for `is_required_change=true`, and before/after deadline parsing for `date_change` type; `addendaService.ts` immutable (DELETE returns 405) |

**Score: 5/5 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/migrations/006_eligibility_schema.sql` | eligibility_rules with chk_enforcement_point | ✓ VERIFIED | `CREATE TABLE eligibility_rules` + `CONSTRAINT chk_enforcement_point` confirmed |
| `src/db/migrations/007_prescreening_schema.sql` | prescreening tables with mapped_rule_id FK | ✓ VERIFIED | `prescreening_questionnaires`, `prescreening_questions`, `prescreening_options` with `mapped_rule_id FK eligibility_rules` |
| `src/db/migrations/008_conditional_and_intake_schema.sql` | section_condition_configs, attachment_requirements, screening_criteria | ✓ VERIFIED | All 3 CREATE TABLE statements confirmed |
| `src/db/migrations/009_addenda_schema.sql` | addenda table with idx_addenda_published_at | ✓ VERIFIED | Table + compound index confirmed; public_slug already existed in prior migration |
| `src/types/eligibility.ts` | EligibilityRule, PrescreeningQuestionnaire, PrescreeningQuestion, PrescreeningOption | ✓ VERIFIED | All 4 interfaces exported; `enforcement_point?` optional field present |
| `src/types/intakeConfig.ts` | AttachmentRequirement, ScreeningCriterion, SectionConditionConfig | ✓ VERIFIED | All 3 interfaces exported |
| `src/services/eligibility/eligibilityService.ts` | CRUD with audit trail | ✓ VERIFIED | ELIGIBILITY_RULE_CREATED/UPDATED/DELETED audit events on all mutations; IDOR guard in update/delete |
| `src/services/eligibility/prescreeningService.ts` | Questionnaire CRUD + preview | ✓ VERIFIED | get (nested), upsert (transactional), preview methods present |
| `src/services/eligibility/sectionConditionService.ts` | Section condition CRUD | ✓ VERIFIED | list, upsert (ON CONFLICT), delete present |
| `src/services/eligibility/attachmentRequirementService.ts` | Attachment requirement CRUD | ✓ VERIFIED | list, create (with validation), update (IDOR T-02-09), delete |
| `src/services/eligibility/screeningCriteriaService.ts` | Screening criteria with auto-protection | ✓ VERIFIED | 403 returned on auto-criteria delete at service layer |
| `src/services/opportunity/publicationService.ts` | publish flow with public_slug + OPPORTUNITY_PUBLISHED audit | ✓ VERIFIED | `generateUniqueSlug()` + UPDATE with public_slug + OPPORTUNITY_PUBLISHED audit event present |
| `src/services/opportunity/addendaService.ts` | Immutable addenda with version_number | ✓ VERIFIED | list, create (with version_number auto-increment), no delete path |
| `src/services/opportunity/searchService.ts` | Full-text + faceted search | ✓ VERIFIED | `to_tsvector` / `plainto_tsquery` / `@@` operator; all 8 facets (keyword, funder, program_area, geography, eligibility_type, funding_min/max, due_date, application_stage); 3 sort modes; pagination |
| `src/routes/eligibility.ts` | GET/POST/PUT/DELETE eligibility-rules | ✓ VERIFIED | `eligibilityService.list/create/update/delete` calls confirmed |
| `src/routes/prescreening.ts` | GET/PUT/POST prescreening endpoints | ✓ VERIFIED | `prescreeningService.get/upsert/preview` calls confirmed |
| `src/routes/attachmentRequirements.ts` | CRUD attachment-requirements | ✓ VERIFIED | `attachmentRequirementService.list/create/update/delete` calls confirmed |
| `src/routes/screeningCriteria.ts` | CRUD with auto-criteria protection | ✓ VERIFIED | 403 path for auto criteria confirmed |
| `src/routes/sectionConditions.ts` | PUT/GET/DELETE section conditions | ✓ VERIFIED | Registered in server.ts |
| `src/routes/publicOpportunities.ts` | GET /opportunities (search), GET /opportunities/:id (detail), GET /opportunities/:id/workspace-status | ✓ VERIFIED | All 3 endpoints present; `WHERE status='published'` enforced; 404 for unpublished; workspace-status returns start/continue/closed |
| `src/routes/addenda.ts` | GET/POST addenda; DELETE → 405 | ✓ VERIFIED | 405 METHOD_NOT_ALLOWED on DELETE confirmed |
| `client/src/pages/grantor/opportunities/EligibilityRuleBuilder.tsx` | Rule builder with USWDS Error/Warning alert styling | ✓ VERIFIED | `usa-alert--error` for hard_blocker, `usa-alert--warning` for advisory; all 10 rule types; enforcement_point required client-side validation |
| `client/src/pages/grantor/opportunities/PrescreeningBuilder.tsx` | Questionnaire builder with conditional logic + preview modal | ✓ VERIFIED | yes_no/multiple_choice/text; conditional_display toggle; option-to-rule mapping; preview modal fetch to `/prescreening/preview` |
| `client/src/pages/grantor/opportunities/ConditionalSectionConfig.tsx` | Section condition editor | ✓ VERIFIED | Fetches GET conditions, PUT upsert, DELETE; section_key + conditions array |
| `client/src/pages/grantor/opportunities/AttachmentRequirementsConfig.tsx` | Attachment requirements config UI | ✓ VERIFIED | stage_scope (pre_application/loi/full_application), document_type select, applicant type scope checkboxes, grouped table |
| `client/src/pages/grantor/opportunities/ScreeningCriteriaConfig.tsx` | Screening criteria with locked auto-criteria | ✓ VERIFIED | Auto criteria split out; lock icon with `aria-label="System criterion — cannot be deleted"`; manual list with delete |
| `client/src/pages/grantor/OpportunitiesIndex.tsx` | Fetches GET /programs/:programId/opportunities + renders cards | ✓ VERIFIED | `apiClient.get('/programs/${programId}/opportunities')` in useEffect; `setOpportunities` state; conditional render (loading → empty → card list) |
| `client/src/pages/applicant/OpportunityListPage.tsx` | Applicant search page with USWDS cards | ✓ VERIFIED | `fetch('/api/v1/opportunities?...')` on filter change; SearchFilters + OpportunityCard rendered |
| `client/src/pages/applicant/OpportunityDetailPage.tsx` | Public detail page with CTA | ✓ VERIFIED | Fetches opportunity by slug + workspace-status; eligibility rules grouped by severity; AddendaTimeline; context-aware CTA (sign_in/start/continue/closed) |
| `client/src/pages/applicant/components/OpportunityCard.tsx` | USWDS card with status badges | ✓ VERIFIED | STATUS_BADGE_CONFIG maps open/closing_soon/closed/not_yet_open to USWDS tag classes |
| `client/src/pages/applicant/components/SearchFilters.tsx` | Filter accordion with all facets | ✓ VERIFIED | keyword, funder, program_area, geography, eligibility_type, funding_min/max, due_date_from/to, sort_by present |
| `client/src/pages/applicant/components/AddendaTimeline.tsx` | Addenda timeline with type badges + date-change parsing | ✓ VERIFIED | isRecent() 14-day check; Required Change warning; date_change before/after parsing via regex; "Updated" badge |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/routes/eligibility.ts` | `src/services/eligibility/eligibilityService.ts` | service method calls | ✓ WIRED | `eligibilityService.list/create/update/delete` calls confirmed at lines 108, 155, 207, 235 |
| `src/services/eligibility/eligibilityService.ts` | audit_events table | INSERT on CRUD | ✓ WIRED | `ELIGIBILITY_RULE_CREATED`, `_UPDATED`, `_DELETED` INSERT statements at lines 107, 247, 309 |
| `src/routes/prescreening.ts` | `src/services/eligibility/prescreeningService.ts` | service calls | ✓ WIRED | `prescreeningService.get/upsert/preview` at lines 89, 139, 177 |
| `src/routes/attachmentRequirements.ts` | `attachmentRequirementService` | service calls | ✓ WIRED | All 4 CRUD methods wired |
| `src/routes/screeningCriteria.ts` | `screeningCriteriaService` | 403 on auto delete | ✓ WIRED | `AUTO_CRITERION_PROTECTED` 403 at route line 147 |
| `src/routes/opportunities.ts` publish handler | `src/services/opportunity/publicationService.ts` | `publicationService.publish()` | ✓ WIRED | Lines 447-448: `const publishedOpp = await publicationService.publish(id, req.user!.user_id)` |
| `client/src/pages/grantor/OpportunitiesIndex.tsx` | `/api/v1/programs/:programId/opportunities` | apiClient.get in useEffect | ✓ WIRED | Lines 54-55: `apiClient.get('/programs/${programId}/opportunities')` |
| `client/src/pages/grantor/opportunities/EligibilityRuleBuilder.tsx` | `/api/v1/opportunities/:id/eligibility-rules` | fetch in useEffect + handlers | ✓ WIRED | Lines 108, 258, 276: fetch to eligibility-rules endpoints |
| `client/src/pages/applicant/OpportunityListPage.tsx` | `/api/v1/opportunities` | fetch with search params | ✓ WIRED | Lines 44, 67: `buildSearchUrl(searchParams)` → `fetch(...)` |
| `client/src/pages/applicant/OpportunityDetailPage.tsx` | `/api/v1/opportunities/:id` | fetch on mount | ✓ WIRED | Line 122: `fetch('/api/v1/opportunities/${slug}')` |
| `client/src/pages/applicant/OpportunityDetailPage.tsx` | `/api/v1/opportunities/:id/addenda` | via AddendaTimeline | ✓ WIRED | AddendaTimeline line 81: `fetch('/api/v1/opportunities/${opportunityId}/addenda')` |
| `client/src/pages/grantor/opportunities/ConditionalSectionConfig.tsx` | `/api/v1/opportunities/:id/sections/conditions` | fetch | ✓ WIRED | Lines 78, 145, 181 |
| `src/services/opportunity/searchService.ts` | opportunities table (GIN index) | `to_tsvector/plainto_tsquery/@@` | ✓ WIRED | Lines 73, 161-162: GIN search operators confirmed |

---

### Requirements Coverage

| Requirement | Criterion | Status | Evidence |
|-------------|-----------|--------|----------|
| PRD-INTAKE-008/F7 | Eligibility rule definition by applicant type, geography, entity status, UEI/SAM, nonprofit, tribal, state/local, prior award, match, custom | ✓ SATISFIED | All 10 rule types in EligibilityRuleBuilder; eligibilityService + migration 006 |
| PRD-INTAKE-009/F8 | Hard blockers vs. advisory with enforcement_point | ✓ SATISFIED | DB constraint, service validation (400), client-side validation confirmed |
| PRD-INTAKE-010/F9 | Pre-screening questionnaire with conditional logic | ✓ SATISFIED | PrescreeningBuilder + prescreeningService; conditional_display JSONB; option-to-rule mapping |
| PRD-INTAKE-011/F10 | Conditional form sections | ✓ SATISFIED | ConditionalSectionConfig + sectionConditionService + migration 008 |
| PRD-INTAKE-012/F11 | Attachment requirements by type and stage | ✓ SATISFIED | AttachmentRequirementsConfig + attachmentRequirementService; stage_scope validated |
| PRD-INTAKE-013/F12 | Administrative screening criteria | ✓ SATISFIED | ScreeningCriteriaConfig + screeningCriteriaService; auto-criteria 403 guard |
| PRD-INTAKE-014/F13 | Publish to portal with public_slug | ✓ SATISFIED | publicationService.publish() delegated from route; public_slug confirmed non-null in gap redrive |
| PRD-INTAKE-015/F14 | Search and filter by 8 facets + full-text | ✓ SATISFIED | searchService with GIN + all 8 filters; publicOpportunitiesRouter |
| PRD-INTAKE-017/F16 | Public opportunity pages with context-aware CTA | ✓ SATISFIED | OpportunityDetailPage; sign_in/start/continue/closed CTAs; breadcrumbs (WCAG 2.1 AA) |
| PRD-INTAKE-018/F17 | Addenda timeline with deadline changes | ✓ SATISFIED | AddendaTimeline; immutable addenda (405 on DELETE); date_change before/after; is_required_change warning |

---

### Anti-Patterns Found

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `EligibilityRuleBuilder.tsx:378` | `placeholder="e.g. state_of_incorporation"` | ℹ️ Info | HTML input placeholder attribute — NOT a code stub. No impact. |
| `OpportunityDetailPage.tsx:138` | `if (!res.ok) return null;` | ℹ️ Info | Error handling guard in workspace-status fetch — not a stub. Falls back to default `sign_in` state correctly. |

No blockers or warnings found. Both flagged patterns are legitimate non-stub code.

---

### Test Suite Evidence

- **Total tests:** 139/139 passed across 16 test files
- **Gate:** `gate_status: passed`, `boot_smoke: pass`
- **Key test files for Phase 2:**
  - `tests/integration/eligibility.test.ts` — 12 tests (CRUD, 400/401/403, audit events)
  - `tests/integration/prescreening.test.ts` — 6 tests (upsert, nested GET, conditional display, preview)
  - `tests/integration/sectionConditions.test.ts` — 5 tests (upsert idempotency, 401, 422)
  - `tests/integration/attachmentRequirements.test.ts` — 6 tests (CRUD, invalid stage_scope 400, 401)
  - `tests/integration/screeningCriteria.test.ts` — 5 tests (manual CRUD, auto creation, 403 guard)
  - `tests/integration/publicOpportunities.test.ts` — 11 tests (published-only, keyword search, pagination, 404 unpublished)
  - `tests/integration/addenda.test.ts` — 8 tests (version_number, reverse-chron, invalid type 400, unpublished 400, 403 auth, DELETE 405)

---

### Human Verification Required

The following items have passed automated checks but involve visual/UX behaviors that should be confirmed by a human when convenient:

#### 1. Eligibility Rule Builder USWDS Styling

**Test:** Log in as grantor → navigate to an opportunity builder → click Eligibility Rules tab → add a hard blocker rule
**Expected:** Rule card renders with red `usa-alert--error` border; "Hard Blocker" badge visible. Add advisory rule: yellow `usa-alert--warning` border; "Advisory" badge.
**Why human:** CSS class presence verified in code (line 564: conditional class), but visual rendering (color, border weight) requires browser confirmation.

#### 2. Pre-Screening Tab Navigation

**Test:** In the opportunity builder, click the "Pre-Screening" tab
**Expected:** Tab activates (blue underline), PrescreeningBuilder renders with placement selector and "Add Question" button
**Why human:** Tab switching is client-side state; automated tests cover API, not tab click UX. UAT confirmed tab was unreachable without opportunity listing — now fixed by plan 02-04.

#### 3. Grantor Opportunity List → Builder Navigation

**Test:** Log in as grantor → navigate to /grantor/opportunities
**Expected:** Existing opportunities displayed as USWDS cards with title, status badge, and link to builder; "No opportunities yet" alert only if list is empty
**Why human:** Critical gap was closed by plan 02-04 and confirmed via API redrive, but visual list rendering in browser should be spot-checked.

#### 4. Public Opportunity Search UX

**Test:** Navigate to /opportunities (no auth) → search keyword → apply filter → observe chip → remove chip
**Expected:** Results filter dynamically; active filter chip appears with × button; removing chip re-fetches unfiltered results
**Why human:** Filter chip interaction logic is implemented but requires browser UX validation.

#### 5. Applicant CTA Context-Awareness

**Test:** Navigate to /opportunities/:slug unauthenticated → observe CTA
**Expected:** "Sign In to Apply" button
**Test (authenticated applicant, no workspace):** Same page after login → "Start Application"
**Why human:** WorkspaceStatus depends on runtime auth state and DB lookup; automated tests cover API contract.

---

### UAT Gap Closure Confirmation

All 4 UAT gaps from `02-UAT.md` are confirmed closed:

| UAT Gap | Root Cause | Closure Evidence |
|---------|-----------|-----------------|
| Opportunity listing placeholder (Tests 2, 3, 4) | `OpportunitiesIndex.tsx` never fetched opportunities | Plan 02-04: `apiClient.get(/programs/${programId}/opportunities)` in useEffect; gap redrive confirmed list returns 1 opportunity |
| public_slug NULL after publish (Test 7) | Route handler used inline UPDATE omitting public_slug | Plan 02-04: route now delegates to `publicationService.publish()`; gap redrive confirmed `public_slug=gap-redrive-test-grant-42e5c6da` |
| GET /programs/:programId/opportunities missing (blocker for Tests 8–10) | Server route not added by initial 02-04 execution | Added during gap redrive to `src/routes/opportunities.ts`; confirmed in GATE.md |
| TypeScript build errors (Test 8 self-check) | `type`-only import, unused const | Fixed during UAT self-check in 02-03; all 139 tests pass with clean build |

---

## Summary

Phase 2 goal is **fully achieved**. All 5 success criteria verified against the actual codebase:

1. **Eligibility rules engine** — 10 rule types, hard_blocker/advisory severity with DB constraint, audit trail, IDOR protection ✓
2. **Pre-screening questionnaire builder** — conditional logic, yes/no/multiple-choice/text, option-to-rule mapping, preview modal ✓
3. **Intake configuration** — conditional section display, attachment requirements by type+stage, administrative screening criteria with auto-protection ✓
4. **Public opportunity portal** — search with 8 facets, GIN full-text, USWDS status badges, detail pages with breadcrumbs, unauthenticated access ✓
5. **Addenda and change notification** — immutable addenda, reverse-chron timeline, Required Change banner, date_change before/after parsing ✓

All artifacts exist at three levels (present, substantive, wired). The publish route now delegates to `publicationService`, generating non-null `public_slug`. The grantor opportunity list now fetches live data. 139/139 tests pass. Gate status is `passed`.

---

*Verified: 2026-07-25T23:35:00Z*
*Verifier: Claude (pivota_spec-verifier)*
