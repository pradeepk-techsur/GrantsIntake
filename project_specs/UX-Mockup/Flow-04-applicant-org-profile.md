# Flow-04: Applicant — Organization Profile and Credential Readiness

**Personas:** Priya Nair (Organization Administrator)
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
**Features:** F18, F19, F20, F21, F22, F23
**Journey:** JRN-03.1

---

## Flow Diagram

```
[Applicant Dashboard] — new user, first login
        │
        ▼ Prompt: "Set up your organization profile to apply"
[Organization Profile Manager — Setup Wizard]
        │
        ├── Step 1: Legal Identity (name, EIN, entity type, UEI, SAM status, address)
        ├── Step 2: Tax Status and Supplemental Fields
        ├── Step 3: Contacts (primary contact, authorized representatives)
        └── Step 4: Confirm + Profile Completeness Score
                 │
                 ▼
[Organization Profile Manager — Main View]
        │
        ├──▶ [Document Library]
        │         ├── Upload documents (IRS letter, W-9, audit, etc.)
        │         ├── Set expiration dates per document
        │         └── Document version history per type
        │
        ├──▶ [Team & Roles Manager]
        │         ├── Invite team members
        │         ├── Assign roles (Admin, Proposal Lead, Finance, Contributor, AR)
        │         └── Authorized Representative designated → visible to all
        │
        └──▶ [Credential Expiration Dashboard]
                  ├── Expired credentials: usa-alert--error
                  ├── Expiring soon: usa-alert--warning
                  └── All current: usa-alert--success (summary)

--- PROFILE REUSE ---
[Application Workspace — new workspace created]
        │
        ▼ Profile fields pre-populate relevant form fields
[Workspace pre-populated with org data]
        │
        └── Jordan confirms pre-populated data; edits only what differs
```

---

## Steps

### Step 1: Initial Profile Setup (First-Time User)
- Priya is prompted to set up her organization profile on first login
- Setup wizard guides through fields with progress indicator
- Required fields clearly marked with asterisk and usa-required indicator
- Real-time validation on each field:
  - EIN: 9-digit format XX-XXXXXXX
  - UEI: 12 alphanumeric characters
  - SAM status: if registered, expiration date becomes required (future date only)
  - State: 2-letter USPS code
  - Contact email: RFC 5322 validation
- System blocks duplicate profile creation if org already exists
- Profile completeness percentage displayed throughout setup

### Step 2: Document Library
- Priya uploads standard documents to the org-level library
- Each document type:
  - Upload new file → creates version record with timestamp and uploader
  - Expiration date field (prompted with guidance: "Why this matters: expired credentials may block submission")
  - Version history accessible (prior versions preserved, never overwritten)
- Document types supported: IRS determination letter, W-9, audit reports, indirect cost agreement, board roster, insurance certificate, letters of support
- Library shows: document type, current version date, expiration date, expiration status badge

### Step 3: Team and Role Assignment
- Priya invites team members by email address
- Assigns roles from dropdown: Organization Admin, Proposal Lead, Finance Contributor, External Contributor, Authorized Representative
- Authorized Representative role highlights prominently with a "Submit Authority" badge
- Multiple team members can have the same role (except AR, which is tracked explicitly)
- External Contributors get scoped access (section-level only)
- Role assignments visible to all team members in the Team view

### Step 4: Credential Expiration Monitoring
- After setup, the Credential Expiration Dashboard shows:
  - Expired: red usa-alert -- must renew before applying
  - Expiring soon (within configurable window): yellow usa-alert with days remaining
  - All current: brief green confirmation
- Warnings appear in both the Organization Profile view AND in every Application Workspace readiness checklist
- Organization Admin and Proposal Lead both see credential warnings

### Step 5: Profile Reuse Across Applications
- When Jordan creates a new Application Workspace, the system auto-populates:
  - Legal name, EIN, UEI, entity type, address, contact info from the profile
  - ≥ 60% of application fields pre-populated at workspace creation
- Priya can update the profile at any time without affecting previously submitted applications
- At submission, the system captures a snapshot of the profile state — future profile edits do not modify the submitted record

---

## Entry Points

- Applicant Dashboard → "Organization" top nav → "Profile"
- First-login prompt (new organizations)
- Readiness Dashboard warning: "Profile incomplete" link

## Exit Points

- Profile saved → returns to Organization Profile Manager (main view)
- Document uploaded → Document Library view
- Role assigned → Team & Roles view
- "Open Application Workspace" → Applicant Dashboard → select opportunity

---
