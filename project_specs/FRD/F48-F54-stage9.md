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

**Description:** Before submission, the system requires a final certification action by an authenticated user with the Authorized Representative role. This certification is a formal, legally meaningful step with configurable certification language. The certification action is logged as an immutable audit event.

**Sub-features:**
- Require certification action as the final step before submission
- Only users with Authorized Representative role can certify
- Display configurable certification text (legal language) for review
- Require explicit acknowledgment (checkbox or click-through) — not a handwritten signature in MVP
- Log certification as an immutable audit event
- Certification linked to specific workspace and submission attempt

**Process:**
1. All blocking errors are resolved; `is_ready_to_submit = true` (F50)
2. Authorized Representative navigates to the Certification step in the Review / Submit section
3. System displays the certification text (configured by grantor or system default)
4. Authorized Representative reads the certification text
5. AR clicks "I Certify" checkbox or button
6. System verifies that the authenticated user has the `authorized_representative` role for this org
7. If verified: certification record created; submission proceeds to F52
8. Audit event created: `CERTIFICATION_COMPLETED` with user, timestamp, certification text hash

**Inputs:**
- `workspace_id` (UUID, required)
- `certifying_user_id` (UUID, required): Must have `authorized_representative` role
- `certification_text` (string): The text the user certified to (stored in audit record)
- `certification_timestamp` (UTC datetime, system)

**Outputs:**
- Certification record stored with `workspace_id`, `certifying_user_id`, `certification_text`, `certification_timestamp`
- Audit event: `CERTIFICATION_COMPLETED`
- Submission proceeds to snapshot generation (F52)

**Validation:**
- MUST: Certifying user MUST have the `authorized_representative` role for the applicant organization
- MUST: Certification MUST require explicit acknowledgment action — auto-certification is not permitted
- MUST: Certification text MUST be displayed in full before acknowledgment
- MUST: Certification action MUST be logged as an immutable audit event
- MUST: Certification is role-and-user-specific — certification by User A does not allow User B to submit

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Certifier lacks AR role | 403 | NOT_AUTHORIZED_REPRESENTATIVE | "You must have the Authorized Representative role to certify this application." |
| Certification text missing | 500 | CERTIFICATION_TEXT_UNAVAILABLE | "Certification text is unavailable. Please contact support." |

**API Surface (this feature):** `POST /api/v1/workspaces/{workspace_id}/certify` (certification action, triggers F52 on success) — see `Y1d-api-submission.md` §Certification.

**Schema Surface (this feature):** `certifications` table (cert_id, workspace_id FK, certifying_user_id FK, certification_text, certification_timestamp UTC, created_at) — see `Y0d-schema-submission.md` §certifications.

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
