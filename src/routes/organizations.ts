import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { organizationService } from '../services/organization/organizationService';
import { pool } from '../db/client';
import { OrgDocumentType } from '../types/organization';

export const organizationsRouter = Router();

// UUID regex for format guard (T-03-02)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Validation schemas ────────────────────────────────────────────────────────

const entityTypeValues = [
  'nonprofit_501c3', 'nonprofit_other', 'for_profit', 'government_federal',
  'government_state', 'government_local', 'tribal', 'university', 'individual', 'other',
] as const;

const taxExemptValues = ['501c3', '501c4', '501c6', 'other', 'not_applicable'] as const;
const bankingReadinessValues = ['ready', 'not_ready', 'unknown'] as const;
const documentTypeValues = [
  'irs_determination_letter', 'w9', 'audit_report', 'indirect_cost_agreement',
  'board_roster', 'insurance_certificate', 'letters_of_support', 'other',
] as const;
const orgRoleValues = [
  'org_admin', 'proposal_lead', 'contributor', 'finance_contributor',
  'authorized_representative', 'external_contributor',
] as const;

const createOrgSchema = z.object({
  legal_name: z.string().min(1).max(250),
  dba_name: z.string().max(250).optional(),
  address_line1: z.string().min(1).max(250),
  address_line2: z.string().max(250).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().min(5).max(10),
  country: z.string().length(2).default('US'),
  entity_type: z.enum(entityTypeValues),
  ein: z.string().regex(/^\d{9}$/).optional(),
  uei: z.string().regex(/^[A-Za-z0-9]{12}$/).optional(),
  sam_registered: z.boolean().optional().default(false),
  sam_expiration_date: z.string().optional(),
  tax_exempt_status: z.enum(taxExemptValues).optional(),
  congressional_district: z.string().max(20).optional(),
  primary_contact_name: z.string().min(1).max(250),
  primary_contact_email: z.string().email().max(320),
  primary_contact_phone: z.string().max(30).optional(),
  banking_readiness: z.enum(bankingReadinessValues).default('unknown'),
  indirect_cost_rate: z.number().min(0).max(999.99).optional(),
  indirect_cost_base: z.string().max(100).optional(),
});

const updateOrgSchema = createOrgSchema.partial();

const assignRoleSchema = z.object({
  user_id: z.string().uuid(),
  roles: z.array(z.enum(orgRoleValues)).min(1),
});

const updateRoleSchema = z.object({
  roles: z.array(z.enum(orgRoleValues)).min(1),
});

// NOTE: multer is not in package.json. For v1, document uploads are accepted
// as JSON with base64-encoded file content. This avoids multipart complexity.
// Upgrade to multer for true multipart in a future iteration.
const uploadDocumentSchema = z.object({
  document_type: z.enum(documentTypeValues),
  custom_document_name: z.string().max(250).optional(),
  file_name: z.string().min(1).max(500),
  mime_type: z.string().min(1).max(100),
  // base64-encoded file content; max ~34MB base64 ≈ 25MB binary (T-03-05)
  file_content_base64: z.string().max(34 * 1024 * 1024 / 0.75).optional().default(''),
  file_size_bytes: z.number().int().min(0),
  expiration_date: z.string().optional(),
});

// ─── Helper: error response ───────────────────────────────────────────────────

function handleOrgError(err: unknown, res: Response, context: string): void {
  const error = err as { code?: string; status?: number; message?: string };
  if (error.code === 'NOT_FOUND') {
    res.status(404).json({ error: 'NOT_FOUND', message: error.message ?? 'Not found' });
    return;
  }
  if (error.code === 'PERMISSION_DENIED') {
    res.status(403).json({ error: 'PERMISSION_DENIED', message: error.message ?? 'Forbidden' });
    return;
  }
  console.error(`${context} error:`, err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal server error' });
}

// ─── POST /api/v1/organizations ───────────────────────────────────────────────

organizationsRouter.post(
  '/organizations',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      const org = await organizationService.createOrg(req.user!.user_id, parsed.data);
      res.status(201).json(org);
    } catch (err) {
      handleOrgError(err, res, 'POST /organizations');
    }
  },
);

