# Screen-07: Readiness Dashboard, Submission Preview, Certification, and Receipt

**Routes:**
- Readiness Dashboard: `/applicant/applications/{workspace_id}/readiness`
- Submission Preview: `/applicant/applications/{workspace_id}/preview`
- Certification: `/applicant/applications/{workspace_id}/certify`
- Receipt: `/applicant/applications/{workspace_id}/receipt`

**Purpose:** Final submission readiness check, package review, certification by Authorized Representative, and immutable receipt.
**User Stories:** US-6.5, US-7.7, US-9.2, US-9.3, US-9.4, US-9.5, US-9.6, US-9.7
**Features:** F34, F42, F49, F50, F51, F52, F53, F54
**Personas:** Jordan Kim (Proposal Lead), Sandra Okafor (Authorized Representative)

---

## Layout — Readiness Dashboard (Full View)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  My Applications  Organization  ▾Sandra Okafor               │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > My Applications > Community Resilience Grant│
│                                                                     │
│  Submission Readiness                                               │
│  Community Resilience Grant                   Deadline: 3 days      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--success]                                         │  │
│  │ ✓ Your application is ready to submit. All blocking errors   │  │
│  │ have been resolved.                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Overall Completion                                                 │
│  [usa-progress: 100%]  All sections complete                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SECTION COMPLETION                                           │  │
│  │ Organization Profile  ████████████████ 100% ✓               │  │
│  │ Eligibility           ████████████████ 100% ✓               │  │
│  │ Narrative             ████████████████ 100% ✓               │  │
│  │ Budget                ████████████████ 100% ✓               │  │
│  │ Workplan              ████████████████ 100% ✓               │  │
│  │ Attachments           ████████████████ 100% ✓               │  │
│  │ Certifications        ████████████████ 100% ✓               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ BLOCKING ERRORS        ✓ None — all cleared                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ WARNINGS (1 — advisory only, do not block submission)        │  │
│  │ ⚠ SAM registration expires Dec 15, 2026 (5 months away)      │  │
│  │   [Update your SAM registration →]                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ REQUIRED ATTACHMENTS   ✓ All required attachments present    │  │
│  │ ✓ IRS Determination Letter                                   │  │
│  │ ✓ W-9                                                        │  │
│  │ ✓ Audit Report (A-133)                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ AUTHORIZED REPRESENTATIVE                                    │  │
│  │ ✓ Sandra Okafor — Assigned and confirmed                     │  │
│  │   Executive Director · sandra@urbanhealthcollab.org           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Preview Submission Package]                                       │
│                                                                     │
│  [Certify & Submit Application]  ← Active for Sandra (AR only)     │
│  [usa-tooltip for non-AR users: "Only the Authorized Representative │
│   can certify and submit this application."]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Submission Preview (Read-Only)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
│                                                                     │
│  Submission Package Preview                     [Print]  [Close ×] │
│  Community Resilience Grant — Urban Health Collaborative            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--info]                                            │  │
│  │ This is a read-only preview. Submitting requires returning   │  │
│  │ to the Readiness Dashboard and clicking "Certify & Submit."  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ORGANIZATION PROFILE                                               │
│  Legal Name: Urban Health Collaborative                             │
│  EIN: 83-4521766 · UEI: UJKL8923MN01                               │
│  Entity Type: Nonprofit 501(c)(3)                                   │
│  Address: 1200 Oak Avenue, Chicago, IL 60601                        │
│                                                                     │
│  ELIGIBILITY                                                        │
│  Pre-screen result: Eligible                                        │
│  (All responses documented)                                         │
│                                                                     │
│  NARRATIVE                                                          │
│  Statement of Need: [full text]                                     │
│  Project Description: [full text]                                   │
│                                                                     │
│  BUDGET SUMMARY                                                     │
│  Personnel:          $125,000                                       │
│  Fringe (28%):       $35,000                                        │
│  Travel:             $8,500                                         │
│  Supplies:           $12,000                                        │
│  Indirect (15%):     $22,125                                        │
│  Other:              $160,375                                       │
│  ────────────────────────────                                       │
│  TOTAL REQUEST:      $363,000                                       │
│  COST SHARE (20%):   $72,600                                        │
│                                                                     │
│  ATTACHMENTS                                                        │
│  ✓ IRS Determination Letter (Jun 2021 · 2.1 MB)                    │
│  ✓ W-9 (Jan 2026 · 180 KB)                                         │
│  ✓ Audit Report (Mar 2024 · 5.4 MB)                                │
│                                                                     │
│  [Return to Readiness Dashboard]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Certification Screen

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > My Applications > Community Resilience...   │
│                                                                     │
│  Authorized Representative Certification                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │ You are certifying this application as:                      │  │
│  │ Sandra Okafor, Executive Director                            │  │
│  │ Urban Health Collaborative                                   │  │
│  │                                                              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                              │  │
│  │ CERTIFICATION STATEMENT                                      │  │
│  │                                                              │  │
│  │ I certify that, to the best of my knowledge and belief,      │  │
│  │ the information in this application is true and correct.     │  │
│  │ I further certify that the organization is in compliance     │  │
│  │ with all applicable federal statutes and regulations,        │  │
│  │ including requirements related to debarment, suspension,     │  │
│  │ drug-free workplace, and non-discrimination. The filing of   │  │
│  │ this application authorizes the use of funds for the purposes│  │
│  │ set forth in the application, if awarded.                    │  │
│  │                                                              │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │                                                              │  │
│  │ ☐ I have read and agree to the above certification statement │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Submit Application]  ← enabled only after checkbox checked        │
│  [Cancel — Return to Readiness Dashboard]                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Submission Receipt

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
│                                                                     │
│  [usa-alert--success]                                               │
│  ✓ Your application has been submitted successfully.                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  SUBMISSION RECEIPT                                          │  │
│  │                                                              │  │
│  │  Confirmation Number:                                        │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  CRG-2026-0042                                         │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  Opportunity:   Community Resilience Grant                   │  │
│  │  Organization:  Urban Health Collaborative                   │  │
│  │  Submitted by:  Sandra Okafor (Authorized Representative)    │  │
│  │  Submitted:     July 24, 2026, 16:42:07 UTC                  │  │
│  │  Status:        Submitted — Awaiting Administrative Screening│  │
│  │                                                              │  │
│  │  [Download Receipt (PDF)]                                   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  What happens next?                                                 │
│  Your application will be reviewed by the grantor's intake team.   │
│  You will receive a notification when a disposition is applied.    │
│                                                                     │
│  [Return to My Dashboard]                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Alert: ready/blocking (readiness), read-only notice (preview), confirmation number (receipt) | Top of each screen |
| Primary | Certify & Submit button — active for AR only | Bottom of Readiness Dashboard |
| Primary | Certification statement — must be read and acknowledged | Center of certification screen |
| Secondary | Section completion breakdown | Readiness Dashboard |
| Secondary | Attachment and AR status | Readiness Dashboard panels |
| Secondary | Full application content (preview) | Submission Preview (scrollable) |
| Tertiary | Warnings (advisory only) | Readiness Dashboard, below blockers |
| Tertiary | "What happens next" | Receipt page footer |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Blocking errors remain | usa-alert--error in Readiness Dashboard | Submit button disabled |
| Ready to submit | usa-alert--success in Readiness Dashboard | Submit button active (for AR) |
| Non-AR user | Submit button disabled with tooltip | "Only the Authorized Representative can submit" |
| Certification checkbox unchecked | Submit button disabled | Checkbox is required |
| Certification checkbox checked | Submit button enabled | Submit available |
| Submission processing | Loading spinner | "Submitting your application..." |
| Submission successful | usa-alert--success + receipt | Confirmation number shown prominently |
| Submission failed | usa-alert--error | "Submission failed. Please try again or contact support." |
| Post-submission (workspace) | All fields read-only | Lock notice: "Submitted on [date]" |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| "Preview Submission Package" | usa-button (outline) | Opens preview page (read-only) |
| "Certify & Submit Application" | usa-button (primary) — AR only | Navigates to certification screen |
| Certification checkbox | usa-checkbox | Must be checked to enable submit |
| "Submit Application" | usa-button (primary) | Opens confirmation modal |
| Confirmation modal "Confirm Submit" | usa-modal confirm | Executes final submission |
| "Download Receipt (PDF)" | usa-button (primary) | Downloads generated PDF receipt |
| "Return to My Dashboard" | usa-button (outline) | Returns to Applicant Dashboard |
| "Print" (preview) | usa-button (unstyled) | Print-friendly layout |

---
