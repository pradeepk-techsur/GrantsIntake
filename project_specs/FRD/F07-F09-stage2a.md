---

# Stage 2: Eligibility and Intake Rules Configuration

*Objective: Allow grantors to convert eligibility and submission requirements into enforceable system rules.*

---

## F7: Eligibility Rule Definition
*Maps to: PRD-INTAKE-008 | Priority: P0 — MVP*

**Description:** Grantors define structured eligibility rules that the system enforces during applicant pre-screening (Stage 5). Rules are configured per opportunity and can target applicant type, geographic location, entity status, UEI/SAM registration requirement, nonprofit status, tribal status, state/local status, prior award history, match requirement, and program-specific custom criteria. Rules are the authoritative source for eligibility determinations and are stored as structured data, not narrative text.

**Terminology:**
- **Eligibility Rule:** A discrete, configured criterion that determines whether an applicant is eligible for a funding opportunity
- **Rule Criterion:** The specific condition the rule evaluates (e.g., applicant type = "nonprofit", geography = "Texas")
- **Rule Operator:** The comparison logic applied to the criterion (e.g., equals, includes, greater than)
- **Rule Group:** A logical grouping of rules combined with AND/OR logic
- **Match Requirement:** A cost-share or matching funds requirement expressed as a percentage or fixed amount

**Sub-features:**
- Create eligibility rules by rule type (applicant type, geography, entity status, UEI/SAM, nonprofit, tribal, state/local, prior award, match requirement, custom)
- Group rules with AND/OR logic
- Configure each rule as Hard Blocker or Advisory Indicator (F8)
- Assign plain-language explanation text to each rule (displayed to applicants when triggered)
- Duplicate eligibility rules from a prior opportunity within the same program

**Process:**
1. Grantor navigates to the Eligibility Rules section of the Opportunity Builder
2. Grantor selects "Add Rule" and chooses rule type from the available rule type library
3. For each rule, grantor configures: criterion, operator, value(s), severity (Hard Blocker or Advisory), and plain-language explanation
4. Rules can be grouped with AND/OR operators for compound eligibility logic
5. Grantor may preview the eligibility questionnaire as it will appear to applicants
6. Rules are saved to the `eligibility_rules` table linked to the opportunity
7. Rules are evaluated in order; all Hard Blockers must pass for applicant to proceed (when blocker mode is configured to prevent workspace creation)

**Inputs:**
- `opportunity_id` (UUID, required): Opportunity this rule belongs to
- `rule_type` (enum, required): `applicant_type | geography | entity_status | uei_sam | nonprofit_status | tribal_status | state_local_status | prior_award_status | match_requirement | custom`
- `criterion_field` (string, required): The field being evaluated (e.g., `applicant_type`, `state`, `sam_registered`)
- `operator` (enum, required): `equals | not_equals | includes | excludes | greater_than | less_than | is_true | is_false`
- `criterion_value` (string | string[] | number, required): The value(s) for comparison
- `severity` (enum, required): `hard_blocker | advisory`
- `explanation_text` (text, required, max 500 chars): Plain-language text shown to applicants when this rule triggers
- `rule_group_id` (UUID, optional): Logical group membership for AND/OR logic
- `rule_group_operator` (enum, optional): `AND | OR` — logic for combining rules within a group
- `display_order` (integer, required): Order in which rule is evaluated and displayed

**Outputs:**
- New `eligibility_rules` record linked to the opportunity
- Eligibility questionnaire preview updated
- Audit event: `ELIGIBILITY_RULE_CREATED` with rule details, timestamp, user

