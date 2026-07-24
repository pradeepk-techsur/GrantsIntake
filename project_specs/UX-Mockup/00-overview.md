# UX Mockup: GrantsIntake

**Project:** GrantsIntake — Dual-Sided Grants Lifecycle Management Platform
**Module:** Grants Intake
**Generated:** July 24, 2026
**Design Standard:** USWDS (U.S. Web Design System) — https://designsystem.digital.gov/
**Accessibility:** Section 508 / WCAG 2.1 AA
**Based on:** UserStories-GrantsIntake.md, PRD-GrantsIntake.md, FRD-GrantsIntake.md, JOURNEYS-GrantsIntake.md

---

## Overview

GrantsIntake is a dual-sided platform connecting grantors and applicants across the complete grants intake lifecycle. The UX is designed around two distinct portals sharing a common USWDS design language, strict data visibility boundaries, and a workflow-driven information architecture that surfaces the right action at the right moment.

### Design Principles

1. **Structured over document-only** — Forms, fields, and tables capture data instead of uploaded PDFs wherever possible. USWDS form components enforce this.
2. **Early validation, not last-minute surprises** — Blocking errors appear as the applicant drafts, not at the submit button. The Readiness Dashboard is the persistent north star.
3. **Plain language throughout** — Every label, error, and guidance prompt follows USWDS plain-language standards. Grade-level indicators support grantors writing opportunity descriptions.
4. **Private work stays private** — A clear visual vocabulary distinguishes Grantee-private content (blue/gray badge), Shared transaction content (no special badge), and Grantor-private content (purple badge). No cross-zone leakage.
5. **Audit trail as primary user value** — Timestamps, version labels, confirmation numbers, and immutable receipts are prominently surfaced — not buried in settings. These are trust-building features, not compliance checkboxes.
6. **Progressive disclosure** — Complex configuration (eligibility rules, conditional logic, budget justification) is reached through a clear information hierarchy: essential fields first, advanced options behind collapsible panels or secondary steps.
7. **Role clarity at every gate** — Role-based UI locks (e.g., Submit button only active for Authorized Representative) are communicated proactively, not as failure states.

### Design System Components in Use

| Component | Use |
|-----------|-----|
| `usa-button` (primary, secondary, outline) | Primary CTAs, secondary actions, destructive actions |
| `usa-alert` (success, warning, error, info) | Eligibility results, validation messages, addendum notices |
| `usa-form`, `usa-form-group`, `usa-input` | All form fields, metadata capture, budget entry |
| `usa-table` | Intake queue, budget line items, version history, role management |
| `usa-card` | Opportunity discovery results, application workspace section cards |
| `usa-step-indicator` | Multi-step flows (eligibility pre-screen, submission certification) |
| `usa-breadcrumb` | All interior pages |
| `usa-accordion` | Guidance prompts, eligibility rule groups, FAQ/Q&A |
| `usa-sidenav` | Opportunity Builder left rail, Application Workspace section navigator |
| `usa-banner` | US government header banner (required on all pages) |
| `usa-tag` | Status badges (Open, Closing Soon, Draft, Submitted, etc.) |
| `usa-progress` | Section completion indicators, overall readiness percentage |
| `usa-modal` | Confirmation dialogs (Publish, Submit, Delete) |
| `usa-process-list` | Publication readiness checklist |
| `usa-file-input` | Attachment uploads |
| `usa-pagination` | Intake queue, search results |

### Portal Architecture

```
GrantsIntake Platform
│
├── Grantor Portal (authenticated)
│   ├── Grantor Dashboard (F61)
│   ├── Opportunity Builder (F0–F12)
│   │   ├── Metadata Editor
│   │   ├── Eligibility Rule Builder
│   │   ├── Pre-Screening Questionnaire Builder
│   │   ├── Timeline & Deadlines
│   │   ├── Attachment Requirements
│   │   ├── Admin Screening Criteria
│   │   └── Publication Readiness Checklist
│   ├── Q&A Manager (F43–F46)
│   └── Intake Queue / Screening Panel (F55–F60)
│
├── Applicant Portal (public + authenticated)
│   ├── Opportunity Discovery (F13–F14) — PUBLIC
│   ├── Published Opportunity Page (F16–F17) — PUBLIC + AUTHENTICATED
│   ├── Applicant Dashboard (F62) — AUTHENTICATED
│   ├── Organization Profile Manager (F18–F23) — AUTHENTICATED
│   ├── Eligibility Pre-Screen (F24–F28) — AUTHENTICATED
│   ├── Application Workspace (F29–F42) — AUTHENTICATED / GRANTEE-PRIVATE
│   │   ├── Section Navigator
│   │   ├── Form Section Editor
│   │   ├── Budget Builder
│   │   ├── Attachments Manager
│   │   ├── Readiness Dashboard (F34)
│   │   └── Submission Preview (F42)
│   └── Submission Certification & Receipt (F51–F52) — AUTHENTICATED
│
└── Shared / Public
    ├── Published Opportunity Page
    ├── Q&A View (F44, F46)
    └── Application Status Tracker (F62)
```

