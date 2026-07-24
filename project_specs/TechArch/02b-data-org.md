---

### DDL: Organization Schema (Users, Orgs, Roles, Documents)

Source: `FRD/Y0b-schema-org.md`

```sql
-- ─────────────────────────────────────────────────────────────────
-- ORGANIZATION SCHEMA: Users, Organizations, Roles, Documents
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) NOT NULL UNIQUE,
    full_name       VARCHAR(250) NOT NULL,
    phone           VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);

-- ─────────────────────────────────────────────────────────────────

CREATE TABLE grantor_organizations (
    org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name        VARCHAR(250) NOT NULL,
    org_type        VARCHAR(50),
    -- federal_agency, state_agency, foundation, corporate, other
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────
-- Applicant organization profile (F18, F19)

CREATE TABLE organizations (
    org_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name              VARCHAR(250) NOT NULL,
    dba_name                VARCHAR(250),
    address_line1           VARCHAR(250) NOT NULL,
    address_line2           VARCHAR(250),
    city                    VARCHAR(100) NOT NULL,
    state                   CHAR(2) NOT NULL,
    zip                     VARCHAR(10) NOT NULL,
    country                 CHAR(2) NOT NULL DEFAULT 'US',
    entity_type             VARCHAR(50) NOT NULL,
    -- nonprofit_501c3, nonprofit_other, for_profit, government_federal,
    -- government_state, government_local, tribal, university, individual, other
    ein                     CHAR(9),                    -- 9 digits, stored without hyphen
    uei                     CHAR(12),                   -- 12-char alphanumeric
    sam_registered          BOOLEAN NOT NULL DEFAULT FALSE,
    sam_expiration_date     DATE,
    tax_exempt_status       VARCHAR(20),
    -- 501c3, 501c4, 501c6, other, not_applicable
    congressional_district  VARCHAR(20),
    primary_contact_name    VARCHAR(250) NOT NULL,
    primary_contact_email   VARCHAR(320) NOT NULL,
    primary_contact_phone   VARCHAR(30),
    banking_readiness       VARCHAR(20) NOT NULL DEFAULT 'unknown',
    -- ready, not_ready, unknown
    indirect_cost_rate      NUMERIC(5,2),               -- percentage
    indirect_cost_base      VARCHAR(100),
    profile_completeness_pct NUMERIC(5,2) DEFAULT 0,    -- computed field
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_uei_format CHECK (uei IS NULL OR uei ~ '^[A-Za-z0-9]{12}$'),
    CONSTRAINT chk_ein_format CHECK (ein IS NULL OR ein ~ '^\d{9}$')
);
CREATE INDEX idx_organizations_uei ON organizations(uei);
CREATE INDEX idx_organizations_ein ON organizations(ein);

-- ─────────────────────────────────────────────────────────────────
-- Additional contacts: authorized representatives, financial contacts (F19)

CREATE TABLE org_contacts (
    contact_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(org_id),
    user_id         UUID REFERENCES users(user_id),
    contact_name    VARCHAR(250) NOT NULL,
    contact_email   VARCHAR(320) NOT NULL,
    contact_phone   VARCHAR(30),
    contact_title   VARCHAR(250),
    contact_type    VARCHAR(50) NOT NULL,
    -- primary, authorized_representative, financial, technical, other
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_contacts_org ON org_contacts(org_id);

-- ─────────────────────────────────────────────────────────────────
-- Role assignments for applicant organization team members (F22)

CREATE TABLE org_roles (
    role_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    user_id                 UUID NOT NULL REFERENCES users(user_id),
    roles                   JSONB NOT NULL,
    -- array of: org_admin, proposal_lead, contributor, finance_contributor,
    --           authorized_representative, external_contributor
    invited_by              UUID REFERENCES users(user_id),
    invitation_sent_at      TIMESTAMPTZ,
    invitation_accepted_at  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at              TIMESTAMPTZ,

    CONSTRAINT uq_org_user_role UNIQUE (org_id, user_id)
);
CREATE INDEX idx_org_roles_org ON org_roles(org_id);
CREATE INDEX idx_org_roles_user ON org_roles(user_id);

-- ─────────────────────────────────────────────────────────────────
-- Reusable standard attachment library at organization level (F20)

CREATE TABLE org_attachments (
    attachment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  UUID NOT NULL REFERENCES organizations(org_id),
    document_type           VARCHAR(100) NOT NULL,
    -- irs_determination_letter, w9, audit_report, indirect_cost_agreement,
    -- board_roster, insurance_certificate, letters_of_support, other
    custom_document_name    VARCHAR(250),
    version_number          INTEGER NOT NULL DEFAULT 1,
    file_name               VARCHAR(500) NOT NULL,
    file_path               VARCHAR(2048) NOT NULL,     -- S3 object key
    mime_type               VARCHAR(100) NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    expiration_date         DATE,                       -- credential tracking (F21)
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by             UUID NOT NULL REFERENCES users(user_id),
    uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_version_positive CHECK (version_number > 0)
);
CREATE INDEX idx_org_attachments_org ON org_attachments(org_id);
CREATE INDEX idx_org_attachments_type ON org_attachments(org_id, document_type);
CREATE INDEX idx_org_attachments_active ON org_attachments(org_id, document_type, is_active);

-- ─────────────────────────────────────────────────────────────────
-- Role assignments for grantor organization users

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
```
