---

## 5. API Design

**Base URL:** `/api/v1`  
**Authentication:** JWT Bearer token on all endpoints except public opportunity reads  
**Content-Type:** `application/json` (multipart/form-data for file uploads)  
**API Versioning:** URL-based (`/api/v1/`)  
**Pagination:** All list endpoints support `page` + `page_size` parameters

### Standard Response Shapes

```typescript
// Standard list response
interface ListResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
}

// Standard error response
interface ApiError {
  error_code: string;
  message: string;
  field?: string;
  timestamp: string;  // ISO 8601 UTC
}

// Validation error (multi-field)
interface ValidationErrorResponse {
  error_code: 'VALIDATION_FAILED';
  message: string;
  errors: Array<{ field: string; error_code: string; message: string }>;
}
```

---

### API: Programs

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/programs` | List programs for authenticated grantor org | Grantor roles |
| POST | `/programs` | Create a new program | Grantor Admin, Program Officer |
| GET | `/programs/{program_id}` | Get program details | Grantor roles |
| PUT | `/programs/{program_id}` | Update program | Grantor Admin, Program Officer |

```typescript
interface Program {
  program_id: string;
  grantor_org_id: string;
  program_name: string;
  program_area?: string;
  is_federal: boolean;
  program_description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

// POST /programs body
interface CreateProgramRequest {
  program_name: string;     // required
  program_area?: string;
  is_federal: boolean;      // required
  program_description?: string;
}
```

---

### API: Opportunity Templates

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunity-templates` | List all templates (system + org custom) | Grantor roles |
| GET | `/opportunity-templates/{template_id}` | Get template details | Grantor roles |
| POST | `/opportunities/{opportunity_id}/save-as-template` | Save published opportunity as custom template | Grantor Admin |

---

### API: Opportunities (Grantor + Public)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/opportunities` | Create opportunity from template (F0) | Grantor Admin, Program Officer |
| GET | `/opportunities` | Search and list published opportunities (F14) | Public |
| GET | `/opportunities/{opportunity_id}` | Get opportunity detail (F16) | Public / Authenticated |
| PUT | `/opportunities/{opportunity_id}/metadata` | Update metadata (F1) | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/deadlines` | Update deadline config (F4) | Program Officer, Grantor Admin |
| GET | `/opportunities/{opportunity_id}/preview` | Grantor preview before publish (F13) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/validate` | Dry-run completeness check (F5) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/publish` | Publish opportunity (F5, F13) | Grantor Admin, Program Officer |
| POST | `/opportunities/{opportunity_id}/modifications` | Post-publication modification (F6) | Grantor Admin, Program Officer |
| GET | `/opportunities/{opportunity_id}/versions` | List version history (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/versions/{version_number}` | Get specific version (F6) | Grantor roles |
| GET | `/opportunities/{opportunity_id}/workspace-status` | Get applicant's workspace status (F16) | Applicant roles |
| GET | `/opportunities/{opportunity_id}/addenda` | List addenda (F17) | Public |
| PUT | `/opportunities/{opportunity_id}/qa-config` | Configure Q&A settings (F43) | Grantor Admin, Program Officer |

```typescript
interface Opportunity {
  opportunity_id: string;
  program_id: string;
  template_id?: string;
  title: string;
  funding_source: string;
  announcement_type: 'initial' | 'modification' | 'continuation' | 'supplemental' | 'correction';
  opportunity_number: string;
  assistance_listing_number?: string;
  funding_amount_min?: number;
  funding_amount_max: number;
  total_program_funding?: number;
  expected_awards_min?: number;
  expected_awards_max?: number;
  eligibility_summary: string;
  executive_summary: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_title?: string;
  program_area: string;
  geography?: string[];
  application_url?: string;
  status: 'draft' | 'internal_review' | 'approved' | 'published' | 'modified' | 'closed' | 'archived';
  visibility: 'public' | 'restricted_authenticated';
  public_slug?: string;
  published_at?: string;
  application_open_date?: string;
  application_close_date?: string;
  pre_application_deadline?: string;
  loi_deadline?: string;
  loi_required: boolean;
  rolling_review_enabled: boolean;
  rolling_review_cadence_days?: number;
  deadline_timezone: string;
  admin_screening_enabled: boolean;
  attachments_required: boolean;
  duplicate_allowed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// POST /opportunities
interface CreateOpportunityRequest {
  template_id: string;   // required
  program_id?: string;
}

// GET /opportunities — search query params
interface OpportunitySearchParams {
  keyword?: string;
  funder?: string;
  program_area?: string;
  geography?: string;
  eligibility_type?: string;
  funding_min?: number;
  funding_max?: number;
  due_date_from?: string;
  due_date_to?: string;
  application_stage?: string;
  sort_by?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  page_size?: number;
}

// POST /opportunities/{id}/validate — response
interface ReadinessResult {
  is_ready: boolean;
  blockers: Array<{
    section: string;
    field?: string;
    message: string;
    error_code: string;
  }>;
  warnings: Array<{ section: string; message: string }>;
  checklist_items: Array<{
    item: string;
    status: 'complete' | 'incomplete' | 'not_applicable';
  }>;
}

// Opportunity version
interface OpportunityVersion {
  version_id: string;
  opportunity_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  delta?: Record<string, unknown>;
  modification_reason: string;
  created_by: string;
  created_at: string;
}
```

---

### API: Opportunity Guidance (F2)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/guidance/prompts?field_id={field_id}` | Get plain-language guidance for a field | Grantor roles |
| POST | `/guidance/readability` | Get readability score for text content | Grantor roles |

```typescript
interface GuidancePrompt {
  field_id: string;
  prompt_text: string;
  example_text?: string;
  uswds_tips: string[];
}

interface ReadabilityRequest {
  text: string;
}

interface ReadabilityResponse {
  grade_level: number;        // Flesch-Kincaid grade level estimate
  reading_ease: number;       // Flesch Reading Ease score
  label: 'very_easy' | 'easy' | 'fairly_easy' | 'standard' | 'fairly_difficult' | 'difficult' | 'very_difficult';
  word_count: number;
  is_advisory: true;          // always advisory, never blocking
}
```

---

### API: Eligibility Rules (F7, F8)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/eligibility-rules` | List rules | Grantor roles |
| POST | `/opportunities/{opportunity_id}/eligibility-rules` | Create rule | Program Officer, Grantor Admin |
| PUT | `/eligibility-rules/{rule_id}` | Update rule | Program Officer, Grantor Admin |
| DELETE | `/eligibility-rules/{rule_id}` | Delete rule | Program Officer, Grantor Admin |

```typescript
interface EligibilityRule {
  rule_id: string;
  opportunity_id: string;
  rule_type: 'applicant_type' | 'geography' | 'entity_status' | 'uei_sam' |
             'nonprofit_status' | 'tribal_status' | 'state_local_status' |
             'prior_award_status' | 'match_requirement' | 'custom';
  criterion_field: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'excludes' |
            'greater_than' | 'less_than' | 'is_true' | 'is_false';
  criterion_value: string | string[] | number;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission';  // required for hard_blocker
  explanation_text: string;
  rule_group_id?: string;
  rule_group_operator?: 'AND' | 'OR';
  display_order: number;
  created_by: string;
  created_at: string;
}
```

---

### API: Prescreening Questionnaire (F9, Grantor config)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get questionnaire (grantor config view) | Grantor roles |
| PUT | `/opportunities/{opportunity_id}/prescreening` | Update questionnaire | Program Officer, Grantor Admin |
| POST | `/opportunities/{opportunity_id}/prescreening/preview` | Preview as applicant | Grantor roles |

---

### API: Attachment Requirements (F11)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/attachment-requirements` | List requirements | Grantor / Applicant roles |
| POST | `/opportunities/{opportunity_id}/attachment-requirements` | Create requirement | Program Officer, Grantor Admin |
| PUT | `/attachment-requirements/{requirement_id}` | Update requirement | Program Officer, Grantor Admin |
| DELETE | `/attachment-requirements/{requirement_id}` | Delete requirement | Program Officer, Grantor Admin |

```typescript
interface AttachmentRequirement {
  requirement_id: string;
  opportunity_id: string;
  document_type: string;
  custom_document_name?: string;
  applicant_type_scope: string[];   // empty = all entity types
  stage_scope: 'pre_application' | 'loi' | 'full_application';
  is_required: boolean;
  instructions?: string;
  file_format_restrictions?: string[];
  max_file_size_mb: number;
}
```

---

### API: Screening Criteria (F12)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/screening-criteria` | List criteria | Grantor roles |
| POST | `/opportunities/{opportunity_id}/screening-criteria` | Create criterion | Program Officer, Grantor Admin |
| PUT | `/screening-criteria/{criterion_id}` | Update criterion | Program Officer, Grantor Admin |
| DELETE | `/screening-criteria/{criterion_id}` | Delete criterion (system criteria protected) | Grantor Admin |

---

### API: Form Builder (F36, F10)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/sections/{section_id}/fields` | List field definitions | Grantor roles |
| POST | `/form-fields` | Create field definition | Program Officer, Grantor Admin |
| PUT | `/form-fields/{field_id}` | Update field | Program Officer, Grantor Admin |
| DELETE | `/form-fields/{field_id}` | Delete field | Program Officer, Grantor Admin |
| PUT | `/opportunities/{opportunity_id}/sections/{section_id}/conditions` | Set section conditional rules | Program Officer |

```typescript
interface FormFieldDefinition {
  field_id: string;
  opportunity_id: string;
  section_id: string;
  field_type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'picklist' |
              'multi_select' | 'checkbox' | 'file_upload' | 'calculated' | 'repeating_table';
  label: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  display_order: number;
  validation_config?: {
    max_length?: number;
    max_chars?: number;
    max_words?: number;
    min?: number;
    max?: number;
    decimal_places?: number;
    allowed_values?: string[];
    min_selected?: number;
    max_selected?: number;
    file_formats?: string[];
    max_size_mb?: number;
    min_date?: string;
    max_date?: string;
  };
  formula?: string;
  columns?: Array<{ name: string; field_type: string; is_required?: boolean }>;
}
```