**Validation:**
- MUST: At least one eligibility rule MUST be configured before an opportunity can be published (enforced by F5)
- MUST: Each rule MUST have `severity` set to either `hard_blocker` or `advisory`
- MUST: `explanation_text` MUST be provided for every rule
- MUST: `criterion_value` MUST be a valid value for the `criterion_field` type (e.g., US state codes for geography rules)
- MUST: `operator` MUST be compatible with the `criterion_field` type (e.g., `greater_than` only valid for numeric fields)
- SHOULD: Each rule group MUST have a defined `rule_group_operator`
- MAY: Custom rules MAY use free-form criterion definitions but MUST still have severity and explanation

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Invalid operator for field type | 422 | INVALID_RULE_OPERATOR | "Operator '{operator}' is not valid for field type '{criterion_field}'." |
| Missing explanation text | 422 | EXPLANATION_REQUIRED | "Plain-language explanation text is required for each eligibility rule." |
| Invalid criterion value | 422 | INVALID_CRITERION_VALUE | "Value '{value}' is not valid for criterion '{criterion_field}'." |
| Rule not found | 404 | RULE_NOT_FOUND | "Eligibility rule not found." |
| Opportunity not in editable state | 409 | OPPORTUNITY_NOT_EDITABLE | "Eligibility rules can only be modified on draft or modification-draft opportunities." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/eligibility-rules` (list); `POST /api/v1/opportunities/{opportunity_id}/eligibility-rules` (create); `PUT /api/v1/eligibility-rules/{rule_id}` (update); `DELETE /api/v1/eligibility-rules/{rule_id}` (delete) — see `Y1a-api-opportunity.md` §Eligibility Rules.

**Schema Surface (this feature):** Uses `eligibility_rules` table (rule_id, opportunity_id FK, rule_type, criterion_field, operator, criterion_value JSONB, severity, explanation_text, rule_group_id, rule_group_operator, display_order, created_by, created_at) — see `Y0a-schema-core.md` §eligibility_rules.

---

## F8: Hard Eligibility Blockers vs. Advisory Fit Indicators
*Maps to: PRD-INTAKE-009 | Priority: P0 — MVP*

**Description:** The system distinguishes between two classes of eligibility rule severity: Hard Blockers and Advisory Fit Indicators. Hard Blockers prevent the applicant from creating a workspace or submitting (depending on opportunity configuration). Advisory Indicators warn the applicant but allow them to proceed. The grantor configures the severity and enforcement point for each rule.

**Terminology:**
- **Hard Blocker:** An eligibility rule violation that, when triggered, either prevents workspace creation or prevents final submission (depending on `enforcement_point` configuration)
- **Advisory Fit Indicator:** An eligibility rule concern that displays a warning to the applicant but does not prevent them from proceeding
- **Enforcement Point:** Where a Hard Blocker is enforced — either at workspace creation (pre-workspace) or at final submission (pre-submission)
- **Eligibility Result State:** The overall determination displayed to the applicant (Eligible, Likely Eligible, Needs Attention, Ineligible)

**Sub-features:**
- Grantor configures severity (hard_blocker or advisory) per rule (F7)
- Grantor configures enforcement point (pre-workspace or pre-submission) per Hard Blocker rule
- System evaluates all rules and computes overall eligibility result state
- System displays distinct visual treatment for blockers vs. warnings (USWDS alert components)
- Blocker prevents workspace creation or submission based on enforcement_point

**Process:**
1. Applicant completes the eligibility pre-screen questionnaire (F24)
2. System evaluates all configured eligibility rules against applicant responses
3. For each triggered rule:
   - Hard Blocker: severity = `hard_blocker` → result classified as Ineligible; explanation displayed prominently
   - Advisory: severity = `advisory` → result classified as Needs Attention; warning displayed
4. Overall result state computed (see F25 for display logic)
5. If result contains any Hard Blocker and `enforcement_point = pre_workspace`: workspace creation button is disabled; applicant cannot proceed
6. If result contains any Hard Blocker and `enforcement_point = pre_submission`: workspace may be created, but submission is blocked; blocker displayed in readiness dashboard (F34)
7. Advisory indicators displayed as warnings in the workspace readiness dashboard throughout the application process

**Inputs:**
- `rule_id` (UUID, from F7): Eligibility rule record
- `severity` (enum): `hard_blocker | advisory` — set on rule record in F7
- `enforcement_point` (enum, required for hard_blockers): `pre_workspace | pre_submission`

**Outputs:**
- Per-rule severity classification stored on `eligibility_rules` record
- Eligibility evaluation result stored on `eligibility_responses` record per applicant session
- Visual display: USWDS Error alert for Hard Blockers; USWDS Warning alert for Advisory indicators

**Validation:**
- MUST: Every Hard Blocker rule MUST have an `enforcement_point` configured
- MUST: System MUST prevent workspace creation when `enforcement_point=pre_workspace` and a Hard Blocker is triggered
- MUST: System MUST prevent submission when `enforcement_point=pre_submission` and a Hard Blocker is triggered
- MUST: Advisory indicators MUST NOT prevent workspace creation or submission
- MUST: Visual treatment MUST be distinct — Hard Blocker uses USWDS Error alert (red); Advisory uses USWDS Warning alert (yellow)
- SHOULD: When multiple Hard Blockers are triggered, all MUST be displayed, not just the first

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Hard blocker triggered at workspace creation | 403 | ELIGIBILITY_HARD_BLOCK | "You are not eligible for this opportunity. {explanation_text}" |
| Hard blocker triggered at submission | 422 | ELIGIBILITY_SUBMISSION_BLOCK | "This application cannot be submitted due to eligibility requirements. {explanation_text}" |
| Enforcement point not configured | 422 | ENFORCEMENT_POINT_REQUIRED | "Hard blocker rules must have an enforcement point configured." |

**API Surface (this feature):** Rule severity and enforcement_point are attributes on the eligibility rule record (F7 API). Eligibility evaluation result is returned by `POST /api/v1/applications/{workspace_id}/eligibility/evaluate` — see `Y1c-api-application.md` §Eligibility Evaluation.

**Schema Surface (this feature):** `eligibility_rules.severity`, `eligibility_rules.enforcement_point` columns. Evaluation results stored in `eligibility_responses` table — see `Y0a-schema-core.md` §eligibility_rules, `Y0c-schema-app.md` §eligibility_responses.

---

## F9: Configurable Pre-Screening Questionnaires
*Maps to: PRD-INTAKE-010 | Priority: P0 — MVP*

**Description:** Grantors configure the pre-screening questionnaire that applicants complete before accessing the application workspace (or before submission, depending on opportunity configuration). Each question is mapped to one or more eligibility rules, and responses drive the eligibility determination. All responses are stored as part of the intake record and carried into administrative screening.

**Terminology:**
- **Pre-Screen Question:** A single question in the eligibility pre-screening questionnaire
- **Question-Rule Mapping:** The association between a question's response and one or more eligibility rules it evaluates
- **Response Option:** A selectable answer choice for a multiple-choice question
- **Questionnaire Placement:** The point in the applicant workflow where the pre-screen is presented (pre-workspace or pre-submission)

**Sub-features:**
- Build questionnaire by adding questions mapped to configured eligibility rules (F7)
- Configure question display order and conditional logic (show/hide question based on prior response)
- Configure questionnaire placement (before workspace creation or before submission)
- Preview questionnaire as it will appear to applicants
- Store applicant responses in intake record

**Process:**
1. Grantor opens the Pre-Screening Questionnaire builder in the Opportunity Builder
2. System displays existing eligibility rules as candidate questions
3. Grantor adds questions by selecting a rule and configuring the question text and response options
4. Each response option is mapped to a specific eligibility rule evaluation outcome (e.g., response "Yes" → rule evaluates as met; "No" → rule evaluates as violated)
5. Grantor sets display order and optional conditional logic (e.g., show question 3 only if question 2 = "Yes")
6. Grantor selects questionnaire placement: `pre_workspace` or `pre_submission`
7. Grantor previews the questionnaire
8. Questionnaire is saved and linked to the opportunity
9. At runtime, when an applicant reaches the questionnaire placement point, they are presented the questionnaire; responses are evaluated against rules and stored

**Inputs:**
- `opportunity_id` (UUID, required): Opportunity this questionnaire belongs to
- `placement` (enum, required): `pre_workspace | pre_submission`
- Per question:
  - `question_id` (UUID, system-generated)
  - `question_text` (text, required, max 500 chars): The question displayed to the applicant
  - `question_type` (enum, required): `yes_no | multiple_choice | text`
  - `is_required` (boolean, required): Whether the applicant must answer before proceeding
  - `display_order` (integer, required)
  - `conditional_display` (object, optional): `{depends_on_question_id, trigger_response_value}`
  - Per response option (for `yes_no` and `multiple_choice`):
    - `option_text` (string, required)
    - `mapped_rule_id` (UUID, optional): Eligibility rule this response evaluates
    - `rule_outcome` (enum, optional): `met | violated | advisory`

**Outputs:**
- `prescreening_questionnaires` record linked to the opportunity
- Question and response option records linked to the questionnaire
- At runtime: `eligibility_responses` records per applicant per opportunity

**Validation:**
- MUST: At least one question MUST be in the questionnaire if eligibility rules are configured
- MUST: Each question MUST have at least one response option for `yes_no` and `multiple_choice` types
- MUST: Response options that map to Hard Blocker rules MUST have `rule_outcome = violated` for the blocking response
- MUST: `placement` MUST be set
- SHOULD: All configured Hard Blocker eligibility rules SHOULD have at least one question mapped to them
- MAY: Text-type questions MAY be used for administrative information but MUST NOT be the sole basis for eligibility determination (text responses are not evaluated against rules in MVP)

**Error States:**
| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| No questions configured | 422 | QUESTIONNAIRE_EMPTY | "Pre-screening questionnaire must contain at least one question." |
| Hard blocker rule unmapped | 422 | RULE_UNMAPPED | "Hard blocker rule '{rule_id}' has no question mapped to it." |
| Invalid conditional reference | 422 | INVALID_CONDITIONAL | "Conditional display references a question that does not exist." |
| Placement not set | 422 | PLACEMENT_REQUIRED | "Questionnaire placement (pre-workspace or pre-submission) must be configured." |

**API Surface (this feature):** `GET /api/v1/opportunities/{opportunity_id}/prescreening` (get questionnaire); `PUT /api/v1/opportunities/{opportunity_id}/prescreening` (update questionnaire); `POST /api/v1/opportunities/{opportunity_id}/prescreening/preview` (preview) — see `Y1a-api-opportunity.md` §Pre-Screening.

**Schema Surface (this feature):** Uses `prescreening_questionnaires` (questionnaire_id, opportunity_id FK, placement, created_by, created_at), `prescreening_questions` (question_id, questionnaire_id FK, question_text, question_type, is_required, display_order, conditional_display JSONB), `prescreening_options` (option_id, question_id FK, option_text, mapped_rule_id FK, rule_outcome) — see `Y0a-schema-core.md` §prescreening.
