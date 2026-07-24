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
