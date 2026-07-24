---

# Y1b: REST API — Organizations, Profiles, Roles, Standard Attachments

*Base URL: `/api/v1` | Auth: JWT Bearer token required | Format: JSON*

---

## Organizations (Applicant Org Profile)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/organizations` | Create applicant organization profile (F18) | Any authenticated user |
| GET | `/organizations/{org_id}` | Get org profile (F18, F19) | Org team members / Grantor (submitted data only) |
| PUT | `/organizations/{org_id}` | Update org profile fields (F18, F19) | Org Admin |
| GET | `/organizations/{org_id}/credential-status` | Get credential expiration status (F21) | Org team members |

**POST /organizations — Request Body:**
```json
{
  "legal_name": "Community Health Alliance",
  "dba_name": "CHA",
  "address_line1": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "entity_type": "nonprofit_501c3",
  "ein": "123456789",
  "uei": "ABC123DEF456",
  "sam_registered": true,
  "sam_expiration_date": "2027-06-30",
  "tax_exempt_status": "501c3",
  "primary_contact_name": "Jane Smith",
  "primary_contact_email": "jane@cha.org",
  "banking_readiness": "ready"
}
```
**Response:** `201 Created` with `org_id`.

**GET /organizations/{org_id}/credential-status — Response:**
```json
{
  "org_id": "uuid",
  "credentials": [
    {
      "item_type": "sam_registration",
      "expiration_date": "2026-06-30",
      "status": "expiring_soon",
      "days_remaining": 45
    },
    {
      "item_type": "audit_report",
      "expiration_date": "2025-12-31",
      "status": "expired",
      "days_remaining": -210
    }
  ]
}
```

---

## Organization Roles / Team Management

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/organizations/{org_id}/roles` | List org team members and roles (F22) | Org team members |
| POST | `/organizations/{org_id}/roles` | Invite user and assign role(s) (F22) | Org Admin |
| PUT | `/organizations/{org_id}/roles/{role_id}` | Update role assignment (F22) | Org Admin |
| DELETE | `/organizations/{org_id}/roles/{role_id}` | Revoke role (F22) | Org Admin |

**POST /organizations/{org_id}/roles — Request Body:**
```json
{
  "invitee_email": "budget@cha.org",
  "roles": ["finance_contributor"]
}
```
**Response:** `201 Created` with `role_id` and `invitation_sent: true`.

**PUT /organizations/{org_id}/roles/{role_id} — Request Body:**
```json
{
  "roles": ["contributor", "authorized_representative"]
}
```

---

## Organization Documents (Standard Attachment Library)

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/organizations/{org_id}/documents` | List org-level documents (F20) | Org team members |
| POST | `/organizations/{org_id}/documents` | Upload new org document or new version (F20) | Org Admin |
| GET | `/organizations/{org_id}/documents/{doc_id}` | Get document metadata | Org team members |
| GET | `/organizations/{org_id}/documents/{doc_id}/download` | Download document file | Org team members |
| GET | `/organizations/{org_id}/documents/{doc_id}/versions` | List version history (F20) | Org team members |

**POST /organizations/{org_id}/documents — Multipart Form:**
```
document_type: irs_determination_letter
expiration_date: 2028-03-01
file: [binary file content]
```
**Response:** `201 Created` with `attachment_id`, `version_number: 1`.

**GET /organizations/{org_id}/documents — Response:**
```json
{
  "documents": [
    {
      "attachment_id": "uuid",
      "document_type": "irs_determination_letter",
      "file_name": "IRS_Letter_2024.pdf",
      "version_number": 2,
      "uploaded_at": "2026-01-15T10:30:00Z",
      "expiration_date": "2028-03-01",
      "is_active": true,
      "expiration_status": "valid"
    }
  ]
}
```

---

## Grantor Organization Management

| Method | Path | Description | Auth Role |
|---|---|---|---|
| GET | `/grantor-organizations/{org_id}` | Get grantor org details | Grantor roles |
| GET | `/grantor-organizations/{org_id}/roles` | List grantor team roles | Grantor Admin |
| POST | `/grantor-organizations/{org_id}/roles` | Add grantor team member | Grantor Admin |
| DELETE | `/grantor-organizations/{org_id}/roles/{role_id}` | Remove grantor team member | Grantor Admin |

---

## Authentication / Session

| Method | Path | Description | Auth Role |
|---|---|---|---|
| POST | `/auth/login` | Authenticate user (email/password or SSO) | Public |
| POST | `/auth/refresh` | Refresh JWT access token | Authenticated |
| POST | `/auth/logout` | Invalidate session | Authenticated |
| GET | `/auth/me` | Get current user profile and org memberships | Authenticated |

**GET /auth/me — Response:**
```json
{
  "user_id": "uuid",
  "email": "jane@cha.org",
  "full_name": "Jane Smith",
  "org_memberships": [
    {
      "org_id": "uuid",
      "org_name": "Community Health Alliance",
      "org_type": "applicant",
      "roles": ["org_admin", "authorized_representative"]
    }
  ],
  "grantor_memberships": []
}
```

---

## Standard Response Shapes

**List Response:**
```json
{
  "items": [...],
  "total_count": 42,
  "page": 1,
  "page_size": 20
}
```

**Error Response:**
```json
{
  "error_code": "INVALID_UEI",
  "message": "UEI must be exactly 12 alphanumeric characters.",
  "field": "uei",
  "timestamp": "2026-07-24T12:00:00Z"
}
```

**Multi-field Validation Error:**
```json
{
  "error_code": "VALIDATION_FAILED",
  "message": "Request contains validation errors.",
  "errors": [
    {"field": "state", "error_code": "INVALID_STATE", "message": "State code 'ZZ' is not valid."},
    {"field": "sam_expiration_date", "error_code": "SAM_EXPIRED_ON_ENTRY", "message": "SAM expiration cannot be in the past."}
  ]
}
```
