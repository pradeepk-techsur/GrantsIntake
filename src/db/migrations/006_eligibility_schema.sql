-- eligibility_rules (F7, F8)
CREATE TABLE eligibility_rules (
    rule_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    rule_type               VARCHAR(50) NOT NULL,
    -- applicant_type, geography, entity_status, uei_sam, nonprofit_status,
    -- tribal_status, state_local_status, prior_award_status, match_requirement, custom
    criterion_field         VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    -- equals, not_equals, includes, excludes, greater_than, less_than, is_true, is_false
    criterion_value         JSONB NOT NULL,
    severity                VARCHAR(20) NOT NULL,   -- hard_blocker, advisory
    enforcement_point       VARCHAR(20),            -- pre_workspace, pre_submission
    explanation_text        TEXT NOT NULL,
    rule_group_id           UUID,
    rule_group_operator     VARCHAR(5),             -- AND, OR
    display_order           INTEGER NOT NULL DEFAULT 0,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_enforcement_point CHECK (
        severity != 'hard_blocker' OR enforcement_point IS NOT NULL
    )
);
CREATE INDEX idx_elig_rules_opportunity ON eligibility_rules(opportunity_id);
