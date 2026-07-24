---

# Y1c: REST API — Workspaces, Sections, Budget, Attachments, Validation, Pre-Screening

*Base URL: `/api/v1` | Auth: JWT Bearer token required | Format: JSON*

---

## Pre-Screening (Applicant)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire for applicant (F24) | Applicant roles (authenticated) |
| POST | `/opportunities/{opportunity_id}/prescreening/submit` | Submit responses and get result (F24, F25, F26, F28) | Applicant roles |
| GET | `/workspaces/{workspace_id}/eligibility-responses` | Get stored eligibility responses (F28) | Applicant roles / Grantor (after submission) |

**POST /opportunities/{opportunity_id}/prescreening/submit — Request Body:**
```json
{
  "org_id": "uuid",
  "questionnaire_responses": [
    {"question_id": "uuid", "selected_option_id": "uuid"},
    {"question_id": "uuid", "selected_option_id": "uuid"},
    {"question_id": "uuid", "response_text": "Additional context"}
  ]
}
```

**Response:**
```json
{
  "overall_result": "likely_eligible",
  "triggered_rules": [
    {
      "rule_id": "uuid",
      "severity": "advisory",
      "explanation_text": "Your organization's match capacity should be reviewed.",
      "opportunity_section_link": "/opportunities/abc/eligibility#match-requirement"
    }
  ],
  "next_step": "Review advisory notes and start your application.",
  "workspace_access_granted": true
}
```

---

