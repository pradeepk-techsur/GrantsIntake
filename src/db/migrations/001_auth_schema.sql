CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    full_name       VARCHAR(250) NOT NULL,
    phone           VARCHAR(30),
    password_hash   VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE grantor_organizations (
    org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name        VARCHAR(250) NOT NULL,
    org_type        VARCHAR(50),
    -- federal_agency, state_agency, foundation, corporate, other
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grantor_roles (
    role_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grantor_org_id  UUID NOT NULL REFERENCES grantor_organizations(org_id),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    roles           JSONB NOT NULL,
    -- array of: grantor_admin, program_officer, intake_administrator,
    --           compliance_analyst, reviewer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ,
    CONSTRAINT uq_grantor_user_role UNIQUE (grantor_org_id, user_id)
);
CREATE INDEX idx_grantor_roles_org ON grantor_roles(grantor_org_id);
CREATE INDEX idx_grantor_roles_user ON grantor_roles(user_id);

CREATE TABLE audit_events (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    actor_user_id   UUID REFERENCES users(user_id),
    actor_ip        INET,
    payload         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at);
-- IMMUTABLE: trigger rejects UPDATE/DELETE
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events rows are immutable';
END;
$$;
CREATE TRIGGER audit_events_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
