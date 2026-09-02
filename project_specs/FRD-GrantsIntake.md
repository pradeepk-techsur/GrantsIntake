# Functional Requirements Document: GrantsIntake

**Product:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform  
**Module:** Grants Intake  
**Document Type:** Functional Requirements Document (FRD)  
**Version:** 1.0 Draft  
**Date:** July 24, 2026  
**Scope Boundary:** Opportunity setup through validated application intake and handoff to review  
**Design Standard:** USWDS (https://designsystem.digital.gov/)  
**Regulatory Alignment:** 2 CFR 200.204 (NOFO), 2 CFR 200.205 (Merit Review), 2 CFR 200.206 (Risk Assessment)  
**Source PRD:** `project_specs/PRD-GrantsIntake.md` / `project_specs/ref_docs/grants_intake.pdf`

---

## Scope

This FRD specifies the functional behavior of the GrantsIntake platform's Grants Intake module. It covers all MVP requirements (F0–F63, excluding Phase 2 items F3, F15, F27, F33, F45, F64, F65) across all 11 intake stages: Program and Opportunity Setup, Eligibility and Intake Rules Configuration, Opportunity Publication and Discovery, Organization Profile and Credential Readiness, Eligibility Pre-Screening, Application Workspace, Form/Budget/Attachment Intake, Q&A/Clarifications/Addenda, Validation and Submission, Intake Queue and Administrative Screening, and Intake Analytics and Reporting.

---

## How to Read This Document

- **Feature IDs** (F0, F1…) map directly to PRD-INTAKE-001, PRD-INTAKE-002… Feature IDs are listed at each section header.
- **Error States** tables use columns: Scenario | HTTP Status | Error Code | Message.
- **API Surface** entries in feature chunks are summaries; full request/response schemas are in `Y1a–Y1d-api-*.md`.
- **Schema Surface** entries in feature chunks are bullets; full DDL is in `Y0a–Y0d-schema-*.md`.
- **Validation** rules use MUST/SHOULD/MAY (RFC 2119 style).
- **Data Zones:** Content is labeled Grantor-private, Grantee-private, or Shared to clarify visibility.

---

## Conventions

| Convention | Meaning |
|---|---|
| MUST | Mandatory; system cannot proceed without this |
| SHOULD | Strongly recommended; deviation requires justification |
| MAY | Optional; configurable |
| Grantor-private | Visible only to grantor users; not exposed to applicants |
| Grantee-private | Visible only to applicant org team; not exposed to grantors |
| Shared | Visible to both parties per status and permission rules |
| UTC | All timestamps stored and displayed in UTC |
| Immutable | Record cannot be edited, only superseded or archived |

---

## Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **Grantor** | The funding organization (federal agency, state/local agency, foundation, corporate funder) that publishes opportunities |
| **Grantee / Applicant** | The organization or individual applying for grant funding |
| **Program** | A funder-defined funding stream or initiative under which one or more opportunities are published |
| **Opportunity** | A specific funding opportunity published by a grantor with defined eligibility, deadlines, forms, and funding parameters |
| **FON** | Funding Opportunity Number — unique identifier assigned to each opportunity |
| **Assistance Listing Number** | Federal catalog identifier (formerly CFDA number) required for federal opportunities under 2 CFR 200.204 |
| **UEI** | Unique Entity Identifier — SAM.gov-assigned identifier required for federal applicants |
| **SAM** | System for Award Management (SAM.gov) — federal registration system for entities receiving federal awards |
| **Application Workspace** | The applicant's private, collaborative drafting environment for a specific opportunity |
| **Submission Snapshot** | The immutable, timestamped, authoritative record of a submitted application |
| **Intake Disposition** | The administrative screening outcome assigned by a grantor intake administrator |
| **Audit Event** | A system-generated, immutable record of a user action or state change |
| **Eligibility Pre-Screen** | The questionnaire-driven workflow that determines applicant eligibility before workspace creation or submission |
| **Hard Blocker** | An eligibility rule violation that prevents workspace creation or submission |
| **Advisory Indicator** | An eligibility rule concern that warns but does not block the applicant |
| **Authorized Representative** | A user with explicit authority to certify and submit a final application |
| **Readiness Dashboard** | The applicant workspace view showing completion status, blocking errors, and submission readiness |
| **Addendum** | A grantor-published change to a published opportunity |
| **NOFO** | Notice of Funding Opportunity — the structured announcement required by 2 CFR 200.204 for federal programs |
| **USWDS** | U.S. Web Design System — the federal design system used for all applicant-facing interfaces |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines Level AA — the minimum accessibility compliance standard |

---

## Intake Status Models

### Opportunity Status
`Draft` → `Internal Review` → `Approved` → `Published` → `Modified` → `Closed` → `Archived`

### Application Status
`Not Started` → `Workspace Created` → `In Progress` → `Ready for Internal Review` → `Ready to Submit` → `Submitted` → `Intake Screening` → `Returned for Correction` → `Resubmitted` → `Accepted for Review` → `Withdrawn` → `Administratively Rejected`

### Question / Addendum Status
`Draft` → `Internal Review` → `Published` → `Superseded / Archived`

### Intake Disposition Status
`Pending Screening` → `Accepted for Review` → `Returned for Correction` → `Ineligible` → `Late` → `Duplicate` → `Withdrawn` → `Administratively Rejected`

---

## Roles and Permissions Summary

| Role | Create Opportunity | Configure Rules | Draft Application | Submit Application | Manage Q&A | Screen Intake | View Submission |
|---|---|---|---|---|---|---|---|
| Grantor Admin | Yes | Yes | No | No | Yes | Yes | Yes |
| Program Officer | Yes | Yes | No | No | Yes | Yes | Yes |
| Intake Administrator | Limited | Limited | No | No | Yes | Yes | Yes |
| Compliance Analyst | Review | Review | No | No | Review | Yes | Yes |
| Applicant Org Admin | No | No | Yes | Depends | No | No | Own org only |
| Proposal Lead | No | No | Yes | Depends | Ask questions | No | Own app only |
| Finance Contributor | No | No | Budget only | No | No | No | Own app budget only |
| External Contributor | No | No | Scoped sections | No | No | No | Scoped only |
| Authorized Representative | No | No | Review | Yes | Ask questions | No | Own app only |
| Reviewer | No | No | No | No | No | No | After intake handoff only |

---

## Notification Model (MVP)

| Notification | Recipient | Trigger | SLA |
|---|---|---|---|
| Opportunity published | Subscribers / applicants | Opportunity status → Published | — |
| Opportunity modified | Applicants with saved/started application | Addendum or date change published | Within 15 minutes |
| Question answered | Applicants with saved/started application | Public answer posted | Within 15 minutes |
| Workspace created | Applicant team | Application workspace creation | — |
| Deadline approaching | Applicant team | Configured days before due date | — |
| Missing required item | Proposal lead | Blocking validation detected | — |
| Ready for submission | Authorized representative | Internal checklist complete | — |
| AR concern flagged | Proposal lead | Authorized Representative flags a concern on submission preview | — |
| Submission received | Applicant team + grantor intake admin | Final submit | — |
| Returned for correction | Applicant team | Grantor disposition | — |
| Correction window expired | Applicant team + intake administrator | Correction deadline passes without resubmission; auto-rejection applied | — |
| Intake accepted for review | Applicant team + reviewers | Screening complete | — |

---

## Master Table of Contents

| Chunk | Contents |
|---|---|
| `00-header.md` | Title, scope, conventions, terminology, TOC |
| `F00-F02-stage1a.md` | F0: Opportunity Creation; F1: Metadata Capture; F2: Plain-Language Guidance |
| `F04-F06-stage1b.md` | F4: Deadline Config; F5: Setup Validation; F6: Versioning & Audit Trail |
| `F07-F09-stage2a.md` | F7: Eligibility Rule Definition; F8: Blockers vs. Indicators; F9: Pre-Screen Questionnaires |
| `F10-F12-stage2b.md` | F10: Conditional Forms; F11: Attachment Config; F12: Admin Screening Criteria Config |
| `F13-F17-stage3.md` | F13: Portal Publication; F14: Search & Filter; F16: Public Pages & Workspaces; F17: Addenda Display |
| `F18-F23-stage4.md` | F18: Org Profile; F19: Profile Data; F20: Standard Attachments; F21: Expiration Warnings; F22: Role Assignment; F23: Profile Reuse |
| `F24-F28-stage5.md` | F24: Pre-Screen Workflow; F25: Eligibility Results; F26: Blocker Explanation; F28: Response Storage |
| `F29-F35-stage6.md` | F29: One Workspace; F30: Workspace Sections; F31: Section Ownership; F32: Private Comments; F34: Readiness Dashboard; F35: Draft Privacy |
| `F36-F42-stage7.md` | F36: Form Field Types; F37: Form Constraints; F38: Budget Capture; F39: Budget Validation; F40: Attachment Requirements; F41: Doc Versioning; F42: Submission Preview |
| `F43-F47-stage8.md` | F43: Q&A Config; F44: Public Q&A Publishing; F46: Auditable History; F47: Applicant Notifications |
| `F48-F54-stage9.md` | F48: Continuous Validation; F49: Validation Classification; F50: Submission Blocking; F51: AR Certification; F52: Snapshot & Receipt; F53: Dual-Format Package; F54: Post-Submission Lock |
| `F55-F60-stage10.md` | F55: Queue Routing; F56: Queue Display; F57: Dispositions; F58: Correction Requests; F59: Snapshot Preservation; F60: Review Routing |
| `F61-F63-stage11.md` | F61: Grantor Dashboards; F62: Applicant Dashboards; F63: Data Export |
| `Y0a-schema-core.md` | DDL: programs, opportunities, opportunity_versions, eligibility_rules |
| `Y0b-schema-org.md` | DDL: organizations, org_contacts, org_roles, org_attachments |
| `Y0c-schema-app.md` | DDL: application_workspaces, application_sections, budgets, budget_line_items, attachments |
| `Y0d-schema-submission.md` | DDL: submission_snapshots, qa_items, addenda, audit_events, intake_dispositions |
| `Y1a-api-opportunity.md` | REST API: Opportunities, Programs, Eligibility Rules, Templates |
| `Y1b-api-org.md` | REST API: Organizations, Profiles, Roles, Standard Attachments |
| `Y1c-api-application.md` | REST API: Workspaces, Sections, Budget, Attachments, Pre-Screen |
| `Y1d-api-submission.md` | REST API: Submission, Intake Queue, Dispositions, Q&A, Addenda, Export |
| `Y2-errors.md` | Cross-feature error catalog |
| `Y3-integrations.md` | External integration points |
---

# Stage 1: Program and Opportunity Setup

*Objective: Enable grantors to create structured, accessible, and configurable grant opportunities.*

---

## F0: Opportunity Creation from Configurable Templates
*Maps to: PRD-INTAKE-001 | Priority: P0 — MVP*

**Description:** Grantors create new funding opportunities by selecting from a library of configurable templates. Templates encode program type, required metadata fields, default sections, and common eligibility structures. This reduces setup time, ensures compliance with program-type defaults, and improves opportunity consistency across a funder's portfolio.

**Terminology:**
- **Template:** A pre-configured opportunity structure with default metadata fields, sections, and eligibility scaffolding
- **Template Library:** The system-managed collection of templates organized by program type and grant market
- **Custom Template:** A grantor-saved template derived from a completed opportunity or base template

**Sub-features:**
- Create a new opportunity from a system template
- Create a new opportunity from a grantor-saved custom template
- Save a completed or draft opportunity as a custom template
- Browse and search the template library by program type and grant market

**Process:**
1. Grantor navigates to the Opportunity Builder and selects "Create New Opportunity"
2. System presents template library organized by program type (federal NOFO, state grant, philanthropic RFP, pass-through subaward)
3. Grantor selects a template; system instantiates a new draft opportunity pre-populated with template defaults
4. System assigns a system-generated draft opportunity ID
5. Grantor reviews pre-populated fields and begins editing
6. Grantor may optionally save the completed configuration as a custom template for future reuse
7. Draft opportunity enters the opportunity setup workflow (see F1 for metadata, F4 for deadlines, F5 for publication validation)

**Inputs:**
- `template_id` (UUID, required): ID of the selected system or custom template
- `program_id` (UUID, optional): Parent program to associate the new opportunity with
- `grantor_user_id` (UUID, required): Authenticated grantor user initiating creation

**Outputs:**
- New `Opportunity` record in `Draft` status with template defaults applied
- System-generated `opportunity_id` (UUID)
- Audit event: `OPPORTUNITY_CREATED` with timestamp, user, and template reference

**Validation:**
- MUST: Grantor user MUST have `Create Opportunity` permission for the target program/org
- MUST: A valid template MUST be selected before an opportunity can be created (blank-slate creation is not supported in MVP)
- SHOULD: Template library MUST contain at minimum: Federal NOFO, State/Local Grant, Philanthropic RFP, Corporate Grant, Pass-Through Subaward
- MAY: Grantor MAY create a custom template only from an existing opportunity that has been published at least once

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Template not found | 404 | TEMPLATE_NOT_FOUND | "The selected template could not be found." |
| Insufficient permissions | 403 | PERMISSION_DENIED | "You do not have permission to create opportunities for this program." |
| Program not found | 404 | PROGRAM_NOT_FOUND | "The specified program does not exist." |
| Template library empty | 500 | TEMPLATE_LIBRARY_UNAVAILABLE | "Opportunity templates are temporarily unavailable." |

**API Surface (this feature):** `POST /api/v1/opportunities` with `template_id` body — see `Y1a-api-opportunity.md` §Opportunities.

**Schema Surface (this feature):** Creates record in `opportunities` table with `status=draft`, `template_id` FK, `created_by`, `created_at` — see `Y0a-schema-core.md` §opportunities.

---

## F1: Structured Opportunity Metadata Capture
*Maps to: PRD-INTAKE-002 | Priority: P0 — MVP*

**Description:** Every opportunity captures a complete, structured set of metadata fields required for federal and non-federal grant programs. Structured metadata ensures applicants have full information, supports search and discovery (F14), enables downstream reporting, and satisfies 2 CFR 200.204 NOFO requirements for federal opportunities.

**Terminology:**
- **NOFO Fields:** Metadata fields required by 2 CFR 200.204 for federal Notices of Funding Opportunities
- **Assistance Listing Number:** Federal identifier (formerly CFDA) identifying the program under which the award is made
- **Announcement Type:** Classification of the opportunity (e.g., Initial, Modification, Continuation, Supplemental)
- **Funding Range:** The minimum and maximum award amounts per applicant or project
- **Expected Awards:** The anticipated number of awards the grantor intends to make

**Sub-features:**
- Capture all required NOFO fields for federal opportunities
- Capture non-federal grant metadata with flexible field configuration
- Validate metadata completeness before publication (enforced by F5)
- Store executive summary, eligibility summary, and contact information

**Process:**
1. Grantor opens the opportunity metadata editor within the Opportunity Builder
2. System presents metadata form pre-populated from template defaults
3. Grantor completes or edits all metadata fields (see Inputs below)
4. System validates each field in real time (format, required, length)
5. System updates the opportunity record on each save (auto-save and explicit save supported)
6. Incomplete required fields are flagged; the opportunity cannot be published until all required fields pass (F5)

**Inputs:**
- `title` (string, required, max 250 chars): Full opportunity title
- `funding_source` (string, required): Name of the funding source or agency
- `announcement_type` (enum, required): `initial | modification | continuation | supplemental | correction`
- `opportunity_number` (string, required, max 100 chars): Grantor-assigned FON; MUST be unique within the program
- `assistance_listing_number` (string, conditional): Required if `funding_source` is a federal agency; format `XX.XXX`
- `funding_amount_min` (currency, optional): Minimum award amount per applicant
- `funding_amount_max` (currency, required): Maximum award amount per applicant
- `total_program_funding` (currency, optional): Total funding available for the opportunity
- `expected_awards_min` (integer, optional): Minimum number of expected awards
- `expected_awards_max` (integer, optional): Maximum number of expected awards
- `eligibility_summary` (text, required, max 2000 chars): Plain-language summary of who is eligible
- `executive_summary` (text, required, max 5000 chars): Plain-language summary of the opportunity purpose and focus
- `contact_name` (string, required): Primary grantor contact name
- `contact_email` (email, required): Primary grantor contact email
- `contact_phone` (string, optional): Primary grantor contact phone number
- `contact_title` (string, optional): Primary grantor contact title
- `program_area` (string, required): Program area or topic classification (e.g., Health, Education, Environment)
- `geography` (string[], optional): Geographic scope (states, regions, counties, or national)
- `application_url` (URL, optional): External application URL if supplemental portal used

**Outputs:**
- Updated `Opportunity` record with all metadata fields persisted
- Metadata completeness flag updated on the opportunity record
- Audit event: `OPPORTUNITY_METADATA_UPDATED` with field-change diff, timestamp, and user

**Validation:**
- MUST: `title`, `funding_source`, `announcement_type`, `opportunity_number`, `funding_amount_max`, `eligibility_summary`, `executive_summary`, `contact_name`, `contact_email`, `program_area` MUST be present before publication
- MUST: `opportunity_number` MUST be unique within the parent program
- MUST: `assistance_listing_number` MUST be present when `funding_source` is federal (determined by `is_federal` flag on the Program record)
- MUST: `funding_amount_min` MUST be ≤ `funding_amount_max` when both are provided
- MUST: `contact_email` MUST pass RFC 5322 email format validation
- SHOULD: `executive_summary` SHOULD be ≥ 100 characters for meaningful content
- MUST: `assistance_listing_number` MUST match format `\d{2}\.\d{3}` when provided

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Duplicate opportunity number | 409 | DUPLICATE_OPPORTUNITY_NUMBER | "This opportunity number already exists within this program." |
| Invalid email format | 422 | INVALID_EMAIL_FORMAT | "Contact email is not a valid email address." |
| Funding min exceeds max | 422 | INVALID_FUNDING_RANGE | "Minimum award amount cannot exceed maximum award amount." |
| Invalid Assistance Listing format | 422 | INVALID_ASSISTANCE_LISTING | "Assistance Listing Number must be in format XX.XXX (e.g., 93.778)." |
| Required field missing | 422 | REQUIRED_FIELD_MISSING | "Field '{field_name}' is required before publication." |

**API Surface (this feature):** `PUT /api/v1/opportunities/{opportunity_id}/metadata` — see `Y1a-api-opportunity.md` §Opportunity Metadata.

**Schema Surface (this feature):** Persists to `opportunities` table columns: `title`, `funding_source`, `announcement_type`, `opportunity_number`, `assistance_listing_number`, `funding_amount_min`, `funding_amount_max`, `total_program_funding`, `expected_awards_min`, `expected_awards_max`, `eligibility_summary`, `executive_summary`, `contact_name`, `contact_email`, `contact_phone`, `contact_title`, `program_area`, `geography`, `application_url` — see `Y0a-schema-core.md` §opportunities.

---

## F2: Plain-Language Guidance Prompts
*Maps to: PRD-INTAKE-003 | Priority: P0 — MVP*

**Description:** The system surfaces contextual plain-language guidance prompts to grantors while they write opportunity descriptions and applicant instructions. Prompts are aligned with USWDS plain language standards and the Simpler.Grants.gov modernization direction, helping program officers write clearer, more accessible opportunity content without requiring plain-language expertise.

**Terminology:**
- **Guidance Prompt:** A contextual in-line suggestion or example displayed adjacent to a form field during grantor authoring
- **Plain Language:** Writing that is clear, concise, and accessible to readers with varying literacy levels — per USWDS and federal plain language guidelines
- **Readability Indicator:** A system-calculated signal (e.g., Flesch-Kincaid grade level) displayed to the grantor to indicate text complexity

**Sub-features:**
- Display field-level guidance prompts during opportunity description authoring
- Display plain-language example text for common NOFO fields
- Show readability indicator for narrative text fields (executive summary, eligibility summary, applicant instructions)
- Allow grantors to toggle guidance prompts on/off

**Process:**
1. Grantor opens a text field in the Opportunity Builder (e.g., executive summary, eligibility summary, applicant instructions)
2. System displays a collapsible guidance panel adjacent to the field with:
   - Plain-language guidance prompt explaining what to write and how
   - Example text showing what good content looks like for this field type
   - USWDS plain language tips (active voice, short sentences, plain terms)
3. As grantor types, system calculates and displays a readability indicator (grade level estimate) below the field
4. Grantor may collapse or dismiss the guidance panel; preference is persisted per user session
5. System does not prevent save or publication based on readability score (indicator is advisory only)

**Inputs:**
- `field_id` (string, system): The field for which guidance is requested
- `field_content` (text, runtime): Current text entered by the grantor (used for readability scoring)
- `guidance_visible` (boolean, user preference): Whether guidance panel is shown

**Outputs:**
- Guidance prompt text displayed in USWDS-styled helper text component adjacent to the field
- Readability grade level estimate displayed as an informational badge
- No output to the opportunity record (guidance is display-only)

**Validation:**
- MUST: Guidance prompts MUST be available for at minimum: `executive_summary`, `eligibility_summary`, `applicant_instructions`, `program_description` fields
- MUST: Readability indicators MUST be clearly labeled as advisory and non-blocking
- SHOULD: Guidance content SHOULD be reviewed and approved by a plain-language specialist before deployment
- MAY: Grantor MAY disable guidance prompts per session; system SHOULD re-enable by default on next session

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Guidance content unavailable | 503 | GUIDANCE_UNAVAILABLE | "Plain-language guidance is temporarily unavailable." |
| Readability service error | 200 (degraded) | — | Readability indicator hidden; field remains editable |

**API Surface (this feature):** `GET /api/v1/guidance/prompts?field_id={field_id}` — returns prompt text and example; readability scored client-side or via `POST /api/v1/guidance/readability`. See `Y1a-api-opportunity.md` §Guidance.

**Schema Surface (this feature):** Guidance prompts stored in `guidance_prompts` lookup table (field_id, prompt_text, example_text, uswds_tips). Not user-generated data. No writes to opportunity record. See `Y0a-schema-core.md` §guidance_prompts.
---

## F4: Intake Windows and Deadline Configuration
*Maps to: PRD-INTAKE-005 | Priority: P0 — MVP*

**Description:** Grantors configure the complete timeline for an opportunity, including the primary application open and close dates, pre-application deadlines, letter-of-intent deadlines, and optional rolling review periods. The system enforces these dates during applicant interaction, preventing workspace creation or submission outside configured windows.

**Terminology:**
- **Intake Window:** The period during which applicants may submit a full application (defined by `application_open_date` and `application_close_date`)
- **Pre-Application Deadline:** The deadline for submitting a pre-application package (e.g., concept paper, notice of intent) before the full application window opens
- **LOI Deadline:** Letter of Intent deadline — a non-binding expression of intent to apply, may be required or optional
- **Rolling Review Period:** A configuration where applications are reviewed and dispositioned on a first-come, first-served basis within a defined window rather than after a hard close date

**Sub-features:**
- Configure primary application open and close dates/times
- Configure pre-application deadline (optional)
- Configure LOI deadline (optional, required, or disabled)
- Configure rolling review period parameters
- Display all configured dates on the opportunity detail page for applicants
- Enforce intake window: prevent workspace creation before open date; block submission after close date

**Process:**
1. Grantor navigates to the Timeline & Deadlines section of the Opportunity Builder
2. Grantor sets `application_open_date` and `application_close_date` with time-of-day and timezone
3. Optionally sets `pre_application_deadline` and `loi_deadline`
4. If rolling review, grantor enables rolling mode and sets review cadence (e.g., monthly)
5. System validates date sequence logic (see Validation)
6. System saves dates to the opportunity record
7. Upon publication, dates are displayed on the public opportunity page
8. System enforces: applicants cannot create workspace before `application_open_date`; submission is blocked after `application_close_date`
9. Date changes to a published opportunity trigger an Addendum event (F6) and applicant notification (F47)

**Inputs:**
- `application_open_date` (datetime with timezone, required): When applicants may begin submitting
- `application_close_date` (datetime with timezone, required): Hard deadline for submission
- `pre_application_deadline` (datetime with timezone, optional): Pre-application package due date
- `loi_deadline` (datetime with timezone, optional): Letter of intent due date
- `loi_required` (boolean, default false): Whether LOI submission is required before full application access
- `rolling_review_enabled` (boolean, default false): Whether rolling review mode is active
- `rolling_review_cadence_days` (integer, conditional): Review cadence in days; required if `rolling_review_enabled=true`
- `deadline_timezone` (IANA timezone string, required): e.g., `America/New_York`

**Outputs:**
- Updated `Opportunity` record with all deadline fields persisted
- Deadline section displayed on the public opportunity page with all configured dates
- Audit event: `OPPORTUNITY_DEADLINES_UPDATED` with before/after values, timestamp, user
- If opportunity is already published: Addendum record created (see F6); applicant notification triggered (see F47)

**Validation:**
- MUST: `application_open_date` MUST be before `application_close_date`
- MUST: `pre_application_deadline` MUST be before `application_open_date` when provided
- MUST: `loi_deadline` MUST be before `application_close_date` when provided
- MUST: All dates MUST be in the future at time of publication
- MUST: When `loi_required=true`, `loi_deadline` MUST be provided
- MUST: When `rolling_review_enabled=true`, `rolling_review_cadence_days` MUST be provided and MUST be > 0
- SHOULD: `application_close_date` SHOULD be at least 30 days after `application_open_date` (warning, not blocker) to align with 2 CFR 200.204 guidance
- MUST: `deadline_timezone` MUST be a valid IANA timezone string

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Close date before open date | 422 | INVALID_DATE_SEQUENCE | "Application close date must be after the open date." |
| Pre-app deadline after open date | 422 | INVALID_PREAPP_DEADLINE | "Pre-application deadline must be before the application open date." |
| Past close date on publication | 422 | DEADLINE_IN_PAST | "Application close date cannot be in the past at time of publication." |
| Missing LOI deadline when required | 422 | LOI_DEADLINE_REQUIRED | "LOI deadline must be provided when LOI is required." |
| Invalid timezone | 422 | INVALID_TIMEZONE | "The specified timezone is not a valid IANA timezone identifier." |

**API Surface (this feature):** `PUT /api/v1/opportunities/{opportunity_id}/deadlines` — see `Y1a-api-opportunity.md` §Deadlines.

**Schema Surface (this feature):** Columns on `opportunities` table: `application_open_date`, `application_close_date`, `pre_application_deadline`, `loi_deadline`, `loi_required`, `rolling_review_enabled`, `rolling_review_cadence_days`, `deadline_timezone` — see `Y0a-schema-core.md` §opportunities.

---

## F5: Opportunity Setup Completeness Validation
*Maps to: PRD-INTAKE-006 | Priority: P0 — MVP*

**Description:** Before a grantor can publish an opportunity, the system validates that all required metadata, eligibility rules, deadline configuration, and form configurations are complete and consistent. Incomplete or invalid setups are blocked from publication with specific, actionable error messaging. A publication readiness checklist gives grantors clear visibility into what remains to be completed.

**Terminology:**
- **Publication Readiness Checklist:** A structured summary of all required setup steps and their completion status, displayed to the grantor in the Opportunity Builder
- **Publication Blocker:** A specific validation failure that prevents the opportunity from being published until resolved
- **Dry Run Validation:** A system-triggered completeness check the grantor can invoke at any time before attempting to publish

**Sub-features:**
- Display publication readiness checklist in the Opportunity Builder sidebar
- Allow grantor to trigger a dry-run validation at any time
- Block publication when any required item is incomplete
- Display actionable error messages with links to the incomplete section
- Mark checklist items as complete/incomplete in real time as the grantor makes edits

**Process:**
1. Grantor completes setup steps (F0 template selection, F1 metadata, F4 deadlines, F7 eligibility rules, F11 attachment config)
2. The publication readiness checklist updates in real time as each section is completed
3. Grantor may click "Check Readiness" at any time to trigger a full dry-run validation
4. When grantor clicks "Publish," system runs a final completeness validation
5. If any blockers exist, publication is prevented; system displays the full list of blocking items with links to each
6. If all items pass, the system transitions the opportunity status from `Draft` or `Approved` to `Published`
7. Audit event is created; notifications trigger (see F47)

**Inputs:**
- `opportunity_id` (UUID, required): The opportunity to validate
- `publish_action` (boolean): Whether this is a publication attempt or a dry-run check

**Outputs:**
- `readiness_result` object containing:
  - `is_ready` (boolean): Whether all required items are complete
  - `blockers` (array): List of blocking validation failures with `section`, `field`, `message`
  - `warnings` (array): Non-blocking issues with guidance
  - `checklist_items` (array): All checklist items with `status` (complete/incomplete/not-applicable)
- If `publish_action=true` and `is_ready=true`: opportunity status updated to `Published`; audit event created

**Validation (Publication Blockers — all MUST pass):**
- MUST: `title`, `funding_source`, `announcement_type`, `opportunity_number`, `funding_amount_max`, `eligibility_summary`, `executive_summary`, `contact_name`, `contact_email`, `program_area` MUST be present (F1)
- MUST: `application_open_date` and `application_close_date` MUST be set and in valid sequence (F4)
- MUST: At least one eligibility rule MUST be configured (F7)
- MUST: At least one application form section MUST be configured
- MUST: `assistance_listing_number` MUST be present for federal opportunities (F1)
- MUST: Administrative screening criteria MUST be configured when opportunity has `admin_screening_enabled=true` (F12)
- SHOULD: `expected_awards_max` SHOULD be set (warning if missing)
- SHOULD: At least one required attachment MUST be configured if `attachments_required=true` (F11)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Publication blocked by missing fields | 422 | PUBLICATION_BLOCKED | "Opportunity cannot be published. {count} item(s) require attention." |
| Opportunity not found | 404 | OPPORTUNITY_NOT_FOUND | "Opportunity not found." |
| User lacks publish permission | 403 | PERMISSION_DENIED | "You do not have permission to publish this opportunity." |
| Opportunity already published | 409 | ALREADY_PUBLISHED | "This opportunity is already published. Use addendum to make changes." |

**API Surface (this feature):** `POST /api/v1/opportunities/{opportunity_id}/validate` (dry run); `POST /api/v1/opportunities/{opportunity_id}/publish` (publish action) — see `Y1a-api-opportunity.md` §Publication.

**Schema Surface (this feature):** Updates `opportunities.status`, `opportunities.published_at`, `opportunities.published_by` on successful publish. Reads all related tables for completeness check — see `Y0a-schema-core.md`.

---

## F6: Opportunity Versioning and Audit Trail
*Maps to: PRD-INTAKE-007 | Priority: P0 — MVP*

**Description:** Every published opportunity is versioned. All modifications, addenda, and date changes made after publication are tracked in an immutable audit trail. This preserves the complete history of what applicants saw at any point in time, satisfies regulatory requirements for a transparent and auditable NOFO record, and provides grantors with a full change history for compliance purposes.

**Terminology:**
- **Opportunity Version:** A point-in-time snapshot of the opportunity record created whenever a published opportunity is modified
- **Version Number:** A sequential integer assigned to each version (v1 = initial publication, v2 = first post-publication modification, etc.)
- **Modification Reason:** A required text field grantors complete when modifying a published opportunity, explaining why the change was made
- **Change Delta:** The set of field-level differences between two consecutive versions stored in the audit trail

**Sub-features:**
- Create a new version snapshot on every post-publication modification
- Require modification reason text for post-publication changes
- Display version history on the opportunity detail page (grantor view)
- Display the current published version on the applicant-facing opportunity page
- Allow grantors to view and compare any two versions

**Process:**
1. Grantor initiates an edit to a published opportunity
2. System creates a draft modification copy linked to the current published version
3. Grantor makes edits and provides a required `modification_reason`
4. Grantor submits the modification for review (or self-approves if permitted)
5. System creates a new `opportunity_version` record with:
   - Incremented version number
   - Full snapshot of the opportunity fields at this version
   - Change delta (field-level diff from previous version)
   - Modification reason, timestamp, and user attribution
6. New version becomes the current published version
7. Audit event created: `OPPORTUNITY_VERSION_CREATED`
8. If dates changed: Addendum record created automatically; applicant notification triggered (F47)
9. Prior versions remain accessible in version history; they are immutable

**Inputs:**
- `opportunity_id` (UUID, required): The published opportunity being modified
- `modified_fields` (object): The fields being changed (field name → new value pairs)
- `modification_reason` (text, required, max 1000 chars): Explanation of why the change was made

**Outputs:**
- New `opportunity_versions` record with version snapshot, delta, reason, timestamp, user
- Updated `opportunities` record reflecting the new field values
- Audit event: `OPPORTUNITY_VERSION_CREATED`
- If date changes: Addendum record; applicant notification
- Version history list updated and accessible to grantor

**Validation:**
- MUST: `modification_reason` MUST be provided for all post-publication modifications; blank submissions are rejected
- MUST: Modifications MUST NOT remove required NOFO fields (F1) — removals are blocked
- MUST: Modified dates MUST pass all deadline sequence rules (F4)
- MUST: Every version record MUST include the full field snapshot (not just the delta) for independent auditability
- MUST: Version records are immutable once created; no edits permitted
- SHOULD: Version numbers MUST be sequential integers with no gaps

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Modification reason missing | 422 | MODIFICATION_REASON_REQUIRED | "A modification reason is required for changes to a published opportunity." |
| Opportunity not published | 409 | NOT_PUBLISHED | "Versioning only applies to published opportunities." |
| Attempted modification of required NOFO field removal | 422 | REQUIRED_FIELD_REMOVAL | "Required field '{field_name}' cannot be removed from a published opportunity." |
| Version record not found | 404 | VERSION_NOT_FOUND | "The requested opportunity version does not exist." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/versions` (list); `GET /api/v1/opportunities/{opportunity_id}/versions/{version_number}` (detail); `POST /api/v1/opportunities/{opportunity_id}/modifications` (create mod) — see `Y1a-api-opportunity.md` §Versions.

**Schema Surface (this feature):** Uses `opportunity_versions` table (version_number, opportunity_id FK, snapshot JSONB, delta JSONB, modification_reason, created_by, created_at) — see `Y0a-schema-core.md` §opportunity_versions.
---

# Stage 2: Eligibility and Intake Rules Configuration

*Objective: Allow grantors to convert eligibility and submission requirements into enforceable system rules.*

---

## F7: Eligibility Rule Definition
*Maps to: PRD-INTAKE-008 | Priority: P0 — MVP*

**Description:** Grantors define structured eligibility rules that the system enforces during applicant pre-screening (Stage 5). Rules are configured per opportunity and can target applicant type, geographic location, entity status, UEI/SAM registration requirement, nonprofit status, tribal status, state/local status, prior award history, match requirement, and program-specific custom criteria. Rules are the authoritative source for eligibility determinations and are stored as structured data, not narrative text.

**Terminology:**
- **Eligibility Rule:** A discrete, configured criterion that determines whether an applicant is eligible for a funding opportunity
- **Rule Criterion:** The specific condition the rule evaluates (e.g., applicant type = "nonprofit", geography = "Texas")
- **Rule Operator:** The comparison logic applied to the criterion (e.g., equals, includes, greater than)
- **Rule Group:** A logical grouping of rules combined with AND/OR logic
- **Match Requirement:** A cost-share or matching funds requirement expressed as a percentage or fixed amount

**Sub-features:**
- Create eligibility rules by rule type (applicant type, geography, entity status, UEI/SAM, nonprofit, tribal, state/local, prior award, match requirement, custom)
- Group rules with AND/OR logic
- Configure each rule as Hard Blocker or Advisory Indicator (F8)
- Assign plain-language explanation text to each rule (displayed to applicants when triggered)
- Duplicate eligibility rules from a prior opportunity within the same program

**Process:**
1. Grantor navigates to the Eligibility Rules section of the Opportunity Builder
2. Grantor selects "Add Rule" and chooses rule type from the available rule type library
3. For each rule, grantor configures: criterion, operator, value(s), severity (Hard Blocker or Advisory), and plain-language explanation
4. Rules can be grouped with AND/OR operators for compound eligibility logic
5. Grantor may preview the eligibility questionnaire as it will appear to applicants
6. Rules are saved to the `eligibility_rules` table linked to the opportunity
7. Rules are evaluated in order; all Hard Blockers must pass for applicant to proceed (when blocker mode is configured to prevent workspace creation)

**Inputs:**
- `opportunity_id` (UUID, required): Opportunity this rule belongs to
- `rule_type` (enum, required): `applicant_type | geography | entity_status | uei_sam | nonprofit_status | tribal_status | state_local_status | prior_award_status | match_requirement | custom`
- `criterion_field` (string, required): The field being evaluated (e.g., `applicant_type`, `state`, `sam_registered`)
- `operator` (enum, required): `equals | not_equals | includes | excludes | greater_than | less_than | is_true | is_false`
- `criterion_value` (string | string[] | number, required): The value(s) for comparison
- `severity` (enum, required): `hard_blocker | advisory`
- `explanation_text` (text, required, max 500 chars): Plain-language text shown to applicants when this rule triggers
- `rule_group_id` (UUID, optional): Logical group membership for AND/OR logic
- `rule_group_operator` (enum, optional): `AND | OR` — logic for combining rules within a group
- `display_order` (integer, required): Order in which rule is evaluated and displayed

**Outputs:**
- New `eligibility_rules` record linked to the opportunity
- Eligibility questionnaire preview updated
- Audit event: `ELIGIBILITY_RULE_CREATED` with rule details, timestamp, user

**Validation:**
- MUST: At least one eligibility rule MUST be configured before an opportunity can be published (enforced by F5)
- MUST: Each rule MUST have `severity` set to either `hard_blocker` or `advisory`
- MUST: `explanation_text` MUST be provided for every rule
- MUST: `criterion_value` MUST be a valid value for the `criterion_field` type (e.g., US state codes for geography rules)
- MUST: `operator` MUST be compatible with the `criterion_field` type (e.g., `greater_than` only valid for numeric fields)
- SHOULD: Each rule group MUST have a defined `rule_group_operator`
- MAY: Custom rules MAY use free-form criterion definitions but MUST still have severity and explanation

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid operator for field type | 422 | INVALID_RULE_OPERATOR | "Operator '{operator}' is not valid for field type '{criterion_field}'." |
| Missing explanation text | 422 | EXPLANATION_REQUIRED | "Plain-language explanation text is required for each eligibility rule." |
| Invalid criterion value | 422 | INVALID_CRITERION_VALUE | "Value '{value}' is not valid for criterion '{criterion_field}'." |
| Rule not found | 404 | RULE_NOT_FOUND | "Eligibility rule not found." |
| Opportunity not in editable state | 409 | OPPORTUNITY_NOT_EDITABLE | "Eligibility rules can only be modified on draft or modification-draft opportunities." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/eligibility-rules` (list); `POST /api/v1/opportunities/{opportunity_id}/eligibility-rules` (create); `PUT /api/v1/eligibility-rules/{rule_id}` (update); `DELETE /api/v1/eligibility-rules/{rule_id}` (delete) — see `Y1a-api-opportunity.md` §Eligibility Rules.

**Schema Surface (this feature):** Uses `eligibility_rules` table (rule_id, opportunity_id FK, rule_type, criterion_field, operator, criterion_value JSONB, severity, explanation_text, rule_group_id, rule_group_operator, display_order, created_by, created_at) — see `Y0a-schema-core.md` §eligibility_rules.

---

## F8: Hard Eligibility Blockers vs. Advisory Fit Indicators
*Maps to: PRD-INTAKE-009 | Priority: P0 — MVP*

**Description:** The system distinguishes between two classes of eligibility rule severity: Hard Blockers and Advisory Fit Indicators. Hard Blockers prevent the applicant from creating a workspace or submitting (depending on opportunity configuration). Advisory Indicators warn the applicant but allow them to proceed. The grantor configures the severity and enforcement point for each rule.

**Terminology:**
- **Hard Blocker:** An eligibility rule violation that, when triggered, either prevents workspace creation or prevents final submission (depending on `enforcement_point` configuration)
- **Advisory Fit Indicator:** An eligibility rule concern that displays a warning to the applicant but does not prevent them from proceeding
- **Enforcement Point:** Where a Hard Blocker is enforced — either at workspace creation (pre-workspace) or at final submission (pre-submission)
- **Eligibility Result State:** The overall determination displayed to the applicant (Eligible, Likely Eligible, Needs Attention, Ineligible)

**Sub-features:**
- Grantor configures severity (hard_blocker or advisory) per rule (F7)
- Grantor configures enforcement point (pre-workspace or pre-submission) per Hard Blocker rule
- System evaluates all rules and computes overall eligibility result state
- System displays distinct visual treatment for blockers vs. warnings (USWDS alert components)
- Blocker prevents workspace creation or submission based on enforcement_point

**Process:**
1. Applicant completes the eligibility pre-screen questionnaire (F24)
2. System evaluates all configured eligibility rules against applicant responses
3. For each triggered rule:
   - Hard Blocker: severity = `hard_blocker` → result classified as Ineligible; explanation displayed prominently
   - Advisory: severity = `advisory` → result classified as Needs Attention; warning displayed
4. Overall result state computed (see F25 for display logic)
5. If result contains any Hard Blocker and `enforcement_point = pre_workspace`: workspace creation button is disabled; applicant cannot proceed
6. If result contains any Hard Blocker and `enforcement_point = pre_submission`: workspace may be created, but submission is blocked; blocker displayed in readiness dashboard (F34)
7. Advisory indicators displayed as warnings in the workspace readiness dashboard throughout the application process

**Inputs:**
- `rule_id` (UUID, from F7): Eligibility rule record
- `severity` (enum): `hard_blocker | advisory` — set on rule record in F7
- `enforcement_point` (enum, required for hard_blockers): `pre_workspace | pre_submission`

**Outputs:**
- Per-rule severity classification stored on `eligibility_rules` record
- Eligibility evaluation result stored on `eligibility_responses` record per applicant session
- Visual display: USWDS Error alert for Hard Blockers; USWDS Warning alert for Advisory indicators

**Validation:**
- MUST: Every Hard Blocker rule MUST have an `enforcement_point` configured
- MUST: System MUST prevent workspace creation when `enforcement_point=pre_workspace` and a Hard Blocker is triggered
- MUST: System MUST prevent submission when `enforcement_point=pre_submission` and a Hard Blocker is triggered
- MUST: Advisory indicators MUST NOT prevent workspace creation or submission
- MUST: Visual treatment MUST be distinct — Hard Blocker uses USWDS Error alert (red); Advisory uses USWDS Warning alert (yellow)
- SHOULD: When multiple Hard Blockers are triggered, all MUST be displayed, not just the first

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Hard blocker triggered at workspace creation | 403 | ELIGIBILITY_HARD_BLOCK | "You are not eligible for this opportunity. {explanation_text}" |
| Hard blocker triggered at submission | 422 | ELIGIBILITY_SUBMISSION_BLOCK | "This application cannot be submitted due to eligibility requirements. {explanation_text}" |
| Enforcement point not configured | 422 | ENFORCEMENT_POINT_REQUIRED | "Hard blocker rules must have an enforcement point configured." |

**API Surface (this feature):** Rule severity and enforcement_point are attributes on the eligibility rule record (F7 API). Eligibility evaluation result is returned by `POST /api/v1/applications/{workspace_id}/eligibility/evaluate` — see `Y1c-api-application.md` §Eligibility Evaluation.

**Schema Surface (this feature):** `eligibility_rules.severity`, `eligibility_rules.enforcement_point` columns. Evaluation results stored in `eligibility_responses` table — see `Y0a-schema-core.md` §eligibility_rules, `Y0c-schema-app.md` §eligibility_responses.

---

## F9: Configurable Pre-Screening Questionnaires
*Maps to: PRD-INTAKE-010 | Priority: P0 — MVP*

**Description:** Grantors configure the pre-screening questionnaire that applicants complete before accessing the application workspace (or before submission, depending on opportunity configuration). Each question is mapped to one or more eligibility rules, and responses drive the eligibility determination. All responses are stored as part of the intake record and carried into administrative screening.

**Terminology:**
- **Pre-Screen Question:** A single question in the eligibility pre-screening questionnaire
- **Question-Rule Mapping:** The association between a question's response and one or more eligibility rules it evaluates
- **Response Option:** A selectable answer choice for a multiple-choice question
- **Questionnaire Placement:** The point in the applicant workflow where the pre-screen is presented (pre-workspace or pre-submission)

**Sub-features:**
- Build questionnaire by adding questions mapped to configured eligibility rules (F7)
- Configure question display order and conditional logic (show/hide question based on prior response)
- Configure questionnaire placement (before workspace creation or before submission)
- Preview questionnaire as it will appear to applicants
- Store applicant responses in intake record

**Process:**
1. Grantor opens the Pre-Screening Questionnaire builder in the Opportunity Builder
2. System displays existing eligibility rules as candidate questions
3. Grantor adds questions by selecting a rule and configuring the question text and response options
4. Each response option is mapped to a specific eligibility rule evaluation outcome (e.g., response "Yes" → rule evaluates as met; "No" → rule evaluates as violated)
5. Grantor sets display order and optional conditional logic (e.g., show question 3 only if question 2 = "Yes")
6. Grantor selects questionnaire placement: `pre_workspace` or `pre_submission`
7. Grantor previews the questionnaire
8. Questionnaire is saved and linked to the opportunity
9. At runtime, when an applicant reaches the questionnaire placement point, they are presented the questionnaire; responses are evaluated against rules and stored

**Inputs:**
- `opportunity_id` (UUID, required): Opportunity this questionnaire belongs to
- `placement` (enum, required): `pre_workspace | pre_submission`
- Per question:
  - `question_id` (UUID, system-generated)
  - `question_text` (text, required, max 500 chars): The question displayed to the applicant
  - `question_type` (enum, required): `yes_no | multiple_choice | text`
  - `is_required` (boolean, required): Whether the applicant must answer before proceeding
  - `display_order` (integer, required)
  - `conditional_display` (object, optional): `{depends_on_question_id, trigger_response_value}`
  - Per response option (for `yes_no` and `multiple_choice`):
    - `option_text` (string, required)
    - `mapped_rule_id` (UUID, optional): Eligibility rule this response evaluates
    - `rule_outcome` (enum, optional): `met | violated | advisory`

**Outputs:**
- `prescreening_questionnaires` record linked to the opportunity
- Question and response option records linked to the questionnaire
- At runtime: `eligibility_responses` records per applicant per opportunity

**Validation:**
- MUST: At least one question MUST be in the questionnaire if eligibility rules are configured
- MUST: Each question MUST have at least one response option for `yes_no` and `multiple_choice` types
- MUST: Response options that map to Hard Blocker rules MUST have `rule_outcome = violated` for the blocking response
- MUST: `placement` MUST be set
- SHOULD: All configured Hard Blocker eligibility rules SHOULD have at least one question mapped to them
- MAY: Text-type questions MAY be used for administrative information but MUST NOT be the sole basis for eligibility determination (text responses are not evaluated against rules in MVP)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| No questions configured | 422 | QUESTIONNAIRE_EMPTY | "Pre-screening questionnaire must contain at least one question." |
| Hard blocker rule unmapped | 422 | RULE_UNMAPPED | "Hard blocker rule '{rule_id}' has no question mapped to it." |
| Invalid conditional reference | 422 | INVALID_CONDITIONAL | "Conditional display references a question that does not exist." |
| Placement not set | 422 | PLACEMENT_REQUIRED | "Questionnaire placement (pre-workspace or pre-submission) must be configured." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/prescreening` (get questionnaire); `PUT /api/v1/opportunities/{opportunity_id}/prescreening` (update questionnaire); `POST /api/v1/opportunities/{opportunity_id}/prescreening/preview` (preview) — see `Y1a-api-opportunity.md` §Pre-Screening.

**Schema Surface (this feature):** Uses `prescreening_questionnaires` (questionnaire_id, opportunity_id FK, placement, created_by, created_at), `prescreening_questions` (question_id, questionnaire_id FK, question_text, question_type, is_required, display_order, conditional_display JSONB), `prescreening_options` (option_id, question_id FK, option_text, mapped_rule_id FK, rule_outcome) — see `Y0a-schema-core.md` §prescreening.
---

## F10: Conditional Forms and Sections
*Maps to: PRD-INTAKE-011 | Priority: P0 — MVP*

**Description:** The system supports conditional display of application form sections based on applicant type, program, geography, funding request amount, or eligibility questionnaire responses. Sections that are not applicable to an applicant are hidden, reducing irrelevant form burden without requiring applicants to fill out and skip sections manually. Conditional logic is configured by the grantor per opportunity.

**Terminology:**
- **Conditional Section:** An application form section that is shown or hidden based on one or more configured conditions
- **Condition Trigger:** The field or response that triggers a section to appear or disappear (e.g., applicant type = "tribal organization" → show Section 7: Tribal Sovereignty Documentation)
- **Condition Operator:** The logical comparison used (equals, not_equals, includes, greater_than, less_than)
- **Section Visibility State:** `always_visible | conditionally_visible | hidden`

**Sub-features:**
- Configure conditional display logic per application section
- Conditions based on: applicant type, program area, geographic scope, funding request amount, or eligibility questionnaire response
- Real-time section visibility adaptation as applicant enters data
- Sections hidden from applicant view when conditions are not met
- Grantor form preview with ability to simulate different applicant profiles

**Process:**
1. Grantor configures sections in the form builder (see F36 for field types)
2. For each section, grantor may add conditional display rules
3. Condition rule specifies: `trigger_field` (e.g., `applicant_type`), `operator` (equals), `trigger_value` (e.g., `tribal_organization`)
4. Multiple conditions per section supported with AND/OR logic
5. Saved conditions are stored as `section_conditions` records
6. At runtime, when an applicant updates a trigger field (e.g., selects their applicant type), system re-evaluates all section conditions
7. Sections meeting conditions are displayed; sections failing conditions are hidden and their validation requirements are suspended
8. Hidden section data (if any was previously entered) is preserved in the database but excluded from submission validation and from the submitted package

**Inputs:**
- `section_id` (UUID, required): The application section to apply conditional logic to
- `visibility` (enum, required): `always_visible | conditionally_visible | hidden`
- Per condition (for `conditionally_visible` sections):
  - `trigger_field` (enum, required): `applicant_type | program_area | geography | funding_request_amount | eligibility_response_{question_id}`
  - `operator` (enum, required): `equals | not_equals | includes | excludes | greater_than | less_than`
  - `trigger_value` (string | number, required): The value to compare against
  - `condition_group_operator` (enum, optional): `AND | OR` for multi-condition groups

**Outputs:**
- `section_conditions` records stored per section
- At runtime: section visibility state computed and returned per applicant workspace state
- Hidden sections excluded from completeness validation and submission

**Validation:**
- MUST: `trigger_field` MUST be a valid field in the applicant data model for the opportunity
- MUST: `trigger_value` MUST be a valid value for the `trigger_field` type
- MUST: When a section is hidden, its required fields MUST be suspended from validation (no blocking errors for hidden sections)
- MUST: Hidden section data MUST NOT appear in the submission package or grantor intake queue
- SHOULD: Grantor SHOULD preview conditional behavior before publishing

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid trigger field | 422 | INVALID_TRIGGER_FIELD | "Trigger field '{trigger_field}' is not available for conditional logic." |
| Invalid trigger value | 422 | INVALID_TRIGGER_VALUE | "Value '{trigger_value}' is not valid for field '{trigger_field}'." |
| Circular condition dependency | 422 | CIRCULAR_CONDITION | "Conditional rules create a circular dependency. Please review section visibility rules." |

**API Surface (this feature):** `PUT /api/v1/opportunities/{opportunity_id}/sections/{section_id}/conditions` (set conditions); `POST /api/v1/applications/{workspace_id}/sections/evaluate` (runtime evaluation) — see `Y1a-api-opportunity.md` §Section Conditions, `Y1c-api-application.md` §Section Evaluation.

**Schema Surface (this feature):** `section_conditions` table (condition_id, section_id FK, trigger_field, operator, trigger_value, condition_group_operator, created_by, created_at) — see `Y0c-schema-app.md` §section_conditions.

---

## F11: Required Attachments and Evidence Configuration
*Maps to: PRD-INTAKE-012 | Priority: P0 — MVP*

**Description:** Grantors define which attachment types and evidence documents are required for each opportunity, with rules differentiated by applicant type and application stage (pre-application, LOI, or full application). The system enforces these requirements during the application process and blocks submission if required attachments are missing.

**Terminology:**
- **Attachment Requirement:** A grantor-configured rule specifying that a particular document type must be uploaded by the applicant
- **Document Type:** The category of document required (e.g., IRS Determination Letter, W-9, Audit Report, Letters of Support)
- **Applicant-Type Scoping:** The ability to require a document only from applicants of a specific type (e.g., only nonprofits must submit IRS Determination Letter)
- **Stage Scoping:** The ability to require a document at a specific intake stage (pre-application, LOI, or full application)

**Sub-features:**
- Define required attachment types per opportunity
- Scope requirements by applicant type (e.g., nonprofit, tribal, state/local, for-profit)
- Scope requirements by application stage (pre-application, LOI, full application)
- Mark attachments as required (blocks submission) or recommended (warning only)
- Allow applicants to fulfill requirements from their organization's reusable attachment library (F20)

**Process:**
1. Grantor navigates to the Attachments section of the Opportunity Builder
2. Grantor selects "Add Requirement" and chooses a document type from the system's document type library
3. Grantor configures: applicant type scope (all applicants or specific types), stage scope, required vs. recommended, instructions for the applicant
4. System saves the attachment requirement record
5. At runtime, applicant views the attachment requirements filtered for their applicant type and current stage
6. Applicant may upload a new file or select a reusable document from their org library
7. System tracks fulfillment status per requirement
8. Unfulfilled required attachments appear as blocking errors in the readiness dashboard (F34) and block submission (F50)

**Inputs:**
- `opportunity_id` (UUID, required)
- `document_type` (enum, required): `irs_determination_letter | w9 | audit_report | indirect_cost_agreement | board_roster | insurance_certificate | letters_of_support | financial_statements | organizational_chart | project_narrative | budget | workplan | performance_measures | custom`
- `custom_document_name` (string, conditional): Required if `document_type = custom`
- `applicant_type_scope` (string[], optional): List of applicant types this requirement applies to; empty = all applicant types
- `stage_scope` (enum, required): `pre_application | loi | full_application`
- `is_required` (boolean, required): `true` = blocking; `false` = recommended (warning only)
- `instructions` (text, optional, max 1000 chars): Instructions displayed to applicant when uploading this document
- `file_format_restrictions` (string[], optional): Allowed file formats (e.g., `["pdf", "docx"]`)
- `max_file_size_mb` (integer, optional): Maximum allowed file size in megabytes

**Outputs:**
- `attachment_requirements` record linked to the opportunity
- Attachment requirements list displayed in the applicant workspace with fulfillment status
- Unfulfilled required attachments shown as blockers in readiness dashboard

**Validation:**
- MUST: `document_type` MUST be a valid value from the system document type library
- MUST: `custom_document_name` MUST be provided when `document_type = custom`
- MUST: `stage_scope` MUST be set
- MUST: At least one stage must have at least one required attachment if `attachments_required=true` on the opportunity
- SHOULD: `max_file_size_mb` SHOULD not exceed 50 MB per file (system default)
- MAY: `file_format_restrictions` MAY be left empty, in which case all common file formats are accepted

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Custom document name missing | 422 | CUSTOM_NAME_REQUIRED | "A document name is required for custom attachment types." |
| File too large at upload | 413 | FILE_TOO_LARGE | "File size exceeds the {max_file_size_mb}MB limit for this attachment." |
| Invalid file format | 415 | INVALID_FILE_FORMAT | "File format '{format}' is not accepted for this attachment. Accepted formats: {formats}." |
| Required attachment missing at submission | 422 | REQUIRED_ATTACHMENT_MISSING | "Required attachment '{document_type}' has not been uploaded." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/attachment-requirements` (list); `POST /api/v1/opportunities/{opportunity_id}/attachment-requirements` (create); `DELETE /api/v1/attachment-requirements/{requirement_id}` (delete) — see `Y1a-api-opportunity.md` §Attachment Requirements.

**Schema Surface (this feature):** `attachment_requirements` table (requirement_id, opportunity_id FK, document_type, custom_document_name, applicant_type_scope JSONB, stage_scope, is_required, instructions, file_format_restrictions JSONB, max_file_size_mb, created_by, created_at) — see `Y0a-schema-core.md` §attachment_requirements.

---

## F12: Administrative Screening Criteria Configuration
*Maps to: PRD-INTAKE-013 | Priority: P0 — MVP*

**Description:** Grantors configure the administrative screening criteria that intake administrators apply after an application is submitted. These criteria are codified in the system as a structured checklist, replacing criteria that previously lived only in program officer memory or email threads. The checklist is presented to intake administrators during the screening disposition workflow (see F57).

**Terminology:**
- **Administrative Screening Criterion:** A specific, configurable check that an intake administrator must evaluate for each submitted application (e.g., "Submission received by deadline", "UEI registered and active", "Required certifications signed")
- **Screening Checklist:** The ordered list of criteria an intake administrator works through before applying a disposition
- **Auto-Populated Criterion:** A criterion that the system can evaluate automatically from intake data (e.g., "Submitted before deadline" — system can check timestamp vs. deadline)
- **Manual Criterion:** A criterion that requires intake administrator judgment and manual check (e.g., "Budget appears reasonable for scope")

**Sub-features:**
- Create custom screening criteria per opportunity
- Use system-provided standard criteria (deadline, completeness, eligibility, attachment)
- Mark each criterion as auto-populated or manual
- Set each criterion as required (must be checked before disposition) or optional
- Order criteria in the screening checklist
- Link criteria to specific disposition outcomes (e.g., criterion failure → suggest "Returned for Correction" or "Administratively Rejected")

**Process:**
1. Grantor navigates to the Administrative Screening section of the Opportunity Builder
2. System presents a set of standard, auto-populated criteria that are always available (deadline check, completeness check, eligibility check)
3. Grantor may add custom manual criteria specific to the program
4. For each criterion, grantor sets: criterion text, type (auto/manual), required flag, and suggested disposition on failure
5. Criteria are ordered via drag-and-drop or explicit ordering
6. Configuration saved to `screening_criteria` table
7. When an intake administrator screens an application (F57), the screening panel presents this checklist, with auto-populated criteria pre-filled from system data

**Inputs:**
- `opportunity_id` (UUID, required)
- Per criterion:
  - `criterion_id` (UUID, system-generated)
  - `criterion_text` (text, required, max 500 chars): The check the administrator must perform
  - `criterion_type` (enum, required): `auto | manual`
  - `auto_criterion_key` (enum, conditional): `deadline_check | completeness_check | eligibility_check | attachment_check | duplicate_check` — required if `criterion_type = auto`
  - `is_required` (boolean, required): Whether administrator must evaluate this criterion before applying a disposition
  - `suggested_disposition_on_failure` (enum, optional): `returned_for_correction | ineligible | administratively_rejected`
  - `display_order` (integer, required)

**Outputs:**
- `screening_criteria` records linked to the opportunity
- Screening checklist displayed in intake administrator panel during screening (F57)
- Auto-populated criteria pre-filled from system data when administrator opens a submission

**Validation:**
- MUST: `auto_criterion_key` MUST be provided when `criterion_type = auto`
- MUST: Standard auto-criteria (deadline_check, completeness_check) MUST always be present and cannot be removed
- MUST: Required criteria MUST be evaluated (checked or failed) before a disposition can be applied
- SHOULD: At least three criteria SHOULD be configured per opportunity for meaningful screening
- MAY: Multiple criteria MAY reference the same `suggested_disposition_on_failure`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Required auto key missing | 422 | AUTO_KEY_REQUIRED | "Auto-populated criteria must specify an auto_criterion_key." |
| Required criterion not evaluated | 422 | CRITERION_NOT_EVALUATED | "Required criterion '{criterion_text}' must be evaluated before applying a disposition." |
| Attempt to delete standard criterion | 403 | STANDARD_CRITERION_PROTECTED | "Standard screening criteria (deadline check, completeness check) cannot be removed." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/screening-criteria` (list); `POST /api/v1/opportunities/{opportunity_id}/screening-criteria` (create); `PUT /api/v1/screening-criteria/{criterion_id}` (update); `DELETE /api/v1/screening-criteria/{criterion_id}` (delete) — see `Y1a-api-opportunity.md` §Screening Criteria.

**Schema Surface (this feature):** `screening_criteria` table (criterion_id, opportunity_id FK, criterion_text, criterion_type, auto_criterion_key, is_required, suggested_disposition_on_failure, display_order, created_by, created_at) — see `Y0a-schema-core.md` §screening_criteria.
---

# Stage 3: Opportunity Publication and Discovery

*Objective: Provide applicants with a clear, searchable, accessible view of available opportunities.*

---

## F13: Applicant-Facing Opportunity Portal Publication
*Maps to: PRD-INTAKE-014 | Priority: P0 — MVP*

**Description:** Approved opportunities are published to an applicant-facing portal built to USWDS standards. The portal is discoverable by the public (for public opportunities) or restricted to authenticated applicants (for invitation-only or restricted-access opportunities). Grantors can preview the applicant-facing opportunity page before publishing.

**Terminology:**
- **Opportunity Portal:** The applicant-facing web interface where published opportunities are listed and detailed
- **Public Opportunity:** An opportunity visible to unauthenticated (anonymous) visitors
- **Restricted Opportunity:** An opportunity visible only to authenticated applicants who meet configured access criteria
- **Opportunity Detail Page:** The full applicant-facing view of a single published opportunity including all metadata, deadlines, eligibility summary, Q&A, and addenda

**Sub-features:**
- Publish approved opportunity to applicant-facing portal
- Support public (unauthenticated) and authenticated-only visibility modes
- Generate USWDS-compliant opportunity listing card and detail page
- Allow grantor to preview applicant-facing page before publication
- Display opportunity status badge (Open, Closing Soon, Closed, Not Yet Open)

**Process:**
1. Grantor completes setup and passes F5 publication readiness validation
2. Grantor selects opportunity visibility: `public` or `restricted_authenticated`
3. Grantor optionally previews the opportunity detail page as an applicant would see it
4. Grantor clicks Publish; system transitions opportunity status to `Published`
5. System generates the opportunity's public URL slug from the opportunity title and FON
6. Opportunity appears in the portal listing with status badge and key metadata
7. Opportunity detail page is rendered with all fields from F1, dates from F4, eligibility summary, Q&A section, addenda section
8. Search index is updated (F14)

**Inputs:**
- `opportunity_id` (UUID, required)
- `visibility` (enum, required): `public | restricted_authenticated`
- `publish_action` (boolean, required): `true` to publish

**Outputs:**
- Opportunity status updated to `Published`
- Public URL generated: `/opportunities/{opportunity_slug}`
- Opportunity listing card rendered in portal
- Opportunity detail page rendered and accessible
- Search index updated
- Audit event: `OPPORTUNITY_PUBLISHED`

**Validation:**
- MUST: All F5 publication blockers MUST be resolved before publication
- MUST: `visibility` MUST be set before publication
- MUST: Public URL slug MUST be unique; system appends a numeric suffix if a slug collision occurs
- MUST: Opportunity detail page MUST be WCAG 2.1 AA compliant
- MUST: For restricted opportunities, unauthenticated visitors MUST see only the opportunity title and a "Sign in to view" prompt

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Publication blocked by validation | 422 | PUBLICATION_BLOCKED | "Opportunity cannot be published. See readiness checklist." |
| URL slug collision (system-handled) | — | — | System auto-appends suffix; no user-facing error |
| Opportunity not found | 404 | OPPORTUNITY_NOT_FOUND | "Opportunity not found." |

**API Surface (this feature):** `POST /api/v1/opportunities/{opportunity_id}/publish`; `GET /api/v1/opportunities/{opportunity_id}/preview` — see `Y1a-api-opportunity.md` §Publication.

**Schema Surface (this feature):** `opportunities.status`, `opportunities.visibility`, `opportunities.published_at`, `opportunities.public_slug` — see `Y0a-schema-core.md` §opportunities.

---

## F14: Search and Filtering
*Maps to: PRD-INTAKE-015 | Priority: P0 — MVP*

**Description:** Applicants can search and filter the opportunity portal by multiple facets: funder, program area, geography, eligibility type, funding amount range, due date, application stage, and keyword. Search results are sorted by relevance and approaching deadline, enabling applicants to quickly identify opportunities for which they may be eligible.

**Terminology:**
- **Faceted Filter:** A search refinement control that filters results by a specific attribute category (e.g., program area, geography)
- **Full-Text Search:** Keyword search across opportunity titles, executive summaries, eligibility summaries, and program descriptions
- **Search Relevance Score:** A calculated score used to rank results when keyword search is active
- **Closing Soon:** Opportunities with deadlines within 14 days of the current date

**Sub-features:**
- Full-text keyword search across opportunity content
- Faceted filters: funder, program area, geography, eligibility type, funding amount range, due date range, application stage
- Sort: by relevance (when keyword active), by deadline (ascending), by newest posted
- Search result display using USWDS card components
- Result count and active filter indicators
- Clear all filters action

**Process:**
1. Applicant accesses the opportunity portal (public or authenticated)
2. System displays all published, open opportunities sorted by deadline (default)
3. Applicant enters keyword in search bar and/or applies facet filters
4. System queries opportunity index and returns matching results
5. Results display as USWDS card components showing: title, funder, program area, deadline, funding range, eligibility type, status badge
6. Applicant may click a result card to navigate to the opportunity detail page (F16)
7. Active filters are displayed as removable chips; results update in real time as filters are applied

**Inputs:**
- `keyword` (string, optional, max 200 chars): Free-text search term
- `funder` (string[], optional): Filter by funder name(s)
- `program_area` (string[], optional): Filter by program area(s)
- `geography` (string[], optional): Filter by geographic scope(s)
- `eligibility_type` (string[], optional): Filter by applicant eligibility type(s)
- `funding_min` (currency, optional): Minimum funding amount filter
- `funding_max` (currency, optional): Maximum funding amount filter
- `due_date_from` (date, optional): Due date range start
- `due_date_to` (date, optional): Due date range end
- `application_stage` (enum[], optional): `not_yet_open | open | closing_soon | closed`
- `sort_by` (enum, optional): `relevance | deadline_asc | posted_desc` — default: `deadline_asc`
- `page` (integer, optional): Pagination page number — default: 1
- `page_size` (integer, optional): Results per page — default: 20; max: 100

**Outputs:**
- Paginated list of matching opportunity records with metadata fields for display
- Total result count
- Active filter state for UI display
- Search query logged for analytics (non-PII)

**Validation:**
- MUST: Only published opportunities with `status = Published` and within `application_close_date ≥ today` SHOULD be shown by default
- MUST: Closed opportunities MAY be shown when `application_stage` filter explicitly includes `closed`
- MUST: Restricted-visibility opportunities MUST NOT appear in unauthenticated search results
- SHOULD: Keyword search SHOULD match against: `title`, `executive_summary`, `eligibility_summary`, `program_area`, `funder_name`
- SHOULD: Search results SHOULD be returned within 500ms under normal load

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Search service unavailable | 503 | SEARCH_UNAVAILABLE | "Search is temporarily unavailable. Please try again." |
| Invalid date range | 422 | INVALID_DATE_RANGE | "Due date range start must be before range end." |

**API Surface (this feature):** `GET /api/v1/opportunities?keyword={}&funder={}&...` — see `Y1a-api-opportunity.md` §Search.

**Schema Surface (this feature):** Reads from `opportunities` table and search index. No writes — see `Y0a-schema-core.md` §opportunities.

---

## F16: Public Opportunity Pages and Authenticated Applicant Workspaces
*Maps to: PRD-INTAKE-017 | Priority: P0 — MVP*

**Description:** The system supports two distinct views of an opportunity: a public-facing opportunity detail page accessible without login, and an authenticated applicant workspace view that provides personalized application status, collaboration tools, and section-level progress. The public page gives all visitors full opportunity information; the authenticated view adds actionable workspace controls.

**Terminology:**
- **Public Opportunity Page:** The unauthenticated view of a published opportunity's full details — USWDS-styled, accessible to anyone
- **Authenticated Workspace View:** The logged-in applicant's view combining the opportunity detail with their personal application status and workspace controls
- **Call to Action:** The primary action button on the opportunity page (e.g., "Start Application", "Continue Application", "Sign in to Apply")

**Sub-features:**
- Render public opportunity detail page with all metadata, deadlines, eligibility summary, Q&A, addenda
- Display application status and workspace link for authenticated applicants with an existing workspace
- Display "Start Application" call to action for authenticated applicants without a workspace (when intake window is open)
- Display "Sign in to Apply" for unauthenticated visitors
- Support opportunity sharing via direct URL

**Process:**
1. Visitor or applicant navigates to `/opportunities/{slug}`
2. System renders opportunity detail page with: title, funder, FON, executive summary, eligibility summary, funding details, deadlines, contact info, Q&A section, addenda section, required attachments summary
3. If visitor is unauthenticated: "Sign in to Apply" button; all content visible (for public opportunities)
4. If visitor is authenticated and has no workspace for this opportunity: "Start Application" button (if intake window open) or "Deadline Passed" state (if closed)
5. If visitor is authenticated and has an existing workspace: "Continue Application" button with application status summary (section completion percentage, blocking errors count)
6. Page includes breadcrumb navigation, print-friendly layout, and share URL

**Inputs:**
- `opportunity_slug` (URL path parameter, required)
- `user_context` (JWT token, optional): Authenticated user identity for personalized view

**Outputs:**
- Rendered opportunity detail page with all public metadata
- For authenticated users: application status panel with workspace link and completion summary
- Response includes structured JSON for programmatic access

**Validation:**
- MUST: Public opportunity page MUST be accessible without authentication for `visibility = public` opportunities
- MUST: For `visibility = restricted_authenticated` opportunities, unauthenticated visitors MUST see only the opportunity title and a sign-in prompt
- MUST: Opportunity detail page MUST be WCAG 2.1 AA compliant
- MUST: Application status panel MUST only show data for the authenticated user's own organization
- MUST: "Start Application" MUST be disabled when `application_open_date > now` or `application_close_date < now`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Opportunity not found | 404 | OPPORTUNITY_NOT_FOUND | "This opportunity does not exist or is no longer available." |
| Access denied (restricted) | 401 | AUTHENTICATION_REQUIRED | "Please sign in to view this opportunity." |
| Intake window closed | 200 (degraded) | — | "Start Application" replaced with "Application window has closed" message |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}` (full detail); `GET /api/v1/opportunities/{opportunity_id}/workspace-status` (authenticated workspace status) — see `Y1a-api-opportunity.md` §Opportunity Detail.

**Schema Surface (this feature):** Reads from `opportunities`, `opportunity_versions`, `qa_items`, `addenda`, `application_workspaces` (for status) — see `Y0a-schema-core.md`, `Y0d-schema-submission.md`.

---

## F17: Opportunity Changes and Addenda Display
*Maps to: PRD-INTAKE-018 | Priority: P0 — MVP*

**Description:** When a grantor publishes changes to a published opportunity — whether deadline modifications, content corrections, or new Q&A responses — the system displays these updates prominently on the opportunity detail page with timestamps and attribution. Applicants who have saved or started applications receive in-app notifications.

**Terminology:**
- **Addendum:** A formal, published change to a published opportunity — may include deadline changes, clarifications, corrections, or new Q&A responses
- **Change Notice:** A UI element on the opportunity detail page that surfaces recent addenda and updates with timestamps
- **Required Application Change:** An addendum that requires applicants to update their in-progress applications (e.g., a new required field is added)

**Sub-features:**
- Display addenda chronologically on the opportunity detail page
- Display deadline changes prominently with before/after values
- Display Q&A updates as they are published (F44)
- Send in-app notifications to applicants with saved/started applications when addenda are published (see Notification Model in 00-header.md)
- Show "Updated" badge on opportunity listing cards when new addenda have been published

**Process:**
1. Grantor publishes a modification to a published opportunity or publishes a new Q&A response (F6, F44)
2. System creates an Addendum record linked to the opportunity and version
3. Addendum is displayed on the opportunity detail page in the "Updates & Addenda" section with: title, type (date_change, content_change, qa_response, correction), description, effective date, and who published it
4. If `deadline_change`: old and new deadline values displayed side by side with prominent visual treatment
5. If `required_application_change`: a warning banner is added to in-progress applicant workspaces
6. Notification triggered to all applicants with `workspace_status != Not Started` for this opportunity
7. Opportunity listing card shows "Updated" badge for 14 days after the most recent addendum

**Inputs:**
- Addendum records created by F6 (opportunity modification) or F44 (Q&A publishing)
- `addendum_id` (UUID, system)
- `addendum_type` (enum): `date_change | content_change | qa_response | correction | required_application_change`
- `title` (string, required): Brief title of the addendum
- `description` (text, required): Full description of the change
- `effective_date` (date, required): Date the change takes effect
- `published_by` (UUID): Grantor user who published

**Outputs:**
- Addendum displayed in "Updates & Addenda" section of opportunity detail page
- In-app notification sent to affected applicant teams
- Email notification sent to affected applicant primary contacts
- "Updated" badge on opportunity listing card
- Audit event: `ADDENDUM_PUBLISHED`

**Validation:**
- MUST: All addenda MUST include `title`, `description`, `addendum_type`, and `effective_date`
- MUST: Date changes MUST display old and new values with clear before/after labeling
- MUST: Required application change addenda MUST display a warning banner in affected applicant workspaces
- MUST: Addenda are immutable once published — corrections require a new addendum
- SHOULD: Addenda SHOULD be displayed in reverse-chronological order (newest first)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Addendum missing required fields | 422 | ADDENDUM_INCOMPLETE | "Addendum must include title, description, type, and effective date." |
| Attempt to edit published addendum | 403 | ADDENDUM_IMMUTABLE | "Published addenda cannot be edited. Publish a new addendum for corrections." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/addenda` (list); `GET /api/v1/addenda/{addendum_id}` (detail) — see `Y1a-api-opportunity.md` §Addenda. Addenda are created by the F6 and F44 flows.

**Schema Surface (this feature):** `addenda` table (addendum_id, opportunity_id FK, version_id FK, addendum_type, title, description, effective_date, published_by, published_at) — see `Y0d-schema-submission.md` §addenda.
---

# Stage 4: Organization Profile and Credential Readiness

*Objective: Reduce repeated application burden by maintaining reusable applicant data.*

---

## F18: Reusable Organization Profile
*Maps to: PRD-INTAKE-019 | Priority: P0 — MVP*

**Description:** Applicant organizations create and maintain a single reusable profile that persists across all applications. Profile data flows into application form fields, eliminating repeated manual entry across funder portals. A profile is created once per organization and is managed by the organization administrator.

**Sub-features:**
- Create organization profile on first registration
- Profile persists independently of any single application
- Profile data pre-populates applicable fields in application workspaces
- Profile editable at any time; updates do not modify submitted application snapshots (F23)

**Process:**
1. Applicant registers for the platform; system prompts organization profile creation
2. Organization admin completes profile setup (see F19 for fields)
3. Profile is saved to the `organizations` table
4. When applicant starts an application workspace (F29), system pre-populates profile fields into the org profile section
5. Pre-populated fields display as editable within the workspace but are sourced from the profile
6. At submission (F52), the profile state is captured in the submission snapshot; future profile edits do not affect the submitted record

**Inputs:** See F19 (Organization Profile Data Capture) for all profile fields.

**Outputs:**
- `organizations` record created or updated
- Profile fields pre-populate application workspace sections
- Audit event: `ORGANIZATION_PROFILE_CREATED` or `ORGANIZATION_PROFILE_UPDATED`

**Validation:**
- MUST: Each organization MUST have exactly one profile record
- MUST: An organization admin MUST complete the profile before creating an application workspace
- MUST: Profile updates after submission MUST NOT modify existing submission snapshots
- SHOULD: Profile completeness percentage SHOULD be displayed to the org admin

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Profile already exists | 409 | PROFILE_EXISTS | "An organization profile already exists for this organization." |
| Unauthorized profile update | 403 | PERMISSION_DENIED | "Only organization administrators can update the organization profile." |

**API Surface (this feature):** `POST /api/v1/organizations` (create); `GET /api/v1/organizations/{org_id}` (get); `PUT /api/v1/organizations/{org_id}` (update) — see `Y1b-api-org.md` §Organizations.

**Schema Surface (this feature):** `organizations` table — see `Y0b-schema-org.md` §organizations.

---

## F19: Organization Profile Data Capture
*Maps to: PRD-INTAKE-020 | Priority: P0 — MVP*

**Description:** The organization profile captures all standard fields required across federal and non-federal grant programs. This includes legal and operational identity, registration status, tax status, contacts, authorized representatives, and banking readiness indicators. All fields are stored in structured format for reuse and downstream intake reporting.

**Sub-features:**
- Capture legal name, DBA, full address, entity type
- Capture UEI, SAM registration status, SAM expiration date
- Capture tax status (EIN, 501(c)(3) status, tax-exempt type)
- Capture authorized representatives and primary contact
- Banking readiness indicator (self-attested)
- Standard document storage (F20)

**Process:**
1. Organization admin completes each profile section
2. System validates each field in real time
3. Profile is saved; completeness indicator updated
4. SAM expiration date stored; system monitors for expiration (F21)

**Inputs:**
- `legal_name` (string, required, max 250 chars): Organization's full legal name
- `dba_name` (string, optional, max 250 chars): Doing Business As name
- `address_line1` (string, required): Street address
- `address_line2` (string, optional): Suite/apt/unit
- `city` (string, required)
- `state` (string, required): 2-letter state code
- `zip` (string, required): 5 or 9-digit ZIP
- `country` (string, required, default: `US`)
- `entity_type` (enum, required): `nonprofit_501c3 | nonprofit_other | for_profit | government_federal | government_state | government_local | tribal | university | individual | other`
- `ein` (string, conditional): 9-digit Employer Identification Number; required for nonprofit and for-profit entities
- `uei` (string, conditional): 12-character Unique Entity Identifier from SAM.gov; required for federal opportunities
- `sam_registered` (boolean, required)
- `sam_expiration_date` (date, conditional): Required if `sam_registered = true`
- `tax_exempt_status` (enum, optional): `501c3 | 501c4 | 501c6 | other | not_applicable`
- `congressional_district` (string, optional)
- `primary_contact_name` (string, required)
- `primary_contact_email` (email, required)
- `primary_contact_phone` (string, optional)
- `banking_readiness` (enum, required): `ready | not_ready | unknown` — self-attested
- `indirect_cost_rate` (decimal, optional): Negotiated indirect cost rate percentage
- `indirect_cost_base` (string, optional): Cost base description (MTDC, TDC, etc.)

**Outputs:**
- Updated `organizations` record with all profile fields
- Credential expiration monitoring initialized for SAM expiration date (F21)

**Validation:**
- MUST: `legal_name`, `address_line1`, `city`, `state`, `zip`, `entity_type`, `primary_contact_name`, `primary_contact_email`, `banking_readiness` MUST be present for profile completion
- MUST: `ein` MUST be 9 digits (format `XX-XXXXXXX` accepted, stripped to digits for storage)
- MUST: `uei` MUST be exactly 12 alphanumeric characters
- MUST: `state` MUST be a valid 2-letter USPS state code
- MUST: `primary_contact_email` MUST pass RFC 5322 validation
- MUST: `sam_expiration_date` MUST be a future date when `sam_registered = true`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid EIN format | 422 | INVALID_EIN | "EIN must be 9 digits (XX-XXXXXXX)." |
| Invalid UEI format | 422 | INVALID_UEI | "UEI must be exactly 12 alphanumeric characters." |
| Invalid state code | 422 | INVALID_STATE | "State code '{state}' is not a valid US state code." |
| SAM expiration in past | 422 | SAM_EXPIRED_ON_ENTRY | "SAM expiration date cannot be in the past." |

**API Surface (this feature):** `PUT /api/v1/organizations/{org_id}` — see `Y1b-api-org.md` §Organization Profile Data.

**Schema Surface (this feature):** All fields on `organizations` table — see `Y0b-schema-org.md` §organizations.

---

## F20: Reusable Standard Attachments Library
*Maps to: PRD-INTAKE-021 | Priority: P0 — MVP*

**Description:** The system stores a library of reusable standard attachments at the organization level. Applicants upload these documents once and can attach them to any application without re-uploading. Each document type maintains a version history. This directly reduces the burden of attaching the same IRS determination letter, W-9, or audit report to every application.

**Sub-features:**
- Upload and store standard documents at the org level
- Document types: IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support
- Version history per document (new upload replaces active version; prior version retained)
- Attach org-level documents to specific application attachment requirements without re-uploading
- Document expiration tracking (integrated with F21)

**Process:**
1. Organization admin navigates to the Organization Document Library
2. Admin selects document type and uploads file
3. System stores file with metadata (name, type, uploaded_by, uploaded_at, version_number)
4. If a prior version exists for this document type, prior version is archived (not deleted)
5. New version becomes active
6. When applicant completes an attachment requirement in a workspace, they may choose "Use from Library" to select the applicable org-level document

**Inputs:**
- `org_id` (UUID, required)
- `document_type` (enum, required): `irs_determination_letter | w9 | audit_report | indirect_cost_agreement | board_roster | insurance_certificate | letters_of_support | other`
- `custom_document_name` (string, conditional): Required if `document_type = other`
- `file` (binary, required): The document file
- `expiration_date` (date, optional): Document expiration date (for tracking in F21)
- `file_name` (string, required): Original filename
- `mime_type` (string, system-derived)

**Outputs:**
- `org_attachments` record with version number, file metadata, storage reference
- Prior version archived
- Attachment available in "Use from Library" selector in application workspaces

**Validation:**
- MUST: File MUST be one of the accepted formats: PDF, DOCX, XLSX, PNG, JPG (max 50 MB)
- MUST: `document_type` MUST be set
- MUST: Prior versions MUST be preserved on replacement; they are NOT deleted
- SHOULD: `expiration_date` SHOULD be provided for time-limited documents (IRS letter, audit reports, SAM, insurance)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| File too large | 413 | FILE_TOO_LARGE | "File size exceeds the 50MB limit." |
| Invalid file format | 415 | INVALID_FILE_FORMAT | "File format is not accepted. Accepted formats: PDF, DOCX, XLSX, PNG, JPG." |
| Document type not found | 404 | DOCUMENT_TYPE_NOT_FOUND | "The specified document type is not valid." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/documents` (list); `POST /api/v1/organizations/{org_id}/documents` (upload); `GET /api/v1/organizations/{org_id}/documents/{doc_id}/versions` (version history) — see `Y1b-api-org.md` §Documents.

**Schema Surface (this feature):** `org_attachments` table (attachment_id, org_id FK, document_type, custom_document_name, version_number, file_name, file_path, mime_type, file_size_bytes, expiration_date, uploaded_by, uploaded_at, is_active) — see `Y0b-schema-org.md` §org_attachments.

---

## F21: Credential Expiration Warnings
*Maps to: PRD-INTAKE-022 | Priority: P0 — MVP*

**Description:** The system monitors the expiration status of credentials, documents, and registrations stored in the organization profile. When an item is expired or approaching expiration, the system warns the applicant in the organization profile and in the application workspace readiness dashboard, before the expired credential becomes a submission blocker. The expiration warning window is configurable per credential type by the organization administrator, with a system default of 60 days.

**Sub-features:**
- Monitor SAM registration expiration date
- Monitor expiration dates of stored documents (audit reports, insurance certificates, IRS letters)
- Allow org admin to configure warning window per credential type (default: 60 days; org admin may set different windows per type, e.g., 90 days for SAM, 30 days for insurance)
- Display in-app warnings when items are expired or within the configured warning window
- Surface expiration warnings in org profile and application workspace readiness dashboard

**Inputs:**
- `item_type` (enum): `sam_registration | irs_determination_letter | audit_report | insurance_certificate | indirect_cost_agreement | other`
- `expiration_date` (date): Date from org profile or document record
- `warning_threshold_days` (integer, org-admin-configurable per credential type): Days before expiration to trigger warning; system default is 60 days if not customized by org admin

**Outputs:**
- In-app warning displayed in organization profile for expired/expiring items
- Warning displayed in application workspace readiness dashboard when a workspace references the expiring item
- Email notification sent to org admin when threshold is crossed (see Notification Model)

**Validation:**
- MUST: SAM expiration date MUST be monitored for all organizations with `sam_registered = true`
- MUST: Expired credentials MUST display as `EXPIRED` (red/error state) in the org profile
- MUST: Credentials within warning threshold MUST display as `EXPIRING SOON` (yellow/warning state)
- MUST: Expired credentials that are required by an opportunity MUST appear as blocking errors in the readiness dashboard
  - MUST: Org Admin MUST be able to configure the warning threshold per credential type; system default MUST be 60 days when no custom threshold is set

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| SAM registration expired at submission | 422 | SAM_EXPIRED | "SAM registration is expired. Update your organization profile before submitting." |
| Required document expired at submission | 422 | DOCUMENT_EXPIRED | "Required document '{document_type}' is expired. Upload a current version." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/credential-status` — returns status of all monitored credentials — see `Y1b-api-org.md` §Credential Status.

**Schema Surface (this feature):** Reads from `organizations.sam_expiration_date` and `org_attachments.expiration_date` — see `Y0b-schema-org.md`.

---

## F22: Organization Role Assignment
*Maps to: PRD-INTAKE-023 | Priority: P0 — MVP*

**Description:** The system supports multi-user organization teams with distinct roles and permission levels. Role assignment is managed by the organization administrator. The Authorized Representative role carries explicit submission authority and is required for final application certification and submission.

**Terminology:**
- **Org Admin:** Full control over organization profile, team members, and role assignments
- **Proposal Lead:** Leads application preparation; assigns section owners, tasks, and contributors
- **Contributor:** Can edit assigned sections; cannot submit
- **Finance Contributor:** Can edit budget sections only; cannot submit
- **Authorized Representative:** Can certify and submit applications; has formal legal authority

**Sub-features:**
- Invite users to the organization team by email
- Assign roles: Org Admin, Proposal Lead, Contributor, Finance Contributor, Authorized Representative
- Users may hold multiple roles (e.g., a user may be both Proposal Lead and Authorized Representative)
- Org Admin can revoke roles at any time
- Role-based access enforced at section, budget, and submission levels

**Process:**
1. Org Admin navigates to the Team Management section
2. Admin enters invitee email and selects one or more roles
3. System sends invitation email; invitee accepts and creates account (or links to existing account)
4. Upon acceptance, user is added to org team with assigned roles
5. Role-based permissions are applied immediately across all active workspaces

**Inputs:**
- `org_id` (UUID, required)
- `invitee_email` (email, required)
- `roles` (enum[], required): One or more of `org_admin | proposal_lead | contributor | finance_contributor | authorized_representative`
- `invited_by` (UUID, required): Org admin initiating the invitation

**Outputs:**
- `org_roles` record created for the invitee
- Invitation email sent
- Audit event: `ROLE_ASSIGNED`

**Validation:**
- MUST: Only Org Admins MUST be able to assign roles
- MUST: An organization MUST have at least one active Org Admin at all times
- MUST: An Authorized Representative MUST be assigned before an application can be submitted
- MUST: Finance Contributors MUST only be able to access budget sections
- SHOULD: Role assignment SHOULD be confirmed by the invitee before the role is fully active

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Last admin removal | 403 | LAST_ADMIN | "Cannot remove the last organization administrator. Assign another admin first." |
| Email not found | 404 | USER_NOT_FOUND | "No user account exists for '{email}'. The invitation will be sent to create an account." |
| Unauthorized role assignment | 403 | PERMISSION_DENIED | "Only organization administrators can assign roles." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/roles` (list team); `POST /api/v1/organizations/{org_id}/roles` (invite + assign); `PUT /api/v1/organizations/{org_id}/roles/{role_id}` (update); `DELETE /api/v1/organizations/{org_id}/roles/{role_id}` (revoke) — see `Y1b-api-org.md` §Roles.

**Schema Surface (this feature):** `org_roles` table (role_id, org_id FK, user_id FK, roles JSONB, invited_by, invitation_accepted_at, created_at, revoked_at) — see `Y0b-schema-org.md` §org_roles.

---

## F23: Profile Reuse with Submission Snapshots
*Maps to: PRD-INTAKE-024 | Priority: P0 — MVP*

**Description:** Applicants can reuse profile fields across applications. When an application is submitted, the system automatically captures a complete snapshot of the organization profile as it existed at submission time. This snapshot is preserved in the submission record; subsequent profile updates do not affect the submitted record. This ensures the submitted application is a complete, accurate, point-in-time record.

**Sub-features:**
- Pre-populate application workspace org profile section from current profile data
- Allow applicants to edit pre-populated fields within the workspace (application-specific overrides)
- At submission, capture org profile snapshot in the submission record
- Prevent profile snapshot modification after submission

**Process:**
1. When workspace is created (F29), system copies current profile field values into the workspace's org profile section
2. Applicant may edit values within the workspace without affecting the master profile
3. At submission (F52), system reads the current state of the org profile section in the workspace and includes it in the submission snapshot (immutable, timestamped)
4. After submission, if the master org profile is updated, the submitted snapshot remains unchanged

**Inputs:**
- `org_id` (UUID): Source profile
- `workspace_id` (UUID): Target application workspace
- At submission: current org profile section state in the workspace

**Outputs:**
- Org profile fields pre-populated in workspace at creation
- `submission_snapshots.org_profile_snapshot` JSONB field populated at submission

**Validation:**
- MUST: The submission snapshot MUST include a complete copy of the org profile section as submitted — not a reference to the live profile record
- MUST: The live profile MUST remain editable at all times without affecting submitted snapshots
- MUST: Workspace-level profile field edits MUST NOT write back to the master profile record

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Profile not found during workspace creation | 404 | PROFILE_NOT_FOUND | "Organization profile not found. Please complete your profile before starting an application." |

**API Surface (this feature):** Profile pre-population is handled by `POST /api/v1/workspaces` (F29). Snapshot is part of `POST /api/v1/workspaces/{workspace_id}/submit` (F52) — see `Y1c-api-application.md`.

**Schema Surface (this feature):** `submission_snapshots.org_profile_snapshot` (JSONB) — see `Y0d-schema-submission.md` §submission_snapshots.
---

# Stage 5: Eligibility Pre-Screening

*Objective: Help applicants determine whether to proceed and help grantors reduce unqualified submissions.*

---

## F24: Eligibility Pre-Screen Workflow
*Maps to: PRD-INTAKE-025 | Priority: P0 — MVP*

**Description:** Before creating an application workspace or before final submission (depending on opportunity configuration set in F9), applicants complete an eligibility pre-screen workflow. The pre-screen is driven by the grantor-configured questionnaire (F9) and evaluated against configured eligibility rules (F7, F8). This surfaces eligibility determinations early, before significant application effort is invested.

**Terminology:**
- **Pre-Screen Session:** A single applicant completion of the eligibility questionnaire for a specific opportunity
- **Pre-Screen Placement:** The point in the workflow where the questionnaire is presented — `pre_workspace` (before workspace creation) or `pre_submission` (before final submit)
- **Pre-Screen Result:** The eligibility determination returned to the applicant after questionnaire completion (Eligible, Likely Eligible, Needs Attention, Ineligible)

**Sub-features:**
- Present questionnaire at configured placement point (pre-workspace or pre-submission)
- Support conditional question display (show/hide question based on prior response — F9)
- Evaluate responses against configured eligibility rules in real time
- Return pre-screen result with rule-level explanations
- Store responses in intake record for administrative screening

**Process:**
1. Applicant clicks "Start Application" on the opportunity detail page (F16)
2. If questionnaire placement is `pre_workspace`: system presents the pre-screen questionnaire before the workspace is created
3. Applicant reads each question and selects responses
4. Conditional logic hides/shows follow-up questions based on responses
5. Applicant submits the questionnaire
6. System evaluates all responses against configured eligibility rules (F7)
7. System computes overall eligibility result state (F25) and returns result to applicant
8. Responses stored in `eligibility_responses` record linked to the opportunity and applicant org
9. If result contains Hard Blocker at `pre_workspace` enforcement: workspace creation is blocked; applicant sees blocker explanation (F26)
10. If result is Eligible, Likely Eligible, or Needs Attention (or blocker is `pre_submission` enforcement): workspace is created (F29); responses are attached to workspace
11. If placement is `pre_submission`: steps 1-10 occur when applicant clicks "Submit" instead of "Start Application"

**Inputs:**
- `opportunity_id` (UUID, required)
- `org_id` (UUID, required): Applicant organization
- `questionnaire_responses` (array, required): Array of `{question_id, selected_option_id}` for each question answered
- `placement_trigger` (enum, system): `pre_workspace | pre_submission`

**Outputs:**
- `eligibility_responses` record created with all question responses and rule evaluations
- Overall eligibility result state returned (F25)
- Triggered rule explanations returned for display (F26)
- If eligible/proceeding: workspace created or submission continues

**Validation:**
- MUST: All `is_required = true` questions MUST be answered before submission of questionnaire
- MUST: Responses MUST be stored before workspace is created or submission proceeds
- MUST: Stored responses MUST be immutable after the pre-screen session is complete; applicants cannot retroactively change responses
- SHOULD: If applicant has already completed the pre-screen for this opportunity (prior session), system SHOULD display prior result and allow applicant to retake or proceed with prior responses

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Required question unanswered | 422 | REQUIRED_QUESTION_UNANSWERED | "Please answer all required questions before continuing." |
| Questionnaire not configured | 404 | QUESTIONNAIRE_NOT_FOUND | "Eligibility questionnaire is not configured for this opportunity." |
| Opportunity intake window not open | 403 | INTAKE_WINDOW_CLOSED | "The application window for this opportunity is not currently open." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/prescreening` (get questionnaire for applicant); `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` (submit responses and get result) — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** `eligibility_responses` table (response_id, opportunity_id FK, org_id FK, workspace_id FK nullable, question_id FK, selected_option_id FK, response_text, rule_evaluation_result, overall_result, submitted_at) — see `Y0c-schema-app.md` §eligibility_responses.

---

## F25: Eligibility Result Display
*Maps to: PRD-INTAKE-026 | Priority: P0 — MVP*

**Description:** After completing the pre-screen questionnaire, applicants receive a clear eligibility result displayed as one of four states. Each state carries a distinct visual treatment using USWDS alert components and provides clear next-step guidance so applicants know whether and how to proceed.

**Terminology:**
- **Eligible:** All configured Hard Blocker rules are met; no advisory warnings triggered — applicant may proceed without restriction
- **Likely Eligible:** All Hard Blocker rules are met; one or more advisory indicators are triggered — applicant may proceed with awareness
- **Needs Attention:** One or more advisory indicators are triggered that raise significant concerns — applicant is encouraged to review before proceeding
- **Ineligible:** One or more Hard Blocker rules are violated — applicant is blocked from proceeding at the enforcement point

**Sub-features:**
- Display one of four result states with USWDS alert styling
- Show rule-level explanations for triggered blockers and advisories (F26)
- Display next-step guidance for each result state
- Allow applicant to download or print result summary

**Result State Definitions and Display:**

| Result State | Trigger Condition | USWDS Alert Type | Next Step |
|---|---|---|---|
| Eligible | No blockers triggered, no advisories triggered | Success (green) | "You appear eligible. Click 'Start Application' to proceed." |
| Likely Eligible | No blockers triggered, ≥1 advisory triggered (minor/informational concerns only) | Info (blue/teal) | "You are likely eligible. Note the advisory information below before proceeding." |
| Needs Attention | No hard blockers, ≥1 advisory triggered that raises a significant concern requiring the applicant to review before proceeding | Warning (yellow) | "Please review the concerns below carefully before starting your application." |
| Ineligible | ≥1 hard blocker triggered | Error (red) | "Based on your responses, you do not appear to be eligible. See explanations below." |

**Note:** Likely Eligible and Needs Attention MUST have distinct visual treatments. Likely Eligible uses the USWDS Info (blue/teal) alert component to signal a positive advisory state. Needs Attention uses the USWDS Warning (yellow) alert component to signal a concern requiring active review. The grantor configures advisory rule severity; the system derives the result state from the evaluation.

**Process:**
1. System receives evaluated responses from F24
2. System computes result state based on triggered rules (see table above)
3. System renders result page using USWDS Alert component (success/warning/error as applicable)
4. System displays per-rule explanations (F26) below the result summary
5. System displays next-step guidance appropriate to the result state
6. If Ineligible with `pre_workspace` enforcement: "Start Application" button is not displayed
7. If Eligible/Likely Eligible/Needs Attention: "Start Application" button is displayed (or "Continue to Submit" for `pre_submission` placement)

**Inputs:** Evaluated `eligibility_responses` record from F24.

**Outputs:**
- Rendered result page with USWDS alert component
- Per-rule explanation text displayed
- Next-step action buttons appropriate to result state
- Result state stored on `eligibility_responses.overall_result`

**Validation:**
- MUST: Result state computation MUST be deterministic and based solely on the configured rule evaluations
- MUST: Ineligible result MUST hide the "Start Application" button when `enforcement_point = pre_workspace`
- MUST: All four result states MUST use the correct USWDS alert variant: Eligible = Success (green), Likely Eligible = Info (blue/teal), Needs Attention = Warning (yellow), Ineligible = Error (red)
- MUST: Likely Eligible and Needs Attention MUST use visually distinct alert variants — they MUST NOT share the same color or component type
- MUST: Result page MUST be WCAG 2.1 AA accessible
- MUST: All triggered rule explanations MUST be displayed in plain language (F7 `explanation_text`)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Result computation error | 500 | RESULT_COMPUTATION_FAILED | "Eligibility result could not be computed. Please try again." |

**API Surface (this feature):** Result is returned inline from `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** `eligibility_responses.overall_result` (enum: eligible | likely_eligible | needs_attention | ineligible) — see `Y0c-schema-app.md` §eligibility_responses.

---

## F26: Eligibility Blocker Explanation
*Maps to: PRD-INTAKE-027 | Priority: P0 — MVP*

**Description:** When an eligibility pre-screen returns a blocker or advisory warning, the system explains specifically which eligibility responses caused the determination, in plain language. Applicants are not left guessing why they received a particular result. Each triggered rule displays its configured `explanation_text` and links to the relevant opportunity eligibility section.

**Sub-features:**
- Display per-rule explanation for every triggered Hard Blocker
- Display per-rule explanation for every triggered Advisory Indicator
- Link each explanation to the relevant section of the opportunity's eligibility requirements
- Distinguish blocker explanations from advisory explanations with distinct visual treatment

**Process:**
1. System evaluates questionnaire responses against rules (F24)
2. For each triggered rule (blocker or advisory), system retrieves the `explanation_text` configured in F7
3. System renders explanation list below the result state alert:
   - Hard Blockers: displayed with error icon and "Why you are ineligible:" label
   - Advisory indicators: displayed with warning icon and "Please note:" label
4. Each explanation includes a "See opportunity requirements" link pointing to the relevant section of the opportunity detail page

**Inputs:** Triggered rule evaluations from F24 with `rule_id`, `severity`, `explanation_text`.

**Outputs:**
- Per-rule explanation text displayed with appropriate icon and label
- Link to opportunity eligibility section for each triggered rule

**Validation:**
- MUST: Every triggered rule MUST display its `explanation_text`
- MUST: Hard Blocker explanations MUST be visually distinct from Advisory explanations
- MUST: Explanation text MUST be the grantor-configured `explanation_text` from the rule record (F7) — system MUST NOT generate its own explanation
- SHOULD: If multiple blockers are triggered, all MUST be displayed (not just the first)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Explanation text missing for rule | 500 | EXPLANATION_TEXT_MISSING | "Rule explanation text is missing. Contact the grantor for eligibility details." |

**API Surface (this feature):** Included in response from `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` as `triggered_rules` array — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** Reads from `eligibility_rules.explanation_text` — see `Y0a-schema-core.md` §eligibility_rules.

---

## F28: Eligibility Response Storage
*Maps to: PRD-INTAKE-029 | Priority: P0 — MVP*

**Description:** All eligibility pre-screen responses are stored as part of the intake record and carried forward into the administrative screening phase. Intake administrators can review eligibility responses alongside the submitted application without asking applicants to repeat information. Responses are included in the submission snapshot (F52).

**Sub-features:**
- Store all question responses and rule evaluations in the intake record at time of pre-screen
- Attach stored responses to the application workspace
- Display stored responses in intake administrator screening panel (F56)
- Include responses in submission snapshot

**Process:**
1. Applicant submits questionnaire (F24)
2. System stores `eligibility_responses` record with all responses and evaluations
3. Record is linked to `opportunity_id`, `org_id`, and (once created) `workspace_id`
4. At submission (F52), responses are included in the submission snapshot JSONB
5. In the intake queue (F56), responses are displayed in a structured format alongside the application

**Inputs:** All question responses and rule evaluations from F24.

**Outputs:**
- `eligibility_responses` records per question per session
- Responses accessible in intake administrator screening panel
- Responses included in `submission_snapshots.eligibility_snapshot` JSONB

**Validation:**
- MUST: Responses MUST be stored before workspace creation or submission proceeds
- MUST: Stored responses MUST be immutable
- MUST: Responses MUST be included in the submission snapshot
- MUST: Responses MUST be visible to intake administrators in the screening panel

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Response storage failure | 500 | RESPONSE_STORAGE_FAILED | "Eligibility responses could not be saved. Please try again." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/eligibility-responses` (get stored responses for intake admin view) — see `Y1c-api-application.md` §Eligibility Responses.

**Schema Surface (this feature):** `eligibility_responses` table — see `Y0c-schema-app.md` §eligibility_responses.
---

# Stage 6: Application Workspace

*Objective: Provide a collaborative, structured, and controlled application preparation environment.*

---

## F29: One Workspace Per Organization Per Opportunity
*Maps to: PRD-INTAKE-030 | Priority: P0 — MVP*

**Description:** The system creates exactly one application workspace per applicant organization per opportunity by default, preventing duplicate submissions and establishing clear ownership. If a second organization member attempts to start a workspace that already exists, the system redirects them to the existing workspace. Multi-track exceptions are configurable by the grantor.

**Sub-features:**
- Enforce single workspace per org per opportunity (default)
- Configurable exception for multi-track opportunities
- Redirect duplicate workspace attempts to existing workspace
- Create workspace upon successful eligibility pre-screen (or immediately if no pre-screen configured)

**Process:**
1. Applicant passes eligibility pre-screen (F24) or opportunity has no pre-screen configured
2. Applicant clicks "Start Application"
3. System checks for existing workspace: `SELECT * FROM application_workspaces WHERE opportunity_id = X AND org_id = Y`
4. If no workspace exists: system creates new workspace; org profile pre-populated (F23); sections initialized per opportunity configuration (F30)
5. If workspace exists and `duplicate_allowed = false`: system redirects applicant to existing workspace with informational message
6. If workspace exists and `duplicate_allowed = true` (multi-track): system prompts applicant to select track and creates a new workspace for the selected track
7. Applicant team notified (Notification Model: "Workspace created")

**Inputs:**
- `opportunity_id` (UUID, required)
- `org_id` (UUID, required)
- `initiated_by` (UUID, required): User who clicked Start Application
- `track_id` (UUID, conditional): Required for multi-track opportunities with `duplicate_allowed = true`

**Outputs:**
- New `application_workspaces` record with `status = Workspace Created`
- Org profile pre-populated in workspace
- Sections initialized per opportunity form configuration
- Audit event: `WORKSPACE_CREATED`
- Notification: "Workspace created" sent to org team

**Validation:**
- MUST: System MUST enforce one workspace per org per opportunity when `duplicate_allowed = false`
- MUST: Workspace MUST NOT be created if the opportunity's `application_open_date > now`
- MUST: Workspace MUST NOT be created if the opportunity's `application_close_date < now`
- MUST: Workspace MUST NOT be created if a Hard Blocker is triggered at `enforcement_point = pre_workspace`
- MUST: Each workspace has a unique `workspace_id`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Workspace already exists | 409 | WORKSPACE_EXISTS | "Your organization already has an application for this opportunity. Continue your existing application." |
| Intake window not open | 403 | INTAKE_WINDOW_CLOSED | "The application window is not currently open." |
| Eligibility pre-screen required | 403 | PRESCREENING_REQUIRED | "Please complete the eligibility pre-screen before starting an application." |

**API Surface (this feature):** `POST /api/v1/workspaces` (create); `GET /api/v1/workspaces/{workspace_id}` (get) — see `Y1c-api-application.md` §Workspaces.

**Schema Surface (this feature):** `application_workspaces` table (workspace_id, opportunity_id FK, org_id FK, track_id FK nullable, status, created_by, created_at) — see `Y0c-schema-app.md` §application_workspaces.

---

## F30: Structured Workspace Sections
*Maps to: PRD-INTAKE-031 | Priority: P0 — MVP*

**Description:** Every application workspace includes a standard set of structured sections covering the full application scope. Section configuration is inherited from the opportunity form configuration; sections may be conditionally visible (F10) based on applicant type or other criteria.

**Standard Sections:**
1. Organization Profile — pre-populated from org profile (F23)
2. Eligibility — pre-populated from pre-screen responses (F28)
3. Narrative — grantor-configured text sections and form fields
4. Budget — structured budget builder (F38)
5. Workplan — grantor-configured workplan form
6. Performance Measures — grantor-configured performance indicators form
7. Attachments — file upload per configured requirements (F40)
8. Certifications — required certifications and assurances
9. Review / Submit — submission readiness and final certification (F51, F52)

**Sub-features:**
- Initialize all configured sections when workspace is created
- Display section completion status (not started, in progress, complete, error)
- Navigate between sections via sidebar navigation
- Mark sections as locked after submission
- Support conditional section visibility (F10)

**Process:**
1. Workspace is created (F29)
2. System initializes all sections per opportunity configuration; each section gets `status = Not Started`
3. Applicant navigates sections via sidebar; each section shows completion indicator
4. As applicant enters data, section status updates: `In Progress`, `Complete`, or `Error`
5. Section statuses roll up to the overall workspace readiness dashboard (F34)
6. After submission, all sections locked (status = `Locked`)

**Inputs:** Section configuration from opportunity form builder.

**Outputs:**
- `application_sections` records created for each section
- Section status tracking updated as data is entered
- Section completion visible in sidebar navigation and readiness dashboard

**Validation:**
- MUST: All required sections MUST be initialized at workspace creation
- MUST: Hidden conditional sections MUST NOT block submission (F10)
- MUST: Section completion MUST be computed based on required fields within the section
- MUST: After submission, all sections MUST be locked against editing

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Section not found | 404 | SECTION_NOT_FOUND | "Application section not found." |
| Edit attempted on locked section | 403 | SECTION_LOCKED | "This section is locked. The application has been submitted." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/sections` (list sections); `GET /api/v1/workspaces/{workspace_id}/sections/{section_id}` (section detail) — see `Y1c-api-application.md` §Sections.

**Schema Surface (this feature):** `application_sections` table (section_id, workspace_id FK, section_type, section_name, status, is_visible, display_order, created_at) — see `Y0c-schema-app.md` §application_sections.

---

## F31: Section Ownership, Tasks, and Contributor Assignments
*Maps to: PRD-INTAKE-032 | Priority: P0 — MVP*

**Description:** The proposal lead can assign section ownership to specific team members, set internal due dates, create tasks, and add section-level comments. This replaces email-based application coordination with a structured, in-platform collaboration workflow.

**Sub-features:**
- Assign a section owner from the org team roster
- Set an internal section due date (independent of submission deadline)
- Create and assign tasks within the workspace
- Add section-level comments visible to assigned team members
- Notify section owners when assigned

**Process:**
1. Proposal Lead opens a section in the workspace
2. Lead selects "Assign Owner" and chooses a team member from the org roster
3. Lead optionally sets an internal due date for the section
4. Lead may create tasks: title, assignee, due date, notes
5. System saves assignments and tasks
6. Email and in-app notification sent to newly assigned section owner
7. Section owner sees their assigned sections and tasks in their personal workspace dashboard

**Inputs:**
- `section_id` (UUID, required)
- `owner_id` (UUID, optional): Org team member assigned as section owner
- `internal_due_date` (date, optional)
- Per task: `task_title` (string, required), `assignee_id` (UUID, required), `task_due_date` (date, optional), `task_notes` (text, optional)

**Outputs:**
- `application_sections.owner_id` and `application_sections.internal_due_date` updated
- `workspace_tasks` records created
- Notification sent to newly assigned section owner
- Tasks visible in workspace task panel

**Validation:**
- MUST: Only Proposal Lead or Org Admin MUST be able to assign section ownership
- MUST: `owner_id` MUST be an active member of the org team
- MUST: Task `assignee_id` MUST be an active member of the org team
- SHOULD: Internal due dates SHOULD be before the opportunity submission deadline

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Assignee not in org team | 404 | ASSIGNEE_NOT_FOUND | "The selected user is not a member of your organization team." |
| Unauthorized assignment | 403 | PERMISSION_DENIED | "Only proposal leads and organization admins can assign section ownership." |

**API Surface (this feature):** `PUT /api/v1/workspaces/{workspace_id}/sections/{section_id}/assignment` (assign owner + due date); `POST /api/v1/workspaces/{workspace_id}/tasks` (create task) — see `Y1c-api-application.md` §Section Assignment.

**Schema Surface (this feature):** `application_sections.owner_id`, `application_sections.internal_due_date`; `workspace_tasks` table (task_id, workspace_id FK, section_id FK, task_title, assignee_id FK, task_due_date, task_notes, status, created_by, created_at) — see `Y0c-schema-app.md`.

---

## F32: Private Internal Applicant Comments
*Maps to: PRD-INTAKE-033 | Priority: P0 — MVP*

**Description:** The workspace supports private internal comments between applicant team members. These comments are never visible to the grantor, are not included in the submission package or any grantor-accessible view, and are clearly labeled as grantee-private. They serve as the in-platform replacement for email-based application coordination.

**Sub-features:**
- Post internal comments on sections or on the workspace overall
- Comments visible only to applicant org team members with workspace access
- Comments clearly labeled "Internal Only — Not Visible to Grantor" in USWDS-styled banner
- Comments not included in submission snapshot or grantor intake queue view

**Process:**
1. Team member navigates to a section or workspace-level comments panel
2. Member types comment and clicks "Post"
3. Comment saved with timestamp, user attribution, and section reference
4. All org team members with access to the workspace see the comment
5. Grantor users cannot access the comments panel; data is excluded from any grantor API responses

**Inputs:**
- `workspace_id` (UUID, required)
- `section_id` (UUID, optional): If comment is section-specific
- `comment_text` (text, required, max 5000 chars)
- `posted_by` (UUID, required)

**Outputs:**
- `workspace_comments` record created with `visibility = internal`
- Comment displayed in comments panel for org team
- Comment NOT included in submission snapshot, NOT accessible via grantor API

**Validation:**
- MUST: Comments MUST be accessible only to authenticated members of the applicant org team for this workspace
- MUST: Comment data MUST be excluded from all grantor-facing API responses
- MUST: Comments MUST NOT be included in the submission snapshot (F52)
- MUST: Comments MUST display a "Internal Only — Not Visible to Grantor" label in the UI
- MUST: Comments MUST be preserved after submission (for applicant team reference)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Comment too long | 422 | COMMENT_TOO_LONG | "Comment cannot exceed 5,000 characters." |
| Unauthorized comment access | 403 | ACCESS_DENIED | "You do not have access to this workspace." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/comments` (list); `POST /api/v1/workspaces/{workspace_id}/comments` (create) — **Grantor API MUST NOT expose this endpoint** — see `Y1c-api-application.md` §Comments.

**Schema Surface (this feature):** `workspace_comments` table (comment_id, workspace_id FK, section_id FK nullable, comment_text, visibility=internal, posted_by FK, posted_at) — see `Y0c-schema-app.md` §workspace_comments.

---

## F34: Readiness Dashboard
*Maps to: PRD-INTAKE-035 | Priority: P0 — MVP*

**Description:** The workspace provides a readiness dashboard as the applicant's primary tool for understanding submission readiness. The dashboard shows overall completion percentage by section, all blocking errors with links to source fields, warnings and informational items, required attachment status, and whether the authorized submitter role is assigned and ready.

**Sub-features:**
- Overall completion percentage (% of required fields completed across all visible sections)
- Section-level completion status with per-section progress indicators
- Blocking errors list with direct links to the incomplete field or section
- Warning and informational items (non-blocking)
- Required attachments checklist with fulfillment status
- Authorized representative readiness indicator (role assigned + ready to certify)
- "Ready to Submit" indicator when all blocking items are cleared

**Process:**
1. Applicant or team member opens the workspace readiness dashboard (accessible from workspace sidebar at all times)
2. System computes: required fields completed vs. total required fields across all visible sections
3. System evaluates all validation rules (F48) and classifies issues
4. Dashboard renders:
   - Completion percentage bar
   - Per-section status cards (green = complete, yellow = in progress, red = errors)
   - Blocking errors section: each error listed with field reference and "Fix" button
   - Warnings section: advisories and informational items
   - Attachments section: required attachments with upload status
   - Authorized representative section: assigned user name or "Not assigned" with role assignment link
5. Dashboard updates in near-real-time as applicant edits data
6. When all blocking errors are cleared and authorized representative is assigned: "Ready to Submit" banner displayed

**Inputs:** Current state of all `application_sections`, `workspace_tasks`, `attachments`, `eligibility_responses`, `org_roles` for this workspace.

**Outputs:**
- `readiness_summary` object:
  - `overall_completion_pct` (decimal 0.0–1.0)
  - `blocking_errors` (array: field_ref, section_id, message)
  - `warnings` (array)
  - `informational` (array)
  - `attachment_status` (array: requirement_id, is_fulfilled, document_name)
  - `authorized_rep_assigned` (boolean)
  - `is_ready_to_submit` (boolean)

**Validation:**
- MUST: All blocking errors MUST be resolved before `is_ready_to_submit = true`
- MUST: `authorized_rep_assigned` MUST be `true` for `is_ready_to_submit = true`
- MUST: Hidden conditional sections MUST NOT contribute blocking errors
- MUST: Readiness dashboard MUST be accessible at all times during drafting
- SHOULD: Dashboard SHOULD refresh within 3 seconds after any field edit

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Readiness computation error | 500 | READINESS_COMPUTATION_FAILED | "Submission readiness could not be computed. Please refresh." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/readiness` — see `Y1c-api-application.md` §Readiness.

**Schema Surface (this feature):** Computed from `application_sections`, `attachments`, `org_roles`, `eligibility_responses` — no dedicated table; computed on demand — see `Y0c-schema-app.md`.

---

## F35: Draft Privacy Until Submission
*Maps to: PRD-INTAKE-036 | Priority: P0 — MVP*

**Description:** Application drafts remain grantee-private until the applicant submits. Grantors cannot access draft application content at any point during preparation. This strict data visibility boundary is enforced at both the API and data layers. Exceptions exist only for explicitly configured pre-application or Q&A workflows where the applicant has deliberately shared content.

**Sub-features:**
- Strict grantee-private enforcement on all draft application data
- Grantor API endpoints MUST NOT return draft workspace content
- Exception path: pre-application workflow (if configured) allows grantor to see pre-application package only
- Draft content labeled "Draft — Not Submitted" in all applicant views
- Submission package preview (F42) shows exactly what the grantor will see upon submission

**Process:**
1. Workspace is created and applicant begins drafting
2. All draft content is stored with `visibility = grantee_private` in the data model
3. Grantor API requests for workspace content return 403 for `status != Submitted`
4. Applicant can generate a submission package preview (F42) at any time to see exactly what will be visible to the grantor upon submission
5. Upon submission (F52), visibility transitions to `shared`; grantor can now access the submission snapshot

**Inputs:** `workspace_id`, `status` from `application_workspaces`.

**Outputs:**
- API access control: 403 response for grantor access to draft workspaces
- UI labels: "Draft — Not Submitted" banner on all draft content
- Data model visibility flag transitions from `grantee_private` to `shared` upon submission

**Validation:**
- MUST: Grantor API MUST return HTTP 403 for any request to access draft workspace content (status ≠ Submitted)
- MUST: Internal comments (F32) MUST NEVER transition to `shared` — they remain `grantee_private` permanently
- MUST: The transition to `shared` MUST only occur when the submission snapshot is generated (F52)
- MUST: Pre-application packages shared via configured workflow MUST be explicitly labeled as "Shared Pre-Application Package" and scoped to the pre-application section only

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Grantor access to draft workspace | 403 | DRAFT_ACCESS_DENIED | "Application is in draft status and cannot be viewed at this time." |

**API Surface (this feature):** Access control enforced on all `GET /api/v1/workspaces/{workspace_id}/*` endpoints — see `Y1c-api-application.md` §Access Control.

**Schema Surface (this feature):** `application_workspaces.visibility` and `application_sections.visibility` enum fields (`grantee_private | shared`) — see `Y0c-schema-app.md`.
---

# Stage 7: Form, Budget, and Attachment Intake

*Objective: Capture intake data as structured data wherever possible, not only as uploaded PDFs.*

---

## F36: Configurable Form Field Types
*Maps to: PRD-INTAKE-037 | Priority: P0 — MVP*

**Description:** The platform supports a full range of configurable form field types to capture structured application data. Forms are configured by the grantor in the opportunity form builder and rendered dynamically in the applicant workspace. Forms adapt in real time based on conditional logic (F10).

**Terminology:**
- **Form Builder:** The grantor-facing configuration interface for creating application forms
- **Field Definition:** A configured form field with type, label, validation rules, and display settings
- **Repeating Table:** A tabular form section where applicants can add multiple rows (e.g., staff roster, activity list)
- **Calculated Field:** A read-only field whose value is automatically computed from other field values (e.g., total cost = sum of budget line items)

**Supported Field Types:**

| Field Type | Description | Validation Support |
|---|---|---|
| `text` | Single-line text input | Required, max_length, pattern |
| `textarea` | Multi-line text with character/word counter | Required, max_chars, max_words |
| `number` | Numeric input | Required, min, max, decimal_places |
| `currency` | Dollar amount input with $ formatting | Required, min, max |
| `date` | Date picker | Required, min_date, max_date |
| `picklist` | Dropdown or radio button select | Required, allowed_values |
| `multi_select` | Checkbox group for multiple selections | Required, min_selected, max_selected |
| `checkbox` | Single boolean checkbox | Required |
| `file_upload` | File attachment upload | Required, file_formats, max_size_mb |
| `calculated` | Read-only computed value | Formula expression |
| `repeating_table` | Multiple-row table with column definitions | Required, min_rows, max_rows |

**Sub-features:**
- Grantor form builder with all supported field types
- Drag-and-drop field ordering within sections
- Field validation settings configurable per field
- Form preview before publication (renders as applicant would see it)
- Calculated field formula builder (sum, count, concatenate operations)
- Repeating table column definition

**Process:**
1. Grantor opens the form builder for an application section
2. Grantor drags or adds fields from the field type palette
3. For each field, grantor configures: label, placeholder, help text, required/optional, field-type-specific validation settings
4. Grantor orders fields and optionally applies conditional display logic (F10)
5. Grantor previews the form
6. Form configuration is saved to `form_field_definitions` records
7. At runtime, form is rendered for the applicant from the `form_field_definitions`

**Inputs (Form Builder):**
- Per field: `field_type`, `label` (string, required, max 200 chars), `placeholder` (string, optional), `help_text` (string, optional, max 1000 chars), `is_required` (boolean), `display_order` (integer)
- Type-specific validation: `max_length`, `max_chars`, `min`, `max`, `decimal_places`, `allowed_values` (for picklist), `min_selected`, `max_selected` (for multi_select), `file_formats`, `max_size_mb` (for file_upload), `formula` (for calculated), `columns` (array, for repeating_table)

**Outputs:**
- `form_field_definitions` records per field per section
- Form rendered in applicant workspace using USWDS form components

**Validation:**
- MUST: All field types listed in the supported field types table MUST be implemented
- MUST: Calculated fields MUST be read-only in the applicant view
- MUST: `repeating_table` MUST support adding and removing rows up to configured `max_rows`
- MUST: Field label MUST be provided for every field
- SHOULD: Form builder SHOULD support a minimum of 50 fields per section

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid formula in calculated field | 422 | INVALID_FORMULA | "Calculated field formula references a field that does not exist." |
| Field type not supported | 422 | INVALID_FIELD_TYPE | "Field type '{type}' is not supported." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/sections/{section_id}/fields` (get field definitions); `POST/PUT/DELETE /api/v1/form-fields/{field_id}` (manage fields) — see `Y1a-api-opportunity.md` §Form Builder.

**Schema Surface (this feature):** `form_field_definitions` table (field_id, section_id FK, field_type, label, placeholder, help_text, is_required, display_order, validation_config JSONB, formula, columns JSONB, created_by, created_at) — see `Y0c-schema-app.md` §form_field_definitions.

---

## F37: Form Constraints and Formatting Guidance
*Maps to: PRD-INTAKE-038 | Priority: P0 — MVP*

**Description:** The system enforces page and character limits, required field markers, conditional field display, and provides in-line formatting guidance so applicants understand exactly what is expected in each field. Validation is continuous during drafting (F48) and final at submission.

**Sub-features:**
- Real-time character counter with limit enforcement (blocks input at limit)
- Word limit enforcement for narrative fields
- Required field indicators (USWDS required asterisk)
- In-line help text and formatting guidance per field (grantor-configured)
- Conditional field display based on prior responses (F10)
- Page limit indicator for narrative sections (where applicable)

**Process:**
1. Applicant opens a narrative or form section
2. Each field displays:
   - USWDS required asterisk (*) if `is_required = true`
   - Grantor-configured help text below the field label
   - Character counter showing "X of Y characters used" as applicant types
   - Visual warning when approaching limit (≥80% of limit)
   - Hard stop at character limit (additional input blocked or pasted content truncated)
3. Conditional fields appear/disappear as the applicant completes prior fields (F10)

**Inputs:**
- Field configuration from `form_field_definitions` (label, is_required, help_text, max_chars, max_words)
- Runtime: applicant input text

**Outputs:**
- Real-time character/word counter displayed beneath the field
- Required field indicator displayed
- Validation state updated (valid/invalid) as applicant types
- Field-level error message displayed when constraint violated

**Validation:**
- MUST: Character limit MUST be enforced; input MUST be blocked or truncated at the limit
- MUST: Required fields MUST display USWDS asterisk indicator
- MUST: Field-level validation errors MUST be displayed adjacent to the field (not only in the readiness dashboard)
- MUST: Help text MUST be displayed below the field label in USWDS helper text style
- SHOULD: Warning styling SHOULD appear when field is ≥80% of character/word limit

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Character limit exceeded | 422 | CHAR_LIMIT_EXCEEDED | "This field has a limit of {max_chars} characters. Please shorten your response." |
| Required field empty at save | 422 | REQUIRED_FIELD_EMPTY | "This field is required." |

**API Surface (this feature):** Field constraints are embedded in `GET /api/v1/opportunities/{opportunity_id}/sections/{section_id}/fields` response — see `Y1a-api-opportunity.md` §Form Builder. Validation state managed client-side with server-side confirmation at save.

**Schema Surface (this feature):** `form_field_definitions.validation_config` JSONB — see `Y0c-schema-app.md` §form_field_definitions.

---

## F38: Structured Budget Capture
*Maps to: PRD-INTAKE-039 | Priority: P0 — MVP*

**Description:** The system provides a structured budget builder with configurable budget categories, cost-share and match tracking, indirect cost capture, budget period management, and budget justification fields. This replaces narrative-only budget attachments with structured, validated data that can be used for downstream review and reporting.

**Terminology:**
- **Budget Category:** A line item grouping within the budget (Personnel, Fringe Benefits, Travel, Equipment, Supplies, Contractual, Indirect Costs, Other Direct Costs)
- **Budget Period:** A single fiscal year or project period within a multi-year budget
- **Cost-Share / Match:** Non-federal or non-grantor funds committed to the project as a condition of the award
- **Indirect Cost Rate:** The negotiated percentage applied to the direct cost base to calculate indirect costs
- **Budget Justification:** A narrative explanation for each budget category or line item

**Sub-features:**
- Configurable budget categories per opportunity (grantor selects which categories apply)
- Single-year and multi-year budget period support
- Personnel lines with FTE, salary, and fringe benefit calculation
- Cost-share / match line capture (required vs. optional per opportunity)
- Indirect cost calculation (rate × base)
- Budget justification narrative per category
- Auto-calculated subtotals and totals

**Process:**
1. Grantor configures the budget template in the Opportunity Builder: selects applicable categories, sets budget period count, configures match requirement and indirect cost rules
2. Applicant opens the Budget section in their workspace
3. Budget builder renders configured categories with line item entry rows
4. Applicant enters line items: description, quantity, unit cost, total (calculated)
5. For Personnel lines: applicant enters name/title, FTE, annual salary, fringe rate; system calculates fringe cost and total
6. Indirect cost: applicant enters rate and cost base; system calculates indirect cost amount
7. Cost-share lines: applicant enters match source, amount, and match type (cash/in-kind)
8. Subtotals and totals auto-computed by system
9. Budget justification narrative fields available per category
10. Budget data saved continuously; validation run (F39) after each save

**Inputs (Budget Data):**
- Per line item: `category` (enum), `description` (string, required), `quantity` (decimal, optional), `unit_cost` (currency, optional), `total_cost` (currency, required)
- Personnel: `personnel_name` (string), `fte` (decimal 0.0–1.0), `annual_salary` (currency), `fringe_rate` (decimal)
- Indirect: `indirect_rate` (decimal), `cost_base` (currency), `indirect_amount` (calculated)
- Cost-share: `match_source` (string), `match_amount` (currency), `match_type` (enum: `cash | in_kind`)
- Budget justification: `justification_text` (text, max 2000 chars per category)
- `budget_period_number` (integer): Which budget period this line item belongs to

**Outputs:**
- `budget_line_items` records per line item
- `budget_totals` computed per period and overall
- Budget summary displayed in readiness dashboard
- Budget data included in submission snapshot and grantor intake queue view

**Validation:**
- MUST: Auto-calculated fields MUST be computed by the system, not entered manually
- MUST: FTE MUST be between 0.01 and 1.0
- MUST: All currency values MUST be non-negative
- MUST: Fringe rate MUST be between 0% and 100%
- SHOULD: Budget justification SHOULD be required for all categories with a configured justification requirement

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Negative line item amount | 422 | NEGATIVE_AMOUNT | "Budget amounts must be zero or greater." |
| FTE out of range | 422 | INVALID_FTE | "FTE must be between 0.01 and 1.0." |
| Fringe rate out of range | 422 | INVALID_FRINGE_RATE | "Fringe benefit rate must be between 0% and 100%." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/budget` (get budget); `PUT /api/v1/workspaces/{workspace_id}/budget` (update budget); `POST /api/v1/workspaces/{workspace_id}/budget/line-items` (add line item) — see `Y1c-api-application.md` §Budget.

**Schema Surface (this feature):** `budgets` table (budget_id, workspace_id FK, total_federal_request, total_match, total_indirect, budget_periods_count, created_at); `budget_line_items` table (line_id, budget_id FK, budget_period, category, description, quantity, unit_cost, total_cost, fte, annual_salary, fringe_rate, match_source, match_type, justification_text, created_by, updated_at) — see `Y0c-schema-app.md` §budgets.

---

## F39: Budget Validation
*Maps to: PRD-INTAKE-040 | Priority: P0 — MVP*

**Description:** The system validates budget data against configured rules: total calculation accuracy, match requirements, funding request ceiling compliance, and required budget justification completeness. Budget errors are surfaced in the readiness dashboard (F34) and block submission when unresolved (F50).

**Sub-features:**
- Auto-validate budget totals after each save
- Validate funding request against opportunity ceiling (`funding_amount_max`)
- Enforce match/cost-share requirements when configured
- Require budget justification completeness per configured categories
- Display budget validation errors in readiness dashboard

**Process:**
1. Applicant saves budget data (F38)
2. System runs budget validation rules:
   - Total federal request = sum of all non-match line items
   - Total request ≤ `funding_amount_max` from opportunity (F1)
   - If match required: total match ≥ match requirement percentage × total project cost
   - If justification required for a category: justification text must be non-empty
3. Validation results returned as blocking errors (ceiling violation, match shortage) or warnings (justification incomplete)
4. Results displayed in readiness dashboard and inline on budget section

**Inputs:**
- Budget data from F38 (`budget_line_items`, `budget_totals`)
- Opportunity configuration: `funding_amount_max`, `match_required`, `match_percentage`, `justification_required_categories`

**Outputs:**
- Validation result: list of blocking errors and warnings per rule
- `budgets.validation_status` updated (valid/invalid)
- Errors displayed in budget section and readiness dashboard

**Validation:**
- MUST: Total federal request MUST NOT exceed `funding_amount_max`
- MUST: When `match_required = true` and `match_percentage > 0`, total match MUST be ≥ calculated requirement
- MUST: Budget justification MUST be non-empty for all categories in `justification_required_categories`
- MUST: All subtotals and totals MUST be server-computed; submitted totals that differ from computed values MUST be rejected
- SHOULD: Budget warnings (non-blocking) SHOULD be displayed when match approaches but does not meet requirement

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Funding ceiling exceeded | 422 | FUNDING_CEILING_EXCEEDED | "Total funding request ({amount}) exceeds the maximum award of {ceiling}." |
| Match requirement not met | 422 | MATCH_REQUIREMENT_NOT_MET | "Cost-share of {actual} does not meet the required match of {required}." |
| Justification missing | 422 | BUDGET_JUSTIFICATION_MISSING | "Budget justification is required for category '{category}'." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/budget/validate` — see `Y1c-api-application.md` §Budget Validation.

**Schema Surface (this feature):** `budgets.validation_status`, `budgets.validation_errors` JSONB — see `Y0c-schema-app.md` §budgets.

---

## F40: Attachment Requirements by Section and Applicant Type
*Maps to: PRD-INTAKE-041 | Priority: P0 — MVP*

**Description:** Attachment requirements configured by the grantor (F11) are enforced at the section level and differentiated by applicant type. The system tracks which attachments have been uploaded, which are missing, and which have been fulfilled from the organization's reusable document library (F20).

**Sub-features:**
- Display applicable attachment requirements per section for the applicant's type
- Allow file upload directly within the section
- Allow "Use from Library" to select an org-level document (F20)
- Track fulfillment status per requirement
- Display missing required attachments as blocking errors in readiness dashboard

**Process:**
1. Applicant navigates to an application section with attachment requirements
2. System displays the list of required and recommended attachments filtered for the applicant's entity type
3. For each requirement, applicant either:
   - Uploads a new file: system stores as `attachments` record linked to the workspace
   - Selects "Use from Library": system creates a reference to the org-level document (F20)
4. Fulfillment status updated to `fulfilled` when a file is associated
5. Missing required attachments shown as blocking errors in readiness dashboard

**Inputs:**
- `workspace_id`, `section_id` (UUID, required)
- `requirement_id` (UUID): Which attachment requirement is being fulfilled
- `file` (binary, conditional): New file upload
- `org_document_id` (UUID, conditional): Reference to org-level document

**Outputs:**
- `attachments` record created (for new upload) or reference record (for library use)
- Requirement fulfillment status updated
- Readiness dashboard updated

**Validation:**
- MUST: System MUST filter requirements by the applicant's entity type — requirements not applicable to the applicant's type MUST NOT be shown or enforced
- MUST: Required attachment MUST block submission when unfulfilled (F50)
- MUST: File type and size limits from `attachment_requirements` MUST be enforced at upload time
- MUST: "Use from Library" MUST only display documents matching the requirement's `document_type`

**Error States:** See F11 error states for file-level upload errors.

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/sections/{section_id}/attachments` (upload or reference); `GET /api/v1/workspaces/{workspace_id}/attachments` (list) — see `Y1c-api-application.md` §Attachments.

**Schema Surface (this feature):** `attachments` table (attachment_id, workspace_id FK, section_id FK, requirement_id FK, source_type (upload|library), org_document_id FK nullable, file_name, file_path, mime_type, file_size_bytes, version_number, uploaded_by, uploaded_at) — see `Y0c-schema-app.md` §attachments.

---

## F41: Attachment Document Versioning
*Maps to: PRD-INTAKE-042 | Priority: P0 — MVP*

**Description:** When applicants replace an uploaded attachment, the system maintains a complete replacement history with timestamps and uploader attribution. Prior versions are preserved for audit purposes. The submission snapshot captures the current (active) version at the time of submission.

**Sub-features:**
- Maintain version history for each attachment requirement fulfillment
- Mark the most recent upload as the active version
- Preserve all prior versions (not deleted)
- Display version history to applicant team (upload date, uploader name, file name)
- Include active version in submission snapshot

**Process:**
1. Applicant uploads a file for an attachment requirement
2. System creates version 1 record as active
3. If applicant uploads a replacement: prior version marked `is_active = false`; new version created as `is_active = true` with incremented `version_number`
4. Version history visible to applicant team via attachment version panel
5. At submission (F52), the active version of each attachment is captured in the snapshot

**Inputs:**
- `attachment_id` (UUID, required): Attachment being replaced
- New file upload (binary)

**Outputs:**
- Prior version record updated: `is_active = false`
- New `attachments` record created as `is_active = true`, incremented `version_number`
- Version history list updated

**Validation:**
- MUST: Prior versions MUST NOT be deleted; they MUST be preserved
- MUST: Only the active version (`is_active = true`) MUST be included in submission
- MUST: Version history MUST display uploader, upload timestamp, and file name for every version

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Version not found | 404 | VERSION_NOT_FOUND | "Attachment version not found." |
| File too large on replacement | 413 | FILE_TOO_LARGE | "Replacement file exceeds the size limit for this attachment." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/attachments/{attachment_id}/versions` (version history); `POST /api/v1/workspaces/{workspace_id}/attachments/{attachment_id}/replace` (replace with new version) — see `Y1c-api-application.md` §Attachment Versions.

**Schema Surface (this feature):** `attachments.version_number`, `attachments.is_active` — see `Y0c-schema-app.md` §attachments.

---

## F42: Submission Package Preview
*Maps to: PRD-INTAKE-043 | Priority: P0 — MVP*

**Description:** Before finalizing submission, applicants can generate a preview of the complete submission package. The preview shows exactly what the grantor will receive — all forms, budget data, attachments, and certifications — in a human-readable USWDS-formatted view. Preview generation does not initiate or lock the submission.

**Sub-features:**
- Generate a read-only preview of the full submission package on demand
- Preview includes: all visible sections, form data, budget summary, attachment list with file names, eligibility responses, certification text
- Preview rendered in human-readable USWDS-styled format
- Preview is clearly labeled "PREVIEW — NOT SUBMITTED"
- Downloadable as PDF
- Preview does not create a submission snapshot or change workspace status

**Process:**
1. Applicant navigates to the Review / Submit section
2. Applicant clicks "Preview Submission Package"
3. System assembles a preview from the current workspace state (all visible sections, current form data, active attachment versions)
4. System renders the preview in a USWDS-styled, print-friendly HTML view with "PREVIEW — NOT SUBMITTED" watermark
5. Applicant may download as PDF
6. Applicant may return to edit any section without affecting the submission

**Inputs:**
- `workspace_id` (UUID, required)

**Outputs:**
- Preview document: complete readable representation of all application sections
- PDF download available
- No database writes; workspace status unchanged

**Validation:**
- MUST: Preview MUST be clearly labeled "PREVIEW — NOT SUBMITTED" in a prominent header
- MUST: Preview MUST include all data that will be visible to the grantor upon submission (and exclude internal comments, F32)
- MUST: Preview generation MUST NOT change workspace status or create any intake record
- SHOULD: Preview SHOULD be available even when blocking errors exist (so applicant can review partial content)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Preview generation failed | 500 | PREVIEW_GENERATION_FAILED | "Submission package preview could not be generated. Please try again." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/preview` (generate preview; returns HTML or PDF) — see `Y1c-api-application.md` §Preview.

**Schema Surface (this feature):** No writes; reads from all workspace-related tables — see `Y0c-schema-app.md`.
---

# Stage 8: Q&A, Clarifications, and Addenda

*Objective: Manage applicant questions and opportunity clarifications in a transparent, auditable way.*

---

## F43: Grantor Q&A Configuration
*Maps to: PRD-INTAKE-044 | Priority: P0 — MVP*

**Description:** Grantors configure whether applicants can submit questions during the opportunity period. Public Q&A is configurable — it can be enabled or disabled per opportunity, with optional question submission window dates. Submitted questions are routed to designated grantor staff for response.

**Terminology:**
- **Q&A Enabled:** Opportunity configuration allowing applicants to submit questions through the platform
- **Question Submission Window:** An optional configured time range during which applicants may submit questions (can be narrower than the full application window)
- **Question Routing:** Automatic assignment of submitted questions to designated grantor staff members for response

**Sub-features:**
- Enable or disable applicant question submission per opportunity
- Configure question submission window (open/close dates — optional; defaults to full application window)
- Designate one or more grantor staff to receive and respond to questions
- Display Q&A section on opportunity detail page when enabled

**Process:**
1. Grantor navigates to Q&A configuration in the Opportunity Builder
2. Grantor enables Q&A by toggling `qa_enabled = true`
3. Grantor optionally configures `question_window_open` and `question_window_close` dates
4. Grantor designates one or more grantor team members as Q&A responders (by user ID)
5. Configuration saved
6. Q&A section displayed on opportunity detail page for applicants when `qa_enabled = true`
7. Applicants can submit questions only when intake window is open and (if configured) within the question window

**Inputs:**
- `opportunity_id` (UUID, required)
- `qa_enabled` (boolean, required)
- `question_window_open` (datetime, optional): When question submission opens
- `question_window_close` (datetime, optional): When question submission closes
- `responder_user_ids` (UUID[], required if `qa_enabled = true`): Grantor staff designated to respond

**Outputs:**
- Updated `opportunities.qa_config` JSONB with Q&A settings
- Q&A section rendered/hidden on opportunity detail page based on `qa_enabled`
- Incoming questions routed to designated responders

**Validation:**
- MUST: At least one `responder_user_id` MUST be designated when `qa_enabled = true`
- MUST: `question_window_close` MUST be before `application_close_date` when both are configured
- MUST: `question_window_open` MUST be before `question_window_close` when both are configured
- MUST: When `qa_enabled = false`, the Q&A section MUST NOT appear on the opportunity page and question submission endpoints MUST return 403

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| No responder designated | 422 | RESPONDER_REQUIRED | "At least one Q&A responder must be designated when Q&A is enabled." |
| Q&A window invalid | 422 | INVALID_QA_WINDOW | "Question window close date must be before the application close date." |
| Question submitted when Q&A disabled | 403 | QA_DISABLED | "This opportunity does not accept applicant questions." |
| Question submitted outside window | 403 | QA_WINDOW_CLOSED | "The question submission window for this opportunity is closed." |

**API Surface (this feature):** `PUT /api/v1/opportunities/{opportunity_id}/qa-config` (configure Q&A); `POST /api/v1/opportunities/{opportunity_id}/questions` (applicant submits question — applicant API) — see `Y1d-api-submission.md` §Q&A.

**Schema Surface (this feature):** `opportunities.qa_config` JSONB (qa_enabled, question_window_open, question_window_close, responder_user_ids); `qa_items` table — see `Y0d-schema-submission.md` §qa_items.

---

## F44: Public Q&A Response Publishing
*Maps to: PRD-INTAKE-045 | Priority: P0 — MVP*

**Description:** Grantors can publish Q&A responses that are visible to all applicants on the opportunity page. This ensures all applicants have equal access to clarifications, consistent with federal fairness requirements (2 CFR 200.204). Published answers are timestamped and displayed chronologically. Applicants are notified when new answers are published (F47).

**Terminology:**
- **Question:** An applicant-submitted inquiry routed to the grantor for response
- **Answer:** The grantor's official response to a question, published publicly for all applicants
- **Anonymous Publication:** Publishing an answer without revealing the identity of the original questioner

**Sub-features:**
- Grantor drafts and reviews applicant questions in the Q&A Manager
- Grantor writes and publishes an answer
- Published answer visible to all applicants on the opportunity detail page
- Question submitter identity hidden in the published answer (anonymous by default)
- Notification triggered when answer is published (F47)
- Q&A displayed chronologically (oldest first) with timestamps

**Process:**
1. Applicant submits a question via the opportunity detail page
2. System creates a `qa_items` record with `status = submitted`; notifies designated Q&A responders (F43)
3. Grantor responder opens Q&A Manager, reviews submitted questions
4. Grantor drafts an answer in the response text field
5. Grantor reviews the draft and clicks "Publish Answer"
6. System transitions question `status` from `submitted` → `answered`; `published_at` timestamp recorded
7. Published Q&A pair displayed on the opportunity detail page (applicant questioner identity NOT shown)
8. Notification triggered to all applicants with saved/started applications (see Notification Model)
9. Addendum record created if the Q&A constitutes a material clarification (grantor judgment; grantor may manually trigger addendum from Q&A manager)

**Inputs:**
- `question_id` (UUID, required)
- `answer_text` (text, required, max 5000 chars): The grantor's official response
- `published_by` (UUID, required): Grantor staff member publishing the response

**Outputs:**
- `qa_items.answer_text`, `qa_items.published_by`, `qa_items.published_at` updated
- `qa_items.status` = `answered`
- Q&A pair rendered on opportunity detail page
- Notification triggered to applicants
- Audit event: `QA_ANSWER_PUBLISHED`

**Validation:**
- MUST: Only grantor users with Q&A responder designation (F43) MUST be able to publish answers
- MUST: `answer_text` MUST be non-empty before publishing
- MUST: Published answers MUST NOT display the name or identity of the original questioner
- MUST: Published answers are immutable; corrections require a new Q&A item or an addendum
- SHOULD: Answer text SHOULD use plain language (USWDS guidance)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Empty answer text | 422 | ANSWER_REQUIRED | "Answer text cannot be empty." |
| Unauthorized publisher | 403 | PERMISSION_DENIED | "Only designated Q&A responders can publish answers." |
| Question already answered | 409 | ALREADY_ANSWERED | "This question already has a published answer." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/questions` (grantor view — all questions); `PUT /api/v1/questions/{question_id}/answer` (publish answer); `GET /api/v1/opportunities/{opportunity_id}/qa` (public Q&A list — applicant view) — see `Y1d-api-submission.md` §Q&A.

**Schema Surface (this feature):** `qa_items` table (qa_id, opportunity_id FK, submitter_org_id FK, question_text, answer_text, status, submitted_by, submitted_at, published_by, published_at) — see `Y0d-schema-submission.md` §qa_items.

---

## F46: Auditable Q&A and Addenda History
*Maps to: PRD-INTAKE-047 | Priority: P0 — MVP*

**Description:** The system maintains a complete, immutable, auditable history of all questions submitted, responses published, addenda issued, and date changes made. Every action is timestamped and attributable to a specific user. This history is accessible to grantors for compliance and is visible on the opportunity page for applicants.

**Sub-features:**
- Immutable record of all Q&A events (question submitted, answer published)
- Immutable record of all addenda (addendum published, superseded)
- Immutable record of all date changes (with before/after values)
- Timestamps and user attribution for all events
- History accessible to grantor in the Q&A/Addenda Manager
- Relevant history visible on the opportunity detail page for applicants

**Process:**
1. Every Q&A event triggers an `audit_events` record with: event_type, entity_id, entity_type, actor_user_id, timestamp, before_state, after_state
2. Every addendum publication triggers an `audit_events` record
3. Every date change (via F6 modification) triggers an `audit_events` record with before/after values
4. Grantor Q&A/Addenda Manager displays a chronological history of all events with actor, timestamp, and summary
5. Opportunity detail page displays the applicant-visible subset: published Q&A pairs and addenda with timestamps

**Inputs:** System-generated from Q&A events (F44), addendum events (F17), and opportunity modifications (F6).

**Outputs:**
- `audit_events` records per event (immutable)
- History timeline displayed in grantor Q&A/Addenda Manager
- Public Q&A and addenda history on opportunity detail page

**Validation:**
- MUST: Every Q&A event, addendum publication, and date change MUST generate an `audit_events` record
- MUST: Audit event records MUST be immutable — no update or delete operations permitted
- MUST: Each audit event MUST include: event_type, entity_id, actor_user_id, timestamp (UTC), before_state (JSONB), after_state (JSONB)
- SHOULD: Audit history MUST be retained for the full duration of the program record (no purge within MVP)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Audit record write failure | 500 | AUDIT_WRITE_FAILED | "Audit record could not be created. The action may not have completed. Please contact support." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/audit-history` (grantor audit view); `GET /api/v1/opportunities/{opportunity_id}/qa` includes timestamps (public view) — see `Y1d-api-submission.md` §Audit History.

**Schema Surface (this feature):** `audit_events` table (event_id, event_type, entity_type, entity_id, actor_user_id, occurred_at, before_state JSONB, after_state JSONB, ip_address) — see `Y0d-schema-submission.md` §audit_events.

---

## F47: Applicant Notifications for Addenda and Changes
*Maps to: PRD-INTAKE-048 | Priority: P0 — MVP*

**Description:** The system automatically notifies applicants of published addenda, changed deadlines, or required application changes. Applicants with saved or in-progress applications receive timely in-app and email notifications. Notification delivery is tracked for audit completeness.

**Sub-features:**
- Trigger notification when addendum is published (F17)
- Trigger notification when deadline changes (F6)
- Trigger notification when a required application change is published
- Trigger notification when a Q&A answer is published (F44)
- Deliver notifications in-app (workspace notification banner) and via email
- Track notification delivery per recipient

**Process:**
1. An event occurs: addendum published, date changed, required change issued, or Q&A answered
2. System identifies all applicant organizations with `workspace_status != Not Started` for this opportunity
3. System creates `notification_records` for each identified recipient team (primary contact + proposal lead)
4. In-app notification displayed as a banner on the workspace dashboard and opportunity detail page
5. Email notification sent to primary contact email address on the org profile
6. Notification delivery tracked (`sent_at`, `delivered_at` where available)

**Inputs:**
- `trigger_event` (enum): `addendum_published | deadline_changed | required_change | qa_answered`
- `opportunity_id` (UUID): Source opportunity
- `addendum_id` or `qa_id` (UUID): Entity that triggered the notification
- `notification_message` (string): System-composed message based on event type

**Outputs:**
- `notification_records` created per recipient
- In-app notification displayed
- Email sent to org primary contact
- Audit event: `NOTIFICATION_SENT`

**Validation:**
- MUST: Notifications MUST be sent to all applicants with active workspaces for the opportunity
- MUST: Email notifications MUST include: opportunity title, type of change, effective date, link to opportunity page
- MUST: Notification delivery MUST be logged
- SHOULD: In-app notifications SHOULD be dismissible by the recipient
- SHOULD: Notifications SHOULD be sent within 5 minutes of the triggering event

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Email delivery failure | — (async) | — | Retry logic applies; failure logged in `notification_records.delivery_status` |
| No applicants to notify | — | — | No action; logged as `notification_sent_count = 0` |

**API Surface (this feature):** Notifications are system-triggered; applicants may view their notifications at `GET /api/v1/notifications` — see `Y1d-api-submission.md` §Notifications.

**Schema Surface (this feature):** `notification_records` table (notification_id, recipient_user_id FK, trigger_event, opportunity_id FK, entity_id, message_text, sent_at, delivered_at, delivery_status, read_at) — see `Y0d-schema-submission.md` §notification_records.
---

# Stage 9: Validation and Submission

*Objective: Ensure only authorized, complete, and review-ready submissions enter the grantor intake queue.*

---

## F48: Continuous Validation During Drafting
*Maps to: PRD-INTAKE-049 | Priority: P0 — MVP*

**Description:** The system validates application data continuously as applicants draft, surfacing issues in real time at the field and section level rather than saving all errors for the final submission attempt. A final validation pass is also triggered at the point of submission. This dramatically reduces last-minute blocking errors.

**Sub-features:**
- Real-time field-level validation on user input (type, format, required, constraints)
- Section-level validation summary computed after each field save
- Readiness dashboard validation summary updated in near-real-time (F34)
- Final validation run triggered automatically when applicant attempts to submit
- Validation results actionable with direct links to source fields

**Process:**
1. Applicant types or selects a value in a form field
2. Client-side validation runs immediately (type, format, character limits) — F37
3. On field blur or explicit save, server-side validation runs for the field (required, business rules)
4. Field validation state updated: `valid`, `warning`, `error`
5. Section validation summary recomputed
6. Readiness dashboard blocking errors list updated
7. When applicant clicks "Submit": final validation runs across all sections, all required fields, all attachment requirements, budget rules, eligibility requirements, and certification status
8. If final validation finds new blocking errors: submission is rejected; all errors displayed

**Inputs:**
- Field value (runtime applicant input)
- Workspace state (all sections, fields, attachments, budget, eligibility responses, org roles)

**Outputs:**
- Per-field validation state: `valid | warning | error`
- Per-section validation summary: complete / in_progress / error
- Readiness dashboard `blocking_errors` list updated
- Final validation result at submission attempt

**Validation:**
- MUST: Real-time validation MUST run on every field save
- MUST: Final validation MUST run at every submission attempt
- MUST: All blocking errors from final validation MUST be surfaced before submission is permitted
- MUST: Validation errors MUST link directly to the source field (section + field reference)
- SHOULD: Real-time validation results SHOULD be returned within 200ms for field-level checks
- SHOULD: Final validation SHOULD complete within 5 seconds

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Validation service error | 500 | VALIDATION_SERVICE_ERROR | "Validation could not be completed. Please try again." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/sections/{section_id}/validate` (section-level); `POST /api/v1/workspaces/{workspace_id}/validate` (full workspace validation) — see `Y1c-api-application.md` §Validation.

**Schema Surface (this feature):** Validation state stored in `application_sections.validation_status` and `application_sections.validation_errors` JSONB — see `Y0c-schema-app.md` §application_sections.

---

## F49: Validation Message Classification
*Maps to: PRD-INTAKE-050 | Priority: P0 — MVP*

**Description:** Validation messages are classified into three tiers — Blocking, Warning, and Informational — with distinct visual treatment per tier. This allows applicants and proposal leads to clearly understand which issues prevent submission and which are advisory. All messages are displayed in the readiness dashboard (F34).

**Message Classification:**

| Tier | Behavior | USWDS Component | Color |
|---|---|---|---|
| Blocking | Prevents submission; must be resolved | Error Alert | Red |
| Warning | Does not prevent submission; applicant should review | Warning Alert | Yellow |
| Informational | Advisory notice; no action required | Info Alert | Blue |

**Blocking Conditions (always blocking):**
- Required field empty at submission
- Required attachment missing at submission
- Required certification not completed
- Authorized representative not assigned
- Eligibility hard blocker at pre-submission enforcement point
- Budget ceiling exceeded
- Required match not met
- Character limit exceeded on required field

**Warning Conditions (non-blocking):**
- Recommended attachment not uploaded
- Budget justification missing for non-required category
- Credential approaching expiration (F21)
- Section not yet reviewed by assigned owner

**Informational Conditions:**
- Section has no content entered yet (started but empty)
- Field is optional and empty
- Addendum published since workspace was created

**Process:**
1. Validation engine classifies each issue during continuous validation (F48) and final validation
2. System maps each validation failure to one of the three tiers using the classification rules above
3. Classified messages are displayed in the readiness dashboard (F34) with USWDS alert components
4. At submission attempt, only Blocking issues prevent submission (F50)

**Inputs:** Validation result from F48.

**Outputs:**
- Per-issue classification: `blocking | warning | informational`
- Classified messages rendered in readiness dashboard with appropriate USWDS alert styling
- `readiness_summary.blocking_errors` count used by F50

**Validation:**
- MUST: Classification rules MUST be applied consistently; the same condition MUST always produce the same classification
- MUST: Blocking errors MUST use USWDS Error Alert (red)
- MUST: Warnings MUST use USWDS Warning Alert (yellow)
- MUST: Informational messages MUST use USWDS Info Alert (blue)
- MUST: Only Blocking issues MUST prevent submission

**Error States:** Inherited from F48 validation service.

**API Surface (this feature):** Classification is part of the validation response from `POST /api/v1/workspaces/{workspace_id}/validate` — see `Y1c-api-application.md` §Validation.

**Schema Surface (this feature):** `application_sections.validation_errors` JSONB includes `severity` field per error — see `Y0c-schema-app.md`.

---

## F50: Submission Blocking
*Maps to: PRD-INTAKE-051 | Priority: P0 — MVP*

**Description:** The system blocks final submission when any mandatory field, certification, attachment, eligibility response, budget requirement, or authorized submitter requirement is incomplete. The Submit button is disabled until all blocking items are resolved. When blocking items are present, the complete list is displayed with remediation links.

**Sub-features:**
- Disable Submit button when any blocking error exists
- Display complete list of all blocking errors with section links
- Re-enable Submit when all blocking errors are cleared
- Prevent submission via API if blocking errors exist (server-side enforcement)
- Log every blocked submission attempt in audit trail

**Process:**
1. Applicant navigates to Review / Submit section
2. System displays current readiness state from F34
3. Submit button is disabled and styled as inactive when `is_ready_to_submit = false`
4. Each blocking error listed with "Go to {section}" link
5. As applicant resolves errors, readiness dashboard updates; when `is_ready_to_submit = true`, Submit button is enabled
6. Even if UI submit button is bypassed, server-side final validation runs at `POST /api/v1/workspaces/{workspace_id}/submit` and rejects submission if blocking errors are found
7. Blocked submission attempt logged as `audit_events` record with `SUBMISSION_BLOCKED` event type

**Inputs:**
- `workspace_id` (UUID, required)
- `readiness_summary` (from F34): `is_ready_to_submit`, `blocking_errors`

**Outputs:**
- Submit button enabled/disabled based on `is_ready_to_submit`
- Blocking errors list with remediation links displayed
- Blocked attempt logged in audit trail

**Validation:**
- MUST: Submit button MUST be disabled (not hidden) when blocking errors exist — applicant must still be able to see the submit section
- MUST: Server-side final validation MUST re-run at every submission attempt regardless of client-side state
- MUST: API submission endpoint MUST return 422 with blocking errors list if validation fails at time of submission attempt
- MUST: Authorized Representative role MUST be assigned to the submitting user for submission to proceed (F51)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Blocking errors at submission | 422 | SUBMISSION_BLOCKED | "Application cannot be submitted. {count} required item(s) must be completed. See details." |
| Unauthorized submitter | 403 | UNAUTHORIZED_SUBMITTER | "Only users with the Authorized Representative role can submit this application." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/submit` (submission endpoint with server-side blocking) — see `Y1d-api-submission.md` §Submission.

**Schema Surface (this feature):** Blocking state computed from `application_sections`, `attachments`, `org_roles` — no dedicated table. Blocked attempts logged in `audit_events`.

---

## F51: Authorized Representative Certification
*Maps to: PRD-INTAKE-052 | Priority: P0 — MVP*

**Description:** Before submission, the system requires a final certification action by an authenticated user with the Authorized Representative role. This certification is a formal, legally meaningful step with configurable certification language. The certification action is logged as an immutable audit event. Before certifying, the Authorized Representative may flag a concern on any section of the submission package preview — a grantee-private note that notifies the Proposal Lead without blocking or altering the application.

**Sub-features:**
- Require certification action as the final step before submission
- Only users with Authorized Representative role can certify
- Display configurable certification text (legal language) for review
- Require explicit acknowledgment (checkbox or click-through) — not a handwritten signature in MVP
- Log certification as an immutable audit event
- Certification linked to specific workspace and submission attempt
- Pre-certification concern flag: AR can leave a private comment or flag on any section of the submission package preview; flag is grantee-private, stored in the grantee-private zone, notifies the Proposal Lead via in-app notification, and does not change application status, alter the submission package, or initiate submission

**Process:**
1. All blocking errors are resolved; `is_ready_to_submit = true` (F50)
2. Authorized Representative navigates to the Certification step in the Review / Submit section
3. System displays the submission package preview and the certification text (configured by grantor or system default)
4. Optionally: AR flags a concern on any section — concern is saved as a grantee-private note; Proposal Lead is notified; AR may then choose to certify or defer
5. Authorized Representative reads the certification text
6. AR clicks "I Certify" checkbox or button
7. System verifies that the authenticated user has the `authorized_representative` role for this org
8. If verified: certification record created; submission proceeds to F52
9. Audit event created: `CERTIFICATION_COMPLETED` with user, timestamp, certification text hash

**Inputs:**
- `workspace_id` (UUID, required)
- `certifying_user_id` (UUID, required): Must have `authorized_representative` role
- `certification_text` (string): The text the user certified to (stored in audit record)
- `certification_timestamp` (UTC datetime, system)
- For concern flags (optional, pre-certification):
  - `section_ref` (string, optional): The section the concern is about
  - `concern_note` (text, required when flagging, max 1000 chars): The AR's concern text

**Outputs:**
- Certification record stored with `workspace_id`, `certifying_user_id`, `certification_text`, `certification_timestamp`
- Audit event: `CERTIFICATION_COMPLETED`
- Submission proceeds to snapshot generation (F52)
- If concern flag submitted: `ar_concern_notes` record created (grantee-private zone); in-app notification sent to Proposal Lead; no application status change

**Validation:**
- MUST: Certifying user MUST have the `authorized_representative` role for the applicant organization
- MUST: Certification MUST require explicit acknowledgment action — auto-certification is not permitted
- MUST: Certification text MUST be displayed in full before acknowledgment
- MUST: Certification action MUST be logged as an immutable audit event
- MUST: Certification is role-and-user-specific — certification by User A does not allow User B to submit
- MUST: Concern flags MUST be stored in the grantee-private data zone and MUST NOT appear in the submission package, grantor intake queue, or any grantor-visible view
- MUST: Concern flags MUST NOT alter the application status or prevent submission if the AR chooses to certify after flagging

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Certifier lacks AR role | 403 | NOT_AUTHORIZED_REPRESENTATIVE | "You must have the Authorized Representative role to certify this application." |
| Certification text missing | 500 | CERTIFICATION_TEXT_UNAVAILABLE | "Certification text is unavailable. Please contact support." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/certify` (certification action, triggers F52 on success); `POST /api/v1/workspaces/{workspace_id}/ar-concern` (submit concern flag, grantee-private) — see `Y1d-api-submission.md` §Certification.

**Schema Surface (this feature):** `certifications` table (cert_id, workspace_id FK, certifying_user_id FK, certification_text, certification_timestamp UTC, created_at); `ar_concern_notes` table (concern_id, workspace_id FK, section_ref, concern_note, created_by, created_at) — grantee-private zone — see `Y0d-schema-submission.md` §certifications, §ar_concern_notes.

---

## F52: Immutable Submission Snapshot and Receipt
*Maps to: PRD-INTAKE-053 | Priority: P0 — MVP*

**Description:** Upon successful submission (after F50 validation and F51 certification), the system generates a final, immutable submission snapshot with a unique confirmation number, UTC timestamp, and downloadable receipt. This snapshot is the authoritative, official record of what was submitted.

**Sub-features:**
- Generate immutable snapshot on successful submission
- Assign unique confirmation number (human-readable, globally unique)
- Record UTC submission timestamp
- Generate downloadable receipt (PDF or HTML) for applicant
- Update workspace status to `Submitted`
- Route application to intake queue (F55)
- Transition workspace data visibility from `grantee_private` to `shared`

**Process:**
1. F51 certification completed successfully
2. System runs final validation (F50); if errors: reject and return error
3. If validation passes:
   - System generates `submission_snapshot` record with:
     - Snapshot of all section data (JSONB)
     - Snapshot of org profile state (JSONB)
     - Snapshot of eligibility responses (JSONB)
     - List of all active attachment references with file metadata
     - Budget data snapshot
     - Certification record reference
   - System generates `confirmation_number` (format: `GI-{YEAR}-{XXXXXXXX}`, e.g., `GI-2026-00001234`)
   - System sets `submitted_at` = current UTC timestamp
   - Workspace status updated to `Submitted`
   - Data visibility updated to `shared` for all non-comment content
   - Intake queue entry created (F55)
4. Receipt generated and displayed to applicant; downloadable as PDF
5. Notification sent: "Submission received" (see Notification Model)
6. Audit event: `APPLICATION_SUBMITTED` with confirmation number, timestamp, certifying user

**Inputs:**
- `workspace_id` (UUID, required)
- All workspace data (sections, attachments, budget, eligibility, org profile, certification)

**Outputs:**
- `submission_snapshots` record (immutable)
- `confirmation_number` (string, globally unique)
- `submitted_at` (UTC datetime)
- Receipt document (PDF/HTML)
- Workspace status = `Submitted`
- Intake queue entry created (F55)
- Notification: "Submission received" to applicant team and grantor intake admin

**Validation:**
- MUST: Snapshot MUST be generated atomically — either fully created or fully rolled back on failure
- MUST: `confirmation_number` MUST be globally unique and human-readable
- MUST: `submitted_at` MUST be stored in UTC
- MUST: Snapshot MUST be immutable — no fields may be updated after creation
- MUST: Receipt MUST display: confirmation number, submission timestamp, opportunity title, FON, applicant org name

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Snapshot generation failure | 500 | SNAPSHOT_GENERATION_FAILED | "Submission could not be completed. Your application data is preserved. Please try again." |
| Duplicate submission | 409 | ALREADY_SUBMITTED | "This application has already been submitted. Confirmation: {confirmation_number}." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/submit` returns submission confirmation; `GET /api/v1/workspaces/{workspace_id}/receipt` returns receipt — see `Y1d-api-submission.md` §Submission.

**Schema Surface (this feature):** `submission_snapshots` table (snapshot_id, workspace_id FK, confirmation_number, submitted_at UTC, submitted_by FK, org_profile_snapshot JSONB, sections_snapshot JSONB, eligibility_snapshot JSONB, budget_snapshot JSONB, attachment_refs JSONB, certification_id FK, is_original BOOLEAN, superseded_by FK nullable) — see `Y0d-schema-submission.md` §submission_snapshots.

---

## F53: Human-Readable and Machine-Readable Submission Package
*Maps to: PRD-INTAKE-054 | Priority: P0 — MVP*

**Description:** The submission snapshot is preserved in two formats: a human-readable package formatted for review (PDF or USWDS-styled HTML) and a machine-readable structured data package (JSON). Both formats are generated and stored at time of submission. Both are accessible in the grantor intake queue.

**Sub-features:**
- Generate human-readable package: USWDS-formatted HTML rendered from snapshot data
- Generate PDF version of human-readable package
- Generate machine-readable JSON data package from snapshot
- Store both formats; make both accessible to grantor via intake queue
- Applicant can download human-readable package as PDF from receipt page

**Process:**
1. Submission snapshot is created (F52)
2. System generates human-readable HTML from snapshot data using USWDS templates
3. System converts HTML to PDF
4. System generates JSON package from snapshot JSONB fields
5. Both files stored in document storage with references on `submission_snapshots` record
6. Grantor can download both formats from intake queue application detail page (F56)
7. Applicant can download human-readable PDF from receipt page

**Inputs:** `submission_snapshots` record from F52.

**Outputs:**
- `submission_snapshots.human_readable_pdf_path` (storage path)
- `submission_snapshots.machine_readable_json_path` (storage path)
- Both accessible via grantor intake API

**Validation:**
- MUST: Both packages MUST be generated within 60 seconds of submission
- MUST: Human-readable PDF MUST include all submitted content visible to the grantor
- MUST: Machine-readable JSON MUST use a consistent, documented schema
- MUST: Both packages MUST reference the `confirmation_number` and `submitted_at` timestamp
- MUST: Internal comments MUST NOT appear in either package

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Package generation failure | 500 | PACKAGE_GENERATION_FAILED | "Submission package could not be generated. The submission was recorded. Please contact support." |

**API Surface (this feature):** `GET /api/v1/submissions/{snapshot_id}/package/human-readable`; `GET /api/v1/submissions/{snapshot_id}/package/machine-readable` — see `Y1d-api-submission.md` §Submission Packages.

**Schema Surface (this feature):** `submission_snapshots.human_readable_pdf_path`, `submission_snapshots.machine_readable_json_path` — see `Y0d-schema-submission.md` §submission_snapshots.

---

## F54: Post-Submission Edit Prevention
*Maps to: PRD-INTAKE-055 | Priority: P0 — MVP*

**Description:** After submission, the application is locked and no edits are permitted unless the application is formally withdrawn, reopened, or returned for correction through the configured workflow. Ad-hoc post-submission edits are never allowed. All lock/unlock events are logged in the audit trail.

**Sub-features:**
- Lock all workspace sections, fields, and attachments upon submission
- Display lock status prominently in the workspace UI
- Prevent API-level edits on locked workspaces
- Unlock only via: formal withdrawal, grantor-initiated return-for-correction (F58), or grantor-initiated reopening
- Log all lock/unlock events in audit trail

**Process:**
1. Workspace status transitions to `Submitted` (F52)
2. System sets `application_sections.is_locked = true` for all sections
3. All edit endpoints for the workspace return 403 `WORKSPACE_LOCKED`
4. UI displays "Submitted — Locked for Editing" banner on all sections
5. Unlock path A — Withdrawal: applicant requests withdrawal; grantor admin approves; status = `Withdrawn`; workspace data preserved (snapshot preserved) but no further submission allowed
6. Unlock path B — Return for Correction (F58): grantor initiates; specific sections unlocked; status = `Returned for Correction`; original snapshot preserved (F59)
7. Audit event created on lock: `WORKSPACE_LOCKED`; on unlock: `WORKSPACE_UNLOCKED` with reason and actor

**Inputs:**
- `workspace_id` (UUID)
- Unlock path triggers from F58 (return for correction) or withdrawal request

**Outputs:**
- `application_sections.is_locked` = true for all sections on submission
- API returns 403 for all edit attempts on locked workspace
- UI lock banner displayed
- Audit event: `WORKSPACE_LOCKED`

**Validation:**
- MUST: Lock MUST be enforced at the API layer, not only in the UI
- MUST: Lock MUST apply to all sections, fields, and attachments
- MUST: Original submission snapshot MUST be preserved regardless of lock/unlock events
- MUST: Every lock/unlock event MUST be logged with actor, timestamp, and reason

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Edit attempted on locked workspace | 403 | WORKSPACE_LOCKED | "This application has been submitted and is locked for editing." |
| Unlock without valid reason | 422 | UNLOCK_REASON_REQUIRED | "A reason for reopening the application is required." |

**API Surface (this feature):** All `PUT/POST/DELETE` endpoints on locked workspaces return 403 `WORKSPACE_LOCKED`. `POST /api/v1/workspaces/{workspace_id}/unlock` (grantor action for return-for-correction) — see `Y1d-api-submission.md` §Submission.

**Schema Surface (this feature):** `application_workspaces.is_locked` (boolean); `application_sections.is_locked` (boolean) — see `Y0c-schema-app.md`.
---

# Stage 10: Intake Queue and Administrative Screening

*Objective: Give grantors a structured queue for receiving, validating, triaging, and routing applications.*

---

## F55: Intake Queue Routing
*Maps to: PRD-INTAKE-056 | Priority: P0 — MVP*

**Description:** Submitted applications are automatically routed into a structured intake queue based on configurable routing rules. Routing criteria include opportunity, applicant type, geographic region, and funding track. Routing happens automatically at the moment of submission; the intake queue entry is visible to authorized grantor users immediately.

**Terminology:**
- **Intake Queue:** The grantor-facing administrative panel displaying all submitted applications for a program or opportunity
- **Routing Rule:** A configured criterion that determines which queue or queue segment a submission is assigned to
- **Queue Segment:** A filtered view of the intake queue (e.g., all "Tribal Organization" applicants for Opportunity X)

**Sub-features:**
- Automatic intake queue entry creation on submission (F52)
- Configurable routing rules per opportunity or program (by applicant type, geography, funding track)
- Queue filtered views for grantor administrators
- Queue entry visible immediately after submission

**Process:**
1. Submission snapshot is created (F52)
2. System evaluates routing rules configured for the opportunity
3. System creates `intake_queue_entries` record with: `workspace_id`, `opportunity_id`, `org_id`, `submission_snapshot_id`, `routed_to` (queue segment or individual), `status = Pending Screening`
4. Entry appears in grantor intake queue filtered by applicable routing criteria
5. Grantor intake administrators can view, filter, and sort the queue

**Inputs:**
- `submission_snapshot_id` (UUID): From F52
- Routing rules from `opportunities.routing_config` JSONB

**Outputs:**
- `intake_queue_entries` record created with routing assignment
- Entry visible in grantor intake queue panel immediately
- Audit event: `INTAKE_QUEUE_ENTRY_CREATED`

**Validation:**
- MUST: An intake queue entry MUST be created for every successful submission within the same atomic transaction as the snapshot
- MUST: Routing rules MUST be evaluated at time of submission using current rule configuration
- SHOULD: Queue entry MUST be visible to authorized grantor users within 10 seconds of submission

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Routing rule evaluation failure | 500 | ROUTING_FAILED | "Application was submitted but could not be routed. Manual assignment may be required." |

**API Surface (this feature):** `GET /api/v1/intake-queue?opportunity_id={}&status={}&applicant_type={}` (grantor queue view) — see `Y1d-api-submission.md` §Intake Queue.

**Schema Surface (this feature):** `intake_queue_entries` table (entry_id, workspace_id FK, opportunity_id FK, org_id FK, snapshot_id FK, routed_to, status, disposition_id FK nullable, created_at) — see `Y0d-schema-submission.md` §intake_queue_entries.

---

## F56: Intake Queue Display
*Maps to: PRD-INTAKE-057 | Priority: P0 — MVP*

**Description:** The intake queue displays a comprehensive summary view of each submitted application, giving intake administrators all the information needed to make initial screening decisions without needing to open every individual application file. The queue is sortable, filterable, and accessible to authorized grantor roles.

**Sub-features:**
- Queue listing view with all key application metadata
- Application detail drawer/panel with eligibility results, validation summary, attachments, and budget
- Sortable and filterable by opportunity, submission date, applicant type, geography, disposition status
- Downloadable queue summary report

**Queue Display Columns:**

| Column | Source |
|---|---|
| Applicant Organization Name | `organizations.legal_name` |
| Applicant Type | `organizations.entity_type` |
| Opportunity Title | `opportunities.title` |
| Submission Timestamp (UTC) | `submission_snapshots.submitted_at` |
| Confirmation Number | `submission_snapshots.confirmation_number` |
| Requested Amount | `budgets.total_federal_request` |
| Eligibility Result | `eligibility_responses.overall_result` |
| Validation Status | `submission_snapshots.validation_summary` |
| Attachment Completeness | Computed from `attachments` vs. `attachment_requirements` |
| Disposition Status | `intake_dispositions.status` |

**Process:**
1. Grantor intake administrator opens the Intake Queue panel
2. System fetches all `intake_queue_entries` for opportunities the administrator has access to
3. Queue displays as a sortable table using USWDS table component
4. Administrator may apply filters (opportunity, date range, disposition status, applicant type)
5. Administrator clicks a row to open the application detail panel, which shows: full org profile summary, eligibility pre-screen responses, validation summary, attachment checklist, budget summary, all from the submission snapshot
6. Administrator may apply a disposition from the detail panel (F57)

**Inputs:**
- Filters: `opportunity_id`, `disposition_status`, `applicant_type`, `submitted_from`, `submitted_to`
- Pagination: `page`, `page_size`

**Outputs:**
- Paginated, sorted, filtered list of intake queue entries
- Per-entry summary data for display columns
- Application detail content from submission snapshot

**Validation:**
- MUST: Queue MUST display only applications for opportunities the authenticated grantor user has access to
- MUST: Application detail MUST pull from the immutable submission snapshot — not from live draft workspace data
- MUST: Internal applicant comments (F32) MUST NOT be visible in the intake queue or application detail

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Queue fetch error | 500 | QUEUE_FETCH_FAILED | "Intake queue could not be loaded. Please refresh." |
| Snapshot not found | 404 | SNAPSHOT_NOT_FOUND | "Submission snapshot not found for this application." |

**API Surface (this feature):** `GET /api/v1/intake-queue` (list); `GET /api/v1/intake-queue/{entry_id}` (detail) — see `Y1d-api-submission.md` §Intake Queue.

**Schema Surface (this feature):** Reads from `intake_queue_entries`, `submission_snapshots`, `organizations`, `eligibility_responses`, `budgets`, `attachments` — see all schema files.

---

## F57: Administrative Screening Dispositions
*Maps to: PRD-INTAKE-058 | Priority: P0 — MVP*

**Description:** Intake administrators apply a formal administrative screening disposition to each application in the intake queue. Dispositions follow configured screening criteria (F12) and are logged with timestamp and user attribution. Disposition triggers an applicant notification and is preserved in the audit trail.

**Disposition States:**

| Disposition | Description | Applicant Notification |
|---|---|---|
| `accepted_for_review` | Application passes screening; routes to review (F60) | Yes — "Accepted for Review" |
| `returned_for_correction` | Application returned for specified corrections (F58) | Yes — "Returned for Correction" |
| `ineligible` | Application determined administratively ineligible | Yes — "Ineligible" |
| `late` | Received after deadline | Yes — "Not Accepted — Late Submission" |
| `duplicate` | Identified as a duplicate of an existing submission | Yes — "Duplicate Submission" |
| `withdrawn` | Applicant or grantor-initiated withdrawal | Yes — "Withdrawn" |
| `administratively_rejected` | Rejected for administrative reasons | Yes — "Administratively Rejected" |

**Sub-features:**
- Display screening checklist (F12) in application detail panel
- Allow intake administrator to evaluate each criterion (pass/fail)
- Apply disposition from predefined disposition states
- Require disposition rationale (text) for all non-acceptance dispositions
- Log disposition as immutable audit event
- Trigger applicant notification on disposition

**Process:**
1. Administrator opens application detail in the intake queue (F56)
2. System displays the screening criteria checklist (F12); auto-populated criteria pre-filled
3. Administrator evaluates each criterion (pass/fail/N/A)
4. Administrator selects disposition from the disposition dropdown
5. Administrator enters disposition rationale (required for non-acceptance)
6. Administrator clicks "Apply Disposition"
7. `intake_dispositions` record created; `intake_queue_entries.disposition_id` updated
8. Audit event: `DISPOSITION_APPLIED`
9. Applicant notification triggered

**Inputs:**
- `entry_id` (UUID, required)
- `screening_criteria_results` (array): `{criterion_id, result: pass|fail|na}`
- `disposition` (enum, required): One of the seven disposition states
- `disposition_rationale` (text, required for non-acceptance): Explanation
- `applied_by` (UUID, required)

**Outputs:**
- `intake_dispositions` record created
- `intake_queue_entries.status` updated
- Applicant notification sent
- Audit event: `DISPOSITION_APPLIED`

**Validation:**
- MUST: `disposition_rationale` MUST be provided for all dispositions except `accepted_for_review`
- MUST: All required screening criteria MUST be evaluated before disposition can be applied (F12)
- MUST: Disposition action MUST be logged in audit trail
- MUST: Applicant MUST be notified of disposition within 5 minutes

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Required criterion not evaluated | 422 | CRITERION_NOT_EVALUATED | "All required screening criteria must be evaluated before applying a disposition." |
| Missing rationale | 422 | RATIONALE_REQUIRED | "A rationale is required for this disposition." |
| Invalid disposition value | 422 | INVALID_DISPOSITION | "Disposition '{value}' is not a valid disposition state." |

**API Surface (this feature):** `POST /api/v1/intake-queue/{entry_id}/disposition` — see `Y1d-api-submission.md` §Dispositions.

**Schema Surface (this feature):** `intake_dispositions` table (disposition_id, entry_id FK, snapshot_id FK, disposition, rationale, screening_criteria_results JSONB, applied_by FK, applied_at) — see `Y0d-schema-submission.md` §intake_dispositions.

---

## F58: Correction and Clarification Requests
*Maps to: PRD-INTAKE-059 | Priority: P0 — MVP*

**Description:** When permitted by opportunity rules, grantors can formally request that an applicant correct or clarify specific aspects of their submitted application. The request is tied to the original submission record, triggers applicant notification, and creates a correction window with a configurable deadline. If the correction window expires without a resubmission, the system automatically transitions the application to Administratively Rejected, notifies the applicant and intake administrator, and logs an audit event. The intake administrator can manually override the auto-rejection post-expiry with a required reason.

**Sub-features:**
- Grantor initiates correction/clarification request from intake queue
- Request specifies which sections or attachments require correction
- System generates correction request notification to applicant team
- Configurable correction window deadline
- Workspace unlocked for specified sections only (F54)
- Original submission snapshot preserved (F59)
- Automatic Administratively Rejected disposition when correction deadline expires without resubmission
- Intake administrator override of auto-rejection with required override reason

**Process:**
1. Administrator opens application in intake queue
2. Administrator applies `returned_for_correction` disposition (F57)
3. Administrator specifies: which sections/attachments require correction, correction instructions text, correction deadline
4. System records correction request
5. Workspace unlocked for specified sections only (other sections remain locked)
6. Status updated to `Returned for Correction`
7. Applicant notification sent: "Returned for Correction — {instructions}" with correction deadline
8. Applicant makes corrections in unlocked sections; resubmits (F52 flow with new snapshot)
9. If correction deadline passes without resubmission: system automatically applies `administratively_rejected` disposition; applicant team and intake administrator notified; `CORRECTION_WINDOW_EXPIRED` audit event logged
10. Intake administrator may override the auto-rejection by applying a different disposition with a required `override_reason` text field

**Inputs:**
- `entry_id` (UUID, required)
- `correction_sections` (UUID[], required): Sections that must be corrected
- `correction_instructions` (text, required, max 2000 chars)
- `correction_deadline` (datetime, required)

**Outputs:**
- Correction request record created
- Specified sections unlocked in workspace
- Workspace status = `Returned for Correction`
- Applicant notification with instructions and deadline
- Audit event: `CORRECTION_REQUESTED`
- On deadline expiry without resubmission: `administratively_rejected` disposition applied; `CORRECTION_WINDOW_EXPIRED` audit event logged; applicant team and intake administrator notified

**Validation:**
- MUST: `correction_instructions` MUST be provided
- MUST: `correction_deadline` MUST be in the future at time of request
- MUST: Only the specified sections MUST be unlocked; all other sections remain locked
- MUST: Original submission snapshot MUST be preserved (F59)
- MUST: When correction deadline expires without resubmission, system MUST automatically apply `administratively_rejected` disposition and log `CORRECTION_WINDOW_EXPIRED` audit event
- MUST: Auto-rejection notification MUST be sent to both the applicant team and the intake administrator
- MUST: Override of auto-rejection MUST require an `override_reason` text field from the intake administrator

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Correction deadline in past | 422 | DEADLINE_IN_PAST | "Correction deadline must be in the future." |
| No sections specified | 422 | SECTIONS_REQUIRED | "At least one section must be specified for correction." |
| Opportunity doesn't allow corrections | 403 | CORRECTIONS_NOT_ALLOWED | "This opportunity does not allow correction requests." |
| Override reason missing | 422 | OVERRIDE_REASON_REQUIRED | "An override reason is required when overriding an auto-rejection disposition." |

**API Surface (this feature):** `POST /api/v1/intake-queue/{entry_id}/correction-request`; `POST /api/v1/intake-queue/{entry_id}/disposition-override` (override auto-rejection) — see `Y1d-api-submission.md` §Correction Requests.

**Schema Surface (this feature):** `correction_requests` table (request_id, entry_id FK, snapshot_id FK, correction_sections JSONB, correction_instructions, correction_deadline, requested_by FK, requested_at, expired_at, auto_rejected_at); `intake_dispositions.override_reason` column — see `Y0d-schema-submission.md` §correction_requests.

---

## F59: Original Submission Snapshot Preservation on Correction
*Maps to: PRD-INTAKE-060 | Priority: P0 — MVP*

**Description:** When a correction or resubmission is requested and the applicant makes changes, the system creates a new versioned submission snapshot. The original submission snapshot is preserved alongside the corrected version. Neither version is overwritten. Both are accessible in the intake queue.

**Sub-features:**
- Preserve original submission snapshot when correction is requested
- Generate new versioned snapshot on resubmission
- Link new snapshot to original via `supersedes_snapshot_id`
- Both snapshots accessible in intake queue application history
- Intake queue displays the most recent (corrected) snapshot as the active submission

**Process:**
1. Correction requested (F58); original snapshot marked `is_original = true`; `is_current = true`
2. Applicant makes corrections; resubmits
3. System generates new submission snapshot (F52 flow)
4. New snapshot: `is_original = false`, `is_current = true`, `supersedes_snapshot_id = original_snapshot_id`
5. Original snapshot: `is_current = false` (preserved, immutable)
6. Intake queue shows new snapshot as active; history panel shows both

**Inputs:** Resubmission triggers standard F52 flow; `supersedes_snapshot_id` populated from correction request context.

**Outputs:**
- New `submission_snapshots` record with `supersedes_snapshot_id` linked to original
- Original snapshot preserved with `is_current = false`
- Intake queue displays corrected snapshot; history accessible

**Validation:**
- MUST: Original snapshot MUST NEVER be deleted or overwritten
- MUST: New snapshot MUST have `supersedes_snapshot_id` set to the original snapshot ID
- MUST: Intake queue MUST clearly indicate which snapshot is the most recent (current) version

**Error States:** See F52 snapshot generation errors.

**API Surface (this feature):** `GET /api/v1/intake-queue/{entry_id}/snapshots` (list all snapshots for application including version history) — see `Y1d-api-submission.md` §Snapshot History.

**Schema Surface (this feature):** `submission_snapshots.is_original`, `submission_snapshots.is_current`, `submission_snapshots.supersedes_snapshot_id` FK — see `Y0d-schema-submission.md` §submission_snapshots.

---

## F60: Accepted Application Routing to Review
*Maps to: PRD-INTAKE-061 | Priority: P0 — MVP*

**Description:** Applications accepted through administrative screening (F57, disposition = `accepted_for_review`) are automatically routed to the appropriate review, scoring, or applicant risk assessment workflow. This handoff is the boundary of the intake module. The handoff is configurable per opportunity or program.

**Sub-features:**
- Automatic handoff triggered when disposition = `accepted_for_review`
- Routing configurable by opportunity or program (review workflow type, assigned reviewers or review panel)
- Handoff event logged in audit trail
- Notification sent to assigned reviewers
- Intake module access preserved; review module access provisioned (out of intake scope for review execution)

**Process:**
1. Grantor applies `accepted_for_review` disposition (F57)
2. System evaluates routing configuration for the opportunity
3. System creates a `review_handoff` record linking the intake queue entry and submission snapshot to the designated review workflow
4. Notification sent to assigned reviewers: "Application ready for review"
5. Audit event: `APPLICATION_ACCEPTED_FOR_REVIEW` with handoff details
6. Intake queue entry status updated to `accepted_for_review`
7. Review workflow provisioning is outside the intake module boundary; the `review_handoff` record is consumed by the review module

**Inputs:**
- `entry_id` (UUID)
- `disposition = accepted_for_review` (from F57)
- Review workflow routing config from `opportunities.review_routing_config`

**Outputs:**
- `review_handoff` record created (intake → review module handoff)
- Intake queue entry status = `Accepted for Review`
- Notification to assigned reviewers
- Audit event: `APPLICATION_ACCEPTED_FOR_REVIEW`

**Validation:**
- MUST: Review handoff MUST be created within the same transaction as the acceptance disposition
- MUST: Handoff event MUST be logged in audit trail
- MUST: Original submission snapshot reference MUST be included in the handoff record

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Review routing config missing | 500 | REVIEW_ROUTING_NOT_CONFIGURED | "Review routing is not configured for this opportunity. Please contact system administrator." |
| Handoff creation failure | 500 | HANDOFF_FAILED | "Application was accepted but could not be routed for review. Manual assignment required." |

**API Surface (this feature):** Triggered by `POST /api/v1/intake-queue/{entry_id}/disposition` with `disposition=accepted_for_review` — creates `review_handoff` record — see `Y1d-api-submission.md` §Dispositions.

**Schema Surface (this feature):** `review_handoffs` table (handoff_id, entry_id FK, snapshot_id FK, review_workflow_type, assigned_reviewer_ids JSONB, handed_off_at, created_by) — see `Y0d-schema-submission.md` §review_handoffs.
---

# Stage 11: Intake Analytics and Reporting

*Objective: Provide grantors and applicants visibility into intake status, bottlenecks, and quality.*

---

## F61: Grantor Intake Dashboards
*Maps to: PRD-INTAKE-062 | Priority: P0 — MVP*

**Description:** Grantors have access to real-time dashboards that provide visibility into opportunity and application intake status. Dashboards support program management, deadline tracking, submission quality monitoring, and disposition tracking. All dashboard data is filtered by the authenticated grantor's access scope (program or opportunity level).

**Terminology:**
- **Intake Pipeline View:** A summary of all applications across stages (started, submitted, screened) for a given opportunity
- **Validation Error Summary:** An aggregate view of the most common blocking errors across submitted applications
- **Disposition Summary:** A breakdown of intake dispositions applied across all applications for an opportunity

**Sub-features:**
- Opportunity views: published, active (open intake window), closed
- Application counts by status: started (workspaces created), submitted, incomplete (started but not submitted by deadline), late
- Validation error summary: most common blocking error types across submitted applications
- Intake disposition summary: counts by disposition state
- Filter by opportunity, program, date range
- Drill down from dashboard to intake queue (F56)

**Dashboard Metrics:**

| Metric | Definition |
|---|---|
| Published Opportunities | Count of opportunities with `status = Published` accessible to this grantor |
| Active Opportunities | Count of opportunities with `application_close_date > now` |
| Applications Started | Count of workspaces created per opportunity |
| Applications Submitted | Count of submission snapshots per opportunity |
| Incomplete Applications | Count of workspaces created but not submitted before close date |
| Late Submissions | Count of submissions received after `application_close_date` |
| Accepted for Review | Count of dispositions = `accepted_for_review` |
| Returned for Correction | Count of dispositions = `returned_for_correction` |
| Ineligible / Rejected | Count of dispositions = `ineligible` or `administratively_rejected` |

**Process:**
1. Grantor navigates to the Intake Analytics section
2. System fetches dashboard data filtered by grantor's access scope
3. Dashboard displays opportunity summary cards and application pipeline metrics
4. Grantor applies filters (opportunity, program, date range)
5. Grantor may click an opportunity card to drill down to the intake queue for that opportunity (F56)

**Inputs:**
- `program_id` (UUID, optional filter)
- `opportunity_id` (UUID, optional filter)
- `date_range_from`, `date_range_to` (date, optional)

**Outputs:**
- Dashboard metrics per the metric table above
- Opportunity summary cards with drill-down links
- Disposition breakdown by state (with counts and percentages)

**Validation:**
- MUST: Dashboard data MUST be scoped to the authenticated grantor's access permissions
- MUST: Dashboard MUST reflect submission data from immutable snapshots, not live draft workspaces
- SHOULD: Dashboard data SHOULD refresh at least every 5 minutes (near-real-time)
- MUST: Dashboard MUST be WCAG 2.1 AA accessible (charts MUST have text equivalents)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Dashboard data unavailable | 503 | DASHBOARD_UNAVAILABLE | "Intake dashboard is temporarily unavailable. Please try again." |

**API Surface (this feature):** `GET /api/v1/analytics/grantor/dashboard` (summary metrics); `GET /api/v1/analytics/grantor/opportunities` (opportunity-level breakdown) — see `Y1d-api-submission.md` §Analytics.

**Schema Surface (this feature):** Reads from `opportunities`, `application_workspaces`, `submission_snapshots`, `intake_dispositions` — no dedicated analytics table in MVP; queries aggregated on demand.

---

## F62: Applicant Dashboards
*Maps to: PRD-INTAKE-063 | Priority: P0 — MVP*

**Description:** Applicants have access to a personal dashboard showing all their activity across opportunities. The dashboard surfaces upcoming deadlines with countdown indicators, application progress by section, missing required items with links into the workspace, and full submission history with receipt access. The dashboard is the applicant's primary status screen across all their applications.

**Sub-features:**
- All active and historical applications for the authenticated user's organization
- Application progress per opportunity (section-level completion and overall %)
- Upcoming deadlines with countdown indicators (days remaining)
- Missing required items with direct links to the applicable workspace section
- Full submission history: status, confirmation number, submission timestamp, receipt download link
- Opportunity browse link from dashboard

**Dashboard Sections:**

| Section | Content |
|---|---|
| My Applications | List of all workspaces with opportunity name, status, completion %, deadline |
| Upcoming Deadlines | Applications sorted by `application_close_date ASC` with days-remaining badge |
| Missing Required Items | Aggregated list of all blocking errors across all active applications with links |
| Submission History | All submitted applications with confirmation number, timestamp, disposition status, receipt link |

**Process:**
1. Applicant logs in and navigates to their dashboard
2. System fetches all `application_workspaces` for the authenticated user's organization
3. For each workspace, system computes: completion percentage, days remaining, blocking errors count
4. Dashboard renders application list, upcoming deadlines, and missing items panels
5. Applicant clicks a workspace to navigate directly to that application
6. Submission history shows all `submission_snapshots` for the org with status and receipt links

**Inputs:**
- `org_id` (UUID): Authenticated applicant organization
- `user_id` (UUID): For user-specific task and assignment views

**Outputs:**
- Application list with status, completion, deadline
- Deadline countdown badges
- Missing items list with section links
- Submission history with receipt download links

**Validation:**
- MUST: Dashboard MUST show only the authenticated user's organization's applications
- MUST: Submission history MUST link to immutable submission snapshots (not live workspace data)
- MUST: Receipt download MUST be accessible for all submitted applications
- SHOULD: Countdown indicators SHOULD update in real time without page refresh (or on page load)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Dashboard data unavailable | 503 | DASHBOARD_UNAVAILABLE | "Your dashboard is temporarily unavailable. Please try again." |
| Receipt not found | 404 | RECEIPT_NOT_FOUND | "Submission receipt could not be found. Please contact support." |

**API Surface (this feature):** `GET /api/v1/analytics/applicant/dashboard` (summary); `GET /api/v1/analytics/applicant/applications` (application list); `GET /api/v1/workspaces/{workspace_id}/receipt` (receipt download) — see `Y1d-api-submission.md` §Analytics.

**Schema Surface (this feature):** Reads from `application_workspaces`, `application_sections`, `submission_snapshots`, `intake_dispositions` — see `Y0c-schema-app.md`, `Y0d-schema-submission.md`.

---

## F63: Intake Data Export
*Maps to: PRD-INTAKE-064 | Priority: P0 — MVP*

**Description:** Grantors and authorized administrators can export intake data for external reporting, audit, and compliance purposes. Exports include submission metadata, eligibility results, disposition history, and audit events. Export access is controlled by role and scoped to the grantor's access permissions.

**Terminology:**
- **Intake Export:** A structured data download of application and intake event data for a configured scope (opportunity, date range, disposition state)
- **Audit Export:** A structured export of audit event records for compliance and records-retention purposes

**Sub-features:**
- Export intake data by opportunity, date range, or disposition state
- Export formats: CSV (for spreadsheet-based reporting), JSON (for structured data integration)
- Export content: submission metadata, eligibility results, budget summaries, disposition history, audit events
- Role-gated export access (Grantor Admin, Program Officer, Intake Administrator, Compliance Analyst)
- Export job queued asynchronously for large datasets; download link emailed when ready

**Process:**
1. Authorized grantor user navigates to Intake Export section
2. User configures export scope: opportunity (required), date range (optional), disposition filter (optional), include/exclude sections (eligibility, budget, audit events)
3. User selects export format (CSV or JSON)
4. User clicks "Generate Export"
5. System queues export job (for large datasets) or generates immediately (for small datasets < 1,000 records)
6. For large datasets: system emails download link to user when ready
7. Export file downloaded

**Export Contents:**

| Field Group | Fields Included |
|---|---|
| Submission Metadata | confirmation_number, submitted_at, opportunity_title, FON, org_name, applicant_type, requested_amount |
| Eligibility Results | overall_result, triggered_rules (rule_type, severity, explanation) |
| Budget Summary | total_federal_request, total_match, total_indirect per budget period |
| Disposition History | disposition, applied_at, applied_by, rationale |
| Audit Events | event_type, entity_type, entity_id, actor, occurred_at |

**Inputs:**
- `opportunity_id` (UUID, required)
- `date_from`, `date_to` (date, optional)
- `disposition_filter` (enum[], optional)
- `include_eligibility` (boolean, default: true)
- `include_budget` (boolean, default: true)
- `include_audit_events` (boolean, default: false — compliance use only)
- `format` (enum, required): `csv | json`

**Outputs:**
- Export file (CSV or JSON) containing the configured data
- Export log record (what was exported, by whom, when)
- Audit event: `EXPORT_GENERATED`

**Validation:**
- MUST: Export MUST be scoped to opportunities the requesting user has access to
- MUST: Export MUST NOT include grantee-private data (internal comments, draft workspace data)
- MUST: Export MUST include only immutable submission snapshot data (not live drafts)
- MUST: Export action MUST be logged in audit trail
- MUST: `include_audit_events = true` MUST require Grantor Admin or Compliance Analyst role
- SHOULD: Exports > 1,000 records SHOULD be processed asynchronously with email delivery

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Unauthorized export | 403 | PERMISSION_DENIED | "You do not have permission to export data for this opportunity." |
| Export generation failed | 500 | EXPORT_FAILED | "Export could not be generated. Please try again or contact support." |
| No data matching filters | 200 | — | Export file returned with headers only and zero data rows |

**API Surface (this feature):** `POST /api/v1/analytics/export` (create export job); `GET /api/v1/analytics/export/{job_id}/status` (job status); `GET /api/v1/analytics/export/{job_id}/download` (download when ready) — see `Y1d-api-submission.md` §Export.

**Schema Surface (this feature):** `export_jobs` table (job_id, requested_by FK, opportunity_id FK, filters JSONB, format, status, file_path, requested_at, completed_at); reads from `submission_snapshots`, `eligibility_responses`, `budgets`, `intake_dispositions`, `audit_events` — see `Y0d-schema-submission.md`.
---

# Y0a: Database Schema — Core: Programs, Opportunities, Eligibility, Prescreening

*All timestamps stored in UTC. UUIDs as primary keys unless noted. JSONB for flexible structured data.*

---

## Table: programs

```sql
CREATE TABLE programs (
    program_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id      UUID NOT NULL REFERENCES grantor_organizations(org_id),
    program_name        VARCHAR(250) NOT NULL,
    program_area        VARCHAR(100),
    is_federal          BOOLEAN NOT NULL DEFAULT FALSE,
    program_description TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ
);
CREATE INDEX idx_programs_grantor ON programs(grantor_org_id);
```

---

## Table: opportunity_templates

```sql
CREATE TABLE opportunity_templates (
    template_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name       VARCHAR(250) NOT NULL,
    template_type       VARCHAR(50) NOT NULL,   -- federal_nofo, state_grant, philanthropic_rfp, etc.
    grant_market        VARCHAR(50),
    default_sections    JSONB,                   -- array of section definitions
    default_metadata    JSONB,                   -- default field values
    is_system_template  BOOLEAN NOT NULL DEFAULT TRUE,
    owner_org_id        UUID REFERENCES grantor_organizations(org_id),  -- null for system templates
    created_by          UUID REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Table: opportunities

```sql
CREATE TABLE opportunities (
    opportunity_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id                  UUID NOT NULL REFERENCES programs(program_id),
    template_id                 UUID REFERENCES opportunity_templates(template_id),

    -- Core Metadata (F1)
    title                       VARCHAR(250) NOT NULL,
    funding_source              VARCHAR(250) NOT NULL,
    announcement_type           VARCHAR(50) NOT NULL,  -- initial, modification, continuation, supplemental, correction
    opportunity_number          VARCHAR(100) NOT NULL,
    assistance_listing_number   VARCHAR(10),           -- XX.XXX format; required for federal
    funding_amount_min          NUMERIC(15,2),
    funding_amount_max          NUMERIC(15,2) NOT NULL,
    total_program_funding       NUMERIC(15,2),
    expected_awards_min         INTEGER,
    expected_awards_max         INTEGER,
    eligibility_summary         TEXT NOT NULL,
    executive_summary           TEXT NOT NULL,
    contact_name                VARCHAR(250) NOT NULL,
    contact_email               VARCHAR(320) NOT NULL,
    contact_phone               VARCHAR(30),
    contact_title               VARCHAR(250),
    program_area                VARCHAR(100) NOT NULL,
    geography                   JSONB,                -- array of geography strings
    application_url             VARCHAR(2048),

    -- Status and Publication (F5, F13)
    status                      VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, internal_review, approved, published, modified, closed, archived
    visibility                  VARCHAR(30) NOT NULL DEFAULT 'public',
    -- public, restricted_authenticated
    public_slug                 VARCHAR(300) UNIQUE,
    published_at                TIMESTAMPTZ,
    published_by                UUID REFERENCES users(user_id),

    -- Deadlines (F4)
    application_open_date       TIMESTAMPTZ,
    application_close_date      TIMESTAMPTZ,
    pre_application_deadline    TIMESTAMPTZ,
    loi_deadline                TIMESTAMPTZ,
    loi_required                BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_cadence_days INTEGER,
    deadline_timezone           VARCHAR(64) NOT NULL DEFAULT 'America/New_York',

    -- Q&A Config (F43)
    qa_config                   JSONB,
    -- {qa_enabled, question_window_open, question_window_close, responder_user_ids}

    -- Review Routing Config (F60)
    review_routing_config       JSONB,
    -- {review_workflow_type, assigned_reviewer_ids}

    -- Admin Screening Config (F12)
    admin_screening_enabled     BOOLEAN NOT NULL DEFAULT TRUE,

    -- Attachment Config (F11)
    attachments_required        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Duplicate Application Config (F29)
    duplicate_allowed           BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_number_program UNIQUE (program_id, opportunity_number),
    CONSTRAINT chk_funding_range CHECK (funding_amount_min IS NULL OR funding_amount_min <= funding_amount_max),
    CONSTRAINT chk_date_sequence CHECK (
        application_open_date IS NULL OR application_close_date IS NULL OR
        application_open_date < application_close_date
    )
);
CREATE INDEX idx_opportunities_program ON opportunities(program_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_close_date ON opportunities(application_close_date);
```

---

## Table: opportunity_versions

```sql
CREATE TABLE opportunity_versions (
    version_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_number          INTEGER NOT NULL,
    snapshot                JSONB NOT NULL,       -- complete opportunity field snapshot at this version
    delta                   JSONB,                -- field-level diff from previous version
    modification_reason     TEXT NOT NULL,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_version UNIQUE (opportunity_id, version_number)
);
CREATE INDEX idx_opp_versions_opportunity ON opportunity_versions(opportunity_id);
```

---

## Table: eligibility_rules

```sql
CREATE TABLE eligibility_rules (
    rule_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    rule_type               VARCHAR(50) NOT NULL,
    -- applicant_type, geography, entity_status, uei_sam, nonprofit_status,
    -- tribal_status, state_local_status, prior_award_status, match_requirement, custom
    criterion_field         VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    -- equals, not_equals, includes, excludes, greater_than, less_than, is_true, is_false
    criterion_value         JSONB NOT NULL,         -- string, string[], or number
    severity                VARCHAR(20) NOT NULL,   -- hard_blocker, advisory
    enforcement_point       VARCHAR(20),            -- pre_workspace, pre_submission (required for hard_blocker)
    explanation_text        TEXT NOT NULL,
    rule_group_id           UUID,
    rule_group_operator     VARCHAR(5),             -- AND, OR
    display_order           INTEGER NOT NULL DEFAULT 0,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_enforcement_point CHECK (
        severity != 'hard_blocker' OR enforcement_point IS NOT NULL
    )
);
CREATE INDEX idx_elig_rules_opportunity ON eligibility_rules(opportunity_id);
```

---

## Table: prescreening_questionnaires

```sql
CREATE TABLE prescreening_questionnaires (
    questionnaire_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id) UNIQUE,
    placement           VARCHAR(20) NOT NULL,  -- pre_workspace, pre_submission
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Table: prescreening_questions

```sql
CREATE TABLE prescreening_questions (
    question_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id        UUID NOT NULL REFERENCES prescreening_questionnaires(questionnaire_id),
    question_text           VARCHAR(500) NOT NULL,
    question_type           VARCHAR(20) NOT NULL,  -- yes_no, multiple_choice, text
    is_required             BOOLEAN NOT NULL DEFAULT TRUE,
    display_order           INTEGER NOT NULL DEFAULT 0,
    conditional_display     JSONB  -- {depends_on_question_id, trigger_response_value}
);
CREATE INDEX idx_ps_questions_questionnaire ON prescreening_questions(questionnaire_id);
```

---

## Table: prescreening_options

```sql
CREATE TABLE prescreening_options (
    option_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES prescreening_questions(question_id),
    option_text         VARCHAR(250) NOT NULL,
    mapped_rule_id      UUID REFERENCES eligibility_rules(rule_id),
    rule_outcome        VARCHAR(10)   -- met, violated, advisory
);
CREATE INDEX idx_ps_options_question ON prescreening_options(question_id);
```

---

## Table: attachment_requirements

```sql
CREATE TABLE attachment_requirements (
    requirement_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    document_type               VARCHAR(100) NOT NULL,
    custom_document_name        VARCHAR(250),
    applicant_type_scope        JSONB,    -- array of entity_type values; empty = all
    stage_scope                 VARCHAR(30) NOT NULL,  -- pre_application, loi, full_application
    is_required                 BOOLEAN NOT NULL DEFAULT TRUE,
    instructions                TEXT,
    file_format_restrictions    JSONB,    -- array of file extensions
    max_file_size_mb            INTEGER NOT NULL DEFAULT 50,
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attach_req_opportunity ON attachment_requirements(opportunity_id);
```

---

## Table: screening_criteria

```sql
CREATE TABLE screening_criteria (
    criterion_id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id                      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    criterion_text                      VARCHAR(500) NOT NULL,
    criterion_type                      VARCHAR(10) NOT NULL,  -- auto, manual
    auto_criterion_key                  VARCHAR(50),
    -- deadline_check, completeness_check, eligibility_check, attachment_check, duplicate_check
    is_required                         BOOLEAN NOT NULL DEFAULT TRUE,
    suggested_disposition_on_failure    VARCHAR(50),
    display_order                       INTEGER NOT NULL DEFAULT 0,
    created_by                          UUID NOT NULL REFERENCES users(user_id),
    created_at                          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screening_criteria_opp ON screening_criteria(opportunity_id);
```

---

## Table: guidance_prompts

```sql
CREATE TABLE guidance_prompts (
    prompt_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        VARCHAR(100) NOT NULL UNIQUE,  -- e.g., 'executive_summary', 'eligibility_summary'
    prompt_text     TEXT NOT NULL,
    example_text    TEXT,
    uswds_tips      JSONB,    -- array of plain-language tip strings
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Table: section_conditions

```sql
CREATE TABLE section_conditions (
    condition_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id              UUID NOT NULL REFERENCES application_sections(section_id),
    trigger_field           VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    trigger_value           JSONB NOT NULL,
    condition_group_operator VARCHAR(5),  -- AND, OR
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_section_conditions_section ON section_conditions(section_id);
```
---

# Y0b: Database Schema — Organization Profile, Contacts, Roles, Documents

*All timestamps stored in UTC. UUIDs as primary keys.*

---

## Table: users

```sql
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    full_name       VARCHAR(250) NOT NULL,
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);
```

---

## Table: grantor_organizations

```sql
CREATE TABLE grantor_organizations (
    org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name        VARCHAR(250) NOT NULL,
    org_type        VARCHAR(50),   -- federal_agency, state_agency, foundation, corporate, other
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Table: organizations

*Applicant organization profile (F18, F19)*

```sql
CREATE TABLE organizations (
    org_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name              VARCHAR(250) NOT NULL,
    dba_name                VARCHAR(250),
    address_line1           VARCHAR(250) NOT NULL,
    address_line2           VARCHAR(250),
    city                    VARCHAR(100) NOT NULL,
    state                   CHAR(2) NOT NULL,
    zip                     VARCHAR(10) NOT NULL,
    country                 CHAR(2) NOT NULL DEFAULT 'US',
    entity_type             VARCHAR(50) NOT NULL,
    -- nonprofit_501c3, nonprofit_other, for_profit, government_federal,
    -- government_state, government_local, tribal, university, individual, other
    ein                     CHAR(9),                    -- 9 digits, stored without hyphen
    uei                     CHAR(12),                   -- 12-char alphanumeric
    sam_registered          BOOLEAN NOT NULL DEFAULT FALSE,
    sam_expiration_date     DATE,
    tax_exempt_status       VARCHAR(20),
    -- 501c3, 501c4, 501c6, other, not_applicable
    congressional_district  VARCHAR(20),
    primary_contact_name    VARCHAR(250) NOT NULL,
    primary_contact_email   VARCHAR(320) NOT NULL,
    primary_contact_phone   VARCHAR(30),
    banking_readiness       VARCHAR(20) NOT NULL DEFAULT 'unknown',
    -- ready, not_ready, unknown
    indirect_cost_rate      NUMERIC(5,2),               -- percentage
    indirect_cost_base      VARCHAR(100),
    profile_completeness_pct NUMERIC(5,2) DEFAULT 0,    -- computed
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_uei_format CHECK (uei IS NULL OR uei ~ '^[A-Za-z0-9]{12}$'),
    CONSTRAINT chk_ein_format CHECK (ein IS NULL OR ein ~ '^\d{9}$')
);
CREATE INDEX idx_organizations_uei ON organizations(uei);
CREATE INDEX idx_organizations_ein ON organizations(ein);
```

---

## Table: org_contacts

*Additional contacts beyond primary (authorized representatives, financial contacts, etc.)*

```sql
CREATE TABLE org_contacts (
    contact_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(org_id),
    user_id         UUID REFERENCES users(user_id),
    contact_name    VARCHAR(250) NOT NULL,
    contact_email   VARCHAR(320) NOT NULL,
    contact_phone   VARCHAR(30),
    contact_title   VARCHAR(250),
    contact_type    VARCHAR(50) NOT NULL,
    -- primary, authorized_representative, financial, technical, other
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_contacts_org ON org_contacts(org_id);
```

---

## Table: org_roles

*Role assignments for applicant organization team members (F22)*

```sql
CREATE TABLE org_roles (
    role_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    user_id                 UUID NOT NULL REFERENCES users(user_id),
    roles                   JSONB NOT NULL,
    -- array of: org_admin, proposal_lead, contributor, finance_contributor, authorized_representative
    invited_by              UUID REFERENCES users(user_id),
    invitation_sent_at      TIMESTAMPTZ,
    invitation_accepted_at  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at              TIMESTAMPTZ,

    CONSTRAINT uq_org_user_role UNIQUE (org_id, user_id)
);
CREATE INDEX idx_org_roles_org ON org_roles(org_id);
CREATE INDEX idx_org_roles_user ON org_roles(user_id);
```

---

## Table: org_attachments

*Reusable standard attachment library at organization level (F20)*

```sql
CREATE TABLE org_attachments (
    attachment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    document_type           VARCHAR(100) NOT NULL,
    -- irs_determination_letter, w9, audit_report, indirect_cost_agreement,
    -- board_roster, insurance_certificate, letters_of_support, other
    custom_document_name    VARCHAR(250),
    version_number          INTEGER NOT NULL DEFAULT 1,
    file_name               VARCHAR(500) NOT NULL,
    file_path               VARCHAR(2048) NOT NULL,    -- storage reference
    mime_type               VARCHAR(100) NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    expiration_date         DATE,                      -- for credential tracking (F21)
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by             UUID NOT NULL REFERENCES users(user_id),
    uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_version_positive CHECK (version_number > 0)
);
CREATE INDEX idx_org_attachments_org ON org_attachments(org_id);
CREATE INDEX idx_org_attachments_type ON org_attachments(org_id, document_type);
CREATE INDEX idx_org_attachments_active ON org_attachments(org_id, document_type, is_active);
```

---

## Table: grantor_roles

*Role assignments for grantor organization users*

```sql
CREATE TABLE grantor_roles (
    role_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id  UUID NOT NULL REFERENCES grantor_organizations(org_id),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    roles           JSONB NOT NULL,
    -- array of: grantor_admin, program_officer, intake_administrator, compliance_analyst, reviewer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ,

    CONSTRAINT uq_grantor_user_role UNIQUE (grantor_org_id, user_id)
);
CREATE INDEX idx_grantor_roles_org ON grantor_roles(grantor_org_id);
CREATE INDEX idx_grantor_roles_user ON grantor_roles(user_id);
```
---

# Y0c: Database Schema — Application Workspace, Sections, Budget, Attachments

*All timestamps stored in UTC. UUIDs as primary keys.*

---

## Table: application_workspaces

```sql
CREATE TABLE application_workspaces (
    workspace_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    track_id            UUID,                       -- for multi-track opportunities
    status              VARCHAR(50) NOT NULL DEFAULT 'workspace_created',
    -- workspace_created, in_progress, ready_for_internal_review,
    -- ready_to_submit, submitted, intake_screening, returned_for_correction,
    -- resubmitted, accepted_for_review, withdrawn, administratively_rejected
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    -- grantee_private (draft), shared (submitted)
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_workspace_org_opp UNIQUE (opportunity_id, org_id)
    -- Note: UNIQUE constraint disabled when opportunity.duplicate_allowed = true
);
CREATE INDEX idx_workspaces_opportunity ON application_workspaces(opportunity_id);
CREATE INDEX idx_workspaces_org ON application_workspaces(org_id);
CREATE INDEX idx_workspaces_status ON application_workspaces(status);
```

---

## Table: application_sections

```sql
CREATE TABLE application_sections (
    section_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_type        VARCHAR(50) NOT NULL,
    -- org_profile, eligibility, narrative, budget, workplan, performance_measures,
    -- attachments, certifications, review_submit, custom
    section_name        VARCHAR(250) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- not_started, in_progress, complete, error, locked
    is_visible          BOOLEAN NOT NULL DEFAULT TRUE,    -- controlled by conditional logic F10
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,   -- locked after submission F54
    display_order       INTEGER NOT NULL DEFAULT 0,
    owner_id            UUID REFERENCES users(user_id),   -- section owner F31
    internal_due_date   DATE,                            -- internal due date F31
    validation_status   VARCHAR(20) DEFAULT 'not_validated',
    validation_errors   JSONB,                           -- array of {field_id, severity, message}
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_workspace ON application_sections(workspace_id);
CREATE INDEX idx_sections_type ON application_sections(workspace_id, section_type);
```

---

## Table: form_field_definitions

*Grantor-configured form field definitions per section (F36)*

```sql
CREATE TABLE form_field_definitions (
    field_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    -- Note: field_definitions belong to opportunity section templates; linked via section_type
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    field_type          VARCHAR(30) NOT NULL,
    -- text, textarea, number, currency, date, picklist, multi_select,
    -- checkbox, file_upload, calculated, repeating_table
    label               VARCHAR(200) NOT NULL,
    placeholder         VARCHAR(500),
    help_text           VARCHAR(1000),
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    display_order       INTEGER NOT NULL DEFAULT 0,
    validation_config   JSONB,
    -- {max_length, max_chars, max_words, min, max, decimal_places,
    --  allowed_values, min_selected, max_selected, file_formats,
    --  max_size_mb, min_date, max_date}
    formula             TEXT,                  -- for calculated fields
    columns             JSONB,                 -- for repeating_table: array of column defs
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_fields_opportunity_section ON form_field_definitions(opportunity_id, section_id);
```

---

## Table: field_responses

*Applicant-entered form data per field per workspace*

```sql
CREATE TABLE field_responses (
    response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_id            UUID NOT NULL REFERENCES form_field_definitions(field_id),
    response_value      TEXT,               -- for simple fields
    response_json       JSONB,              -- for complex types (repeating_table rows, multi_select)
    updated_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_field_response UNIQUE (workspace_id, field_id)
);
CREATE INDEX idx_field_responses_workspace ON field_responses(workspace_id);
CREATE INDEX idx_field_responses_section ON field_responses(section_id);
```

---

## Table: workspace_tasks

*Internal tasks within application workspace (F31)*

```sql
CREATE TABLE workspace_tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    task_title      VARCHAR(500) NOT NULL,
    assignee_id     UUID NOT NULL REFERENCES users(user_id),
    task_due_date   DATE,
    task_notes      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',  -- open, complete
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_tasks_workspace ON workspace_tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON workspace_tasks(assignee_id);
```

---

## Table: workspace_comments

*Private internal applicant comments (F32)*

```sql
CREATE TABLE workspace_comments (
    comment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    comment_text    TEXT NOT NULL CHECK (char_length(comment_text) <= 5000),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'internal',  -- always internal; never shared
    posted_by       UUID NOT NULL REFERENCES users(user_id),
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_workspace ON workspace_comments(workspace_id);
```

---

## Table: eligibility_responses

*Per-applicant eligibility pre-screen responses (F24, F28)*

```sql
CREATE TABLE eligibility_responses (
    response_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    workspace_id            UUID REFERENCES application_workspaces(workspace_id),
    question_id             UUID NOT NULL REFERENCES prescreening_questions(question_id),
    selected_option_id      UUID REFERENCES prescreening_options(option_id),
    response_text           TEXT,                  -- for text-type questions
    rule_evaluation_result  VARCHAR(20),           -- met, violated, advisory, not_applicable
    overall_result          VARCHAR(20),
    -- eligible, likely_eligible, needs_attention, ineligible
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_elig_response UNIQUE (opportunity_id, org_id, question_id)
);
CREATE INDEX idx_elig_responses_workspace ON eligibility_responses(workspace_id);
CREATE INDEX idx_elig_responses_org_opp ON eligibility_responses(org_id, opportunity_id);
```

---

## Table: budgets

```sql
CREATE TABLE budgets (
    budget_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id) UNIQUE,
    budget_periods_count    INTEGER NOT NULL DEFAULT 1,
    total_federal_request   NUMERIC(15,2),          -- computed
    total_match             NUMERIC(15,2),          -- computed
    total_indirect          NUMERIC(15,2),          -- computed
    total_project_cost      NUMERIC(15,2),          -- computed (federal + match)
    validation_status       VARCHAR(20) DEFAULT 'not_validated',
    validation_errors       JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Table: budget_line_items

```sql
CREATE TABLE budget_line_items (
    line_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id           UUID NOT NULL REFERENCES budgets(budget_id),
    budget_period       INTEGER NOT NULL DEFAULT 1,
    category            VARCHAR(50) NOT NULL,
    -- personnel, fringe, travel, equipment, supplies, contractual,
    -- indirect, other_direct, match_cash, match_in_kind
    description         VARCHAR(500) NOT NULL,
    quantity            NUMERIC(10,2),
    unit_cost           NUMERIC(15,2),
    total_cost          NUMERIC(15,2) NOT NULL,
    -- Personnel-specific
    personnel_name      VARCHAR(250),
    fte                 NUMERIC(4,3),              -- 0.001 to 1.000
    annual_salary       NUMERIC(15,2),
    fringe_rate         NUMERIC(5,2),              -- percentage
    -- Cost-share
    match_source        VARCHAR(250),
    match_type          VARCHAR(10),               -- cash, in_kind
    -- Justification
    justification_text  TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_total_cost_nonneg CHECK (total_cost >= 0),
    CONSTRAINT chk_fte_range CHECK (fte IS NULL OR (fte >= 0.001 AND fte <= 1.000)),
    CONSTRAINT chk_fringe_range CHECK (fringe_rate IS NULL OR (fringe_rate >= 0 AND fringe_rate <= 100))
);
CREATE INDEX idx_budget_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_items_period ON budget_line_items(budget_id, budget_period);
```

---

## Table: attachments

*Application-level uploaded attachments (F40, F41)*

```sql
CREATE TABLE attachments (
    attachment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID REFERENCES application_sections(section_id),
    requirement_id      UUID REFERENCES attachment_requirements(requirement_id),
    source_type         VARCHAR(10) NOT NULL,       -- upload, library
    org_document_id     UUID REFERENCES org_attachments(attachment_id),  -- for library source
    file_name           VARCHAR(500),
    file_path           VARCHAR(2048),              -- storage reference; null for library source
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    version_number      INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by         UUID REFERENCES users(user_id),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_workspace ON attachments(workspace_id);
CREATE INDEX idx_attachments_requirement ON attachments(requirement_id, is_active);
```

---

## Table: certifications

*Authorized representative certification records (F51)*

```sql
CREATE TABLE certifications (
    cert_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    certifying_user_id      UUID NOT NULL REFERENCES users(user_id),
    certification_text      TEXT NOT NULL,
    certification_text_hash VARCHAR(64) NOT NULL,  -- SHA-256 of certification text
    certification_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_certification_workspace UNIQUE (workspace_id)
);
```
---

# Y0d: Database Schema — Submission Snapshots, Q&A, Addenda, Audit Events, Intake Queue

*All timestamps stored in UTC. UUIDs as primary keys.*

---

## Table: submission_snapshots

*Immutable final submitted application package (F52, F53, F59)*

```sql
CREATE TABLE submission_snapshots (
    snapshot_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id                UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                      UUID NOT NULL REFERENCES organizations(org_id),
    confirmation_number         VARCHAR(30) NOT NULL UNIQUE,
    -- Format: GI-{YEAR}-{8-digit-seq}, e.g., GI-2026-00001234
    submitted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_by                UUID NOT NULL REFERENCES users(user_id),

    -- Immutable snapshot data (JSONB)
    org_profile_snapshot        JSONB NOT NULL,    -- org profile state at submission
    eligibility_snapshot        JSONB NOT NULL,    -- eligibility responses and results
    sections_snapshot           JSONB NOT NULL,    -- all section field data
    budget_snapshot             JSONB NOT NULL,    -- budget data
    attachment_refs             JSONB NOT NULL,    -- list of attachment metadata (not file content)

    -- Certification reference
    certification_id            UUID REFERENCES certifications(cert_id),

    -- Version tracking (F59)
    is_original                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_current                  BOOLEAN NOT NULL DEFAULT TRUE,
    supersedes_snapshot_id      UUID REFERENCES submission_snapshots(snapshot_id),

    -- Generated packages (F53)
    human_readable_pdf_path     VARCHAR(2048),
    machine_readable_json_path  VARCHAR(2048),

    -- Validation summary at submission
    validation_summary          JSONB,

    CONSTRAINT chk_snapshot_immutable CHECK (TRUE)
    -- Enforcement: no UPDATE operations permitted on this table after INSERT
);
CREATE INDEX idx_snapshots_workspace ON submission_snapshots(workspace_id);
CREATE INDEX idx_snapshots_opportunity ON submission_snapshots(opportunity_id);
CREATE INDEX idx_snapshots_confirmation ON submission_snapshots(confirmation_number);
CREATE INDEX idx_snapshots_current ON submission_snapshots(workspace_id, is_current);
```

---

## Table: intake_queue_entries

*Routing and screening queue entries (F55, F56)*

```sql
CREATE TABLE intake_queue_entries (
    entry_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    snapshot_id         UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    routed_to           VARCHAR(250),               -- queue segment or assigned team name
    status              VARCHAR(50) NOT NULL DEFAULT 'pending_screening',
    -- pending_screening, accepted_for_review, returned_for_correction,
    -- ineligible, late, duplicate, withdrawn, administratively_rejected
    disposition_id      UUID REFERENCES intake_dispositions(disposition_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_opportunity ON intake_queue_entries(opportunity_id);
CREATE INDEX idx_queue_status ON intake_queue_entries(status);
CREATE INDEX idx_queue_org ON intake_queue_entries(org_id);
```

---

## Table: intake_dispositions

*Administrative screening disposition records (F57)*

```sql
CREATE TABLE intake_dispositions (
    disposition_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                    UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id                 UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    disposition                 VARCHAR(50) NOT NULL,
    -- accepted_for_review, returned_for_correction, ineligible, late,
    -- duplicate, withdrawn, administratively_rejected
    rationale                   TEXT,                  -- required for non-acceptance
    screening_criteria_results  JSONB,
    -- array of {criterion_id, criterion_text, result: pass|fail|na}
    applied_by                  UUID NOT NULL REFERENCES users(user_id),
    applied_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispositions_entry ON intake_dispositions(entry_id);
```

---

## Table: correction_requests

*Grantor correction/clarification requests (F58)*

```sql
CREATE TABLE correction_requests (
    request_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    correction_sections     JSONB NOT NULL,        -- array of section_ids requiring correction
    correction_instructions TEXT NOT NULL,
    correction_deadline     TIMESTAMPTZ NOT NULL,
    requested_by            UUID NOT NULL REFERENCES users(user_id),
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at             TIMESTAMPTZ
);
CREATE INDEX idx_correction_requests_entry ON correction_requests(entry_id);
```

---

## Table: review_handoffs

*Accepted application routing to review module (F60)*

```sql
CREATE TABLE review_handoffs (
    handoff_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    review_workflow_type    VARCHAR(100),          -- merit_review, risk_assessment, scoring
    assigned_reviewer_ids   JSONB,                 -- array of user_ids
    handed_off_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL REFERENCES users(user_id)
);
CREATE INDEX idx_review_handoffs_entry ON review_handoffs(entry_id);
```

---

## Table: qa_items

*Q&A questions and published answers (F43, F44)*

```sql
CREATE TABLE qa_items (
    qa_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    submitter_org_id    UUID NOT NULL REFERENCES organizations(org_id),
    submitter_user_id   UUID NOT NULL REFERENCES users(user_id),
    question_text       TEXT NOT NULL,
    answer_text         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'submitted',
    -- submitted, under_review, answered, archived
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_by        UUID REFERENCES users(user_id),
    published_at        TIMESTAMPTZ
);
CREATE INDEX idx_qa_items_opportunity ON qa_items(opportunity_id);
CREATE INDEX idx_qa_items_status ON qa_items(opportunity_id, status);
```

---

## Table: addenda

*Published opportunity changes (F17, F46)*

```sql
CREATE TABLE addenda (
    addendum_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_id          UUID REFERENCES opportunity_versions(version_id),
    addendum_type       VARCHAR(50) NOT NULL,
    -- date_change, content_change, qa_response, correction, required_application_change
    title               VARCHAR(250) NOT NULL,
    description         TEXT NOT NULL,
    effective_date      DATE NOT NULL,
    published_by        UUID NOT NULL REFERENCES users(user_id),
    published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    superseded_at       TIMESTAMPTZ
);
CREATE INDEX idx_addenda_opportunity ON addenda(opportunity_id);
CREATE INDEX idx_addenda_published ON addenda(opportunity_id, published_at DESC);
```

---

## Table: audit_events

*Immutable system-generated audit event records (F46, F6)*

```sql
CREATE TABLE audit_events (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,
    -- OPPORTUNITY_CREATED, OPPORTUNITY_METADATA_UPDATED, OPPORTUNITY_PUBLISHED,
    -- OPPORTUNITY_VERSION_CREATED, ELIGIBILITY_RULE_CREATED, WORKSPACE_CREATED,
    -- APPLICATION_SUBMITTED, SUBMISSION_BLOCKED, CERTIFICATION_COMPLETED,
    -- DISPOSITION_APPLIED, CORRECTION_REQUESTED, APPLICATION_ACCEPTED_FOR_REVIEW,
    -- QA_ANSWER_PUBLISHED, ADDENDUM_PUBLISHED, NOTIFICATION_SENT, EXPORT_GENERATED,
    -- WORKSPACE_LOCKED, WORKSPACE_UNLOCKED, ROLE_ASSIGNED, ORGANIZATION_PROFILE_CREATED,
    -- ORGANIZATION_PROFILE_UPDATED
    entity_type     VARCHAR(50) NOT NULL,      -- opportunity, workspace, snapshot, disposition, etc.
    entity_id       UUID NOT NULL,
    actor_user_id   UUID REFERENCES users(user_id),  -- null for system-generated events
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    before_state    JSONB,
    after_state     JSONB,
    ip_address      INET,
    metadata        JSONB                      -- additional event-specific data

    -- No UPDATE or DELETE operations permitted on this table
);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_occurred ON audit_events(occurred_at DESC);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
```

---

## Table: notification_records

*Notification delivery tracking (F47)*

```sql
CREATE TABLE notification_records (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   UUID NOT NULL REFERENCES users(user_id),
    trigger_event       VARCHAR(50) NOT NULL,
    -- addendum_published, deadline_changed, required_change, qa_answered,
    -- submission_received, returned_for_correction, accepted_for_review,
    -- workspace_created, deadline_approaching
    opportunity_id      UUID REFERENCES opportunities(opportunity_id),
    entity_id           UUID,                  -- addendum_id, qa_id, etc.
    message_text        TEXT NOT NULL,
    channel             VARCHAR(10) NOT NULL,  -- email, in_app
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at        TIMESTAMPTZ,
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- sent, delivered, failed, bounced
    read_at             TIMESTAMPTZ
);
CREATE INDEX idx_notifications_recipient ON notification_records(recipient_user_id);
CREATE INDEX idx_notifications_opportunity ON notification_records(opportunity_id);
```

---

## Table: export_jobs

*Intake data export job tracking (F63)*

```sql
CREATE TABLE export_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by    UUID NOT NULL REFERENCES users(user_id),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    filters         JSONB NOT NULL,            -- date_from, date_to, disposition_filter, include_* flags
    format          VARCHAR(5) NOT NULL,       -- csv, json
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- queued, processing, complete, failed
    file_path       VARCHAR(2048),             -- storage path when complete
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    row_count       INTEGER
);
CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
```
---

# Y1a: REST API — Opportunities, Programs, Eligibility, Templates

*Base URL: `/api/v1` | Auth: JWT Bearer token required on all endpoints except public opportunity portal reads | Format: JSON*

---

## Programs

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/programs` | List programs for authenticated grantor org | Grantor roles |
| POST | `/programs` | Create a new program | Grantor Admin, Program Officer |
| GET | `/programs/{program_id}` | Get program details | Grantor roles |
| PUT | `/programs/{program_id}` | Update program | Grantor Admin, Program Officer |

**POST /programs — Request Body:**
```json
{
  "program_name": "Community Health Grants",
  "program_area": "Health",
  "is_federal": true,
  "program_description": "..."
}
```
**Response:** `201 Created` with `program_id`.

---

## Opportunity Templates

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunity-templates` | List all templates (system + custom for org) | Grantor roles |
| GET | `/opportunity-templates/{template_id}` | Get template details | Grantor roles |
| POST | `/opportunities/{opportunity_id}/save-as-template` | Save published opportunity as custom template | Grantor Admin |

---

## Opportunities

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/opportunities` | Create opportunity from template (F0) | Grantor Admin, Program Officer |
| GET | `/opportunities` | Search and list opportunities (F14) | Public (published) |
| GET | `/opportunities/{opportunity_id}` | Get opportunity detail (F16) | Public / Authenticated |
| PUT | `/opportunities/{opportunity_id}/metadata` | Update metadata (F1) | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/deadlines` | Update deadline config (F4) | Program Officer, Grantor Admin |
| GET | `/opportunities/{opportunity_id}/preview` | Grantor preview before publish (F13) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/validate` | Dry-run completeness check (F5) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/publish` | Publish opportunity (F5, F13) | Grantor Admin, Program Officer |
| POST | `/opportunities/{opportunity_id}/modifications` | Create post-publication modification (F6) | Grantor Admin, Program Officer |
| GET | `/opportunities/{opportunity_id}/versions` | List version history (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/versions/{version_number}` | Get specific version (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/workspace-status` | Get authenticated applicant's workspace status (F16) | Applicant roles |
| GET | `/opportunities/{opportunity_id}/addenda` | List addenda (F17) | Public |
| GET | `/addenda/{addendum_id}` | Get addendum detail | Public |
| PUT | `/opportunities/{opportunity_id}/qa-config` | Configure Q&A settings (F43) | Grantor Admin, Program Officer |

**POST /opportunities — Request Body:**
```json
{
  "template_id": "uuid",
  "program_id": "uuid"
}
```
**Response:** `201 Created` with `opportunity_id`, `status: "draft"`.

**PUT /opportunities/{opportunity_id}/metadata — Request Body (partial update supported):**
```json
{
  "title": "Community Health Initiative 2026",
  "funding_source": "Department of Health and Human Services",
  "announcement_type": "initial",
  "opportunity_number": "HHS-CHI-2026-001",
  "assistance_listing_number": "93.243",
  "funding_amount_max": 500000,
  "eligibility_summary": "Open to nonprofit organizations...",
  "executive_summary": "This opportunity supports...",
  "contact_name": "Jane Smith",
  "contact_email": "jane.smith@hhs.gov",
  "program_area": "Health"
}
```

**GET /opportunities (Search) — Query Parameters:**
```
keyword, funder, program_area, geography, eligibility_type,
funding_min, funding_max, due_date_from, due_date_to,
application_stage, sort_by, page, page_size
```
**Response:** `200 OK` with `{results: [...], total_count, page, page_size}`.

---

## Opportunity Guidance

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/guidance/prompts?field_id={field_id}` | Get plain-language guidance for a field (F2) | Grantor roles |
| POST | `/guidance/readability` | Get readability score for text content (F2) | Grantor roles |

**GET /guidance/prompts Response:**
```json
{
  "field_id": "executive_summary",
  "prompt_text": "Write 2-3 paragraphs explaining what this grant funds...",
  "example_text": "This opportunity funds community health clinics...",
  "uswds_tips": ["Use active voice", "Avoid jargon", "Aim for 8th grade reading level"]
}
```

---

## Eligibility Rules

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/eligibility-rules` | List rules for opportunity (F7) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/eligibility-rules` | Create rule (F7) | Program Officer, Grantor Admin |
| PUT | `/eligibility-rules/{rule_id}` | Update rule (F7) | Program Officer, Grantor Admin |
| DELETE | `/eligibility-rules/{rule_id}` | Delete rule (F7) | Program Officer, Grantor Admin |

**POST /opportunities/{opportunity_id}/eligibility-rules — Request Body:**
```json
{
  "rule_type": "entity_status",
  "criterion_field": "entity_type",
  "operator": "includes",
  "criterion_value": ["nonprofit_501c3", "nonprofit_other"],
  "severity": "hard_blocker",
  "enforcement_point": "pre_workspace",
  "explanation_text": "This opportunity is only open to nonprofit organizations.",
  "display_order": 1
}
```

---

## Pre-Screening Questionnaire

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire (grantor config view) (F9) | Grantor roles |
| PUT | `/opportunities/{opportunity_id}/prescreening` | Update questionnaire (F9) | Program Officer, Grantor Admin |
| POST | `/opportunities/{opportunity_id}/prescreening/preview` | Preview questionnaire as applicant (F9) | Grantor roles |

---

## Attachment Requirements

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/attachment-requirements` | List requirements (F11) | Grantor roles / Applicant roles |
| POST | `/opportunities/{opportunity_id}/attachment-requirements` | Create requirement (F11) | Program Officer, Grantor Admin |
| PUT | `/attachment-requirements/{requirement_id}` | Update requirement | Program Officer, Grantor Admin |
| DELETE | `/attachment-requirements/{requirement_id}` | Delete requirement | Program Officer, Grantor Admin |

---

## Screening Criteria

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/screening-criteria` | List criteria (F12) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/screening-criteria` | Create criterion (F12) | Program Officer, Grantor Admin |
| PUT | `/screening-criteria/{criterion_id}` | Update criterion | Program Officer, Grantor Admin |
| DELETE | `/screening-criteria/{criterion_id}` | Delete criterion (system criteria protected) | Grantor Admin |

---

## Form Builder

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/sections/{section_id}/fields` | List field definitions (F36) | Grantor roles |
| POST | `/form-fields` | Create field definition (F36) | Program Officer, Grantor Admin |
| PUT | `/form-fields/{field_id}` | Update field (F36) | Program Officer, Grantor Admin |
| DELETE | `/form-fields/{field_id}` | Delete field | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/sections/{section_id}/conditions` | Set section conditional rules (F10) | Program Officer |

---

## Standard Error Response Shape

All API errors return:
```json
{
  "error_code": "REQUIRED_FIELD_MISSING",
  "message": "Field 'title' is required before publication.",
  "field": "title",
  "timestamp": "2026-07-24T12:00:00Z"
}
```
Validation errors on multi-field requests return `errors: [{error_code, message, field}, ...]`.
---

# Y1b: REST API — Organizations, Profiles, Roles, Standard Attachments

*Base URL: `/api/v1` | Auth: JWT Bearer token required | Format: JSON*

---

## Organizations (Applicant Org Profile)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/organizations` | Create applicant organization profile (F18) | Any authenticated user |
| GET | `/organizations/{org_id}` | Get org profile (F18, F19) | Org team members / Grantor (submitted data only) |
| PUT | `/organizations/{org_id}` | Update org profile fields (F18, F19) | Org Admin |
| GET | `/organizations/{org_id}/credential-status` | Get credential expiration status (F21) | Org team members |

**POST /organizations — Request Body:**
```json
{
  "legal_name": "Community Health Alliance",
  "dba_name": "CHA",
  "address_line1": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "entity_type": "nonprofit_501c3",
  "ein": "123456789",
  "uei": "ABC123DEF456",
  "sam_registered": true,
  "sam_expiration_date": "2027-06-30",
  "tax_exempt_status": "501c3",
  "primary_contact_name": "Jane Smith",
  "primary_contact_email": "jane@cha.org",
  "banking_readiness": "ready"
}
```
**Response:** `201 Created` with `org_id`.

**GET /organizations/{org_id}/credential-status — Response:**
```json
{
  "org_id": "uuid",
  "credentials": [
    {
      "item_type": "sam_registration",
      "expiration_date": "2026-06-30",
      "status": "expiring_soon",
      "days_remaining": 45
    },
    {
      "item_type": "audit_report",
      "expiration_date": "2025-12-31",
      "status": "expired",
      "days_remaining": -210
    }
  ]
}
```

---

## Organization Roles / Team Management

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/organizations/{org_id}/roles` | List org team members and roles (F22) | Org team members |
| POST | `/organizations/{org_id}/roles` | Invite user and assign role(s) (F22) | Org Admin |
| PUT | `/organizations/{org_id}/roles/{role_id}` | Update role assignment (F22) | Org Admin |
| DELETE | `/organizations/{org_id}/roles/{role_id}` | Revoke role (F22) | Org Admin |

**POST /organizations/{org_id}/roles — Request Body:**
```json
{
  "invitee_email": "budget@cha.org",
  "roles": ["finance_contributor"]
}
```
**Response:** `201 Created` with `role_id` and `invitation_sent: true`.

**PUT /organizations/{org_id}/roles/{role_id} — Request Body:**
```json
{
  "roles": ["contributor", "authorized_representative"]
}
```

---

## Organization Documents (Standard Attachment Library)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/organizations/{org_id}/documents` | List org-level documents (F20) | Org team members |
| POST | `/organizations/{org_id}/documents` | Upload new org document or new version (F20) | Org Admin |
| GET | `/organizations/{org_id}/documents/{doc_id}` | Get document metadata | Org team members |
| GET | `/organizations/{org_id}/documents/{doc_id}/download` | Download document file | Org team members |
| GET | `/organizations/{org_id}/documents/{doc_id}/versions` | List version history (F20) | Org team members |

**POST /organizations/{org_id}/documents — Multipart Form:**
```
document_type: irs_determination_letter
expiration_date: 2028-03-01
file: [binary file content]
```
**Response:** `201 Created` with `attachment_id`, `version_number: 1`.

**GET /organizations/{org_id}/documents — Response:**
```json
{
  "documents": [
    {
      "attachment_id": "uuid",
      "document_type": "irs_determination_letter",
      "file_name": "IRS_Letter_2024.pdf",
      "version_number": 2,
      "uploaded_at": "2026-01-15T10:30:00Z",
      "expiration_date": "2028-03-01",
      "is_active": true,
      "expiration_status": "valid"
    }
  ]
}
```

---

## Grantor Organization Management

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/grantor-organizations/{org_id}` | Get grantor org details | Grantor roles |
| GET | `/grantor-organizations/{org_id}/roles` | List grantor team roles | Grantor Admin |
| POST | `/grantor-organizations/{org_id}/roles` | Add grantor team member | Grantor Admin |
| DELETE | `/grantor-organizations/{org_id}/roles/{role_id}` | Remove grantor team member | Grantor Admin |

---

## Authentication / Session

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/auth/login` | Authenticate user (email/password or SSO) | Public |
| POST | `/auth/refresh` | Refresh JWT access token | Authenticated |
| POST | `/auth/logout` | Invalidate session | Authenticated |
| GET | `/auth/me` | Get current user profile and org memberships | Authenticated |

**GET /auth/me — Response:**
```json
{
  "user_id": "uuid",
  "email": "jane@cha.org",
  "full_name": "Jane Smith",
  "org_memberships": [
    {
      "org_id": "uuid",
      "org_name": "Community Health Alliance",
      "org_type": "applicant",
      "roles": ["org_admin", "authorized_representative"]
    }
  ],
  "grantor_memberships": []
}
```

---

## Standard Response Shapes

**List Response:**
```json
{
  "items": [...],
  "total_count": 42,
  "page": 1,
  "page_size": 20
}
```

**Error Response:**
```json
{
  "error_code": "INVALID_UEI",
  "message": "UEI must be exactly 12 alphanumeric characters.",
  "field": "uei",
  "timestamp": "2026-07-24T12:00:00Z"
}
```

**Multi-field Validation Error:**
```json
{
  "error_code": "VALIDATION_FAILED",
  "message": "Request contains validation errors.",
  "errors": [
    {"field": "state", "error_code": "INVALID_STATE", "message": "State code 'ZZ' is not valid."},
    {"field": "sam_expiration_date", "error_code": "SAM_EXPIRED_ON_ENTRY", "message": "SAM expiration cannot be in the past."}
  ]
}
```
---

# Y1c: REST API — Workspaces, Sections, Budget, Attachments, Validation, Pre-Screening

*Base URL: `/api/v1` | Auth: JWT Bearer token required | Format: JSON*

---

## Pre-Screening (Applicant)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire for applicant (F24) | Applicant roles (authenticated) |
| POST | `/opportunities/{opportunity_id}/prescreening/submit` | Submit responses and get result (F24, F25, F26, F28) | Applicant roles |
| GET | `/workspaces/{workspace_id}/eligibility-responses` | Get stored eligibility responses (F28) | Applicant roles / Grantor (after submission) |

**POST /opportunities/{opportunity_id}/prescreening/submit — Request Body:**
```json
{
  "org_id": "uuid",
  "questionnaire_responses": [
    {"question_id": "uuid", "selected_option_id": "uuid"},
    {"question_id": "uuid", "selected_option_id": "uuid"},
    {"question_id": "uuid", "response_text": "Additional context"}
  ]
}
```

**Response:**
```json
{
  "overall_result": "likely_eligible",
  "triggered_rules": [
    {
      "rule_id": "uuid",
      "severity": "advisory",
      "explanation_text": "Your organization's match capacity should be reviewed.",
      "opportunity_section_link": "/opportunities/abc/eligibility#match-requirement"
    }
  ],
  "next_step": "Review advisory notes and start your application.",
  "workspace_access_granted": true
}
```

---

## Application Workspaces

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces` | Create application workspace (F29) | Applicant roles |
| GET | `/workspaces/{workspace_id}` | Get workspace details and status | Applicant team / Grantor (after submission) |
| GET | `/workspaces/{workspace_id}/readiness` | Get submission readiness summary (F34) | Applicant team |

**POST /workspaces — Request Body:**
```json
{
  "opportunity_id": "uuid",
  "org_id": "uuid"
}
```
**Response:** `201 Created` with `workspace_id`, `status: "workspace_created"`.

**GET /workspaces/{workspace_id}/readiness — Response:**
```json
{
  "workspace_id": "uuid",
  "overall_completion_pct": 0.72,
  "is_ready_to_submit": false,
  "authorized_rep_assigned": true,
  "blocking_errors": [
    {
      "section_id": "uuid",
      "section_name": "Budget",
      "field_id": "uuid",
      "field_label": "Budget Justification — Personnel",
      "error_code": "BUDGET_JUSTIFICATION_MISSING",
      "message": "Budget justification is required for category 'Personnel'.",
      "severity": "blocking",
      "link": "/workspaces/{workspace_id}/sections/{section_id}#field-uuid"
    }
  ],
  "warnings": [...],
  "informational": [...],
  "attachment_status": [
    {
      "requirement_id": "uuid",
      "document_type": "irs_determination_letter",
      "is_required": true,
      "is_fulfilled": true,
      "document_name": "IRS_Letter_2024.pdf"
    }
  ]
}
```

---

## Application Sections

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/sections` | List all sections with status (F30) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections/{section_id}` | Get section details and fields (F30) | Applicant team |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/assignment` | Assign owner and due date (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/fields/{field_id}` | Save field response | Applicant team (scoped by role) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/validate` | Validate section (F48) | Applicant team |
| POST | `/workspaces/{workspace_id}/sections/evaluate` | Re-evaluate section visibility (F10) | Applicant team |

**PUT /workspaces/{workspace_id}/sections/{section_id}/assignment — Request Body:**
```json
{
  "owner_id": "uuid",
  "internal_due_date": "2026-08-15"
}
```

**PUT section field response — Request Body:**
```json
{
  "response_value": "Our organization serves 2,500 patients annually...",
  "response_json": null
}
```

---

## Workspace Tasks

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/tasks` | List tasks (F31) | Applicant team |
| POST | `/workspaces/{workspace_id}/tasks` | Create task (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/tasks/{task_id}` | Update task | Assignee, Proposal Lead |
| DELETE | `/workspaces/{workspace_id}/tasks/{task_id}` | Delete task | Proposal Lead, Org Admin |

---

## Workspace Comments (Internal Only)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/comments` | List internal comments (F32) | Applicant team ONLY |
| POST | `/workspaces/{workspace_id}/comments` | Post comment (F32) | Applicant team ONLY |

*Note: These endpoints MUST NOT be accessible to grantor roles under any circumstances.*

---

## Budget

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/budget` | Get budget with line items (F38) | Applicant team, Grantor (after submission) |
| PUT | `/workspaces/{workspace_id}/budget` | Update budget metadata | Finance Contributor, Proposal Lead, Org Admin |
| POST | `/workspaces/{workspace_id}/budget/line-items` | Add line item (F38) | Finance Contributor, Proposal Lead |
| PUT | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Update line item | Finance Contributor |
| DELETE | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Delete line item | Finance Contributor |
| POST | `/workspaces/{workspace_id}/budget/validate` | Validate budget (F39) | Applicant team |

**POST /workspaces/{workspace_id}/budget/line-items — Request Body:**
```json
{
  "budget_period": 1,
  "category": "personnel",
  "description": "Project Director",
  "personnel_name": "Jane Smith",
  "fte": 0.5,
  "annual_salary": 90000,
  "fringe_rate": 28.5
}
```
**Response:** `201 Created` with `line_id` and computed `total_cost`.

**POST /workspaces/{workspace_id}/budget/validate — Response:**
```json
{
  "is_valid": false,
  "total_federal_request": 485000,
  "total_match": 95000,
  "funding_ceiling": 500000,
  "match_required": true,
  "match_required_amount": 97000,
  "errors": [
    {
      "error_code": "MATCH_REQUIREMENT_NOT_MET",
      "message": "Cost-share of $95,000 does not meet the required match of $97,000.",
      "severity": "blocking"
    }
  ]
}
```

---

## Attachments

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/attachments` | List all attachments (F40) | Applicant team, Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/attachments` | Upload or reference library doc (F40) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}` | Get attachment metadata | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/download` | Download attachment file | Applicant team, Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/attachments/{attachment_id}/replace` | Upload replacement version (F41) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/versions` | Version history (F41) | Applicant team |

**POST /workspaces/{workspace_id}/sections/{section_id}/attachments — Upload:**
```
Content-Type: multipart/form-data
requirement_id: uuid
source_type: upload
file: [binary file content]
```

**POST /workspaces/{workspace_id}/sections/{section_id}/attachments — Library Reference:**
```json
{
  "requirement_id": "uuid",
  "source_type": "library",
  "org_document_id": "uuid"
}
```

---

## Workspace Validation

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces/{workspace_id}/validate` | Full workspace validation (F48, F49, F50) | Applicant team |

**POST /workspaces/{workspace_id}/validate — Response:**
```json
{
  "workspace_id": "uuid",
  "is_ready_to_submit": false,
  "blocking_errors": [...],
  "warnings": [...],
  "informational": [...]
}
```

---

## Submission Preview

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces/{workspace_id}/preview` | Generate submission package preview (F42) | Applicant team |

**POST /workspaces/{workspace_id}/preview — Request Body:**
```json
{"format": "html"}
```
**Response:** `200 OK` with HTML body of the preview (labeled "PREVIEW — NOT SUBMITTED"). PDF format also supported via `"format": "pdf"`.

---

## Access Control Notes

- All `/workspaces/{workspace_id}/*` endpoints return `403 DRAFT_ACCESS_DENIED` for grantor roles when `workspace_status != submitted`
- Finance Contributors are restricted to `/budget/*` endpoints only
- External Contributors are restricted to their assigned section endpoints only
- Internal comments endpoints (`/comments`) always return `403` for grantor roles regardless of workspace status
---

# Y1d: REST API — Submission, Intake Queue, Dispositions, Q&A, Addenda, Analytics, Export

*Base URL: `/api/v1` | Auth: JWT Bearer token required | Format: JSON*

---

## Submission Workflow

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces/{workspace_id}/certify` | Authorized representative certification (F51) — triggers submit | Authorized Representative |
| POST | `/workspaces/{workspace_id}/submit` | Submit application (F50, F52) | Authorized Representative |
| GET | `/workspaces/{workspace_id}/receipt` | Download submission receipt (F52) | Applicant team |
| POST | `/workspaces/{workspace_id}/unlock` | Grantor-initiated workspace unlock (F54, F58) | Grantor Admin, Intake Administrator |

**POST /workspaces/{workspace_id}/certify — Request Body:**
```json
{
  "certifying_user_id": "uuid",
  "certification_acknowledged": true
}
```
**Response on success:**
```json
{
  "cert_id": "uuid",
  "certification_timestamp": "2026-07-24T18:30:00Z",
  "message": "Certification recorded. Your application is now being submitted."
}
```
*On success, submit flow triggers automatically; response transitions to submission confirmation.*

**POST /workspaces/{workspace_id}/submit — Response (success):**
```json
{
  "snapshot_id": "uuid",
  "confirmation_number": "GI-2026-00001234",
  "submitted_at": "2026-07-24T18:30:12Z",
  "opportunity_title": "Community Health Initiative 2026",
  "applicant_org_name": "Community Health Alliance",
  "receipt_download_url": "/api/v1/workspaces/{workspace_id}/receipt"
}
```

**POST /workspaces/{workspace_id}/submit — Response (blocked):**
```json
{
  "error_code": "SUBMISSION_BLOCKED",
  "message": "Application cannot be submitted. 3 required item(s) must be completed.",
  "blocking_errors": [
    {
      "section_id": "uuid",
      "field_label": "Budget Justification — Personnel",
      "error_code": "BUDGET_JUSTIFICATION_MISSING",
      "severity": "blocking"
    }
  ]
}
```

---

## Submission Packages

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/submissions/{snapshot_id}` | Get submission snapshot metadata | Applicant team / Grantor |
| GET | `/submissions/{snapshot_id}/package/human-readable` | Download human-readable package PDF (F53) | Applicant team / Grantor |
| GET | `/submissions/{snapshot_id}/package/machine-readable` | Download JSON package (F53) | Grantor roles |
| GET | `/workspaces/{workspace_id}/snapshots` | List all snapshots including correction versions (F59) | Applicant team / Grantor |

---

## Intake Queue

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/intake-queue` | List intake queue entries with filters (F55, F56) | Grantor roles |
| GET | `/intake-queue/{entry_id}` | Get application detail from submission snapshot (F56) | Grantor roles |
| POST | `/intake-queue/{entry_id}/disposition` | Apply administrative screening disposition (F57) | Intake Administrator, Grantor Admin |
| POST | `/intake-queue/{entry_id}/correction-request` | Request correction/clarification (F58) | Intake Administrator, Grantor Admin |
| GET | `/intake-queue/{entry_id}/snapshots` | List all submission snapshots for application (F59) | Grantor roles |

**GET /intake-queue — Query Parameters:**
```
opportunity_id, disposition_status, applicant_type, submitted_from, submitted_to, page, page_size, sort_by
```

**GET /intake-queue — Response:**
```json
{
  "entries": [
    {
      "entry_id": "uuid",
      "workspace_id": "uuid",
      "org_name": "Community Health Alliance",
      "entity_type": "nonprofit_501c3",
      "opportunity_title": "Community Health Initiative 2026",
      "submitted_at": "2026-07-24T18:30:12Z",
      "confirmation_number": "GI-2026-00001234",
      "requested_amount": 450000,
      "eligibility_result": "eligible",
      "attachment_completeness": "complete",
      "disposition_status": "pending_screening"
    }
  ],
  "total_count": 47,
  "page": 1,
  "page_size": 20
}
```

**POST /intake-queue/{entry_id}/disposition — Request Body:**
```json
{
  "screening_criteria_results": [
    {"criterion_id": "uuid", "result": "pass"},
    {"criterion_id": "uuid", "result": "pass"},
    {"criterion_id": "uuid", "result": "fail"}
  ],
  "disposition": "returned_for_correction",
  "disposition_rationale": "Budget justification for personnel category is insufficient."
}
```
**Response:** `200 OK` with disposition record and triggered notification confirmation.

**POST /intake-queue/{entry_id}/correction-request — Request Body:**
```json
{
  "correction_sections": ["uuid-budget-section", "uuid-attachments-section"],
  "correction_instructions": "Please revise the personnel budget justification and upload the updated audit report.",
  "correction_deadline": "2026-08-07T23:59:00Z"
}
```

---

## Q&A

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/qa` | List published Q&A (public view) (F44, F46) | Public |
| GET | `/opportunities/{opportunity_id}/questions` | List all questions including unanswered (grantor view) (F44) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/questions` | Submit a question (applicant) (F43) | Applicant roles |
| PUT | `/questions/{question_id}/answer` | Publish an answer (F44) | Designated Q&A responders |
| GET | `/opportunities/{opportunity_id}/audit-history` | Full audit history for opportunity (F46) | Grantor roles |

**POST /opportunities/{opportunity_id}/questions — Request Body:**
```json
{
  "question_text": "Can organizations that currently hold a federal award apply?",
  "submitter_org_id": "uuid"
}
```

**PUT /questions/{question_id}/answer — Request Body:**
```json
{
  "answer_text": "Yes, organizations with active federal awards may apply provided they demonstrate adequate capacity to manage additional funding."
}
```

---

## Notifications

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/notifications` | List notifications for authenticated user (F47) | Authenticated |
| PUT | `/notifications/{notification_id}/read` | Mark notification as read | Authenticated |

---

## Analytics — Grantor Dashboards

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/analytics/grantor/dashboard` | Grantor intake dashboard summary metrics (F61) | Grantor roles |
| GET | `/analytics/grantor/opportunities` | Opportunity-level breakdown (F61) | Grantor roles |

**GET /analytics/grantor/dashboard — Query Parameters:** `program_id, opportunity_id, date_range_from, date_range_to`

**Response:**
```json
{
  "published_opportunities": 12,
  "active_opportunities": 5,
  "applications_started": 78,
  "applications_submitted": 45,
  "incomplete_applications": 18,
  "late_submissions": 3,
  "disposition_summary": {
    "pending_screening": 20,
    "accepted_for_review": 15,
    "returned_for_correction": 5,
    "ineligible": 2,
    "administratively_rejected": 1,
    "withdrawn": 2
  }
}
```

---

## Analytics — Applicant Dashboard

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/analytics/applicant/dashboard` | Applicant dashboard summary (F62) | Applicant roles |
| GET | `/analytics/applicant/applications` | Detailed application list (F62) | Applicant roles |

**GET /analytics/applicant/dashboard — Response:**
```json
{
  "active_applications": [
    {
      "workspace_id": "uuid",
      "opportunity_title": "Community Health Initiative 2026",
      "status": "in_progress",
      "completion_pct": 0.72,
      "deadline": "2026-09-01T23:59:00Z",
      "days_remaining": 38,
      "blocking_errors_count": 2
    }
  ],
  "submission_history": [
    {
      "snapshot_id": "uuid",
      "confirmation_number": "GI-2025-00000891",
      "opportunity_title": "Rural Health Access 2025",
      "submitted_at": "2025-10-14T16:00:00Z",
      "disposition_status": "accepted_for_review",
      "receipt_url": "/api/v1/workspaces/{workspace_id}/receipt"
    }
  ]
}
```

---

## Export

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/analytics/export` | Create export job (F63) | Grantor Admin, Program Officer, Intake Administrator, Compliance Analyst |
| GET | `/analytics/export/{job_id}/status` | Get export job status (F63) | Export requester |
| GET | `/analytics/export/{job_id}/download` | Download completed export (F63) | Export requester |

**POST /analytics/export — Request Body:**
```json
{
  "opportunity_id": "uuid",
  "date_from": "2026-07-01",
  "date_to": "2026-09-30",
  "disposition_filter": ["accepted_for_review", "returned_for_correction"],
  "include_eligibility": true,
  "include_budget": true,
  "include_audit_events": false,
  "format": "csv"
}
```
**Response:** `202 Accepted` with `job_id` and `status: "queued"`. Download link provided via email when complete.
---

# Y2: Cross-Feature Error Catalog

*All API errors return a JSON body with `error_code`, `message`, `timestamp`, and optionally `field` and `errors[]`.*

---

## Authentication and Authorization Errors

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 401 | AUTHENTICATION_REQUIRED | "Authentication is required to access this resource." | Any authenticated endpoint when no valid token provided |
| 401 | TOKEN_EXPIRED | "Your session has expired. Please sign in again." | JWT access token has expired |
| 403 | PERMISSION_DENIED | "You do not have permission to perform this action." | Authenticated but insufficient role |
| 403 | DRAFT_ACCESS_DENIED | "Application is in draft status and cannot be viewed at this time." | Grantor access to draft workspace |
| 403 | WORKSPACE_LOCKED | "This application has been submitted and is locked for editing." | Edit on submitted/locked workspace |
| 403 | NOT_AUTHORIZED_REPRESENTATIVE | "You must have the Authorized Representative role to certify this application." | Non-AR attempting certification |
| 403 | UNAUTHORIZED_SUBMITTER | "Only users with the Authorized Representative role can submit this application." | Non-AR submission attempt |

---

## Opportunity Errors (Stages 1–3)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 404 | OPPORTUNITY_NOT_FOUND | "This opportunity does not exist or is no longer available." | Any opportunity lookup by ID |
| 404 | TEMPLATE_NOT_FOUND | "The selected template could not be found." | F0: template selection |
| 404 | VERSION_NOT_FOUND | "The requested opportunity version does not exist." | F6: version lookup |
| 409 | ALREADY_PUBLISHED | "This opportunity is already published. Use addendum to make changes." | F5: re-publish attempt |
| 409 | DUPLICATE_OPPORTUNITY_NUMBER | "This opportunity number already exists within this program." | F1: metadata validation |
| 422 | PUBLICATION_BLOCKED | "Opportunity cannot be published. {count} item(s) require attention." | F5: publish blocked |
| 422 | REQUIRED_FIELD_MISSING | "Field '{field_name}' is required before publication." | F1, F5: metadata |
| 422 | INVALID_FUNDING_RANGE | "Minimum award amount cannot exceed maximum award amount." | F1: funding range |
| 422 | INVALID_ASSISTANCE_LISTING | "Assistance Listing Number must be in format XX.XXX (e.g., 93.778)." | F1: federal metadata |
| 422 | INVALID_DATE_SEQUENCE | "Application close date must be after the open date." | F4: deadline config |
| 422 | INVALID_PREAPP_DEADLINE | "Pre-application deadline must be before the application open date." | F4: deadline config |
| 422 | DEADLINE_IN_PAST | "Application close date cannot be in the past at time of publication." | F4, F5: publish |
| 422 | LOI_DEADLINE_REQUIRED | "LOI deadline must be provided when LOI is required." | F4: LOI config |
| 422 | MODIFICATION_REASON_REQUIRED | "A modification reason is required for changes to a published opportunity." | F6: versioning |
| 422 | REQUIRED_FIELD_REMOVAL | "Required field '{field_name}' cannot be removed from a published opportunity." | F6: modification |
| 422 | ADDENDUM_INCOMPLETE | "Addendum must include title, description, type, and effective date." | F17: addenda |
| 403 | ADDENDUM_IMMUTABLE | "Published addenda cannot be edited. Publish a new addendum for corrections." | F17: addenda |
| 503 | TEMPLATE_LIBRARY_UNAVAILABLE | "Opportunity templates are temporarily unavailable." | F0: template load |
| 503 | SEARCH_UNAVAILABLE | "Search is temporarily unavailable. Please try again." | F14: search |

---

## Eligibility Errors (Stage 2, 5)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 403 | ELIGIBILITY_HARD_BLOCK | "You are not eligible for this opportunity. {explanation_text}" | F8: workspace creation blocked |
| 422 | ELIGIBILITY_SUBMISSION_BLOCK | "This application cannot be submitted due to eligibility requirements. {explanation_text}" | F8: pre-submission blocker |
| 422 | INVALID_RULE_OPERATOR | "Operator '{operator}' is not valid for field type '{criterion_field}'." | F7: rule config |
| 422 | EXPLANATION_REQUIRED | "Plain-language explanation text is required for each eligibility rule." | F7: rule config |
| 422 | ENFORCEMENT_POINT_REQUIRED | "Hard blocker rules must have an enforcement point configured." | F8 |
| 422 | REQUIRED_QUESTION_UNANSWERED | "Please answer all required questions before continuing." | F24: pre-screen |
| 404 | QUESTIONNAIRE_NOT_FOUND | "Eligibility questionnaire is not configured for this opportunity." | F24 |
| 500 | RESULT_COMPUTATION_FAILED | "Eligibility result could not be computed. Please try again." | F25 |
| 500 | RESPONSE_STORAGE_FAILED | "Eligibility responses could not be saved. Please try again." | F28 |

---

## Organization Profile Errors (Stage 4)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 409 | PROFILE_EXISTS | "An organization profile already exists for this organization." | F18: duplicate profile |
| 422 | INVALID_EIN | "EIN must be 9 digits (XX-XXXXXXX)." | F19: profile data |
| 422 | INVALID_UEI | "UEI must be exactly 12 alphanumeric characters." | F19: profile data |
| 422 | INVALID_STATE | "State code '{state}' is not a valid US state code." | F19: profile data |
| 422 | SAM_EXPIRED_ON_ENTRY | "SAM expiration date cannot be in the past." | F19: profile data |
| 422 | SAM_EXPIRED | "SAM registration is expired. Update your organization profile before submitting." | F21: submission block |
| 422 | DOCUMENT_EXPIRED | "Required document '{document_type}' is expired. Upload a current version." | F21: submission block |
| 403 | LAST_ADMIN | "Cannot remove the last organization administrator. Assign another admin first." | F22: role management |

---

## Application Workspace and Form Errors (Stages 6–7)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 409 | WORKSPACE_EXISTS | "Your organization already has an application for this opportunity." | F29: duplicate workspace |
| 403 | INTAKE_WINDOW_CLOSED | "The application window is not currently open." | F29, F24 |
| 403 | PRESCREENING_REQUIRED | "Please complete the eligibility pre-screen before starting an application." | F29 |
| 404 | SECTION_NOT_FOUND | "Application section not found." | F30 |
| 403 | SECTION_LOCKED | "This section is locked. The application has been submitted." | F30, F54 |
| 422 | CHAR_LIMIT_EXCEEDED | "This field has a limit of {max_chars} characters." | F37: form constraints |
| 422 | REQUIRED_FIELD_EMPTY | "This field is required." | F37: field validation |
| 422 | NEGATIVE_AMOUNT | "Budget amounts must be zero or greater." | F38: budget |
| 422 | INVALID_FTE | "FTE must be between 0.01 and 1.0." | F38: budget |
| 422 | INVALID_FRINGE_RATE | "Fringe benefit rate must be between 0% and 100%." | F38: budget |
| 422 | FUNDING_CEILING_EXCEEDED | "Total funding request ({amount}) exceeds the maximum award of {ceiling}." | F39: budget validation |
| 422 | MATCH_REQUIREMENT_NOT_MET | "Cost-share of {actual} does not meet the required match of {required}." | F39: budget validation |
| 422 | BUDGET_JUSTIFICATION_MISSING | "Budget justification is required for category '{category}'." | F39: budget validation |
| 413 | FILE_TOO_LARGE | "File size exceeds the {max_file_size_mb}MB limit for this attachment." | F11, F20, F41 |
| 415 | INVALID_FILE_FORMAT | "File format '{format}' is not accepted. Accepted: {formats}." | F11, F20 |
| 422 | REQUIRED_ATTACHMENT_MISSING | "Required attachment '{document_type}' has not been uploaded." | F11, F40 |

---

## Submission Errors (Stage 9)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 422 | SUBMISSION_BLOCKED | "Application cannot be submitted. {count} required item(s) must be completed." | F50: submission blocking |
| 409 | ALREADY_SUBMITTED | "This application has already been submitted. Confirmation: {confirmation_number}." | F52: duplicate submit |
| 500 | SNAPSHOT_GENERATION_FAILED | "Submission could not be completed. Your application data is preserved. Please try again." | F52: snapshot |
| 500 | PACKAGE_GENERATION_FAILED | "Submission package could not be generated. The submission was recorded." | F53: packages |
| 422 | UNLOCK_REASON_REQUIRED | "A reason for reopening the application is required." | F54: unlock |

---

## Intake Queue and Screening Errors (Stage 10)

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 422 | CRITERION_NOT_EVALUATED | "Required criterion '{criterion_text}' must be evaluated before applying a disposition." | F57 |
| 422 | RATIONALE_REQUIRED | "A rationale is required for this disposition." | F57 |
| 422 | INVALID_DISPOSITION | "Disposition '{value}' is not a valid disposition state." | F57 |
| 422 | CORRECTION_DEADLINE_IN_PAST | "Correction deadline must be in the future." | F58 |
| 422 | CORRECTIONS_NOT_ALLOWED | "This opportunity does not allow correction requests." | F58 |
| 500 | ROUTING_FAILED | "Application was submitted but could not be routed. Manual assignment may be required." | F55 |
| 500 | REVIEW_ROUTING_NOT_CONFIGURED | "Review routing is not configured for this opportunity." | F60 |

---

## System Errors

| HTTP Status | Error Code | Message | Context |
|---|---|---|---|
| 500 | INTERNAL_SERVER_ERROR | "An unexpected error occurred. Please try again or contact support." | Generic catch-all |
| 500 | AUDIT_WRITE_FAILED | "Audit record could not be created. The action may not have completed." | F46: audit trail |
| 500 | VALIDATION_SERVICE_ERROR | "Validation could not be completed. Please try again." | F48: validation |
| 500 | EXPORT_FAILED | "Export could not be generated. Please try again or contact support." | F63: export |
| 503 | DASHBOARD_UNAVAILABLE | "Dashboard is temporarily unavailable. Please try again." | F61, F62 |
| 503 | GUIDANCE_UNAVAILABLE | "Plain-language guidance is temporarily unavailable." | F2 |
| 404 | RESOURCE_NOT_FOUND | "The requested resource does not exist." | Generic 404 |
| 429 | RATE_LIMIT_EXCEEDED | "Too many requests. Please wait before trying again." | All endpoints |
---

# Y3: External Integration Points

*MVP integrations are minimal by design. Phase 2 and Phase 3 integrations are noted but out of scope for MVP.*

---

## MVP Integration Points

### INT-01: Email Notification Delivery

**Purpose:** Deliver transactional email notifications for all intake lifecycle events (see Notification Model in `00-header.md`).

**Integration Type:** Outbound webhook / SMTP / email service provider API

**Trigger Events:**
- Workspace created
- Submission received
- Returned for correction
- Accepted for review
- Addendum published
- Q&A answer published
- Deadline approaching
- Export ready for download

**Requirements:**
- MUST: All outbound emails MUST include: platform name, opportunity title, applicant org name, action required (if any), direct deep link to the relevant workspace or opportunity page
- MUST: Email delivery status MUST be tracked in `notification_records.delivery_status`
- MUST: Bounced emails MUST be retried up to 3 times with exponential backoff before marking `delivery_status = bounced`
- SHOULD: HTML and plain-text versions of every email MUST be provided
- SHOULD: Email templates MUST use USWDS-aligned styling and plain language

**MVP Scope:** System-generated transactional emails only. Marketing/campaign emails are out of scope.

---

### INT-02: File / Document Storage

**Purpose:** Persistent binary storage for all uploaded attachments (application documents, org library documents, submission packages, export files).

**Integration Type:** Object storage (S3-compatible API)

**Requirements:**
- MUST: All uploaded files MUST be stored in object storage; file binaries MUST NOT be stored in the relational database
- MUST: Storage paths MUST be referenced in the relational database (`file_path` columns) but files MUST NOT be served directly via database queries
- MUST: Files MUST be served via pre-signed URLs with short expiration windows (15 minutes) — never via permanent public URLs
- MUST: File uploads MUST be scanned for malware before being made accessible for download
- MUST: Files MUST be encrypted at rest using AES-256
- MUST: Submission snapshot attachments (referenced in `submission_snapshots.attachment_refs`) MUST be stored immutably — deletion of these objects MUST be blocked by storage policy
- SHOULD: Object storage MUST support versioning at the storage layer for additional protection

**MVP Scope:** Single storage backend. Multi-region replication deferred to Phase 2.

---

### INT-03: UEI / SAM.gov Entry (Manual — MVP)

**Purpose:** Allow applicants to enter their Unique Entity Identifier (UEI) and SAM.gov registration status manually in their organization profile.

**Integration Type:** Manual data entry in MVP — no live API integration

**MVP Behavior:**
- Applicant enters UEI (12-character) and SAM expiration date manually in the org profile (F19)
- System validates format only (12 alphanumeric characters) — no live validation against SAM.gov
- System tracks SAM expiration date for credential warning purposes (F21)
- Grantor intake administrators may manually verify SAM status during administrative screening (F57)

**Phase 2 Scope (deferred):** SAM.gov API integration for automated UEI lookup, real-time registration status validation, and auto-populated entity data.

---

## Phase 2 Integrations (Deferred — Not in MVP)

### INT-04 (Phase 2): SAM.gov API Integration

**Purpose:** Automate UEI/SAM registration status lookup and validation.

**Status:** Deferred. See open question OQ-002 in reference PRD.

---

### INT-05 (Phase 2): External Opportunity Feed Ingestion

**Purpose:** Import opportunity listings from external sources (e.g., state portals, foundation databases).

**Status:** Deferred.

---

## Phase 3 Integrations (Deferred)

### INT-06 (Phase 3): Grants.gov System-to-System Connector

**Purpose:** Enable GrantsIntake to submit applications directly to Grants.gov on behalf of applicants, replacing manual dual-portal entry.

**Status:** Explicitly deferred to Phase 3. See MVP Non-Goals in reference PRD §10.2.

---

### INT-07 (Phase 3): Common Data Standard Exports

**Purpose:** Export intake data in standardized interoperability formats (e.g., FAADS+, Uniform Grants Reporting).

**Status:** Deferred to Phase 3.

---

### INT-08 (Phase 8): Grants.gov Opportunity Search and Detail APIs

**Purpose:** Automatically ingest active funding opportunities from Grants.gov, normalize metadata, and provide applicants with a browseable, trackable, importable external opportunity catalog.

**Status:** Planned — Phase 8 (PRD-INTAKE-019A through 019E)

**API Endpoints Used:**
- `POST https://api.grants.gov/v1/api/search2/opportunities/search` — paginated search with filters (oppStatuses, rows, startRecordNum)
- `GET https://api.grants.gov/v1/api/opportunities/{opportunityId}` — full opportunity detail

**Authentication:** No API key required for public search and detail endpoints. Requests sent as anonymous GET/POST with `Content-Type: application/json`.

**Data Normalization Contract (PRD-INTAKE-019B):**

| Grants.gov API Field | Internal Field | Notes |
|---|---|---|
| `opportunityTitle` | `title` | Required |
| `agencyName` | `agency` | Required |
| `opportunityNumber` | `source_opportunity_number` | Unique key for upsert |
| `cfdaNumbers[0]` | `source_assistance_listing` | Assistance Listing (CFDA) |
| `opportunityStatus` | `opportunity_status` | posted / forecasted / closed / archived |
| `closeDate` | `due_date` | Normalized to DATE |
| `awardCeiling` | `award_ceiling` | Numeric, nullable |
| `awardFloor` | `award_floor` | Numeric, nullable |
| eligibility fields (joined) | `eligibility_summary` | Text summary |
| `packages[0].packageURL` | `application_package_url` | May be null |
| `https://www.grants.gov/search-results-detail/{id}` | `source_url` | Computed canonical URL |
| Full raw response | `api_reference` | JSONB — preserved for audit (PRD-INTAKE-019E) |

**Source Attribution (PRD-INTAKE-019E):**
Every record stores: `source = 'grants.gov'`, `source_url`, `source_opportunity_number`, `import_timestamp` (set once, never updated), and `api_reference` (full raw API response snapshot).

**Version History (PRD-INTAKE-019E):**
On each fetch: compare incoming normalized record to stored record. If any watched field differs (title, agency, opportunity_status, due_date, award_ceiling, award_floor, eligibility_summary, application_package_url), insert a new `external_opportunity_versions` row with `changed_fields` diff array and full `snapshot`. Version 1 always created on first import with empty `changed_fields`.

**Change Alerts (PRD-INTAKE-019D):**
When re-fetch detects changes, insert `change_alerts` rows for all users who saved the opportunity. Alert types: `due_date_change`, `status_change`, `package_change`, `addenda_change`, `instructions_change`.

**Scheduler:** `node-cron` running `0 */6 * * *` (configurable via `GRANTS_GOV_REFRESH_CRON` env var). Fetches up to 5 pages × 25 results. Graceful per-opportunity error handling — batch continues on single failure.

**Error Handling:**

| Failure Mode | Fallback |
|---|---|
| Grants.gov API timeout (>10s) | Log warning, skip batch, retry on next scheduled run |
| Single opportunity detail fetch failure | Log error, skip that opportunity, continue batch |
| API returns 429 (rate limit) | Exponential backoff (1s, 2s, 4s), then skip with log |
| API returns malformed JSON | Log error with raw body snippet, skip record |
| Duplicate opportunity number on INSERT | ON CONFLICT DO UPDATE (upsert) — safe by design |

---

## Non-Integration Boundaries (Out of Scope for Intake Module)

The following integration points are explicitly excluded from the intake module scope:

| System | Reason for Exclusion |
|---|---|
| Merit review / scoring platform | Post-intake; separate module. Intake boundary ends at `review_handoffs` table |
| Payment / financial systems (ERP) | Award and disbursement are post-intake |
| SAM.gov payment registration | Post-award banking setup |
| Grants.gov System-to-System (S2S) applicant workspace | Phase 3 connector only — Phase 8 uses REST search/detail only |
| Analytics / BI platforms | Intake export provides data; BI platform integration is consumer's responsibility |
| Identity provider / SSO configuration | Platform-level concern; not intake module |

---

## Integration Data Flow Summary

```
External Email Provider  ←── notification_records ←── Intake Events
Object Storage           ←── attachments, org_attachments, submission_snapshots
SAM.gov (MVP: manual)    ←── organizations.uei, organizations.sam_expiration_date [manual entry]
Review Module            ←── review_handoffs [intake boundary end]
Grants.gov REST API ────►── external_opportunities ──►── saved_external_opportunities
                                                    ──►── external_opportunity_versions
                                                    ──►── change_alerts ──►── applicant notifications
```
