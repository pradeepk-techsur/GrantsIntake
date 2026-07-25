CREATE TABLE opportunities (
    opportunity_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id                  UUID NOT NULL REFERENCES programs(program_id),
    template_id                 UUID REFERENCES opportunity_templates(template_id),
    title                       VARCHAR(250) NOT NULL,
    funding_source              VARCHAR(250) NOT NULL,
    announcement_type           VARCHAR(50) NOT NULL,
    opportunity_number          VARCHAR(100) NOT NULL,
    assistance_listing_number   VARCHAR(10),
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
    geography                   JSONB,
    application_url             VARCHAR(2048),
    status                      VARCHAR(50) NOT NULL DEFAULT 'draft',
    visibility                  VARCHAR(30) NOT NULL DEFAULT 'public',
    public_slug                 VARCHAR(300) UNIQUE,
    published_at                TIMESTAMPTZ,
    published_by                UUID REFERENCES users(user_id),
    application_open_date       TIMESTAMPTZ,
    application_close_date      TIMESTAMPTZ,
    pre_application_deadline    TIMESTAMPTZ,
    loi_deadline                TIMESTAMPTZ,
    loi_required                BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_review_cadence_days INTEGER,
    deadline_timezone           VARCHAR(64) NOT NULL DEFAULT 'America/New_York',
    qa_config                   JSONB,
    review_routing_config       JSONB,
    admin_screening_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    attachments_required        BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_allowed           BOOLEAN NOT NULL DEFAULT FALSE,
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
CREATE INDEX idx_opportunities_fts ON opportunities
    USING GIN (to_tsvector('english', title || ' ' || executive_summary || ' ' || eligibility_summary));

CREATE TABLE guidance_prompts (
    prompt_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        VARCHAR(100) NOT NULL UNIQUE,
    prompt_text     TEXT NOT NULL,
    example_text    TEXT,
    uswds_tips      JSONB,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