// ─── GET /api/v1/organizations/:org_id ───────────────────────────────────────

organizationsRouter.get(
  '/organizations/:org_id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    try {
      const org = await organizationService.getOrg(org_id);
      if (!org) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
        return;
      }

      // T-03-02: IDOR guard — verify caller is a member
      const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
      if (!isMember) {
        res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
        return;
      }

      res.status(200).json(org);
    } catch (err) {
      handleOrgError(err, res, 'GET /organizations/:org_id');
    }
  },
);

// ─── PUT /api/v1/organizations/:org_id ───────────────────────────────────────

organizationsRouter.put(
  '/organizations/:org_id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    // T-03-01: Admin guard (also checked in service, but validate early)
    const isAdmin = await organizationService.verifyOrgAdmin(org_id, req.user!.user_id);
    if (!isAdmin) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'org_admin role required' });
      return;
    }

    const parsed = updateOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      const updated = await organizationService.updateOrg(org_id, req.user!.user_id, parsed.data);
      res.status(200).json(updated);
    } catch (err) {
      handleOrgError(err, res, 'PUT /organizations/:org_id');
    }
  },
);

// ─── GET /api/v1/organizations/:org_id/credential-status ─────────────────────

organizationsRouter.get(
  '/organizations/:org_id/credential-status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
    if (!isMember) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
      return;
    }

    try {
      const status = await organizationService.getCredentialStatus(org_id);
      res.status(200).json(status);
    } catch (err) {
      handleOrgError(err, res, 'GET /organizations/:org_id/credential-status');
    }
  },
);

// ─── GET /api/v1/organizations/:org_id/roles ─────────────────────────────────

organizationsRouter.get(
  '/organizations/:org_id/roles',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
    if (!isMember) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
      return;
    }

    try {
      const result = await pool.query(
        `SELECT role_id, org_id, user_id, roles, invited_by,
                invitation_sent_at, invitation_accepted_at, created_at, revoked_at
         FROM org_roles
         WHERE org_id = $1 AND revoked_at IS NULL`,
        [org_id],
      );
      res.status(200).json(result.rows);
    } catch (err) {
      handleOrgError(err, res, 'GET /organizations/:org_id/roles');
    }
  },
);

// ─── POST /api/v1/organizations/:org_id/roles ────────────────────────────────

organizationsRouter.post(
  '/organizations/:org_id/roles',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    // T-03-04: Admin guard
    const isAdmin = await organizationService.verifyOrgAdmin(org_id, req.user!.user_id);
    if (!isAdmin) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'org_admin role required' });
      return;
    }

    const parsed = assignRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      // INSERT or UPDATE on duplicate (uq_org_user_role)
      const result = await pool.query(
        `INSERT INTO org_roles (org_id, user_id, roles, invited_by, invitation_sent_at)
         VALUES ($1, $2, $3::jsonb, $4, now())
         ON CONFLICT (org_id, user_id) DO UPDATE
           SET roles = $3::jsonb,
               invited_by = $4,
               invitation_sent_at = now(),
               revoked_at = NULL
         RETURNING role_id, org_id, user_id, roles, invited_by, invitation_sent_at, created_at, revoked_at`,
        [
          org_id,
          parsed.data.user_id,
          JSON.stringify(parsed.data.roles),
          req.user!.user_id,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      handleOrgError(err, res, 'POST /organizations/:org_id/roles');
    }
  },
);

// ─── PUT /api/v1/organizations/:org_id/roles/:role_id ────────────────────────

organizationsRouter.put(
  '/organizations/:org_id/roles/:role_id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id, role_id } = req.params;

    if (!UUID_REGEX.test(org_id) || !UUID_REGEX.test(role_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Not found' });
      return;
    }

    // Admin guard
    const isAdmin = await organizationService.verifyOrgAdmin(org_id, req.user!.user_id);
    if (!isAdmin) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'org_admin role required' });
      return;
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      const result = await pool.query(
        `UPDATE org_roles SET roles = $1::jsonb
         WHERE role_id = $2 AND org_id = $3 AND revoked_at IS NULL
         RETURNING role_id, org_id, user_id, roles, invited_by, invitation_sent_at, created_at, revoked_at`,
        [JSON.stringify(parsed.data.roles), role_id, org_id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Role not found' });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      handleOrgError(err, res, 'PUT /organizations/:org_id/roles/:role_id');
    }
  },
);

