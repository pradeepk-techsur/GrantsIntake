-- section_conditions (F10) — Note: references application_sections from Phase 4
-- For Phase 2, store as opportunity-level section condition config (JSONB on sections)
-- The full section_conditions table will be migrated in Phase 4 with application_sections FK
CREATE TABLE section_condition_configs (
    config_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    section_key             VARCHAR(100) NOT NULL,  -- section identifier
    conditions              JSONB NOT NULL,  -- array of condition objects
    condition_group_operator VARCHAR(5) DEFAULT 'AND',  -- AND, OR
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_section_config UNIQUE (opportunity_id, section_key)
);
CREATE INDEX idx_section_configs_opp ON section_condition_configs(opportunity_id);

-- attachment_requirements (F11)
CREATE TABLE attachment_requirements (
    requirement_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    document_type               VARCHAR(100) NOT NULL,
    custom_document_name        VARCHAR(250),
    applicant_type_scope        JSONB,   -- array of entity_type values; empty = all
    stage_scope                 VARCHAR(30) NOT NULL,
    -- pre_application, loi, full_application
    is_required                 BOOLEAN NOT NULL DEFAULT TRUE,
    instructions                TEXT,
    file_format_restrictions    JSONB,   -- array of file extensions
    max_file_size_mb            INTEGER NOT NULL DEFAULT 50,
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attach_req_opportunity ON attachment_requirements(opportunity_id);

-- screening_criteria (F12)
CREATE TABLE screening_criteria (
    criterion_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id                  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    criterion_text                  VARCHAR(500) NOT NULL,
    criterion_type                  VARCHAR(10) NOT NULL,  -- auto, manual
    auto_criterion_key              VARCHAR(50),
    -- deadline_check, completeness_check, eligibility_check, attachment_check, duplicate_check
    is_required                     BOOLEAN NOT NULL DEFAULT TRUE,
    suggested_disposition_on_failure VARCHAR(50),
    display_order                   INTEGER NOT NULL DEFAULT 0,
    created_by                      UUID NOT NULL REFERENCES users(user_id),
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screening_criteria_opp ON screening_criteria(opportunity_id);
