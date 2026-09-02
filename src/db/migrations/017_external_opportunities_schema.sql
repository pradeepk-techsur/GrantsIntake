-- ─────────────────────────────────────────────────────────────────
-- PHASE 8 SCHEMA: Grants.gov External Opportunity Ingestion
-- Canonical normalized records, immutable version history, user saves,
-- and change alerts for tracked opportunities.
-- Requirements: PRD-INTAKE-019A, 019B, 019C, 019D, 019E
-- ─────────────────────────────────────────────────────────────────

-- Canonical normalized record of each ingested external opportunity (PRD-INTAKE-019B)
CREATE TABLE external_opportunities (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source                      VARCHAR(50) NOT NULL DEFAULT 'grants.gov',    -- source attribution (PRD-INTAKE-019E)
    source_url                  TEXT NOT NULL,                                -- canonical Grants.gov URL (PRD-INTAKE-019E)
    source_opportunity_number   VARCHAR(100) UNIQUE NOT NULL,                 -- FON, stable upsert key
    source_assistance_listing   VARCHAR(50),                                  -- CFDA / assistance listing number (PRD-INTAKE-019B)
    api_reference               JSONB NOT NULL DEFAULT '{}',                  -- raw API response snapshot (PRD-INTAKE-019E)
    import_timestamp            TIMESTAMPTZ NOT NULL DEFAULT now(),           -- first import timestamp (PRD-INTAKE-019E)
    last_fetched_at             TIMESTAMPTZ NOT NULL DEFAULT now(),           -- last API poll timestamp
    title                       TEXT NOT NULL,                                -- normalized (PRD-INTAKE-019B)
    agency                      VARCHAR(255),                                 -- sponsoring agency (PRD-INTAKE-019B)
    opportunity_status          VARCHAR(50),                                  -- forecasted/posted/closed/archived (PRD-INTAKE-019B)
    eligibility_summary         TEXT,                                         -- normalized eligibility text (PRD-INTAKE-019B)
    due_date                    DATE,                                         -- application deadline (PRD-INTAKE-019B)
    award_ceiling               NUMERIC(15,2),                                -- max award (PRD-INTAKE-019B)
    award_floor                 NUMERIC(15,2),                                -- min award (PRD-INTAKE-019B)
    application_package_url     TEXT,                                         -- link to package (PRD-INTAKE-019B)
    raw_metadata                JSONB NOT NULL DEFAULT '{}',                  -- full normalized metadata blob
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ext_opp_source_number ON external_opportunities(source_opportunity_number);
CREATE INDEX idx_ext_opp_status ON external_opportunities(opportunity_status);
CREATE INDEX idx_ext_opp_due_date ON external_opportunities(due_date);
CREATE INDEX idx_ext_opp_last_fetched ON external_opportunities(last_fetched_at);

-- Immutable version history for change tracking (PRD-INTAKE-019E)
CREATE TABLE external_opportunity_versions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_opportunity_id     UUID NOT NULL REFERENCES external_opportunities(id) ON DELETE CASCADE,
    version_number              INTEGER NOT NULL,
    changed_fields              JSONB NOT NULL DEFAULT '[]',    -- list of field names that changed
    snapshot                    JSONB NOT NULL,                 -- full record snapshot at this version
    fetched_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (external_opportunity_id, version_number)
);
CREATE INDEX idx_ext_opp_versions_opp ON external_opportunity_versions(external_opportunity_id);

-- User saves/tracks an external opportunity (PRD-INTAKE-019C)
CREATE TABLE saved_external_opportunities (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    external_opportunity_id     UUID NOT NULL REFERENCES external_opportunities(id) ON DELETE CASCADE,
    saved_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, external_opportunity_id)
);
CREATE INDEX idx_saved_ext_opp_user ON saved_external_opportunities(user_id);

-- Pending change alerts for users tracking an opportunity (PRD-INTAKE-019D)
CREATE TABLE change_alerts (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    external_opportunity_id     UUID NOT NULL REFERENCES external_opportunities(id) ON DELETE CASCADE,
    alert_type                  VARCHAR(50) NOT NULL,
    -- due_date_change | status_change | package_change | addenda_change | instructions_change
    previous_value              TEXT,
    new_value                   TEXT,
    is_read                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_change_alerts_user ON change_alerts(user_id, is_read);
CREATE INDEX idx_change_alerts_opp ON change_alerts(external_opportunity_id);
