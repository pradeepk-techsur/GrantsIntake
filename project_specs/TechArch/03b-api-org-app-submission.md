---

### API: Authentication & Organizations

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/auth/login` | Authenticate (email/password or SSO) | Public |
| POST | `/auth/refresh` | Refresh JWT access token | Authenticated |
| POST | `/auth/logout` | Invalidate session | Authenticated |
| GET | `/auth/me` | Get current user profile and org memberships | Authenticated |

```typescript
interface CurrentUser {
  user_id: string;
  email: string;
  full_name: string;
  org_memberships: Array<{
    org_id: string;
    org_name: string;
    org_type: 'applicant';
    roles: ApplicantRole[];
  }>;
  grantor_memberships: Array<{
    org_id: string;
    org_name: string;
    org_type: 'grantor';
    roles: GrantorRole[];
  }>;
}

type GrantorRole = 'grantor_admin' | 'program_officer' | 'intake_administrator' |
                  'compliance_analyst' | 'reviewer';

type ApplicantRole = 'org_admin' | 'proposal_lead' | 'contributor' |
                     'finance_contributor' | 'external_contributor' | 'authorized_representative';
```

---

### API: Organizations (Applicant Profile)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/organizations` | Create applicant organization profile (F18) | Any authenticated user |
| GET | `/organizations/{org_id}` | Get org profile (F18, F19) | Org team / Grantor (submitted data only) |
| PUT | `/organizations/{org_id}` | Update org profile (F18, F19) | Org Admin |
| GET | `/organizations/{org_id}/credential-status` | Get credential expiration status (F21) | Org team |
| GET | `/organizations/{org_id}/roles` | List org team roles (F22) | Org team |
| POST | `/organizations/{org_id}/roles` | Invite user and assign role(s) (F22) | Org Admin |
| PUT | `/organizations/{org_id}/roles/{role_id}` | Update role assignment (F22) | Org Admin |
| DELETE | `/organizations/{org_id}/roles/{role_id}` | Revoke role (F22) | Org Admin |
| GET | `/organizations/{org_id}/documents` | List org-level documents (F20) | Org team |
| POST | `/organizations/{org_id}/documents` | Upload new org document (F20) | Org Admin |
| GET | `/organizations/{org_id}/documents/{doc_id}` | Get document metadata | Org team |
| GET | `/organizations/{org_id}/documents/{doc_id}/download` | Download document | Org team |
| GET | `/organizations/{org_id}/documents/{doc_id}/versions` | List version history (F20) | Org team |

```typescript
interface Organization {
  org_id: string;
  legal_name: string;
  dba_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;          // 2-char US state code
  zip: string;
  country: string;
  entity_type: 'nonprofit_501c3' | 'nonprofit_other' | 'for_profit' | 'government_federal' |
               'government_state' | 'government_local' | 'tribal' | 'university' | 'individual' | 'other';
  ein?: string;           // 9 digits, no hyphen
  uei?: string;           // 12-char alphanumeric
  sam_registered: boolean;
  sam_expiration_date?: string;
  tax_exempt_status?: '501c3' | '501c4' | '501c6' | 'other' | 'not_applicable';
  congressional_district?: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  banking_readiness: 'ready' | 'not_ready' | 'unknown';
  indirect_cost_rate?: number;
  indirect_cost_base?: string;
  profile_completeness_pct: number;
  created_at: string;
  updated_at: string;
}

interface CredentialStatus {
  org_id: string;
  credentials: Array<{
    item_type: string;  // sam_registration, audit_report, irs_determination_letter, etc.
    expiration_date?: string;
    status: 'valid' | 'expiring_soon' | 'expired';
    days_remaining: number;
  }>;
}

interface OrgDocument {
  attachment_id: string;
  document_type: 'irs_determination_letter' | 'w9' | 'audit_report' | 'indirect_cost_agreement' |
                 'board_roster' | 'insurance_certificate' | 'letters_of_support' | 'other';
  custom_document_name?: string;
  file_name: string;
  version_number: number;
  uploaded_at: string;
  expiration_date?: string;
  is_active: boolean;
  expiration_status: 'valid' | 'expiring_soon' | 'expired';
}
```

---

### API: Application Workspaces (F24–F54)

**Pre-Screening (Applicant)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/prescreening` | Get applicant-facing questionnaire (F24) | Applicant roles |
| POST | `/opportunities/{opportunity_id}/prescreening/submit` | Submit responses; get eligibility result (F24–F26, F28) | Applicant roles |
| GET | `/workspaces/{workspace_id}/eligibility-responses` | Get stored eligibility responses (F28) | Applicant / Grantor (after submission) |

```typescript
interface PrescreeningSubmitRequest {
  org_id: string;
  questionnaire_responses: Array<{
    question_id: string;
    selected_option_id?: string;
    response_text?: string;
  }>;
}

