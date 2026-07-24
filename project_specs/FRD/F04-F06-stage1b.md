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
