# Screen-04: Organization Profile Manager

**Routes:**
- Profile: `/applicant/organization/profile`
- Documents: `/applicant/organization/documents`
- Team: `/applicant/organization/team`

**Purpose:** Priya maintains the organization's reusable profile, document library, credential tracking, and team role assignments — the foundation that makes all applications faster.
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
**Features:** F18, F19, F20, F21, F22, F23
**Personas:** Priya Nair (Organization Administrator)

---

## Layout — Organization Profile Main View

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  Organization  ▾Priya   │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Organization > Profile                      │
│                                                                     │
│  Organization Profile                                               │
│  Urban Health Collaborative                    [Edit Profile]       │
│                                                                     │
│  Profile Completeness: ████████████████░░░░ 82%                    │
│  [usa-progress: 82%]                                                │
│  3 optional fields incomplete. [See what's missing →]              │
│                                                                     │
├────────────────────────┬────────────────────────────────────────────┤
│ ORGANIZATION SIDENAV   │  LEGAL IDENTITY                            │
│                        │                                            │
│ ▶ Profile              │  Legal Name *                              │
│   Document Library     │  Urban Health Collaborative                │
│   Team & Roles         │                                            │
│   Credential Status    │  DBA (if different)                        │
│                        │  Urban Health Collab                       │
│                        │                                            │
│                        │  Entity Type *                             │
│                        │  Nonprofit 501(c)(3)                       │
│                        │                                            │
│                        │  EIN *   83-4521766                        │
│                        │  UEI *   UJKL8923MN01                      │
│                        │                                            │
│                        │  SAM Registration *                        │
│                        │  Registered · Expires Dec 15, 2026         │
│                        │  [usa-tag--warning] Expires in 5 months    │
│                        │                                            │
│                        │  MAILING ADDRESS                           │
│                        │  1200 Oak Avenue                           │
│                        │  Chicago, IL 60601                         │
│                        │  Congressional District: IL-07             │
│                        │                                            │
│                        │  Tax Status                                │
│                        │  Tax-exempt (501(c)(3))                    │
│                        │  Indirect Cost Rate: 15%                   │
│                        │                                            │
│                        │  Banking Readiness                         │
│                        │  ✓ Self-attested ready                     │
│                        │                                            │
│                        │  PRIMARY CONTACT                           │
│                        │  Priya Nair · priya@urbanhealthcollab.org  │
│                        │                                            │
│                        │  [Edit Profile]  [Save Changes]            │
└────────────────────────┴────────────────────────────────────────────┘
```

---

## Layout — Document Library

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Sidenav: Document Library selected]                                │
│                                                                     │
│  Document Library                          [Upload New Document]    │
│                                                                     │
│  [usa-alert--warning]                                               │
│  1 credential requires attention: Audit Report expires in 45 days.  │
│  [Update Audit Report →]                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Document Type          Latest Version  Expires   Status      │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ IRS Determination      Jun 2021        Mar 2027  ✓ Current   │  │
│  │ Letter                 [History ▾]                 [Replace] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ W-9                    Jan 2026        N/A       ✓ Current   │  │
│  │                        [History ▾]                 [Replace] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Audit Report (A-133)   Mar 2024        Sep 2026  ⚠ Expiring  │  │
│  │                        [History ▾]      45 days  [Replace]   │  │
│  │                        [usa-tag--warning] EXPIRING SOON      │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Indirect Cost Agree.   Not uploaded    —         ○ Missing   │  │
│  │                                                   [Upload]   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Board Roster           Apr 2026        N/A       ✓ Current   │  │
│  │                        [History ▾]                 [Replace] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  --- UPLOAD FORM (inline on [Upload] click) ---                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Document Type: [Audit Report (A-133)___________▾]            │  │
│  │                                                              │  │
│  │ [usa-file-input]                                             │  │
│  │ Drag file here or click to upload                            │  │
│  │ Accepted: PDF, DOCX, XLSX · Max: 25MB                        │  │
│  │                                                              │  │
│  │ Expiration Date  [____/____/________]                        │  │
│  │ ℹ Why this matters: Expired credentials may block submission │  │
│  │                                                              │  │
│  │ [Upload Document]  [Cancel]                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Team and Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Sidenav: Team & Roles selected]                                    │
│                                                                     │
│  Team & Roles                               [Invite Team Member]   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Name            Email                   Role        Actions   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Priya Nair      priya@urbanhc.org  Org Admin        [Manage] │  │
│  │ Jordan Kim      jordan@urbanhc.org Proposal Lead    [Manage] │  │
│  │ Maria Santos    maria@urbanhc.org  Finance Contrib. [Manage] │  │
│  │ Sandra Okafor   sandra@urbanhc.org                           │  │
│  │ [usa-tag: AUTHORIZED REPRESENTATIVE — Submit Authority]      │  │
│  │                                         AR             [Manage] │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ [Invite Member]                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [usa-alert--info]                                                  │
│  Sandra Okafor is designated as the Authorized Representative.      │
│  Only she can certify and submit final applications.                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Profile completeness percentage | Top of profile view |
| Primary | Credential expiration warnings (if any) | Alert banner at top of Document Library |
| Primary | Authorized Representative designation | Highlighted row in Team table + info alert |
| Secondary | Required profile fields (legal name, EIN, UEI, SAM) | Main content area |
| Secondary | Document library with status per document type | Document Library view |
| Tertiary | Optional supplemental fields | Below required fields |
| Tertiary | Document version history | Expandable per row |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Profile complete | usa-progress at 100%; no warnings | "Your profile is complete" |
| Profile incomplete | usa-progress < 100%; incomplete field list | "X fields incomplete. [See what's missing →]" |
| Credential expired | usa-tag--error on document row; usa-alert--error | "This credential has expired. Update before submitting." |
| Credential expiring soon | usa-tag--warning on document row; usa-alert--warning | "Expires in X days. Update soon." |
| No AR assigned | usa-alert--warning in Team view | "No Authorized Representative assigned. Applications cannot be submitted." |
| Document uploading | Progress bar within file input | "Uploading... 67%" |
| Upload success | New version row added | "Document uploaded successfully" |
| Upload error | usa-alert--error inline | "Upload failed. File type not supported / File exceeds 25MB." |
| Edit mode | Fields become editable; Save/Cancel buttons appear | Form fields unlocked |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Left sidenav links | Links | Navigate between profile, documents, team |
| "Edit Profile" | usa-button (outline) | Unlocks profile fields for editing |
| "Save Changes" | usa-button (primary) | Saves profile; logs audit event |
| Document "Replace" | usa-button (unstyled) | Opens upload form inline |
| Document "History ▾" | usa-accordion | Expands version history for that document type |
| "Upload New Document" | usa-button (outline) | Opens upload form; prompts for document type and expiration |
| "Invite Team Member" | usa-button (outline) | Opens invite form (email + role selection) |
| Role dropdown (manage) | usa-select | Changes team member role |
| Credential expiration alert | usa-alert | Links to the relevant document row |

---
