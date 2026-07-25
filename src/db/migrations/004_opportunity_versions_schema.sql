CREATE TABLE opportunity_versions (
    version_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id          UUID NOT NULL REFERENCES opportunities(opportunity_id),
    version_number          INTEGER NOT NULL,
    snapshot                JSONB NOT NULL,
    delta                   JSONB,
    modification_reason     TEXT NOT NULL,
    created_by              UUID NOT NULL REFERENCES users(user_id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_opportunity_version UNIQUE (opportunity_id, version_number)
);
CREATE INDEX idx_opp_versions_opportunity ON opportunity_versions(opportunity_id);

-- IMMUTABLE: trigger rejects UPDATE/DELETE
CREATE OR REPLACE FUNCTION prevent_version_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'opportunity_versions rows are immutable';
END;
$$;
CREATE TRIGGER opportunity_versions_immutable
  BEFORE UPDATE OR DELETE ON opportunity_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_version_mutation();
