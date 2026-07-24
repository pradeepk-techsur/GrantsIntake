---

## 4. Data Model

### Entity Relationship Overview

```
grantor_organizations ──< programs ──< opportunities >── opportunity_templates
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
              eligibility_rules    prescreening_questionnaires    attachment_requirements
              section_conditions   prescreening_questions         screening_criteria
                                   prescreening_options           form_field_definitions
                                   guidance_prompts               opportunity_versions

organizations ──< org_roles (users)
             ──< org_contacts (users)
             ──< org_attachments

organizations + opportunities ──> application_workspaces
                                          │
                    ┌─────────────────────┼──────────────────────────┐
                    │                     │                           │
              application_sections   eligibility_responses        budgets
              field_responses        workspace_tasks                  │
              workspace_comments     attachments              budget_line_items
              section_conditions     certifications

application_workspaces ──> submission_snapshots ──> intake_queue_entries
                                                           │
                                          ┌────────────────┼──────────────┐
                                          │                │              │
                                   intake_dispositions  correction_requests  review_handoffs

opportunities ──< qa_items
             ──< addenda

audit_events (references all entities)
notification_records
export_jobs
```

---

### DDL: Core Schema (Programs, Opportunities, Eligibility)

Source: `FRD/Y0a-schema-core.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- CORE SCHEMA: Programs, Opportunities, Eligibility, Prescreening
-- All timestamps UTC. UUIDs as primary keys.
-- ─────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunity_templates (
    template_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name       VARCHAR(250) NOT NULL,
    template_type       VARCHAR(50) NOT NULL,
    -- federal_nofo, state_grant, philanthropic_rfp, corporate_grant, pass_through_subaward
    grant_market        VARCHAR(50),
    default_sections    JSONB,          -- array of section definitions
    default_metadata    JSONB,          -- default field values
    is_system_template  BOOLEAN NOT NULL DEFAULT TRUE,
    owner_org_id        UUID REFERENCES grantor_organizations(org_id),  -- null for system templates
    created_by          UUID REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunities (
    opportunity_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id                  UUID NOT NULL REFERENCES programs(program_id),
    template_id                 UUID REFERENCES opportunity_templates(template_id),

    -- Core Metadata (F1)
    title                       VARCHAR(250) NOT NULL,
    funding_source              VARCHAR(250) NOT NULL,
    announcement_type           VARCHAR(50) NOT NULL,
    -- initial, modification, continuation, supplemental, correction
    opportunity_number          VARCHAR(100) NOT NULL,
    assistance_listing_number   VARCHAR(10),       -- XX.XXX; required for federal
    funding_amount_min          NUMERIC(15,2),
    funding_amount_max          NUMERIC(15,2) NOT NULL,
    total_program_funding       NUMERIC(15,2),
    expected_awards_min         INTEGER,
    expected_awards_max         INTEGER,
    eligibility_summary         TEXT NOT NULL,
    executive_summary           TEXT NOT NULL,
    contact_name                VARCHAR(250) NOT NULL,
    contact_email               VARCHAR(320) NOT NULL,
    contact_phone               VARCHAR(30),
    contact_title               VARCHAR(250),
    program_area                VARCHAR(100) NOT NULL,
    geography                   JSONB,             -- array of geography strings
    application_url             VARCHAR(2048),

    -- Status and Publication (F5, F13)
    status                      VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, internal_review, approved, published, modified, closed, archived
    visibility                  VARCHAR(30) NOT NULL DEFAULT 'public',
    -- public, restricted_authenticated
    public_slug                 VARCHAR(300) UNIQUE,
    published_at                TIMESTAMPTZ,
    published_by                UUID REFERENCES users(user_id),

    -- Deadlines (F4)
    application_open_date       TIMESTAMPTZ,
    application_close_date      TIMESTAMPTZ,
    pre_application_deadline    TIMESTAMPTZ,
    loi_deadline                TIMESTAMPTZ,
    loi_required                BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_cadence_days INTEGER,
    deadline_timezone           VARCHAR(64) NOT NULL DEFAULT 'America/New_York',

    -- Q&A Config (F43)
    qa_config                   JSONB,
    -- {qa_enabled, question_window_open, question_window_close, responder_user_ids}

    -- Review Routing Config (F60)
    review_routing_config       JSONB,
    -- {review_workflow_type, assigned_reviewer_ids}

    -- Admin Screening Config (F12)
    admin_screening_enabled     BOOLEAN NOT NULL DEFAULT TRUE,

    -- Attachment Config (F11)
    attachments_required        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Duplicate Application Config (F29)
    duplicate_allowed           BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_by                  UUID NOT NULL REFERENCES users(user_id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_number_program UNIQUE (program_id, opportunity_number),
    CONSTRAINT chk_funding_range CHECK (
        funding_amount_min IS NULL OR funding_amount_min <= funding_amount_max
    ),
    CONSTRAINT chk_date_sequence CHECK (
        application_open_date IS NULL OR application_close_date IS NULL OR
        application_open_date < application_close_date
    )
);
CREATE INDEX idx_opportunities_program ON opportunities(program_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_close_date ON opportunities(application_close_date);
-- Full-text search index
CREATE INDEX idx_opportunities_fts ON opportunities
    USING GIN (to_tsvector('english', title || ' ' || executive_summary || ' ' || eligibility_summary));

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE opportunity_versions (
    version_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_number          INTEGER NOT NULL,
    snapshot                JSONB NOT NULL,    -- complete opportunity field snapshot
    delta                   JSONB,             -- field-level diff from previous version
    modification_reason     TEXT NOT NULL,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_opportunity_version UNIQUE (opportunity_id, version_number)
);
CREATE INDEX idx_opp_versions_opportunity ON opportunity_versions(opportunity_id);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE eligibility_rules (
    rule_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    rule_type               VARCHAR(50) NOT NULL,
    -- applicant_type, geography, entity_status, uei_sam, nonprofit_status,
    -- tribal_status, state_local_status, prior_award_status, match_requirement, custom
    criterion_field         VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    -- equals, not_equals, includes, excludes, greater_than, less_than, is_true, is_false
    criterion_value         JSONB NOT NULL,    -- string, string[], or number
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

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE prescreening_questionnaires (
    questionnaire_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id) UNIQUE,
    placement           VARCHAR(20) NOT NULL,   -- pre_workspace, pre_submission
    created_by          UUID NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescreening_questions (
    question_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id        UUID NOT NULL REFERENCES prescreening_questionnaires(questionnaire_id),
    question_text           VARCHAR(500) NOT NULL,
    question_type           VARCHAR(20) NOT NULL,  -- yes_no, multiple_choice, text
    is_required             BOOLEAN NOT NULL DEFAULT TRUE,
    display_order           INTEGER NOT NULL DEFAULT 0,
    conditional_display     JSONB  -- {depends_on_question_id, trigger_response_value}
);
CREATE INDEX idx_ps_questions_questionnaire ON prescreening_questions(questionnaire_id);

CREATE TABLE prescreening_options (
    option_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES prescreening_questions(question_id),
    option_text         VARCHAR(250) NOT NULL,
    mapped_rule_id      UUID REFERENCES eligibility_rules(rule_id),
    rule_outcome        VARCHAR(10)   -- met, violated, advisory
);
CREATE INDEX idx_ps_options_question ON prescreening_options(question_id);

-- ─────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE guidance_prompts (
    prompt_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        VARCHAR(100) NOT NULL UNIQUE,
    -- e.g., 'executive_summary', 'eligibility_summary', 'applicant_instructions'
    prompt_text     TEXT NOT NULL,
    example_text    TEXT,
    uswds_tips      JSONB,   -- array of plain-language tip strings
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE section_conditions (
    condition_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id              UUID NOT NULL REFERENCES application_sections(section_id),
    trigger_field           VARCHAR(100) NOT NULL,
    operator                VARCHAR(20) NOT NULL,
    trigger_value           JSONB NOT NULL,
    condition_group_operator VARCHAR(5),  -- AND, OR
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_section_conditions_section ON section_conditions(section_id);
```
