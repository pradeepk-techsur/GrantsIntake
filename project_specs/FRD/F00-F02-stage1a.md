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
