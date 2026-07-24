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

**Description:** When permitted by opportunity rules, grantors can formally request that an applicant correct or clarify specific aspects of their submitted application. The request is tied to the original submission record, triggers applicant notification, and creates a correction window with a configurable deadline.

**Sub-features:**
- Grantor initiates correction/clarification request from intake queue
- Request specifies which sections or attachments require correction
- System generates correction request notification to applicant team
- Configurable correction window deadline
- Workspace unlocked for specified sections only (F54)
- Original submission snapshot preserved (F59)

**Process:**
1. Administrator opens application in intake queue
2. Administrator applies `returned_for_correction` disposition (F57)
3. Administrator specifies: which sections/attachments require correction, correction instructions text, correction deadline
4. System records correction request
5. Workspace unlocked for specified sections only (other sections remain locked)
6. Status updated to `Returned for Correction`
7. Applicant notification sent: "Returned for Correction — {instructions}" with correction deadline
8. Applicant makes corrections in unlocked sections; resubmits (F52 flow with new snapshot)

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

**Validation:**
- MUST: `correction_instructions` MUST be provided
- MUST: `correction_deadline` MUST be in the future at time of request
- MUST: Only the specified sections MUST be unlocked; all other sections remain locked
- MUST: Original submission snapshot MUST be preserved (F59)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Correction deadline in past | 422 | DEADLINE_IN_PAST | "Correction deadline must be in the future." |
| No sections specified | 422 | SECTIONS_REQUIRED | "At least one section must be specified for correction." |
| Opportunity doesn't allow corrections | 403 | CORRECTIONS_NOT_ALLOWED | "This opportunity does not allow correction requests." |

**API Surface (this feature):** `POST /api/v1/intake-queue/{entry_id}/correction-request` — see `Y1d-api-submission.md` §Correction Requests.

**Schema Surface (this feature):** `correction_requests` table (request_id, entry_id FK, snapshot_id FK, correction_sections JSONB, correction_instructions, correction_deadline, requested_by FK, requested_at) — see `Y0d-schema-submission.md` §correction_requests.

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
