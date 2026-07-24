---

# Stage 4: Organization Profile and Credential Readiness

*Objective: Reduce repeated application burden by maintaining reusable applicant data.*

---

## F18: Reusable Organization Profile
*Maps to: PRD-INTAKE-019 | Priority: P0 — MVP*

**Description:** Applicant organizations create and maintain a single reusable profile that persists across all applications. Profile data flows into application form fields, eliminating repeated manual entry across funder portals. A profile is created once per organization and is managed by the organization administrator.

**Sub-features:**
- Create organization profile on first registration
- Profile persists independently of any single application
- Profile data pre-populates applicable fields in application workspaces
- Profile editable at any time; updates do not modify submitted application snapshots (F23)

**Process:**
1. Applicant registers for the platform; system prompts organization profile creation
2. Organization admin completes profile setup (see F19 for fields)
3. Profile is saved to the `organizations` table
4. When applicant starts an application workspace (F29), system pre-populates profile fields into the org profile section
5. Pre-populated fields display as editable within the workspace but are sourced from the profile
6. At submission (F52), the profile state is captured in the submission snapshot; future profile edits do not affect the submitted record

**Inputs:** See F19 (Organization Profile Data Capture) for all profile fields.

**Outputs:**
- `organizations` record created or updated
- Profile fields pre-populate application workspace sections
- Audit event: `ORGANIZATION_PROFILE_CREATED` or `ORGANIZATION_PROFILE_UPDATED`

**Validation:**
- MUST: Each organization MUST have exactly one profile record
- MUST: An organization admin MUST complete the profile before creating an application workspace
- MUST: Profile updates after submission MUST NOT modify existing submission snapshots
- SHOULD: Profile completeness percentage SHOULD be displayed to the org admin

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Profile already exists | 409 | PROFILE_EXISTS | "An organization profile already exists for this organization." |
| Unauthorized profile update | 403 | PERMISSION_DENIED | "Only organization administrators can update the organization profile." |

**API Surface (this feature):** `POST /api/v1/organizations` (create); `GET /api/v1/organizations/{org_id}` (get); `PUT /api/v1/organizations/{org_id}` (update) — see `Y1b-api-org.md` §Organizations.

**Schema Surface (this feature):** `organizations` table — see `Y0b-schema-org.md` §organizations.

---

## F19: Organization Profile Data Capture
*Maps to: PRD-INTAKE-020 | Priority: P0 — MVP*

**Description:** The organization profile captures all standard fields required across federal and non-federal grant programs. This includes legal and operational identity, registration status, tax status, contacts, authorized representatives, and banking readiness indicators. All fields are stored in structured format for reuse and downstream intake reporting.

**Sub-features:**
- Capture legal name, DBA, full address, entity type
- Capture UEI, SAM registration status, SAM expiration date
- Capture tax status (EIN, 501(c)(3) status, tax-exempt type)
- Capture authorized representatives and primary contact
- Banking readiness indicator (self-attested)
- Standard document storage (F20)

**Process:**
1. Organization admin completes each profile section
2. System validates each field in real time
3. Profile is saved; completeness indicator updated
4. SAM expiration date stored; system monitors for expiration (F21)

**Inputs:**
- `legal_name` (string, required, max 250 chars): Organization's full legal name
- `dba_name` (string, optional, max 250 chars): Doing Business As name
- `address_line1` (string, required): Street address
- `address_line2` (string, optional): Suite/apt/unit
- `city` (string, required)
- `state` (string, required): 2-letter state code
- `zip` (string, required): 5 or 9-digit ZIP
- `country` (string, required, default: `US`)
- `entity_type` (enum, required): `nonprofit_501c3 | nonprofit_other | for_profit | government_federal | government_state | government_local | tribal | university | individual | other`
- `ein` (string, conditional): 9-digit Employer Identification Number; required for nonprofit and for-profit entities
- `uei` (string, conditional): 12-character Unique Entity Identifier from SAM.gov; required for federal opportunities
- `sam_registered` (boolean, required)
- `sam_expiration_date` (date, conditional): Required if `sam_registered = true`
- `tax_exempt_status` (enum, optional): `501c3 | 501c4 | 501c6 | other | not_applicable`
- `congressional_district` (string, optional)
- `primary_contact_name` (string, required)
- `primary_contact_email` (email, required)
- `primary_contact_phone` (string, optional)
- `banking_readiness` (enum, required): `ready | not_ready | unknown` — self-attested
- `indirect_cost_rate` (decimal, optional): Negotiated indirect cost rate percentage
- `indirect_cost_base` (string, optional): Cost base description (MTDC, TDC, etc.)