// ─── DELETE /api/v1/organizations/:org_id/roles/:role_id ─────────────────────

organizationsRouter.delete(
  '/organizations/:org_id/roles/:role_id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id, role_id } = req.params;

    if (!UUID_REGEX.test(org_id) || !UUID_REGEX.test(role_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Not found' });
      return;
    }

    // Admin guard
    const isAdmin = await organizationService.verifyOrgAdmin(org_id, req.user!.user_id);
    if (!isAdmin) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'org_admin role required' });
      return;
    }

    try {
      // Fetch the role to check self-revoke (T-03-08)
      const roleResult = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM org_roles WHERE role_id = $1 AND org_id = $2 AND revoked_at IS NULL`,
        [role_id, org_id],
      );

      if (roleResult.rows.length === 0) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Role not found' });
        return;
      }

      // T-03-08: Prevent self-revocation
      if (roleResult.rows[0].user_id === req.user!.user_id) {
        res.status(400).json({ error: 'SELF_REVOKE_FORBIDDEN', message: 'Cannot revoke your own role' });
        return;
      }

      await pool.query(
        `UPDATE org_roles SET revoked_at = now() WHERE role_id = $1`,
        [role_id],
      );

      res.status(204).send();
    } catch (err) {
      handleOrgError(err, res, 'DELETE /organizations/:org_id/roles/:role_id');
    }
  },
);

// ─── GET /api/v1/organizations/:org_id/documents ─────────────────────────────

organizationsRouter.get(
  '/organizations/:org_id/documents',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
    if (!isMember) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
      return;
    }

    try {
      const docs = await organizationService.listDocuments(org_id);
      res.status(200).json(docs);
    } catch (err) {
      handleOrgError(err, res, 'GET /organizations/:org_id/documents');
    }
  },
);

// ─── POST /api/v1/organizations/:org_id/documents ────────────────────────────
// NOTE: Accepts JSON with base64-encoded file content (multer not available in v1)
// T-03-05: file_size_bytes validated; base64 string has 34MB cap for 25MB binary

organizationsRouter.post(
  '/organizations/:org_id/documents',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id } = req.params;

    if (!UUID_REGEX.test(org_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
      return;
    }

    const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
    if (!isMember) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
      return;
    }

    const parsed = uploadDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: firstError.message,
        field: firstError.path.join('.'),
      });
      return;
    }

    try {
      const { file_content_base64, ...meta } = parsed.data;
      const fileBuffer = file_content_base64
        ? Buffer.from(file_content_base64, 'base64')
        : Buffer.alloc(0);

      const doc = await organizationService.uploadDocument(
        org_id,
        req.user!.user_id,
        {
          document_type: meta.document_type as OrgDocumentType,
          custom_document_name: meta.custom_document_name,
          file_name: meta.file_name,
          mime_type: meta.mime_type,
          file_size_bytes: meta.file_size_bytes,
          expiration_date: meta.expiration_date,
        },
        fileBuffer,
      );

      res.status(201).json(doc);
    } catch (err) {
      handleOrgError(err, res, 'POST /organizations/:org_id/documents');
    }
  },
);

// ─── GET /api/v1/organizations/:org_id/documents/:doc_id/versions ─────────────

organizationsRouter.get(
  '/organizations/:org_id/documents/:doc_id/versions',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { org_id, doc_id } = req.params;

    if (!UUID_REGEX.test(org_id) || !UUID_REGEX.test(doc_id)) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Not found' });
      return;
    }

    const isMember = await organizationService.verifyOrgMember(org_id, req.user!.user_id);
    if (!isMember) {
      res.status(403).json({ error: 'PERMISSION_DENIED', message: 'Forbidden' });
      return;
    }

    try {
      const versions = await organizationService.listDocumentVersions(org_id, doc_id);
      res.status(200).json(versions);
    } catch (err) {
      handleOrgError(err, res, 'GET /organizations/:org_id/documents/:doc_id/versions');
    }
  },
);
