---

# Stage 5: Eligibility Pre-Screening

*Objective: Help applicants determine whether to proceed and help grantors reduce unqualified submissions.*

---

## F24: Eligibility Pre-Screen Workflow
*Maps to: PRD-INTAKE-025 | Priority: P0 — MVP*

**Description:** Before creating an application workspace or before final submission (depending on opportunity configuration set in F9), applicants complete an eligibility pre-screen workflow. The pre-screen is driven by the grantor-configured questionnaire (F9) and evaluated against configured eligibility rules (F7, F8). This surfaces eligibility determinations early, before significant application effort is invested.

**Terminology:**
- **Pre-Screen Session:** A single applicant completion of the eligibility questionnaire for a specific opportunity
- **Pre-Screen Placement:** The point in the workflow where the questionnaire is presented — `pre_workspace` (before workspace creation) or `pre_submission` (before final submit)
- **Pre-Screen Result:** The eligibility determination returned to the applicant after questionnaire completion (Eligible, Likely Eligible, Needs Attention, Ineligible)

**Sub-features:**
- Present questionnaire at configured placement point (pre-workspace or pre-submission)
- Support conditional question display (show/hide question based on prior response — F9)
- Evaluate responses against configured eligibility rules in real time
- Return pre-screen result with rule-level explanations
- Store responses in intake record for administrative screening

**Process:**
1. Applicant clicks "Start Application" on the opportunity detail page (F16)
2. If questionnaire placement is `pre_workspace`: system presents the pre-screen questionnaire before the workspace is created
3. Applicant reads each question and selects responses
4. Conditional logic hides/shows follow-up questions based on responses
5. Applicant submits the questionnaire
6. System evaluates all responses against configured eligibility rules (F7)
7. System computes overall eligibility result state (F25) and returns result to applicant
8. Responses stored in `eligibility_responses` record linked to the opportunity and applicant org
9. If result contains Hard Blocker at `pre_workspace` enforcement: workspace creation is blocked; applicant sees blocker explanation (F26)
10. If result is Eligible, Likely Eligible, or Needs Attention (or blocker is `pre_submission` enforcement): workspace is created (F29); responses are attached to workspace
11. If placement is `pre_submission`: steps 1-10 occur when applicant clicks "Submit" instead of "Start Application"

**Inputs:**
- `opportunity_id` (UUID, required)
- `org_id` (UUID, required): Applicant organization
- `questionnaire_responses` (array, required): Array of `{question_id, selected_option_id}` for each question answered
- `placement_trigger` (enum, system): `pre_workspace | pre_submission`

**Outputs:**
- `eligibility_responses` record created with all question responses and rule evaluations
- Overall eligibility result state returned (F25)
- Triggered rule explanations returned for display (F26)
- If eligible/proceeding: workspace created or submission continues

**Validation:**
- MUST: All `is_required = true` questions MUST be answered before submission of questionnaire
- MUST: Responses MUST be stored before workspace is created or submission proceeds
- MUST: Stored responses MUST be immutable after the pre-screen session is complete; applicants cannot retroactively change responses
- SHOULD: If applicant has already completed the pre-screen for this opportunity (prior session), system SHOULD display prior result and allow applicant to retake or proceed with prior responses

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Required question unanswered | 422 | REQUIRED_QUESTION_UNANSWERED | "Please answer all required questions before continuing." |
| Questionnaire not configured | 404 | QUESTIONNAIRE_NOT_FOUND | "Eligibility questionnaire is not configured for this opportunity." |
| Opportunity intake window not open | 403 | INTAKE_WINDOW_CLOSED | "The application window for this opportunity is not currently open." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/prescreening` (get questionnaire for applicant); `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` (submit responses and get result) — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** `eligibility_responses` table (response_id, opportunity_id FK, org_id FK, workspace_id FK nullable, question_id FK, selected_option_id FK, response_text, rule_evaluation_result, overall_result, submitted_at) — see `Y0c-schema-app.md` §eligibility_responses.

---

## F25: Eligibility Result Display
*Maps to: PRD-INTAKE-026 | Priority: P0 — MVP*

**Description:** After completing the pre-screen questionnaire, applicants receive a clear eligibility result displayed as one of four states. Each state carries a distinct visual treatment using USWDS alert components and provides clear next-step guidance so applicants know whether and how to proceed.

**Terminology:**
- **Eligible:** All configured Hard Blocker rules are met; no advisory warnings triggered — applicant may proceed without restriction
- **Likely Eligible:** All Hard Blocker rules are met; one or more advisory indicators are triggered — applicant may proceed with awareness
- **Needs Attention:** One or more advisory indicators are triggered that raise significant concerns — applicant is encouraged to review before proceeding
- **Ineligible:** One or more Hard Blocker rules are violated — applicant is blocked from proceeding at the enforcement point

**Sub-features:**
- Display one of four result states with USWDS alert styling
- Show rule-level explanations for triggered blockers and advisories (F26)
- Display next-step guidance for each result state
- Allow applicant to download or print result summary

**Result State Definitions and Display:**

| Result State | Trigger Condition | USWDS Alert Type | Next Step |
|---|---|---|---|
| Eligible | No blockers triggered, no advisories triggered | Success (green) | "You appear eligible. Click 'Start Application' to proceed." |
| Likely Eligible | No blockers triggered, ≥1 advisory triggered | Warning (yellow) | "You may be eligible. Review advisory notes below before proceeding." |
| Needs Attention | No hard blockers, ≥2 advisories or high-severity advisory | Warning (yellow, prominent) | "Please review the concerns below carefully before starting your application." |
| Ineligible | ≥1 hard blocker triggered | Error (red) | "Based on your responses, you do not appear to be eligible. See explanations below." |

**Process:**
1. System receives evaluated responses from F24
2. System computes result state based on triggered rules (see table above)
3. System renders result page using USWDS Alert component (success/warning/error as applicable)
4. System displays per-rule explanations (F26) below the result summary
5. System displays next-step guidance appropriate to the result state
6. If Ineligible with `pre_workspace` enforcement: "Start Application" button is not displayed
7. If Eligible/Likely Eligible/Needs Attention: "Start Application" button is displayed (or "Continue to Submit" for `pre_submission` placement)

**Inputs:** Evaluated `eligibility_responses` record from F24.

**Outputs:**
- Rendered result page with USWDS alert component
- Per-rule explanation text displayed
- Next-step action buttons appropriate to result state
- Result state stored on `eligibility_responses.overall_result`

**Validation:**
- MUST: Result state computation MUST be deterministic and based solely on the configured rule evaluations
- MUST: Ineligible result MUST hide the "Start Application" button when `enforcement_point = pre_workspace`
- MUST: All four result states MUST use the correct USWDS alert variant
- MUST: Result page MUST be WCAG 2.1 AA accessible
- MUST: All triggered rule explanations MUST be displayed in plain language (F7 `explanation_text`)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Result computation error | 500 | RESULT_COMPUTATION_FAILED | "Eligibility result could not be computed. Please try again." |

**API Surface (this feature):** Result is returned inline from `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** `eligibility_responses.overall_result` (enum: eligible | likely_eligible | needs_attention | ineligible) — see `Y0c-schema-app.md` §eligibility_responses.