**Outputs:**
- Updated `organizations` record with all profile fields
- Credential expiration monitoring initialized for SAM expiration date (F21)

**Validation:**
- MUST: `legal_name`, `address_line1`, `city`, `state`, `zip`, `entity_type`, `primary_contact_name`, `primary_contact_email`, `banking_readiness` MUST be present for profile completion
- MUST: `ein` MUST be 9 digits (format `XX-XXXXXXX` accepted, stripped to digits for storage)
- MUST: `uei` MUST be exactly 12 alphanumeric characters
- MUST: `state` MUST be a valid 2-letter USPS state code
- MUST: `primary_contact_email` MUST pass RFC 5322 validation
- MUST: `sam_expiration_date` MUST be a future date when `sam_registered = true`

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid EIN format | 422 | INVALID_EIN | "EIN must be 9 digits (XX-XXXXXXX)." |
| Invalid UEI format | 422 | INVALID_UEI | "UEI must be exactly 12 alphanumeric characters." |
| Invalid state code | 422 | INVALID_STATE | "State code '{state}' is not a valid US state code." |
| SAM expiration in past | 422 | SAM_EXPIRED_ON_ENTRY | "SAM expiration date cannot be in the past." |

**API Surface (this feature):** `PUT /api/v1/organizations/{org_id}` — see `Y1b-api-org.md` §Organization Profile Data.

**Schema Surface (this feature):** All fields on `organizations` table — see `Y0b-schema-org.md` §organizations.

---

## F20: Reusable Standard Attachments Library
*Maps to: PRD-INTAKE-021 | Priority: P0 — MVP*

**Description:** The system stores a library of reusable standard attachments at the organization level. Applicants upload these documents once and can attach them to any application without re-uploading. Each document type maintains a version history. This directly reduces the burden of attaching the same IRS determination letter, W-9, or audit report to every application.

**Sub-features:**
- Upload and store standard documents at the org level
- Document types: IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support
- Version history per document (new upload replaces active version; prior version retained)
- Attach org-level documents to specific application attachment requirements without re-uploading
- Document expiration tracking (integrated with F21)

**Process:**
1. Organization admin navigates to the Organization Document Library
2. Admin selects document type and uploads file
3. System stores file with metadata (name, type, uploaded_by, uploaded_at, version_number)
4. If a prior version exists for this document type, prior version is archived (not deleted)
5. New version becomes active
6. When applicant completes an attachment requirement in a workspace, they may choose "Use from Library" to select the applicable org-level document

**Inputs:**
- `org_id` (UUID, required)
- `document_type` (enum, required): `irs_determination_letter | w9 | audit_report | indirect_cost_agreement | board_roster | insurance_certificate | letters_of_support | other`
- `custom_document_name` (string, conditional): Required if `document_type = other`
- `file` (binary, required): The document file
- `expiration_date` (date, optional): Document expiration date (for tracking in F21)
- `file_name` (string, required): Original filename
- `mime_type` (string, system-derived)

**Outputs:**
- `org_attachments` record with version number, file metadata, storage reference
- Prior version archived
- Attachment available in "Use from Library" selector in application workspaces

