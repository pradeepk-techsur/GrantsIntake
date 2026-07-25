CREATE TABLE programs (
    program_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id      UUID NOT NULL REFERENCES grantor_organizations(org_id),
    program_name        VARCHAR(250) NOT NULL,
    program_area        VARCHAR(100),
    is_federal          BOOLEAN NOT NULL DEFAULT FALSE,
    program_description TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at         TIMESTAMPTZ
);
CREATE INDEX idx_programs_grantor ON programs(grantor_org_id);

CREATE TABLE opportunity_templates (
    template_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name       VARCHAR(250) NOT NULL,
    template_type       VARCHAR(50) NOT NULL,
    -- federal_nofo, state_grant, philanthropic_rfp, corporate_grant, pass_through_subaward
    grant_market        VARCHAR(50),
    default_sections    JSONB,
    default_metadata    JSONB,
    is_system_template  BOOLEAN NOT NULL DEFAULT TRUE,
    owner_org_id        UUID REFERENCES grantor_organizations(org_id),
    created_by          UUID REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
