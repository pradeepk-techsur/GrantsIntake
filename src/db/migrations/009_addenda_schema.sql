-- addenda (F17) — published opportunity changes
CREATE TABLE addenda (
    addendum_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      UUID NOT NULL REFERENCES opportunities(opportunity_id),
    addendum_type       VARCHAR(30) NOT NULL,
    -- date_change, requirement_change, clarification, correction, other
    title               VARCHAR(250) NOT NULL,
    body                TEXT NOT NULL,
    version_number      INTEGER NOT NULL,
    is_required_change  BOOLEAN NOT NULL DEFAULT FALSE,
    published_by        UUID NOT NULL REFERENCES users(user_id),
    published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    superseded_at       TIMESTAMPTZ  -- immutable once published
);
CREATE INDEX idx_addenda_opportunity ON addenda(opportunity_id);
CREATE INDEX idx_addenda_published_at ON addenda(opportunity_id, published_at DESC);

-- public_slug column and GIN FTS index already exist on opportunities table from prior migration
-- No-op: ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS public_slug VARCHAR(200) UNIQUE;
-- No-op: CREATE INDEX IF NOT EXISTS idx_opportunities_fts ...
