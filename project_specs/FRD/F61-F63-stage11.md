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
