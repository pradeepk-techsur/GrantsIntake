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