**Validation:**
- MUST: File MUST be one of the accepted formats: PDF, DOCX, XLSX, PNG, JPG (max 50 MB)
- MUST: `document_type` MUST be set
- MUST: Prior versions MUST be preserved on replacement; they are NOT deleted
- SHOULD: `expiration_date` SHOULD be provided for time-limited documents (IRS letter, audit reports, SAM, insurance)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| File too large | 413 | FILE_TOO_LARGE | "File size exceeds the 50MB limit." |
| Invalid file format | 415 | INVALID_FILE_FORMAT | "File format is not accepted. Accepted formats: PDF, DOCX, XLSX, PNG, JPG." |
| Document type not found | 404 | DOCUMENT_TYPE_NOT_FOUND | "The specified document type is not valid." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/documents` (list); `POST /api/v1/organizations/{org_id}/documents` (upload); `GET /api/v1/organizations/{org_id}/documents/{doc_id}/versions` (version history) — see `Y1b-api-org.md` §Documents.

**Schema Surface (this feature):** `org_attachments` table (attachment_id, org_id FK, document_type, custom_document_name, version_number, file_name, file_path, mime_type, file_size_bytes, expiration_date, uploaded_by, uploaded_at, is_active) — see `Y0b-schema-org.md` §org_attachments.

---

## F21: Credential Expiration Warnings
*Maps to: PRD-INTAKE-022 | Priority: P0 — MVP*

**Description:** The system monitors the expiration status of credentials, documents, and registrations stored in the organization profile. When an item is expired or approaching expiration, the system warns the applicant in the organization profile and in the application workspace readiness dashboard, before the expired credential becomes a submission blocker.

**Sub-features:**
- Monitor SAM registration expiration date
- Monitor expiration dates of stored documents (audit reports, insurance certificates, IRS letters)
- Display in-app warnings when items are expired or within the configured warning window
- Surface expiration warnings in org profile and application workspace readiness dashboard

**Inputs:**
- `item_type` (enum): `sam_registration | irs_determination_letter | audit_report | insurance_certificate | indirect_cost_agreement | other`
- `expiration_date` (date): Date from org profile or document record
- `warning_threshold_days` (integer, configurable): Days before expiration to trigger warning (default: 90 days)

**Outputs:**
- In-app warning displayed in organization profile for expired/expiring items
- Warning displayed in application workspace readiness dashboard when a workspace references the expiring item
- Email notification sent to org admin when threshold is crossed (see Notification Model)

**Validation:**
- MUST: SAM expiration date MUST be monitored for all organizations with `sam_registered = true`
- MUST: Expired credentials MUST display as `EXPIRED` (red/error state) in the org profile
- MUST: Credentials within warning threshold MUST display as `EXPIRING SOON` (yellow/warning state)
- MUST: Expired credentials that are required by an opportunity MUST appear as blocking errors in the readiness dashboard
- SHOULD: Warning threshold default SHOULD be 90 days but SHOULD be configurable per credential type

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| SAM registration expired at submission | 422 | SAM_EXPIRED | "SAM registration is expired. Update your organization profile before submitting." |
| Required document expired at submission | 422 | DOCUMENT_EXPIRED | "Required document '{document_type}' is expired. Upload a current version." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/credential-status` — returns status of all monitored credentials — see `Y1b-api-org.md` §Credential Status.

**Schema Surface (this feature):** Reads from `organizations.sam_expiration_date` and `org_attachments.expiration_date` — see `Y0b-schema-org.md`.

---

## F22: Organization Role Assignment
*Maps to: PRD-INTAKE-023 | Priority: P0 — MVP*

**Description:** The system supports multi-user organization teams with distinct roles and permission levels. Role assignment is managed by the organization administrator. The Authorized Representative role carries explicit submission authority and is required for final application certification and submission.

**Terminology:**
- **Org Admin:** Full control over organization profile, team members, and role assignments
- **Proposal Lead:** Leads application preparation; assigns section owners, tasks, and contributors
- **Contributor:** Can edit assigned sections; cannot submit
- **Finance Contributor:** Can edit budget sections only; cannot submit
- **Authorized Representative:** Can certify and submit applications; has formal legal authority

**Sub-features:**
- Invite users to the organization team by email
- Assign roles: Org Admin, Proposal Lead, Contributor, Finance Contributor, Authorized Representative
- Users may hold multiple roles (e.g., a user may be both Proposal Lead and Authorized Representative)
- Org Admin can revoke roles at any time
- Role-based access enforced at section, budget, and submission levels

