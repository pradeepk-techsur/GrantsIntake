---

# Y1a: REST API — Opportunities, Programs, Eligibility, Templates

*Base URL: `/api/v1` | Auth: JWT Bearer token required on all endpoints except public opportunity portal reads | Format: JSON*

---

## Programs

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/programs` | List programs for authenticated grantor org | Grantor roles |
| POST | `/programs` | Create a new program | Grantor Admin, Program Officer |
| GET | `/programs/{program_id}` | Get program details | Grantor roles |
| PUT | `/programs/{program_id}` | Update program | Grantor Admin, Program Officer |

**POST /programs — Request Body:**
```json
{
  "program_name": "Community Health Grants",
  "program_area": "Health",
  "is_federal": true,
  "program_description": "..."
}
```
**Response:** `201 Created` with `program_id`.

---

## Opportunity Templates

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunity-templates` | List all templates (system + custom for org) | Grantor roles |
| GET | `/opportunity-templates/{template_id}` | Get template details | Grantor roles |
| POST | `/opportunities/{opportunity_id}/save-as-template` | Save published opportunity as custom template | Grantor Admin |

---

## Opportunities

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/opportunities` | Create opportunity from template (F0) | Grantor Admin, Program Officer |
| GET | `/opportunities` | Search and list opportunities (F14) | Public (published) |
| GET | `/opportunities/{opportunity_id}` | Get opportunity detail (F16) | Public / Authenticated |
| PUT | `/opportunities/{opportunity_id}/metadata` | Update metadata (F1) | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/deadlines` | Update deadline config (F4) | Program Officer, Grantor Admin |
| GET | `/opportunities/{opportunity_id}/preview` | Grantor preview before publish (F13) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/validate` | Dry-run completeness check (F5) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/publish` | Publish opportunity (F5, F13) | Grantor Admin, Program Officer |
| POST | `/opportunities/{opportunity_id}/modifications` | Create post-publication modification (F6) | Grantor Admin, Program Officer |
| GET | `/opportunities/{opportunity_id}/versions` | List version history (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/versions/{version_number}` | Get specific version (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/workspace-status` | Get authenticated applicant's workspace status (F16) | Applicant roles |
| GET | `/opportunities/{opportunity_id}/addenda` | List addenda (F17) | Public |
| GET | `/addenda/{addendum_id}` | Get addendum detail | Public |
| PUT | `/opportunities/{opportunity_id}/qa-config` | Configure Q&A settings (F43) | Grantor Admin, Program Officer |

**POST /opportunities — Request Body:**
```json
{
  "template_id": "uuid",
  "program_id": "uuid"
}
```
**Response:** `201 Created` with `opportunity_id`, `status: "draft"`.

**PUT /opportunities/{opportunity_id}/metadata — Request Body (partial update supported):**
```json
{
  "title": "Community Health Initiative 2026",
  "funding_source": "Department of Health and Human Services",
  "announcement_type": "initial",
  "opportunity_number": "HHS-CHI-2026-001",
  "assistance_listing_number": "93.243",
  "funding_amount_max": 500000,
  "eligibility_summary": "Open to nonprofit organizations...",
  "executive_summary": "This opportunity supports...",
  "contact_name": "Jane Smith",
  "contact_email": "jane.smith@hhs.gov",
  "program_area": "Health"
}
```

**GET /opportunities (Search) — Query Parameters:**
```
keyword, funder, program_area, geography, eligibility_type,
funding_min, funding_max, due_date_from, due_date_to,
application_stage, sort_by, page, page_size
```
**Response:** `200 OK` with `{results: [...], total_count, page, page_size}`.

---

## Opportunity Guidance

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/guidance/prompts?field_id={field_id}` | Get plain-language guidance for a field (F2) | Grantor roles |
| POST | `/guidance/readability` | Get readability score for text content (F2) | Grantor roles |

**GET /guidance/prompts Response:**
```json
{
  "field_id": "executive_summary",
  "prompt_text": "Write 2-3 paragraphs explaining what this grant funds...",
  "example_text": "This opportunity funds community health clinics...",
  "uswds_tips": ["Use active voice", "Avoid jargon", "Aim for 8th grade reading level"]
}
```

---

## Eligibility Rules

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/eligibility-rules` | List rules for opportunity (F7) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/eligibility-rules` | Create rule (F7) | Program Officer, Grantor Admin |
| PUT | `/eligibility-rules/{rule_id}` | Update rule (F7) | Program Officer, Grantor Admin |
| DELETE | `/eligibility-rules/{rule_id}` | Delete rule (F7) | Program Officer, Grantor Admin |

**POST /opportunities/{opportunity_id}/eligibility-rules — Request Body:**
```json
{
  "rule_type": "entity_status",
  "criterion_field": "entity_type",
  "operator": "includes",
  "criterion_value": ["nonprofit_501c3", "nonprofit_other"],
  "severity": "hard_blocker",
  "enforcement_point": "pre_workspace",
  "explanation_text": "This opportunity is only open to nonprofit organizations.",
  "display_order": 1
}
```

---

## Pre-Screening Questionnaire

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire (grantor config view) (F9) | Grantor roles |
| PUT | `/opportunities/{opportunity_id}/prescreening` | Update questionnaire (F9) | Program Officer, Grantor Admin |
| POST | `/opportunities/{opportunity_id}/prescreening/preview` | Preview questionnaire as applicant (F9) | Grantor roles |

---

## Attachment Requirements

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/attachment-requirements` | List requirements (F11) | Grantor roles / Applicant roles |
| POST | `/opportunities/{opportunity_id}/attachment-requirements` | Create requirement (F11) | Program Officer, Grantor Admin |
| PUT | `/attachment-requirements/{requirement_id}` | Update requirement | Program Officer, Grantor Admin |
| DELETE | `/attachment-requirements/{requirement_id}` | Delete requirement | Program Officer, Grantor Admin |

---

## Screening Criteria

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/screening-criteria` | List criteria (F12) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/screening-criteria` | Create criterion (F12) | Program Officer, Grantor Admin |
| PUT | `/screening-criteria/{criterion_id}` | Update criterion | Program Officer, Grantor Admin |
| DELETE | `/screening-criteria/{criterion_id}` | Delete criterion (system criteria protected) | Grantor Admin |

---

## Form Builder

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/opportunities/{opportunity_id}/sections/{section_id}/fields` | List field definitions (F36) | Grantor roles |
| POST | `/form-fields` | Create field definition (F36) | Program Officer, Grantor Admin |
| PUT | `/form-fields/{field_id}` | Update field (F36) | Program Officer, Grantor Admin |
| DELETE | `/form-fields/{field_id}` | Delete field | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/sections/{section_id}/conditions` | Set section conditional rules (F10) | Program Officer |

---

## Standard Error Response Shape

All API errors return:
```json
{
  "error_code": "REQUIRED_FIELD_MISSING",
  "message": "Field 'title' is required before publication.",
  "field": "title",
  "timestamp": "2026-07-24T12:00:00Z"
}
```
Validation errors on multi-field requests return `errors: [{error_code, message, field}, ...]`.
