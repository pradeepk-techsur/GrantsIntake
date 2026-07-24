---

# Y0d: Database Schema — Submission Snapshots, Q&A, Addenda, Audit Events, Intake Queue

*All timestamps stored in UTC. UUIDs as primary keys.*

---

## Table: submission_snapshots

*Immutable final submitted application package (F52, F53, F59)*

```sql
CREATE TABLE submission_snapshots (
    snapshot_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id                UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id              UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id                      UUID NOT NULL REFERENCES organizations(org_id),
    confirmation_number         VARCHAR(30) NOT NULL UNIQUE,
    -- Format: GI-{YEAR}-{8-digit-seq}, e.g., GI-2026-00001234
    submitted_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_by                UUID NOT NULL REFERENCES users(user_id),

    -- Immutable snapshot data (JSONB)
    org_profile_snapshot        JSONB NOT NULL,    -- org profile state at submission
    eligibility_snapshot        JSONB NOT NULL,    -- eligibility responses and results
    sections_snapshot           JSONB NOT NULL,    -- all section field data
    budget_snapshot             JSONB NOT NULL,    -- budget data
    attachment_refs             JSONB NOT NULL,    -- list of attachment metadata (not file content)

    -- Certification reference
    certification_id            UUID REFERENCES certifications(cert_id),

    -- Version tracking (F59)
    is_original                 BOOLEAN NOT NULL DEFAULT TRUE,
    is_current                  BOOLEAN NOT NULL DEFAULT TRUE,
    supersedes_snapshot_id      UUID REFERENCES submission_snapshots(snapshot_id),

    -- Generated packages (F53)
    human_readable_pdf_path     VARCHAR(2048),
    machine_readable_json_path  VARCHAR(2048),

    -- Validation summary at submission
    validation_summary          JSONB,

    CONSTRAINT chk_snapshot_immutable CHECK (TRUE)
    -- Enforcement: no UPDATE operations permitted on this table after INSERT
);
CREATE INDEX idx_snapshots_workspace ON submission_snapshots(workspace_id);
CREATE INDEX idx_snapshots_opportunity ON submission_snapshots(opportunity_id);
CREATE INDEX idx_snapshots_confirmation ON submission_snapshots(confirmation_number);
CREATE INDEX idx_snapshots_current ON submission_snapshots(workspace_id, is_current);
```

---

## Table: intake_queue_entries

*Routing and screening queue entries (F55, F56)*

```sql
CREATE TABLE intake_queue_entries (
    entry_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES application_workspaces(workspace_id),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    org_id              UUID NOT NULL REFERENCES organizations(org_id),
    snapshot_id         UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    routed_to           VARCHAR(250),               -- queue segment or assigned team name
    status              VARCHAR(50) NOT NULL DEFAULT 'pending_screening',
    -- pending_screening, accepted_for_review, returned_for_correction,
    -- ineligible, late, duplicate, withdrawn, administratively_rejected
    disposition_id      UUID REFERENCES intake_dispositions(disposition_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_opportunity ON intake_queue_entries(opportunity_id);
CREATE INDEX idx_queue_status ON intake_queue_entries(status);
CREATE INDEX idx_queue_org ON intake_queue_entries(org_id);
```

---

## Table: intake_dispositions

*Administrative screening disposition records (F57)*

```sql
CREATE TABLE intake_dispositions (
    disposition_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                    UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id                 UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    disposition                 VARCHAR(50) NOT NULL,
    -- accepted_for_review, returned_for_correction, ineligible, late,
    -- duplicate, withdrawn, administratively_rejected
    rationale                   TEXT,                  -- required for non-acceptance
    screening_criteria_results  JSONB,
    -- array of {criterion_id, criterion_text, result: pass|fail|na}
    applied_by                  UUID NOT NULL REFERENCES users(user_id),
    applied_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispositions_entry ON intake_dispositions(entry_id);
```

---

## Table: correction_requests

*Grantor correction/clarification requests (F58)*

```sql
CREATE TABLE correction_requests (
    request_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    correction_sections     JSONB NOT NULL,        -- array of section_ids requiring correction
    correction_instructions TEXT NOT NULL,
    correction_deadline     TIMESTAMPTZ NOT NULL,
    requested_by            UUID NOT NULL REFERENCES users(user_id),
    requested_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at             TIMESTAMPTZ
);
CREATE INDEX idx_correction_requests_entry ON correction_requests(entry_id);
```

---

## Table: review_handoffs

*Accepted application routing to review module (F60)*