**Process:**
1. Org Admin navigates to the Team Management section
2. Admin enters invitee email and selects one or more roles
3. System sends invitation email; invitee accepts and creates account (or links to existing account)
4. Upon acceptance, user is added to org team with assigned roles
5. Role-based permissions are applied immediately across all active workspaces

**Inputs:**
- `org_id` (UUID, required)
- `invitee_email` (email, required)
- `roles` (enum[], required): One or more of `org_admin | proposal_lead | contributor | finance_contributor | authorized_representative`
- `invited_by` (UUID, required): Org admin initiating the invitation

**Outputs:**
- `org_roles` record created for the invitee
- Invitation email sent
- Audit event: `ROLE_ASSIGNED`

**Validation:**
- MUST: Only Org Admins MUST be able to assign roles
- MUST: An organization MUST have at least one active Org Admin at all times
- MUST: An Authorized Representative MUST be assigned before an application can be submitted
- MUST: Finance Contributors MUST only be able to access budget sections
- SHOULD: Role assignment SHOULD be confirmed by the invitee before the role is fully active

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Last admin removal | 403 | LAST_ADMIN | "Cannot remove the last organization administrator. Assign another admin first." |
| Email not found | 404 | USER_NOT_FOUND | "No user account exists for '{email}'. The invitation will be sent to create an account." |
| Unauthorized role assignment | 403 | PERMISSION_DENIED | "Only organization administrators can assign roles." |

**API Surface (this feature):** `GET /api/v1/organizations/{org_id}/roles` (list team); `POST /api/v1/organizations/{org_id}/roles` (invite + assign); `PUT /api/v1/organizations/{org_id}/roles/{role_id}` (update); `DELETE /api/v1/organizations/{org_id}/roles/{role_id}` (revoke) — see `Y1b-api-org.md` §Roles.

**Schema Surface (this feature):** `org_roles` table (role_id, org_id FK, user_id FK, roles JSONB, invited_by, invitation_accepted_at, created_at, revoked_at) — see `Y0b-schema-org.md` §org_roles.

---

## F23: Profile Reuse with Submission Snapshots
*Maps to: PRD-INTAKE-024 | Priority: P0 — MVP*

**Description:** Applicants can reuse profile fields across applications. When an application is submitted, the system automatically captures a complete snapshot of the organization profile as it existed at submission time. This snapshot is preserved in the submission record; subsequent profile updates do not affect the submitted record. This ensures the submitted application is a complete, accurate, point-in-time record.

**Sub-features:**
- Pre-populate application workspace org profile section from current profile data
- Allow applicants to edit pre-populated fields within the workspace (application-specific overrides)
- At submission, capture org profile snapshot in the submission record
- Prevent profile snapshot modification after submission

**Process:**
1. When workspace is created (F29), system copies current profile field values into the workspace's org profile section
2. Applicant may edit values within the workspace without affecting the master profile
3. At submission (F52), system reads the current state of the org profile section in the workspace and includes it in the submission snapshot (immutable, timestamped)
4. After submission, if the master org profile is updated, the submitted snapshot remains unchanged

**Inputs:**
- `org_id` (UUID): Source profile
- `workspace_id` (UUID): Target application workspace
- At submission: current org profile section state in the workspace

**Outputs:**
- Org profile fields pre-populated in workspace at creation
- `submission_snapshots.org_profile_snapshot` JSONB field populated at submission

**Validation:**
- MUST: The submission snapshot MUST include a complete copy of the org profile section as submitted — not a reference to the live profile record
- MUST: The live profile MUST remain editable at all times without affecting submitted snapshots
- MUST: Workspace-level profile field edits MUST NOT write back to the master profile record

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Profile not found during workspace creation | 404 | PROFILE_NOT_FOUND | "Organization profile not found. Please complete your profile before starting an application." |

**API Surface (this feature):** Profile pre-population is handled by `POST /api/v1/workspaces` (F29). Snapshot is part of `POST /api/v1/workspaces/{workspace_id}/submit` (F52) — see `Y1c-api-application.md`.

**Schema Surface (this feature):** `submission_snapshots.org_profile_snapshot` (JSONB) — see `Y0d-schema-submission.md` §submission_snapshots.
