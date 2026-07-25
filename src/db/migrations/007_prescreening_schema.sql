-- prescreening_questionnaires (F9)
CREATE TABLE prescreening_questionnaires (
    questionnaire_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id) UNIQUE,
    placement           VARCHAR(20) NOT NULL,   -- pre_workspace, pre_submission
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescreening_questions (
    question_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id        UUID NOT NULL REFERENCES prescreening_questionnaires(questionnaire_id),
    question_text           VARCHAR(500) NOT NULL,
    question_type           VARCHAR(20) NOT NULL,  -- yes_no, multiple_choice, text
    is_required             BOOLEAN NOT NULL DEFAULT TRUE,
    display_order           INTEGER NOT NULL DEFAULT 0,
    conditional_display     JSONB  -- {depends_on_question_id, trigger_response_value}
);
CREATE INDEX idx_ps_questions_questionnaire ON prescreening_questions(questionnaire_id);

CREATE TABLE prescreening_options (
    option_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES prescreening_questions(question_id),
    option_text         VARCHAR(250) NOT NULL,
    mapped_rule_id      UUID REFERENCES eligibility_rules(rule_id),
    rule_outcome        VARCHAR(10)   -- met, violated, advisory
);
CREATE INDEX idx_ps_options_question ON prescreening_options(question_id);
