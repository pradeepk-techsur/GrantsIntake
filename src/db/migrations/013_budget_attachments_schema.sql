-- Migration 013b / 014: Budgets, budget line items, and workspace attachments
-- Depends on: migration 012 (application_workspaces), migration 013 (form_field_definitions)

CREATE TABLE budgets (
    budget_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id) UNIQUE,
    budget_periods_count    INTEGER NOT NULL DEFAULT 1,
    total_federal_request   NUMERIC(15,2),
    total_match             NUMERIC(15,2),
    total_indirect          NUMERIC(15,2),
    total_project_cost      NUMERIC(15,2),
    validation_status       VARCHAR(20) DEFAULT 'not_validated',
    validation_errors       JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_line_items (
    line_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id           UUID NOT NULL REFERENCES budgets(budget_id),
    budget_period       INTEGER NOT NULL DEFAULT 1,
    category            VARCHAR(50) NOT NULL,
    -- personnel, fringe, travel, equipment, supplies, contractual,
    -- indirect, other_direct, match_cash, match_in_kind
    description         VARCHAR(500) NOT NULL,
    quantity            NUMERIC(10,2),
    unit_cost           NUMERIC(15,2),
    total_cost          NUMERIC(15,2) NOT NULL,
    personnel_name      VARCHAR(250),
    fte                 NUMERIC(4,3),
    annual_salary       NUMERIC(15,2),
    fringe_rate         NUMERIC(5,2),
    match_source        VARCHAR(250),
    match_type          VARCHAR(10),
    justification_text  TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_total_cost_nonneg CHECK (total_cost >= 0),
    CONSTRAINT chk_fte_range CHECK (fte IS NULL OR (fte >= 0.001 AND fte <= 1.000)),
    CONSTRAINT chk_fringe_range CHECK (fringe_rate IS NULL OR (fringe_rate >= 0 AND fringe_rate <= 100))
);
CREATE INDEX idx_budget_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_items_period ON budget_line_items(budget_id, budget_period);

CREATE TABLE attachments (
    attachment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID REFERENCES application_sections(section_id),
    requirement_id      UUID REFERENCES attachment_requirements(requirement_id),
    source_type         VARCHAR(10) NOT NULL,   -- upload, library
    org_document_id     UUID REFERENCES org_attachments(attachment_id),
    file_name           VARCHAR(500),
    file_path           VARCHAR(2048),
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    version_number      INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by         UUID REFERENCES users(user_id),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_workspace ON attachments(workspace_id);
CREATE INDEX idx_attachments_requirement ON attachments(requirement_id, is_active);
