-- Migration 013: Form field definitions and field responses
-- Plans 04-03 and 04-04 together complete this migration.
-- This file covers form_field_definitions and field_responses.
-- budget and attachment tables are appended by Plan 04-04.

CREATE TABLE form_field_definitions (
    field_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_type          VARCHAR(30) NOT NULL,
    -- text, textarea, number, currency, date, picklist, multi_select,
    -- checkbox, file_upload, calculated, repeating_table
    label               VARCHAR(200) NOT NULL,
    placeholder         VARCHAR(500),
    help_text           VARCHAR(1000),
    is_required         BOOLEAN NOT NULL DEFAULT FALSE,
    display_order       INTEGER NOT NULL DEFAULT 0,
    validation_config   JSONB,
    -- {max_length, max_chars, max_words, min, max, decimal_places,
    --  allowed_values, min_selected, max_selected, file_formats,
    --  max_size_mb, min_date, max_date}
    formula             TEXT,
    columns             JSONB,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_fields_opportunity_section ON form_field_definitions(opportunity_id, section_id);

CREATE TABLE field_responses (
    response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_id            UUID NOT NULL REFERENCES form_field_definitions(field_id),
    response_value      TEXT,
    response_json       JSONB,
    updated_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_field_response UNIQUE (workspace_id, field_id)
);
CREATE INDEX idx_field_responses_workspace ON field_responses(workspace_id);
CREATE INDEX idx_field_responses_section ON field_responses(section_id);