---

## Navigation Map

| Screen | Route | Reached from | Nav element |
|--------|-------|--------------|-------------|
| Grantor Dashboard | `/grantor/dashboard` | App shell (post-login) | Top nav: "Dashboard" |
| Opportunity Builder — New | `/grantor/opportunities/new` | Grantor Dashboard | Button: "Create New Opportunity" |
| Opportunity Builder — Edit | `/grantor/opportunities/{id}/edit` | Grantor Dashboard opportunity list | Table row: opportunity title link |
| Opportunity Builder — Metadata | `/grantor/opportunities/{id}/edit/metadata` | Opportunity Builder | Left sidenav: "Opportunity Details" |
| Opportunity Builder — Eligibility | `/grantor/opportunities/{id}/edit/eligibility` | Opportunity Builder | Left sidenav: "Eligibility Rules" |
| Eligibility Rule Builder | `/grantor/opportunities/{id}/edit/eligibility/rules` | Eligibility section | Button: "Add Rule" |
| Pre-Screening Questionnaire Builder | `/grantor/opportunities/{id}/edit/eligibility/questionnaire` | Eligibility section | Tab: "Pre-Screening Questionnaire" |
| Opportunity Builder — Deadlines | `/grantor/opportunities/{id}/edit/deadlines` | Opportunity Builder | Left sidenav: "Timeline & Deadlines" |
| Opportunity Builder — Attachments | `/grantor/opportunities/{id}/edit/attachments` | Opportunity Builder | Left sidenav: "Required Attachments" |
| Opportunity Builder — Admin Screening | `/grantor/opportunities/{id}/edit/screening` | Opportunity Builder | Left sidenav: "Screening Criteria" |
| Publication Readiness Check | `/grantor/opportunities/{id}/readiness` | Opportunity Builder | Sidebar checklist CTA / Button: "Check Readiness" |
| Opportunity Version History | `/grantor/opportunities/{id}/versions` | Opportunity Builder | Link: "Version History" |
| Q&A Manager | `/grantor/opportunities/{id}/qa` | Grantor Dashboard / Opportunity Builder | Left sidenav: "Q&A" / Dashboard link |
| Intake Queue Dashboard | `/grantor/intake` | Grantor Dashboard | Top nav: "Intake Queue" |
| Administrative Screening Panel | `/grantor/intake/{submission_id}` | Intake Queue Dashboard | Table row: applicant name link |
| Opportunity Discovery | `/opportunities` | Public nav / App shell | Top nav: "Find Opportunities" |
| Published Opportunity Page | `/opportunities/{slug}` | Opportunity Discovery results | Card: opportunity title link |
| Applicant Dashboard | `/applicant/dashboard` | App shell (post-login) | Top nav: "My Applications" |
| Organization Profile Manager | `/applicant/organization/profile` | Applicant Dashboard | Top nav: "Organization" → "Profile" |
| Document Library | `/applicant/organization/documents` | Organization Profile Manager | Sidenav: "Document Library" |
| Team & Roles Manager | `/applicant/organization/team` | Organization Profile Manager | Sidenav: "Team & Roles" |
| Eligibility Pre-Screen | `/applicant/opportunities/{id}/pre-screen` | Published Opportunity Page | Button: "Check My Eligibility" / "Start Application" |
| Eligibility Result Page | `/applicant/opportunities/{id}/pre-screen/result` | Eligibility Pre-Screen | Automatic on questionnaire completion |
| Application Workspace | `/applicant/applications/{workspace_id}` | Applicant Dashboard / Opportunity Page | Card: "Continue Application" / Button: "Start Application" |
| Workspace Section Editor | `/applicant/applications/{workspace_id}/sections/{section_id}` | Application Workspace | Section navigator: section name link |
| Budget Builder | `/applicant/applications/{workspace_id}/budget` | Application Workspace | Section navigator: "Budget" |
| Readiness Dashboard | `/applicant/applications/{workspace_id}/readiness` | Application Workspace | Persistent sidebar / Button: "Check Readiness" |
| Submission Preview | `/applicant/applications/{workspace_id}/preview` | Application Workspace / Readiness Dashboard | Button: "Preview Submission Package" |
| Submission Certification | `/applicant/applications/{workspace_id}/certify` | Readiness Dashboard | Button: "Certify & Submit" (AR only) |
| Submission Receipt | `/applicant/applications/{workspace_id}/receipt` | Submission Certification | Automatic on successful submission |
| Application Status Tracker | `/applicant/applications/{workspace_id}/status` | Applicant Dashboard | Card: "View Status" |

**Invariant — no orphan screens:** Every screen listed above is reachable from either the authenticated app shell (top nav / sidenav) or a clearly identified parent screen. All public screens are reachable from the public navigation.

---
