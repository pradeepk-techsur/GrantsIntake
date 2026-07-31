-- ─────────────────────────────────────────────────────────────────
-- PHASE 5 SCHEMA: Q&A, Certifications, Submission Snapshots
-- ─────────────────────────────────────────────────────────────────

-- Q&A questions and published answers (F43, F44)
CREATE TABLE qa_items (
    qa_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    submitter_org_id    UUID NOT NULL REFERENCES organizations(org_id),
    submitter_user_id   UUID NOT NULL REFERENCES users(user_id),
    question_text       TEXT NOT NULL,
    answer_text         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'submitted',
    -- submitted, under_review, answered, archived
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_by        UUID REFERENCES users(user_id),
    published_at        TIMESTAMPTZ
);
CREATE INDEX idx_qa_items_opportunity ON qa_items(opportunity_id);
CREATE INDEX idx_qa_items_status ON qa_items(opportunity_id, status);

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

-- Immutable final submitted application package (F52, F53)
CREATE TABLE submission_snapshots (
    snapshot_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id                UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                      UUID NOT NULL REFERENCES organizations(org_id),
    confirmation_number         VARCHAR(30) NOT NULL UNIQUE,
    -- Format: GI-{YEAR}-{8-digit-seq}, e.g., GI-2026-00001234
    submitted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_by                UUID NOT NULL REFERENCES users(user_id),

    -- Immutable snapshot payloads (JSONB)
    org_profile_snapshot        JSONB NOT NULL,
    eligibility_snapshot        JSONB NOT NULL,
    sections_snapshot           JSONB NOT NULL,
    budget_snapshot             JSONB NOT NULL,
    attachment_refs             JSONB NOT NULL,

    -- Certification reference
    certification_id            UUID REFERENCES certifications(cert_id),

    -- Version tracking
    is_original                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_current                  BOOLEAN NOT NULL DEFAULT TRUE,
    supersedes_snapshot_id      UUID REFERENCES submission_snapshots(snapshot_id),

    -- Generated packages (F53)
    human_readable_pdf_path     VARCHAR(2048),
    machine_readable_json_path  VARCHAR(2048),

    -- Validation summary at submission
    validation_summary          JSONB
);
CREATE INDEX idx_snapshots_workspace ON submission_snapshots(workspace_id);
CREATE INDEX idx_snapshots_opportunity ON submission_snapshots(opportunity_id);
CREATE INDEX idx_snapshots_confirmation ON submission_snapshots(confirmation_number);
CREATE INDEX idx_snapshots_current ON submission_snapshots(workspace_id, is_current);

-- DB-level immutability trigger (no updates/deletes on submission_snapshots)
CREATE OR REPLACE FUNCTION fn_submission_snapshots_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'submission_snapshots records are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_submission_snapshots_no_update
    BEFORE UPDATE ON submission_snapshots
    FOR EACH ROW EXECUTE FUNCTION fn_submission_snapshots_immutable();

CREATE TRIGGER trg_submission_snapshots_no_delete
    BEFORE DELETE ON submission_snapshots
    FOR EACH ROW EXECUTE FUNCTION fn_submission_snapshots_immutable();