## Application Workspaces

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces` | Create application workspace (F29) | Applicant roles |
| GET | `/workspaces/{workspace_id}` | Get workspace details and status | Applicant team / Grantor (after submission) |
| GET | `/workspaces/{workspace_id}/readiness` | Get submission readiness summary (F34) | Applicant team |

**POST /workspaces — Request Body:**
```json
{
  "opportunity_id": "uuid",
  "org_id": "uuid"
}
```
**Response:** `201 Created` with `workspace_id`, `status: "workspace_created"`.

**GET /workspaces/{workspace_id}/readiness — Response:**
```json
{
  "workspace_id": "uuid",
  "overall_completion_pct": 0.72,
  "is_ready_to_submit": false,
  "authorized_rep_assigned": true,
  "blocking_errors": [
    {
      "section_id": "uuid",
      "section_name": "Budget",
      "field_id": "uuid",
      "field_label": "Budget Justification — Personnel",
      "error_code": "BUDGET_JUSTIFICATION_MISSING",
      "message": "Budget justification is required for category 'Personnel'.",
      "severity": "blocking",
      "link": "/workspaces/{workspace_id}/sections/{section_id}#field-uuid"
    }
  ],
  "warnings": [...],
  "informational": [...],
  "attachment_status": [
    {
      "requirement_id": "uuid",
      "document_type": "irs_determination_letter",
      "is_required": true,
      "is_fulfilled": true,
      "document_name": "IRS_Letter_2024.pdf"
    }
  ]
}
```

---

## Application Sections

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/sections` | List all sections with status (F30) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections/{section_id}` | Get section details and fields (F30) | Applicant team |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/assignment` | Assign owner and due date (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/fields/{field_id}` | Save field response | Applicant team (scoped by role) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/validate` | Validate section (F48) | Applicant team |
| POST | `/workspaces/{workspace_id}/sections/evaluate` | Re-evaluate section visibility (F10) | Applicant team |

**PUT /workspaces/{workspace_id}/sections/{section_id}/assignment — Request Body:**
```json
{
  "owner_id": "uuid",
  "internal_due_date": "2026-08-15"
}
```

**PUT section field response — Request Body:**
```json
{
  "response_value": "Our organization serves 2,500 patients annually...",
  "response_json": null
}
```

---

## Workspace Tasks

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/tasks` | List tasks (F31) | Applicant team |
| POST | `/workspaces/{workspace_id}/tasks` | Create task (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/tasks/{task_id}` | Update task | Assignee, Proposal Lead |
| DELETE | `/workspaces/{workspace_id}/tasks/{task_id}` | Delete task | Proposal Lead, Org Admin |

---

## Workspace Comments (Internal Only)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/comments` | List internal comments (F32) | Applicant team ONLY |
| POST | `/workspaces/{workspace_id}/comments` | Post comment (F32) | Applicant team ONLY |

*Note: These endpoints MUST NOT be accessible to grantor roles under any circumstances.*

---

## Budget

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/budget` | Get budget with line items (F38) | Applicant team, Grantor (after submission) |
| PUT | `/workspaces/{workspace_id}/budget` | Update budget metadata | Finance Contributor, Proposal Lead, Org Admin |
| POST | `/workspaces/{workspace_id}/budget/line-items` | Add line item (F38) | Finance Contributor, Proposal Lead |
| PUT | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Update line item | Finance Contributor |
| DELETE | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Delete line item | Finance Contributor |
| POST | `/workspaces/{workspace_id}/budget/validate` | Validate budget (F39) | Applicant team |

**POST /workspaces/{workspace_id}/budget/line-items — Request Body:**
```json
{
  "budget_period": 1,
  "category": "personnel",
  "description": "Project Director",
  "personnel_name": "Jane Smith",
  "fte": 0.5,
  "annual_salary": 90000,
  "fringe_rate": 28.5
}
```
**Response:** `201 Created` with `line_id` and computed `total_cost`.

**POST /workspaces/{workspace_id}/budget/validate — Response:**
```json
{
  "is_valid": false,
  "total_federal_request": 485000,
  "total_match": 95000,
  "funding_ceiling": 500000,
  "match_required": true,
  "match_required_amount": 97000,
  "errors": [
    {
      "error_code": "MATCH_REQUIREMENT_NOT_MET",
      "message": "Cost-share of $95,000 does not meet the required match of $97,000.",
      "severity": "blocking"
    }
  ]
}
```

---

## Attachments

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/workspaces/{workspace_id}/attachments` | List all attachments (F40) | Applicant team, Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/attachments` | Upload or reference library doc (F40) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}` | Get attachment metadata | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/download` | Download attachment file | Applicant team, Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/attachments/{attachment_id}/replace` | Upload replacement version (F41) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/versions` | Version history (F41) | Applicant team |

**POST /workspaces/{workspace_id}/sections/{section_id}/attachments — Upload:**
```
Content-Type: multipart/form-data
requirement_id: uuid
source_type: upload
file: [binary file content]
```

**POST /workspaces/{workspace_id}/sections/{section_id}/attachments — Library Reference:**
```json
{
  "requirement_id": "uuid",
  "source_type": "library",
  "org_document_id": "uuid"
}
```

---

## Workspace Validation

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces/{workspace_id}/validate` | Full workspace validation (F48, F49, F50) | Applicant team |

**POST /workspaces/{workspace_id}/validate — Response:**
```json
{
  "workspace_id": "uuid",
  "is_ready_to_submit": false,
  "blocking_errors": [...],
  "warnings": [...],
  "informational": [...]
}
```

---

## Submission Preview

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/workspaces/{workspace_id}/preview` | Generate submission package preview (F42) | Applicant team |

**POST /workspaces/{workspace_id}/preview — Request Body:**
```json
{"format": "html"}
```
**Response:** `200 OK` with HTML body of the preview (labeled "PREVIEW — NOT SUBMITTED"). PDF format also supported via `"format": "pdf"`.

---

## Access Control Notes

- All `/workspaces/{workspace_id}/*` endpoints return `403 DRAFT_ACCESS_DENIED` for grantor roles when `workspace_status != submitted`
- Finance Contributors are restricted to `/budget/*` endpoints only
- External Contributors are restricted to their assigned section endpoints only
- Internal comments endpoints (`/comments`) always return `403` for grantor roles regardless of workspace status
