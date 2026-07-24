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
