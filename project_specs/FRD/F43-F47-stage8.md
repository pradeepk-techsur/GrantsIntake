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
