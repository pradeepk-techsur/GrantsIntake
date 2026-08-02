-- ─────────────────────────────────────────────────────────────────
-- PHASE 6 SCHEMA: Intake Queue, Dispositions, Corrections, Review Handoffs
-- Notification records for in-app notifications
-- ─────────────────────────────────────────────────────────────────

-- Routing and screening queue entries (F55, F56)
CREATE TABLE intake_queue_entries (
    entry_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    snapshot_id         UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    routed_to           VARCHAR(250),   -- queue segment or assigned team name
    status              VARCHAR(50) NOT NULL DEFAULT 'pending_screening',
    -- pending_screening, accepted_for_review, returned_for_correction,
    -- ineligible, late, duplicate, withdrawn, administratively_rejected
    disposition_id      UUID,           -- FK added after intake_dispositions created below
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_opportunity ON intake_queue_entries(opportunity_id);
CREATE INDEX idx_queue_status ON intake_queue_entries(status);
CREATE INDEX idx_queue_org ON intake_queue_entries(org_id);

-- Administrative screening disposition records (F57)
CREATE TABLE intake_dispositions (
    disposition_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                    UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id                 UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    disposition                 VARCHAR(50) NOT NULL,
    -- accepted_for_review, returned_for_correction, ineligible, late,
    -- duplicate, withdrawn, administratively_rejected
    rationale                   TEXT,     -- required for non-acceptance dispositions
    screening_criteria_results  JSONB,
    -- array of {criterion_id, criterion_text, result: pass|fail|na}
    applied_by                  UUID NOT NULL REFERENCES users(user_id),
    applied_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispositions_entry ON intake_dispositions(entry_id);

-- Add FK from intake_queue_entries to intake_dispositions (after both created)
ALTER TABLE intake_queue_entries
    ADD CONSTRAINT fk_queue_disposition
    FOREIGN KEY (disposition_id) REFERENCES intake_dispositions(disposition_id);

-- Grantor correction/clarification requests (F58)
CREATE TABLE correction_requests (
    request_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    correction_sections     JSONB NOT NULL,      -- array of section_ids requiring correction
    correction_instructions TEXT NOT NULL,
    correction_deadline     TIMESTAMPTZ NOT NULL,
    requested_by            UUID NOT NULL REFERENCES users(user_id),
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at             TIMESTAMPTZ
);
CREATE INDEX idx_correction_requests_entry ON correction_requests(entry_id);

-- Accepted application routing to review module (F60)
CREATE TABLE review_handoffs (
    handoff_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    review_workflow_type    VARCHAR(100),    -- merit_review, risk_assessment, scoring
    assigned_reviewer_ids   JSONB,           -- array of user_ids
    handed_off_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL REFERENCES users(user_id)
);
CREATE INDEX idx_review_handoffs_entry ON review_handoffs(entry_id);

-- In-app notification records (F47, F57, F58, F61, F62)
-- Phase 5 used audit_events for simulated notifications; Phase 6 adds proper notification_records
CREATE TABLE notification_records (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   UUID NOT NULL REFERENCES users(user_id),
    notification_type   VARCHAR(100) NOT NULL,
    -- ADDENDUM_PUBLISHED, DEADLINE_CHANGED, QA_ANSWERED, SUBMISSION_RECEIVED,
    -- DISPOSITION_APPLIED, CORRECTION_REQUESTED, CORRECTION_WINDOW_EXPIRED,
    -- APPLICATION_ACCEPTED_FOR_REVIEW
    entity_type         VARCHAR(50),     -- opportunity, workspace, queue_entry
    entity_id           UUID,
    title               VARCHAR(250) NOT NULL,
    body                TEXT NOT NULL,
    action_url          VARCHAR(2048),
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notification_records(recipient_user_id, is_read);
CREATE INDEX idx_notifications_created ON notification_records(recipient_user_id, created_at DESC);

-- Export jobs for async data export (F63)
CREATE TABLE export_jobs (
    job_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by        UUID NOT NULL REFERENCES users(user_id),
    export_type         VARCHAR(50) NOT NULL,       -- intake_data
    export_format       VARCHAR(10) NOT NULL,        -- csv, xlsx, json
    filter_params       JSONB NOT NULL,              -- {opportunity_id, date_from, date_to, disposition}
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, processing, completed, failed
    file_path           VARCHAR(2048),               -- S3 object key when completed
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);
CREATE INDEX idx_export_jobs_requester ON export_jobs(requested_by, created_at DESC);