---

## F26: Eligibility Blocker Explanation
*Maps to: PRD-INTAKE-027 | Priority: P0 — MVP*

**Description:** When an eligibility pre-screen returns a blocker or advisory warning, the system explains specifically which eligibility responses caused the determination, in plain language. Applicants are not left guessing why they received a particular result. Each triggered rule displays its configured `explanation_text` and links to the relevant opportunity eligibility section.

**Sub-features:**
- Display per-rule explanation for every triggered Hard Blocker
- Display per-rule explanation for every triggered Advisory Indicator
- Link each explanation to the relevant section of the opportunity's eligibility requirements
- Distinguish blocker explanations from advisory explanations with distinct visual treatment

**Process:**
1. System evaluates questionnaire responses against rules (F24)
2. For each triggered rule (blocker or advisory), system retrieves the `explanation_text` configured in F7
3. System renders explanation list below the result state alert:
   - Hard Blockers: displayed with error icon and "Why you are ineligible:" label
   - Advisory indicators: displayed with warning icon and "Please note:" label
4. Each explanation includes a "See opportunity requirements" link pointing to the relevant section of the opportunity detail page

**Inputs:** Triggered rule evaluations from F24 with `rule_id`, `severity`, `explanation_text`.

**Outputs:**
- Per-rule explanation text displayed with appropriate icon and label
- Link to opportunity eligibility section for each triggered rule

**Validation:**
- MUST: Every triggered rule MUST display its `explanation_text`
- MUST: Hard Blocker explanations MUST be visually distinct from Advisory explanations
- MUST: Explanation text MUST be the grantor-configured `explanation_text` from the rule record (F7) — system MUST NOT generate its own explanation
- SHOULD: If multiple blockers are triggered, all MUST be displayed (not just the first)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Explanation text missing for rule | 500 | EXPLANATION_TEXT_MISSING | "Rule explanation text is missing. Contact the grantor for eligibility details." |

**API Surface (this feature):** Included in response from `POST /api/v1/opportunities/{opportunity_id}/prescreening/submit` as `triggered_rules` array — see `Y1c-api-application.md` §Pre-Screening.

**Schema Surface (this feature):** Reads from `eligibility_rules.explanation_text` — see `Y0a-schema-core.md` §eligibility_rules.

---

## F28: Eligibility Response Storage
*Maps to: PRD-INTAKE-029 | Priority: P0 — MVP*

**Description:** All eligibility pre-screen responses are stored as part of the intake record and carried forward into the administrative screening phase. Intake administrators can review eligibility responses alongside the submitted application without asking applicants to repeat information. Responses are included in the submission snapshot (F52).

**Sub-features:**
- Store all question responses and rule evaluations in the intake record at time of pre-screen
- Attach stored responses to the application workspace
- Display stored responses in intake administrator screening panel (F56)
- Include responses in submission snapshot

**Process:**
1. Applicant submits questionnaire (F24)
2. System stores `eligibility_responses` record with all responses and evaluations
3. Record is linked to `opportunity_id`, `org_id`, and (once created) `workspace_id`
4. At submission (F52), responses are included in the submission snapshot JSONB
5. In the intake queue (F56), responses are displayed in a structured format alongside the application

**Inputs:** All question responses and rule evaluations from F24.

**Outputs:**
- `eligibility_responses` records per question per session
- Responses accessible in intake administrator screening panel
- Responses included in `submission_snapshots.eligibility_snapshot` JSONB

**Validation:**
- MUST: Responses MUST be stored before workspace creation or submission proceeds
- MUST: Stored responses MUST be immutable
- MUST: Responses MUST be included in the submission snapshot
- MUST: Responses MUST be visible to intake administrators in the screening panel

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Response storage failure | 500 | RESPONSE_STORAGE_FAILED | "Eligibility responses could not be saved. Please try again." |

**API Surface (this feature):** `GET /api/v1/workspaces/{workspace_id}/eligibility-responses` (get stored responses for intake admin view) — see `Y1c-api-application.md` §Eligibility Responses.

**Schema Surface (this feature):** `eligibility_responses` table — see `Y0c-schema-app.md` §eligibility_responses.
