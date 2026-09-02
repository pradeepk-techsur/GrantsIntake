-- ─────────────────────────────────────────────────────────────────
-- PHASE 8 — Plan 08-03: Import External Opportunity into Internal Workspace
-- Links an internal `opportunities` row back to the Grants.gov external
-- source it was imported from, and records the import source so imported
-- opportunities can be attributed in the UI.
-- Requirement: PRD-INTAKE-019C
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS external_opportunity_id UUID REFERENCES external_opportunities(id),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'internal';

-- One internal opportunity per external source (idempotent re-import guard).
CREATE UNIQUE INDEX IF NOT EXISTS uq_opportunities_external_opportunity
  ON opportunities(external_opportunity_id)
  WHERE external_opportunity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_source ON opportunities(source);