interface EligibilityResult {
  overall_result: 'eligible' | 'likely_eligible' | 'needs_attention' | 'ineligible';
  triggered_rules: Array<{
    rule_id: string;
    severity: 'hard_blocker' | 'advisory';
    explanation_text: string;
    opportunity_section_link?: string;
  }>;
  next_step: string;
  workspace_access_granted: boolean;
}
```

**Workspaces**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces` | Create application workspace (F29) | Applicant roles |
| GET | `/workspaces/{workspace_id}` | Get workspace details | Applicant team / Grantor (after submission) |
| GET | `/workspaces/{workspace_id}/readiness` | Get submission readiness summary (F34) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections` | List sections with status (F30) | Applicant team |
| GET | `/workspaces/{workspace_id}/sections/{section_id}` | Get section details and fields | Applicant team |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/assignment` | Assign owner and due date (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/sections/{section_id}/fields/{field_id}` | Save field response | Applicant team (scoped) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/validate` | Validate section (F48) | Applicant team |
| POST | `/workspaces/{workspace_id}/sections/evaluate` | Re-evaluate section visibility (F10) | Applicant team |
| GET | `/workspaces/{workspace_id}/tasks` | List tasks (F31) | Applicant team |
| POST | `/workspaces/{workspace_id}/tasks` | Create task (F31) | Proposal Lead, Org Admin |
| PUT | `/workspaces/{workspace_id}/tasks/{task_id}` | Update task | Assignee, Proposal Lead |
| DELETE | `/workspaces/{workspace_id}/tasks/{task_id}` | Delete task | Proposal Lead, Org Admin |
| GET | `/workspaces/{workspace_id}/comments` | List internal comments (F32) | Applicant team ONLY |
| POST | `/workspaces/{workspace_id}/comments` | Post comment (F32) | Applicant team ONLY |

```typescript
interface ApplicationWorkspace {
  workspace_id: string;
  opportunity_id: string;
  org_id: string;
  status: 'workspace_created' | 'in_progress' | 'ready_for_internal_review' |
          'ready_to_submit' | 'submitted' | 'intake_screening' | 'returned_for_correction' |
          'resubmitted' | 'accepted_for_review' | 'withdrawn' | 'administratively_rejected';
  visibility: 'grantee_private' | 'shared';
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ReadinessSummary {
  workspace_id: string;
  overall_completion_pct: number;
  is_ready_to_submit: boolean;
  authorized_rep_assigned: boolean;
  blocking_errors: Array<{
    section_id: string;
    section_name: string;
    field_id?: string;
    field_label?: string;
    error_code: string;
    message: string;
    severity: 'blocking';
    link: string;
  }>;
  warnings: Array<{
    section_id: string;
    field_label?: string;
    message: string;
    severity: 'warning';
  }>;
  informational: Array<{ message: string; severity: 'info' }>;
  attachment_status: Array<{
    requirement_id: string;
    document_type: string;
    is_required: boolean;
    is_fulfilled: boolean;
    document_name?: string;
  }>;
}
```

**Budget (F38–F39)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/workspaces/{workspace_id}/budget` | Get budget with line items | Applicant team / Grantor (after submission) |
| PUT | `/workspaces/{workspace_id}/budget` | Update budget metadata | Finance Contributor, Proposal Lead, Org Admin |
| POST | `/workspaces/{workspace_id}/budget/line-items` | Add line item | Finance Contributor, Proposal Lead |
| PUT | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Update line item | Finance Contributor |
| DELETE | `/workspaces/{workspace_id}/budget/line-items/{line_id}` | Delete line item | Finance Contributor |
| POST | `/workspaces/{workspace_id}/budget/validate` | Validate budget (F39) | Applicant team |

```typescript
interface BudgetLineItem {
  line_id: string;
  budget_id: string;
  budget_period: number;
  category: 'personnel' | 'fringe' | 'travel' | 'equipment' | 'supplies' |
            'contractual' | 'indirect' | 'other_direct' | 'match_cash' | 'match_in_kind';
  description: string;
  quantity?: number;
  unit_cost?: number;
  total_cost: number;
  personnel_name?: string;
  fte?: number;
  annual_salary?: number;
  fringe_rate?: number;
  match_source?: string;
  match_type?: 'cash' | 'in_kind';
  justification_text?: string;
}

interface BudgetValidationResult {
  is_valid: boolean;
  total_federal_request: number;
  total_match: number;
  funding_ceiling: number;
  match_required: boolean;
  match_required_amount?: number;
  errors: Array<{ error_code: string; message: string; severity: 'blocking' | 'warning' }>;
}
```

**Attachments (F40–F41)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/workspaces/{workspace_id}/attachments` | List all attachments | Applicant team / Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/sections/{section_id}/attachments` | Upload or reference library doc | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/download` | Download file | Applicant team / Grantor (after submission) |
| POST | `/workspaces/{workspace_id}/attachments/{attachment_id}/replace` | Upload replacement version (F41) | Applicant team |
| GET | `/workspaces/{workspace_id}/attachments/{attachment_id}/versions` | Version history (F41) | Applicant team |

**Validation & Preview (F48–F50, F42)**

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces/{workspace_id}/validate` | Full workspace validation | Applicant team |
| POST | `/workspaces/{workspace_id}/preview` | Generate submission preview (F42) | Applicant team |

---

### API: Submission Workflow (F51–F54)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| POST | `/workspaces/{workspace_id}/certify` | AR certification — triggers submit flow (F51) | Authorized Representative |
| POST | `/workspaces/{workspace_id}/submit` | Submit application (F50, F52) | Authorized Representative |
| GET | `/workspaces/{workspace_id}/receipt` | Download submission receipt (F52) | Applicant team |
| POST | `/workspaces/{workspace_id}/unlock` | Grantor-initiated workspace unlock (F54, F58) | Grantor Admin, Intake Administrator |
| GET | `/submissions/{snapshot_id}` | Get submission snapshot metadata | Applicant / Grantor |
| GET | `/submissions/{snapshot_id}/package/human-readable` | Download human-readable PDF (F53) | Applicant / Grantor |
| GET | `/submissions/{snapshot_id}/package/machine-readable` | Download JSON package (F53) | Grantor roles |
| GET | `/workspaces/{workspace_id}/snapshots` | List all snapshots incl. correction versions (F59) | Applicant / Grantor |

```typescript
interface SubmissionConfirmation {
  snapshot_id: string;
  confirmation_number: string;  // GI-{YEAR}-{8-digit-seq}
  submitted_at: string;
  opportunity_title: string;
  applicant_org_name: string;
  receipt_download_url: string;
}

interface SubmissionBlockedError {
  error_code: 'SUBMISSION_BLOCKED';
  message: string;
  blocking_errors: Array<{
    section_id: string;
    field_label: string;
    error_code: string;
    severity: 'blocking';
  }>;
}
```

---

### API: Intake Queue & Dispositions (F55–F60)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/intake-queue` | List intake queue with filters (F55, F56) | Grantor roles |
| GET | `/intake-queue/{entry_id}` | Get application detail from snapshot (F56) | Grantor roles |
| POST | `/intake-queue/{entry_id}/disposition` | Apply administrative screening disposition (F57) | Intake Administrator, Grantor Admin |
| POST | `/intake-queue/{entry_id}/correction-request` | Request correction/clarification (F58) | Intake Administrator, Grantor Admin |
| GET | `/intake-queue/{entry_id}/snapshots` | List all submission snapshots (F59) | Grantor roles |

---

### API: Q&A (F43–F44, F46)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/opportunities/{opportunity_id}/qa` | List published Q&A (public) | Public |
| GET | `/opportunities/{opportunity_id}/questions` | List all questions incl. unanswered (F44) | Grantor roles |
| POST | `/opportunities/{opportunity_id}/questions` | Submit a question (F43) | Applicant roles |
| PUT | `/questions/{question_id}/answer` | Publish answer (F44) | Designated Q&A responders |
| GET | `/opportunities/{opportunity_id}/audit-history` | Full audit history (F46) | Grantor roles |

---

### API: Notifications, Analytics, Export (F47, F61–F63)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/notifications` | List notifications for authenticated user | Authenticated |
| PUT | `/notifications/{notification_id}/read` | Mark notification as read | Authenticated |
| GET | `/analytics/grantor/dashboard` | Grantor intake dashboard metrics (F61) | Grantor roles |
| GET | `/analytics/grantor/opportunities` | Opportunity-level breakdown (F61) | Grantor roles |
| GET | `/analytics/applicant/dashboard` | Applicant dashboard (F62) | Applicant roles |
| GET | `/analytics/applicant/applications` | Detailed application list (F62) | Applicant roles |
| POST | `/analytics/export` | Create export job (F63) | Grantor Admin, Program Officer, Intake Administrator, Compliance Analyst |
| GET | `/analytics/export/{job_id}/status` | Get export job status | Export requester |
| GET | `/analytics/export/{job_id}/download` | Download completed export | Export requester |
