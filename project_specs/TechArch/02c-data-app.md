---

### DDL: Application Workspace Schema

Source: `FRD/Y0c-schema-app.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- APPLICATION SCHEMA: Workspaces, Sections, Budget, Attachments
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE application_workspaces (
    workspace_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    track_id            UUID,               -- for multi-track opportunities
    status              VARCHAR(50) NOT NULL DEFAULT 'workspace_created',
    -- workspace_created, in_progress, ready_for_internal_review,
    -- ready_to_submit, submitted, intake_screening, returned_for_correction,
    -- resubmitted, accepted_for_review, withdrawn, administratively_rejected
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    -- grantee_private (draft) | shared (submitted)
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_workspace_org_opp UNIQUE (opportunity_id, org_id)
    -- Note: constraint is conditionally bypassed when opportunity.duplicate_allowed = true
);
CREATE INDEX idx_workspaces_opportunity ON application_workspaces(opportunity_id);
CREATE INDEX idx_workspaces_org ON application_workspaces(org_id);
CREATE INDEX idx_workspaces_status ON application_workspaces(status);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE application_sections (
    section_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_type        VARCHAR(50) NOT NULL,
    -- org_profile, eligibility, narrative, budget, workplan, performance_measures,
    -- attachments, certifications, review_submit, custom
    section_name        VARCHAR(250) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- not_started, in_progress, complete, error, locked
    is_visible          BOOLEAN NOT NULL DEFAULT TRUE,     -- conditional logic F10
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,    -- locked after submission F54
    display_order       INTEGER NOT NULL DEFAULT 0,
    owner_id            UUID REFERENCES users(user_id),    -- section owner F31
    internal_due_date   DATE,                              -- internal due date F31
    validation_status   VARCHAR(20) DEFAULT 'not_validated',
    validation_errors   JSONB,
    -- array of {field_id, severity: blocking|warning|info, message, field_label}
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_workspace ON application_sections(workspace_id);
CREATE INDEX idx_sections_type ON application_sections(workspace_id, section_type);

-- ─────────────────────────────────────────────────────────────────
-- Grantor-configured form field definitions per section (F36)

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
    formula             TEXT,              -- for calculated fields
    columns             JSONB,             -- for repeating_table: array of column defs
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_fields_opportunity_section ON form_field_definitions(opportunity_id, section_id);

-- ─────────────────────────────────────────────────────────────────
-- Applicant-entered form data per field per workspace

CREATE TABLE field_responses (
    response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID NOT NULL REFERENCES application_sections(section_id),
    field_id            UUID NOT NULL REFERENCES form_field_definitions(field_id),
    response_value      TEXT,              -- for simple fields
    response_json       JSONB,             -- for complex types (repeating_table, multi_select)
    updated_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_field_response UNIQUE (workspace_id, field_id)
);
CREATE INDEX idx_field_responses_workspace ON field_responses(workspace_id);
CREATE INDEX idx_field_responses_section ON field_responses(section_id);

-- ─────────────────────────────────────────────────────────────────
-- Internal tasks within application workspace (F31)

CREATE TABLE workspace_tasks (
    task_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    task_title      VARCHAR(500) NOT NULL,
    assignee_id     UUID NOT NULL REFERENCES users(user_id),
    task_due_date   DATE,
    task_notes      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'open',  -- open, complete
    created_by      UUID NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_tasks_workspace ON workspace_tasks(workspace_id);
CREATE INDEX idx_tasks_assignee ON workspace_tasks(assignee_id);

-- ─────────────────────────────────────────────────────────────────
-- Private internal applicant comments (F32)
-- CRITICAL: These records MUST NEVER be visible to grantor roles

CREATE TABLE workspace_comments (
    comment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    comment_text    TEXT NOT NULL CHECK (char_length(comment_text) <= 5000),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'internal',
    -- always 'internal'; API enforces no grantor access
    posted_by       UUID NOT NULL REFERENCES users(user_id),
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_workspace ON workspace_comments(workspace_id);

-- ─────────────────────────────────────────────────────────────────
-- Per-applicant eligibility pre-screen responses (F24, F28)

CREATE TABLE eligibility_responses (
    response_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    workspace_id            UUID REFERENCES application_workspaces(workspace_id),
    question_id             UUID NOT NULL REFERENCES prescreening_questions(question_id),
    selected_option_id      UUID REFERENCES prescreening_options(option_id),
    response_text           TEXT,           -- for text-type questions
    rule_evaluation_result  VARCHAR(20),    -- met, violated, advisory, not_applicable
    overall_result          VARCHAR(20),
    -- eligible, likely_eligible, needs_attention, ineligible
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_elig_response UNIQUE (opportunity_id, org_id, question_id)
);
CREATE INDEX idx_elig_responses_workspace ON eligibility_responses(workspace_id);
CREATE INDEX idx_elig_responses_org_opp ON eligibility_responses(org_id, opportunity_id);

-- ─────────────────────────────────────────────────────────────────
-- Budget header per workspace (F38)

CREATE TABLE budgets (
    budget_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id) UNIQUE,
    budget_periods_count    INTEGER NOT NULL DEFAULT 1,
    total_federal_request   NUMERIC(15,2),   -- computed
    total_match             NUMERIC(15,2),   -- computed
    total_indirect          NUMERIC(15,2),   -- computed
    total_project_cost      NUMERIC(15,2),   -- computed (federal + match)
    validation_status       VARCHAR(20) DEFAULT 'not_validated',
    validation_errors       JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- Budget line items (F38)

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
    -- Personnel-specific fields
    personnel_name      VARCHAR(250),
    fte                 NUMERIC(4,3),              -- 0.001 to 1.000
    annual_salary       NUMERIC(15,2),
    fringe_rate         NUMERIC(5,2),              -- percentage
    -- Cost-share fields
    match_source        VARCHAR(250),
    match_type          VARCHAR(10),               -- cash, in_kind
    -- Justification
    justification_text  TEXT,
    created_by          UUID NOT NULL REFERENCES users(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_total_cost_nonneg CHECK (total_cost >= 0),
    CONSTRAINT chk_fte_range CHECK (fte IS NULL OR (fte >= 0.001 AND fte <= 1.000)),
    CONSTRAINT chk_fringe_range CHECK (
        fringe_rate IS NULL OR (fringe_rate >= 0 AND fringe_rate <= 100)
    )
);
CREATE INDEX idx_budget_items_budget ON budget_line_items(budget_id);
CREATE INDEX idx_budget_items_period ON budget_line_items(budget_id, budget_period);

-- ─────────────────────────────────────────────────────────────────
-- Application-level uploaded attachments (F40, F41)

CREATE TABLE attachments (
    attachment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id          UUID REFERENCES application_sections(section_id),
    requirement_id      UUID REFERENCES attachment_requirements(requirement_id),
    source_type         VARCHAR(10) NOT NULL,      -- upload, library
    org_document_id     UUID REFERENCES org_attachments(attachment_id),
    -- populated when source_type = 'library'
    file_name           VARCHAR(500),
    file_path           VARCHAR(2048),              -- S3 object key; null for library source
    mime_type           VARCHAR(100),
    file_size_bytes     BIGINT,
    version_number      INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by         UUID REFERENCES users(user_id),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_workspace ON attachments(workspace_id);
CREATE INDEX idx_attachments_requirement ON attachments(requirement_id, is_active);

-- ─────────────────────────────────────────────────────────────────
-- Authorized representative certification records (F51)

CREATE TABLE certifications (
    cert_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    certifying_user_id      UUID NOT NULL REFERENCES users(user_id),
    certification_text      TEXT NOT NULL,
    certification_text_hash VARCHAR(64) NOT NULL,   -- SHA-256 of certification text
    certification_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_certification_workspace UNIQUE (workspace_id)
);
```
