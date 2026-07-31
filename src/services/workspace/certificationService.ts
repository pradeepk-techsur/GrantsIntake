import { createHash } from 'crypto';
import { pool } from '../../db/client';

export interface Certification {
  cert_id: string;
  workspace_id: string;
  certifying_user_id: string;
  certification_text: string;
  certification_text_hash: string;
  certification_timestamp: string;
}

class CertificationService {
  /**
   * Create a certification record for an authorized representative.
   *
   * Validates:
   * 1. certifying_user_id has authorized_representative role in the workspace's org
   *    (org_roles.roles JSONB array — NOT a role_type column)
   * 2. No existing certification for this workspace (UNIQUE constraint)
   *
   * Emits CERTIFICATION_COMPLETED audit_event.
   * SHA-256 hash of certification_text stored for tamper detection.
   */
  async certify(
    workspaceId: string,
    certifyingUserId: string,
    certificationText: string,
  ): Promise<Certification> {
    // Derive org_id from workspace (never from request body — IDOR pattern)
    const wsResult = await pool.query<{ org_id: string }>(
      `SELECT org_id FROM application_workspaces WHERE workspace_id = $1`,
      [workspaceId],
    );
    if (wsResult.rowCount === 0) {
      const err = new Error('Workspace not found') as Error & { status: number };
      err.status = 404;
      throw err;
    }
    const { org_id } = wsResult.rows[0];

    // Verify authorized_representative role via roles JSONB array
    const arResult = await pool.query(
      `SELECT 1 FROM org_roles
       WHERE org_id = $1
         AND user_id = $2
         AND roles @> '["authorized_representative"]'::jsonb
         AND revoked_at IS NULL`,
      [org_id, certifyingUserId],
    );
    if (arResult.rowCount === 0) {
      const err = new Error('Only authorized representatives can certify') as Error & { status: number; code: string };
      err.status = 403;
      err.code = 'FORBIDDEN_NOT_AR';
      throw err;
    }

    const certHash = createHash('sha256').update(certificationText).digest('hex');

    let cert: Certification;
    try {
      const result = await pool.query<Certification>(
        `INSERT INTO certifications (workspace_id, certifying_user_id, certification_text, certification_text_hash)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [workspaceId, certifyingUserId, certificationText, certHash],
      );
      cert = result.rows[0];
    } catch (dbErr: unknown) {
      const e = dbErr as { code?: string };
      if (e.code === '23505') {
        // Unique constraint violation — already certified
        const err = new Error('This workspace has already been certified') as Error & { status: number; code: string };
        err.status = 409;
        err.code = 'ALREADY_CERTIFIED';
        throw err;
      }
      throw dbErr;
    }

    // Audit event (payload column, not metadata — Phase 1 schema)
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('certification', $1, 'CERTIFICATION_COMPLETED', $2, $3)`,
      [cert.cert_id, certifyingUserId, JSON.stringify({ workspace_id: workspaceId, cert_hash: certHash })],
    );

    return cert;
  }

  /** Get existing certification for a workspace (null if uncertified). */
  async getCertification(workspaceId: string): Promise<Certification | null> {
    const result = await pool.query<Certification>(
      `SELECT * FROM certifications WHERE workspace_id = $1`,
      [workspaceId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Record an AR concern flag (grantee-private note).
   * Does NOT block submission. Creates a workspace_comment (internal) + notifies Proposal Lead.
   *
   * workspace_comments schema: posted_by (not author_user_id), visibility (not is_internal)
   */
  async recordConcernFlag(
    workspaceId: string,
    concernText: string,
    actorUserId: string,
  ): Promise<void> {
    // Insert as internal workspace_comment (visibility='internal' per migration 012 schema)
    await pool.query(
      `INSERT INTO workspace_comments (workspace_id, posted_by, comment_text, visibility)
       VALUES ($1, $2, $3, 'internal')`,
      [workspaceId, actorUserId, `[AR CONCERN FLAG] ${concernText}`],
    );
    // Audit event for concern flag
    await pool.query(
      `INSERT INTO audit_events (entity_type, entity_id, event_type, actor_user_id, payload)
       VALUES ('workspace', $1, 'AR_CONCERN_FLAG_SUBMITTED', $2, $3)`,
      [workspaceId, actorUserId, JSON.stringify({ concern_note: concernText })],
    );
    // Console notification to Proposal Lead (Phase 6 will deliver as real email)
    console.log(`[NOTIFICATION] AR_CONCERN_FLAG for workspace ${workspaceId} — Proposal Lead notified`);
  }
}

export const certificationService = new CertificationService();
