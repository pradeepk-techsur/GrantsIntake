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
