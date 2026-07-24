# Screen-05: Eligibility Pre-Screen and Result

**Routes:**
- Pre-Screen: `/applicant/opportunities/{id}/pre-screen`
- Result: `/applicant/opportunities/{id}/pre-screen/result`

**Purpose:** Jordan completes a guided questionnaire to determine eligibility before investing time in the application.
**User Stories:** US-5.1, US-5.2, US-5.3
**Features:** F24, F25, F26
**Personas:** Jordan Kim (Proposal Lead)

---

## Layout — Eligibility Pre-Screen Questionnaire

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-banner]                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Logo]  Find Opportunities  My Applications  ▾Jordan Kim            │
├─────────────────────────────────────────────────────────────────────┤
│ [usa-breadcrumb] Home > Community Resilience Grant > Eligibility    │
│                                                                     │
│  Check Your Eligibility                                             │
│  Community Resilience Grant — HHS                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [usa-step-indicator]                                        │  │
│  │  Step 2 of 4: Organization Type                              │  │
│  │  ●─────────●─────────○─────────○                             │  │
│  │  Basics  Org Type  SAM/UEI   Geography                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  What type of organization is applying?                      │  │
│  │                                                              │  │
│  │  Select the option that best describes your organization.    │  │
│  │                                                              │  │
│  │  ○ Nonprofit 501(c)(3)                                       │  │
│  │  ○ Nonprofit (other tax-exempt)                              │  │
│  │  ○ Government — State or Local                               │  │
│  │  ○ Government — Tribal                                       │  │
│  │  ○ University or College                                     │  │
│  │  ○ For-profit organization                                   │  │
│  │  ○ Individual                                                │  │
│  │  ○ Other                                                     │  │
│  │                                                              │  │
│  │  [← Back]                        [Next: SAM Registration →]  │  │
│  │  (disabled if no answer selected)                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Your answers are saved privately and not visible to the grantor    │
│  until you complete this questionnaire.                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Eligibility Result: Eligible

```
┌─────────────────────────────────────────────────────────────────────┐
│ [usa-breadcrumb] Home > Community Resilience Grant > Eligibility    │
│                                                                     │
│  Eligibility Check Complete                                         │
│  Community Resilience Grant                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--success]                                         │  │
│  │                                                              │  │
│  │ ✓  You appear to meet the eligibility requirements.          │  │
│  │                                                              │  │
│  │ Based on your answers, your organization appears eligible    │  │
│  │ for this opportunity. You may proceed to start your          │  │
│  │ application.                                                 │  │
│  │                                                              │  │
│  │ [Start Application]                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Summary of your responses:                                         │
│  · Organization type: Nonprofit 501(c)(3) ✓                        │
│  · SAM registered: Yes ✓                                            │
│  · Location: Illinois (Midwest region) ✓                            │
│  · Prior exclusion: No ✓                                            │
│                                                                     │
│  [Review the full eligibility requirements →]                       │
│  [Return to opportunity]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layout — Eligibility Result: Needs Attention (Advisory Warning)

```
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--warning]                                         │  │
│  │                                                              │  │
│  │ ⚠  You may be eligible, but please review the items below.   │  │
│  │                                                              │  │
│  │ Your answers indicate you may qualify, but one or more items │  │
│  │ require your attention. You may proceed, but reviewers will  │  │
│  │ see these items.                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Items to review:                                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ⚠ Nonprofit status — advisory                                │  │
│  │                                                              │  │
│  │ Your answer: Nonprofit (other tax-exempt)                    │  │
│  │                                                              │  │
│  │ "Nonprofit organizations with 501(c)(3) status are preferred │  │
│  │ for this program. Other nonprofit types may apply but should │  │
│  │ be prepared to document their tax-exempt status."            │  │
│  │                                                              │  │
│  │ [View eligibility section of the opportunity →]             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Proceed with Awareness]   [Return to opportunity]                 │
```

---

## Layout — Eligibility Result: Ineligible (Hard Blocker)

```
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [usa-alert--error]                                           │  │
│  │                                                              │  │
│  │ ✗  You do not meet the eligibility requirements.             │  │
│  │                                                              │  │
│  │ Based on your answers, your organization does not meet one   │  │
│  │ or more required eligibility criteria. You are not able to   │  │
│  │ start an application for this opportunity at this time.      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Why you are not eligible:                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✗ SAM Registration — required                                │  │
│  │                                                              │  │
│  │ Your answer: Not registered in SAM.gov                       │  │
│  │                                                              │  │
│  │ "Your organization must be registered in SAM.gov before you  │  │
│  │ can apply for this federal opportunity. SAM registration is  │  │
│  │ required by 2 CFR 200.206. Registration can take up to 3-4   │  │
│  │ weeks."                                                      │  │
│  │                                                              │  │
│  │ [View eligibility requirements →]                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✗ Geographic Restriction — required                          │  │
│  │                                                              │  │
│  │ Your answer: Florida (Southeast region)                      │  │
│  │                                                              │  │
│  │ "This opportunity is limited to organizations operating in   │  │
│  │ the Midwest region (IL, IN, OH, MI, WI, MN, IA, MO)."       │  │
│  │ [View eligibility requirements →]                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Return to opportunity listing]   [Find other opportunities]      │
```

---

## Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Step indicator (progress through questionnaire) | Top of questionnaire |
| Primary | Current question + response options | Center of screen |
| Primary | Eligibility result (success / warning / error) | Top of result page |
| Secondary | Per-rule explanations (why each triggered) | Below result alert |
| Secondary | Summary of all responses | Result page |
| Tertiary | Link to eligibility section of opportunity | Per rule item + footer |

---

## States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Question unanswered | "Next" button disabled | "Please select an answer to continue" |
| Conditional question visible | Question appears below parent answer | Smooth expansion (no page reload) |
| Conditional question hidden | Question not visible | No error for hidden questions |
| Loading results | Spinner after final question answered | "Calculating your eligibility..." |
| Eligible | usa-alert--success | "Start Application" button active |
| Likely Eligible | usa-alert--success (with advisory note) | "Start Application" button active |
| Needs Attention | usa-alert--warning | "Proceed with Awareness" button active |
| Ineligible | usa-alert--error | No workspace button; back to listing link |
| All blockers shown | All triggered rules listed individually | Multiple usa-alert--error items |

---

## Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Radio buttons (single-select) | usa-radio | Selects answer; may show/hide conditional questions |
| Checkboxes (multi-select) | usa-checkbox | For multi-value questions (e.g., select all that apply) |
| "Back" button | usa-button (unstyled) | Returns to prior question (answers preserved) |
| "Next" button | usa-button (primary) | Advances to next question (disabled until answer selected) |
| "Start Application" | usa-button (primary) | Creates workspace; navigates to Application Workspace |
| "Proceed with Awareness" | usa-button (secondary) | Creates workspace despite advisory warnings |
| "View eligibility requirements" | Link | Opens opportunity detail page, scrolled to eligibility section |
| "Find other opportunities" | usa-button (outline) | Returns to Opportunity Discovery |

---
