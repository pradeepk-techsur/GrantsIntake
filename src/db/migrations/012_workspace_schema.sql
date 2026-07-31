CREATE TABLE application_workspaces (
    workspace_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    track_id            UUID,
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
    -- Note: constraint conditionally bypassed when opportunity.duplicate_allowed = true
);
CREATE INDEX idx_workspaces_opportunity ON application_workspaces(opportunity_id);
CREATE INDEX idx_workspaces_org ON application_workspaces(org_id);
CREATE INDEX idx_workspaces_status ON application_workspaces(status);

CREATE TABLE application_sections (
    section_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_type        VARCHAR(50) NOT NULL,
    -- org_profile, eligibility, narrative, budget, workplan, performance_measures,
    -- attachments, certifications, review_submit, custom
    section_name        VARCHAR(250) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'not_started',
    -- not_started, in_progress, complete, error, locked
    is_visible          BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    display_order       INTEGER NOT NULL DEFAULT 0,
    owner_id            UUID REFERENCES users(user_id),
    internal_due_date   DATE,
    validation_status   VARCHAR(20) DEFAULT 'not_validated',
    validation_errors   JSONB,
    -- array of {field_id, severity: blocking|warning|info, message, field_label}
    visibility          VARCHAR(20) NOT NULL DEFAULT 'grantee_private',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sections_workspace ON application_sections(workspace_id);
CREATE INDEX idx_sections_type ON application_sections(workspace_id, section_type);

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

-- CRITICAL: workspace_comments are NEVER visible to grantor roles
CREATE TABLE workspace_comments (
    comment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    section_id      UUID REFERENCES application_sections(section_id),
    comment_text    TEXT NOT NULL CHECK (char_length(comment_text) <= 5000),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'internal',
    posted_by       UUID NOT NULL REFERENCES users(user_id),
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_workspace ON workspace_comments(workspace_id);

-- Add workspace_id FK to eligibility_responses (deferred from Phase 3 migration 011)
ALTER TABLE eligibility_responses
    ADD COLUMN IF NOT EXISTS workspace_id_fk UUID REFERENCES application_workspaces(workspace_id);