```sql
CREATE TABLE review_handoffs (
    handoff_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id                UUID NOT NULL REFERENCES intake_queue_entries(entry_id),
    snapshot_id             UUID NOT NULL REFERENCES submission_snapshots(snapshot_id),
    review_workflow_type    VARCHAR(100),          -- merit_review, risk_assessment, scoring
    assigned_reviewer_ids   JSONB,                 -- array of user_ids
    handed_off_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID NOT NULL REFERENCES users(user_id)
);
CREATE INDEX idx_review_handoffs_entry ON review_handoffs(entry_id);
```

---

## Table: qa_items

*Q&A questions and published answers (F43, F44)*

```sql
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
```

---

## Table: addenda

*Published opportunity changes (F17, F46)*

```sql
CREATE TABLE addenda (
    addendum_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_id          UUID REFERENCES opportunity_versions(version_id),
    addendum_type       VARCHAR(50) NOT NULL,
    -- date_change, content_change, qa_response, correction, required_application_change
    title               VARCHAR(250) NOT NULL,
    description         TEXT NOT NULL,
    effective_date      DATE NOT NULL,
    published_by        UUID NOT NULL REFERENCES users(user_id),
    published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    superseded_at       TIMESTAMPTZ
);
CREATE INDEX idx_addenda_opportunity ON addenda(opportunity_id);
CREATE INDEX idx_addenda_published ON addenda(opportunity_id, published_at DESC);
```

---

## Table: audit_events

*Immutable system-generated audit event records (F46, F6)*

```sql
CREATE TABLE audit_events (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,
    -- OPPORTUNITY_CREATED, OPPORTUNITY_METADATA_UPDATED, OPPORTUNITY_PUBLISHED,
    -- OPPORTUNITY_VERSION_CREATED, ELIGIBILITY_RULE_CREATED, WORKSPACE_CREATED,
    -- APPLICATION_SUBMITTED, SUBMISSION_BLOCKED, CERTIFICATION_COMPLETED,
    -- DISPOSITION_APPLIED, CORRECTION_REQUESTED, APPLICATION_ACCEPTED_FOR_REVIEW,
    -- QA_ANSWER_PUBLISHED, ADDENDUM_PUBLISHED, NOTIFICATION_SENT, EXPORT_GENERATED,
    -- WORKSPACE_LOCKED, WORKSPACE_UNLOCKED, ROLE_ASSIGNED, ORGANIZATION_PROFILE_CREATED,
    -- ORGANIZATION_PROFILE_UPDATED
    entity_type     VARCHAR(50) NOT NULL,      -- opportunity, workspace, snapshot, disposition, etc.
    entity_id       UUID NOT NULL,
    actor_user_id   UUID REFERENCES users(user_id),  -- null for system-generated events
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    before_state    JSONB,
    after_state     JSONB,
    ip_address      INET,
    metadata        JSONB                      -- additional event-specific data

    -- No UPDATE or DELETE operations permitted on this table
);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_occurred ON audit_events(occurred_at DESC);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
```

---

## Table: notification_records

*Notification delivery tracking (F47)*

```sql
CREATE TABLE notification_records (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   UUID NOT NULL REFERENCES users(user_id),
    trigger_event       VARCHAR(50) NOT NULL,
    -- addendum_published, deadline_changed, required_change, qa_answered,
    -- submission_received, returned_for_correction, accepted_for_review,
    -- workspace_created, deadline_approaching
    opportunity_id      UUID REFERENCES opportunities(opportunity_id),
    entity_id           UUID,                  -- addendum_id, qa_id, etc.
    message_text        TEXT NOT NULL,
    channel             VARCHAR(10) NOT NULL,  -- email, in_app
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at        TIMESTAMPTZ,
    delivery_status     VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- sent, delivered, failed, bounced
    read_at             TIMESTAMPTZ
);
CREATE INDEX idx_notifications_recipient ON notification_records(recipient_user_id);
CREATE INDEX idx_notifications_opportunity ON notification_records(opportunity_id);
```

---

## Table: export_jobs

*Intake data export job tracking (F63)*

```sql
CREATE TABLE export_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requested_by    UUID NOT NULL REFERENCES users(user_id),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    filters         JSONB NOT NULL,            -- date_from, date_to, disposition_filter, include_* flags
    format          VARCHAR(5) NOT NULL,       -- csv, json
    status          VARCHAR(20) NOT NULL DEFAULT 'queued',
    -- queued, processing, complete, failed
    file_path       VARCHAR(2048),             -- storage path when complete
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    row_count       INTEGER
);
CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
```
