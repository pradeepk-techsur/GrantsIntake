import { pool } from '../../db/client';
import {
  Organization,
  OrgRole,
  OrgDocument,
  CredentialStatus,
  CreateOrgInput,
  UpdateOrgInput,
  UploadDocumentMeta,
} from '../../types/organization';
import * as fs from 'fs';
import * as path from 'path';

// Required fields for completeness calculation (12 total)
const REQUIRED_FIELDS: (keyof Organization)[] = [
  'legal_name',
  'address_line1',
  'city',
  'state',
  'zip',
  'entity_type',
  'primary_contact_name',
  'primary_contact_email',
  'banking_readiness',
  'ein',
  'uei',
  'sam_registered',
];

function computeExpirationStatus(
  expirationDate: string | null | undefined,
  warningWindowDays = 60,
): 'valid' | 'expiring_soon' | 'expired' {
  if (!expirationDate) return 'valid';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffMs = expDate.getTime() - today.getTime();
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= warningWindowDays) return 'expiring_soon';
  return 'valid';
}

function computeDaysRemaining(expirationDate: string | null | undefined): number {
  if (!expirationDate) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffMs = expDate.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

class OrganizationService {
  /**
   * Compute completeness percentage based on filled required fields.
   * 12 required fields, each worth 1/12 × 100.
   */
  computeCompleteness(org: Partial<Organization>): number {
    let filled = 0;
    for (const field of REQUIRED_FIELDS) {
      const val = org[field];
      if (val !== null && val !== undefined && val !== '') {
        filled++;
      }
    }
    return Math.round((filled / REQUIRED_FIELDS.length) * 100 * 100) / 100;
  }

  /**
   * Create a new organization.
   * - Inserts org row with computed profile_completeness_pct
   * - Assigns creator as org_admin in org_roles
   * - Emits ORGANIZATION_PROFILE_CREATED audit event
   */
  async createOrg(userId: string, input: CreateOrgInput): Promise<Organization> {
    const completeness = this.computeCompleteness(input as Partial<Organization>);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<Organization>(
        `INSERT INTO organizations (
          legal_name, dba_name, address_line1, address_line2, city, state, zip, country,
          entity_type, ein, uei, sam_registered, sam_expiration_date, tax_exempt_status,
          congressional_district, primary_contact_name, primary_contact_email,
          primary_contact_phone, banking_readiness, indirect_cost_rate, indirect_cost_base,
          profile_completeness_pct
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20, $21,
          $22
        ) RETURNING *`,
        [
          input.legal_name,
          input.dba_name ?? null,
          input.address_line1,
          input.address_line2 ?? null,
          input.city,
          input.state,
          input.zip,
          input.country ?? 'US',
          input.entity_type,
          input.ein ?? null,
          input.uei ?? null,
          input.sam_registered ?? false,
          input.sam_expiration_date ?? null,
          input.tax_exempt_status ?? null,
          input.congressional_district ?? null,
          input.primary_contact_name,
          input.primary_contact_email,
          input.primary_contact_phone ?? null,
          input.banking_readiness ?? 'unknown',
          input.indirect_cost_rate ?? null,
          input.indirect_cost_base ?? null,
          completeness,
        ],
      );

      const org = result.rows[0];

      // Insert creator as org_admin in org_roles
      await client.query(
        `INSERT INTO org_roles (org_id, user_id, roles)
         VALUES ($1, $2, $3::jsonb)`,
        [org.org_id, userId, JSON.stringify(['org_admin'])],
      );

      // Emit audit event
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('ORGANIZATION_PROFILE_CREATED', $1, 'organization', $2, $3::jsonb)`,
        [
          userId,
          org.org_id,
          JSON.stringify({ legal_name: org.legal_name, entity_type: org.entity_type }),
        ],
      );

      await client.query('COMMIT');
      return org;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get an organization by org_id. Returns null if not found.
   */
  async getOrg(orgId: string): Promise<Organization | null> {
    const result = await pool.query<Organization>(
      `SELECT * FROM organizations WHERE org_id = $1`,
      [orgId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Get the org_id for a user (via org_roles). Returns null if user has no org.
   */
  async getOrgIdForUser(userId: string): Promise<string | null> {
    const result = await pool.query<{ org_id: string }>(
      `SELECT org_id FROM org_roles WHERE user_id = $1 AND revoked_at IS NULL LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.org_id ?? null;
  }

  /**
   * Verify a user is a member of an org (not revoked).
   */
  async verifyOrgMember(orgId: string, userId: string): Promise<boolean> {
    const result = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM org_roles
         WHERE org_id = $1 AND user_id = $2 AND revoked_at IS NULL
       ) AS exists`,
      [orgId, userId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Verify a user is an org_admin of an org (not revoked).
   */
  async verifyOrgAdmin(orgId: string, userId: string): Promise<boolean> {
    const result = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM org_roles
         WHERE org_id = $1 AND user_id = $2
           AND revoked_at IS NULL
           AND roles @> '["org_admin"]'::jsonb
       ) AS exists`,
      [orgId, userId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Update an organization.
   * - Caller must be org_admin (403 if not)
   * - Recomputes profile_completeness_pct
   * - Emits ORGANIZATION_PROFILE_UPDATED audit event
   */
  async updateOrg(orgId: string, callerId: string, input: UpdateOrgInput): Promise<Organization> {
    const isAdmin = await this.verifyOrgAdmin(orgId, callerId);
    if (!isAdmin) {
      const err = new Error('Forbidden: org_admin role required') as Error & {
        status: number;
        code: string;
      };
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch current org to merge for completeness calculation
      const currentResult = await client.query<Organization>(
        `SELECT * FROM organizations WHERE org_id = $1`,
        [orgId],
      );
      if (currentResult.rows.length === 0) {
        const err = new Error('Organization not found') as Error & { status: number; code: string };
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      const current = currentResult.rows[0];
      const merged = { ...current, ...input };
      const completeness = this.computeCompleteness(merged);

      // Build dynamic SET clause
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIdx = 1;

      const fieldMap: Record<string, string> = {
        legal_name: 'legal_name',
        dba_name: 'dba_name',
        address_line1: 'address_line1',
        address_line2: 'address_line2',
        city: 'city',
        state: 'state',
        zip: 'zip',
        country: 'country',
        entity_type: 'entity_type',
        ein: 'ein',
        uei: 'uei',
        sam_registered: 'sam_registered',
        sam_expiration_date: 'sam_expiration_date',
        tax_exempt_status: 'tax_exempt_status',
        congressional_district: 'congressional_district',
        primary_contact_name: 'primary_contact_name',
        primary_contact_email: 'primary_contact_email',
        primary_contact_phone: 'primary_contact_phone',
        banking_readiness: 'banking_readiness',
        indirect_cost_rate: 'indirect_cost_rate',
        indirect_cost_base: 'indirect_cost_base',
      };

      for (const [key, column] of Object.entries(fieldMap)) {
        if (key in input) {
          setClauses.push(`${column} = $${paramIdx}`);
          values.push((input as Record<string, unknown>)[key]);
          paramIdx++;
        }
      }

      // Always update completeness and updated_at
      setClauses.push(`profile_completeness_pct = $${paramIdx}`);
      values.push(completeness);
      paramIdx++;

      setClauses.push(`updated_at = now()`);

      values.push(orgId);
      const whereIdx = paramIdx;

      const result = await client.query<Organization>(
        `UPDATE organizations SET ${setClauses.join(', ')}
         WHERE org_id = $${whereIdx}
         RETURNING *`,
        values,
      );

      const updated = result.rows[0];

      // Emit audit event
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('ORGANIZATION_PROFILE_UPDATED', $1, 'organization', $2, $3::jsonb)`,
        [callerId, orgId, JSON.stringify({ updated_fields: Object.keys(input) })],
      );

      await client.query('COMMIT');
      return updated;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get credential expiration status for an org.
   * Checks SAM registration expiration and active attachment expirations.
   */
  async getCredentialStatus(orgId: string, warningWindowDays = 60): Promise<CredentialStatus> {
    const credentials: CredentialStatus['credentials'] = [];

    // Get org for SAM expiration
    const orgResult = await pool.query<{ sam_expiration_date: string | null }>(
      `SELECT sam_expiration_date FROM organizations WHERE org_id = $1`,
      [orgId],
    );

    if (orgResult.rows.length === 0) {
      const err = new Error('Organization not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const { sam_expiration_date } = orgResult.rows[0];
    if (sam_expiration_date) {
      const daysRemaining = computeDaysRemaining(sam_expiration_date);
      credentials.push({
        item_type: 'sam_expiration',
        expiration_date: sam_expiration_date,
        status: computeExpirationStatus(sam_expiration_date, warningWindowDays),
        days_remaining: daysRemaining,
      });
    }

    // Get active attachments with expiration dates for credential types
    const credentialDocTypes = [
      'irs_determination_letter',
      'w9',
      'audit_report',
      'indirect_cost_agreement',
      'insurance_certificate',
    ];

    const attachmentsResult = await pool.query<{
      attachment_id: string;
      document_type: string;
      expiration_date: string | null;
    }>(
      `SELECT attachment_id, document_type, expiration_date
       FROM org_attachments
       WHERE org_id = $1 AND is_active = true
         AND expiration_date IS NOT NULL
         AND document_type = ANY($2::text[])
       ORDER BY document_type, expiration_date DESC`,
      [orgId, credentialDocTypes],
    );

    for (const row of attachmentsResult.rows) {
      if (row.expiration_date) {
        const daysRemaining = computeDaysRemaining(row.expiration_date);
        credentials.push({
          item_type: row.document_type,
          expiration_date: row.expiration_date,
          status: computeExpirationStatus(row.expiration_date, warningWindowDays),
          days_remaining: daysRemaining,
        });
      }
    }

    return { org_id: orgId, credentials };
  }

  /**
   * List active documents for an org with computed expiration_status.
   */
  async listDocuments(orgId: string): Promise<OrgDocument[]> {
    const result = await pool.query<Omit<OrgDocument, 'expiration_status'>>(
      `SELECT attachment_id, org_id, document_type, custom_document_name,
              version_number, file_name, file_path, mime_type, file_size_bytes,
              expiration_date, is_active, uploaded_by, uploaded_at
       FROM org_attachments
       WHERE org_id = $1 AND is_active = true
       ORDER BY document_type, version_number DESC`,
      [orgId],
    );

    return result.rows.map((row) => ({
      ...row,
      expiration_status: computeExpirationStatus(row.expiration_date as string | undefined),
    }));
  }

  /**
   * Upload a document for an org (stores locally under uploads/ for v1).
   * - Computes version_number = MAX(version_number) for same org+type+active + 1
   * - Sanitizes file name to prevent path traversal
   * - Inserts into org_attachments
   */
  async uploadDocument(
    orgId: string,
    callerId: string,
    meta: UploadDocumentMeta,
    fileBuffer: Buffer,
  ): Promise<OrgDocument> {
    // Sanitize file name (T-03-06: prevent path traversal)
    const sanitizedFileName = meta.file_name.replace(/[/\\]/g, '_');

    // File path (local storage for v1)
    const filePath = `orgs/${orgId}/docs/${meta.document_type}/${Date.now()}-${sanitizedFileName}`;

    // Persist file to uploads directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'orgs', orgId, 'docs', meta.document_type);
    fs.mkdirSync(uploadDir, { recursive: true });
    const localFilePath = path.join(uploadDir, `${Date.now()}-${sanitizedFileName}`);
    fs.writeFileSync(localFilePath, fileBuffer);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Compute version number
      const versionResult = await client.query<{ max_version: number | null }>(
        `SELECT MAX(version_number) AS max_version
         FROM org_attachments
         WHERE org_id = $1 AND document_type = $2 AND is_active = true`,
        [orgId, meta.document_type],
      );
      const versionNumber = (versionResult.rows[0]?.max_version ?? 0) + 1;

      const result = await client.query<Omit<OrgDocument, 'expiration_status'>>(
        `INSERT INTO org_attachments (
           org_id, document_type, custom_document_name, version_number,
           file_name, file_path, mime_type, file_size_bytes,
           expiration_date, is_active, uploaded_by
         ) VALUES (
           $1, $2, $3, $4,
           $5, $6, $7, $8,
           $9, true, $10
         ) RETURNING attachment_id, org_id, document_type, custom_document_name,
                     version_number, file_name, file_path, mime_type, file_size_bytes,
                     expiration_date, is_active, uploaded_by, uploaded_at`,
        [
          orgId,
          meta.document_type,
          meta.custom_document_name ?? null,
          versionNumber,
          sanitizedFileName,
          filePath,
          meta.mime_type,
          meta.file_size_bytes,
          meta.expiration_date ?? null,
          callerId,
        ],
      );

      await client.query('COMMIT');

      const row = result.rows[0];
      return {
        ...row,
        expiration_status: computeExpirationStatus(row.expiration_date as string | undefined),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * List all versions (active and inactive) for the same document_type as docId.
   */
  async listDocumentVersions(orgId: string, docId: string): Promise<OrgDocument[]> {
    // Find the document_type for docId
    const docResult = await pool.query<{ document_type: string }>(
      `SELECT document_type FROM org_attachments
       WHERE attachment_id = $1 AND org_id = $2`,
      [docId, orgId],
    );

    if (docResult.rows.length === 0) {
      const err = new Error('Document not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const { document_type } = docResult.rows[0];

    const result = await pool.query<Omit<OrgDocument, 'expiration_status'>>(
      `SELECT attachment_id, org_id, document_type, custom_document_name,
              version_number, file_name, file_path, mime_type, file_size_bytes,
              expiration_date, is_active, uploaded_by, uploaded_at
       FROM org_attachments
       WHERE org_id = $1 AND document_type = $2
       ORDER BY version_number DESC`,
      [orgId, document_type],
    );

    return result.rows.map((row) => ({
      ...row,
      expiration_status: computeExpirationStatus(row.expiration_date as string | undefined),
    }));
  }

  /**
   * Get all active roles for an org.
   */
  async listRoles(orgId: string): Promise<OrgRole[]> {
    const result = await pool.query<OrgRole>(
      `SELECT role_id, org_id, user_id, roles, invited_by,
              invitation_sent_at, invitation_accepted_at, created_at, revoked_at
       FROM org_roles
       WHERE org_id = $1 AND revoked_at IS NULL`,
      [orgId],
    );
    return result.rows;
  }
}

export const organizationService = new OrganizationService();
