import { pool } from '../../db/client';
import { Opportunity } from '../../types/opportunity';

export interface OpportunityVersion {
  version_id: string;
  opportunity_id: string;
  version_number: number;
  snapshot: Opportunity;
  delta: Record<string, { old: unknown; new: unknown }> | null;
  modification_reason: string;
  created_by: string;
  created_at: Date;
}

/**
 * VersioningService manages immutable version snapshots for published opportunities.
 *
 * Every post-publication PATCH creates a new version with:
 * - version_number: incremented from MAX(version_number) + 1
 * - snapshot: full JSONB of the opportunity after update
 * - delta: per-field {old, new} for changed fields only
 * - modification_reason: supplied by user (NOT NULL enforced at DB)
 * - created_by: user ID of the modifier
 *
 * Rows are immutable: DB trigger rejects UPDATE/DELETE (T-04-03).
 * OPPORTUNITY_PUBLISHED and OPPORTUNITY_UPDATED_PUBLISHED audit events are logged.
 */
export class VersioningService {
  /**
   * Create a new version snapshot for a published opportunity.
   * Computes delta between oldSnapshot and newSnapshot.
   * Logs OPPORTUNITY_UPDATED_PUBLISHED audit event.
   */
  async createSnapshot(
    opportunityId: string,
    updatedBy: string,
    modificationReason: string,
    oldSnapshot: Opportunity,
    newSnapshot: Opportunity,
  ): Promise<OpportunityVersion> {
    // Compute next version number
    const versionResult = await pool.query<{ max: number | null }>(
      `SELECT MAX(version_number) as max FROM opportunity_versions WHERE opportunity_id = $1`,
      [opportunityId],
    );
    const maxVersion = versionResult.rows[0].max;
    const nextVersion = maxVersion === null || maxVersion === undefined ? 1 : maxVersion + 1;

    // Compute delta: fields that changed between old and new snapshot
    const delta: Record<string, { old: unknown; new: unknown }> = {};
    const allKeys = new Set([
      ...Object.keys(oldSnapshot as object),
      ...Object.keys(newSnapshot as object),
    ]);
    for (const key of allKeys) {
      // Skip system-managed fields that change on every update
      if (key === 'updated_at') continue;
      const oldVal = (oldSnapshot as Record<string, unknown>)[key];
      const newVal = (newSnapshot as Record<string, unknown>)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        delta[key] = { old: oldVal, new: newVal };
      }
    }

    // Insert version row (DB trigger will reject any future UPDATE/DELETE)
    const insertResult = await pool.query<OpportunityVersion>(
      `INSERT INTO opportunity_versions (
        opportunity_id, version_number, snapshot, delta,
        modification_reason, created_by
      ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
      RETURNING *`,
      [
        opportunityId,
        nextVersion,
        JSON.stringify(newSnapshot),
        Object.keys(delta).length > 0 ? JSON.stringify(delta) : null,
        modificationReason,
        updatedBy,
      ],
    );

    const version = insertResult.rows[0];

    // Write OPPORTUNITY_UPDATED_PUBLISHED audit event
    await pool.query(
      `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
       VALUES ('OPPORTUNITY_UPDATED_PUBLISHED', $1, 'opportunity', $2, $3::jsonb)`,
      [
        updatedBy,
        opportunityId,
        JSON.stringify({ version_number: nextVersion, modification_reason: modificationReason }),
      ],
    );

    return version;
  }

  /**
   * List all versions for an opportunity, ordered by version_number DESC.
   */
  async listVersions(opportunityId: string): Promise<OpportunityVersion[]> {
    const result = await pool.query<OpportunityVersion>(
      `SELECT * FROM opportunity_versions
       WHERE opportunity_id = $1
       ORDER BY version_number DESC`,
      [opportunityId],
    );
    return result.rows;
  }

  /**
   * Get a single version by version_id.
   * Throws 404 if not found.
   */
  async getVersion(versionId: string): Promise<OpportunityVersion> {
    const result = await pool.query<OpportunityVersion>(
      `SELECT * FROM opportunity_versions WHERE version_id = $1`,
      [versionId],
    );

    if (result.rows.length === 0) {
      const err = new Error('Version not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return result.rows[0];
  }
}

export const versioningService = new VersioningService();
