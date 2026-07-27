-- Migration 014: Add match requirement columns to opportunities table (PRD-INTAKE-040 / F39)
-- match_required: whether this opportunity requires cost-share/matching funds
-- match_percentage: the required match as a percentage of total project cost (0-100)

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS match_required   BOOLEAN       NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_percentage NUMERIC(5,2)  DEFAULT NULL;

COMMENT ON COLUMN opportunities.match_required   IS 'Whether this opportunity requires cost-share / matching funds (F39)';
COMMENT ON COLUMN opportunities.match_percentage IS 'Required match as percent of total project cost; NULL when match_required=false (F39)';
