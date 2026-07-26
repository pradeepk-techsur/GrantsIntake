-- Migration 011: eligibility_responses (applicant pre-screen)
CREATE TABLE eligibility_responses (
    response_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    workspace_id            UUID,  -- Phase 4 will add FK: REFERENCES application_workspaces(workspace_id)
    question_id             UUID NOT NULL REFERENCES prescreening_questions(question_id),
    selected_option_id      UUID REFERENCES prescreening_options(option_id),
    response_text           TEXT,
    rule_evaluation_result  VARCHAR(20),
    -- met, violated, advisory, not_applicable
    overall_result          VARCHAR(20),
    -- eligible, likely_eligible, needs_attention, ineligible
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_elig_response UNIQUE (opportunity_id, org_id, question_id)
);
CREATE INDEX idx_elig_responses_workspace ON eligibility_responses(workspace_id);
CREATE INDEX idx_elig_responses_org_opp ON eligibility_responses(org_id, opportunity_id);
