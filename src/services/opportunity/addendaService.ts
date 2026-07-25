import { pool } from '../../db/client';

export type AddendumType =
  | 'date_change'
  | 'requirement_change'
  | 'clarification'
  | 'correction'
  | 'other';

export interface Addendum {
  addendum_id: string;
  opportunity_id: string;
  addendum_type: AddendumType;
  title: string;
  body: string;
  version_number: number;
  is_required_change: boolean;
  published_by: string;
  published_at: Date;
  superseded_at: Date | null;
}

export interface CreateAddendumInput {
  addendum_type: AddendumType;
  title: string;
  body: string;
  is_required_change?: boolean;
}

/**
 * AddendaService manages immutable addenda for published opportunities.
 *
 * Implements PRD-INTAKE-018 (F17):
 * - Addenda are immutable once published (no UPDATE, no DELETE)
 * - Auto-incremented version_number per opportunity
 * - Only published opportunities can receive addenda
 *
 * Security: T-02-15 — no UPDATE path; DELETE returns 405 at route layer.
 */
export class AddendaService {
  /**
   * List all addenda for an opportunity, ordered by published_at DESC (reverse-chronological).
   */
  async list(opportunityId: string): Promise<Addendum[]> {
    const result = await pool.query<Addendum>(
      `SELECT addendum_id, opportunity_id, addendum_type, title, body,
              version_number, is_required_change, published_by, published_at, superseded_at
       FROM addenda
       WHERE opportunity_id = $1
       ORDER BY published_at DESC`,
      [opportunityId],
    );
    return result.rows;
  }

  /**
   * Create a new immutable addendum for a published opportunity.
   *
   * 1. Verify opportunity is published
   * 2. Compute next version_number
   * 3. INSERT (no future UPDATE allowed by design)
   * 4. Return created addendum
   */
  async create(
    opportunityId: string,
    data: CreateAddendumInput,
    userId: string,
  ): Promise<Addendum> {
    // Step 1: Verify opportunity is published
    const oppResult = await pool.query<{ status: string }>(
      'SELECT status FROM opportunities WHERE opportunity_id = $1',
      [opportunityId],
    );

    if (oppResult.rows.length === 0) {
      const err = new Error('Opportunity not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (oppResult.rows[0].status !== 'published') {
      const err = new Error('Cannot add addendum to unpublished opportunity') as Error & {
        status: number;
        code: string;
      };
      err.status = 400;
      err.code = 'NOT_PUBLISHED';
      throw err;
    }

    // Step 2: Compute next version_number
    const versionResult = await pool.query<{ max: number | null }>(
      'SELECT MAX(version_number) as max FROM addenda WHERE opportunity_id = $1',
      [opportunityId],
    );
    const maxVersion = versionResult.rows[0].max;
    const nextVersion = maxVersion === null || maxVersion === undefined ? 1 : maxVersion + 1;

    // Step 3: INSERT (immutable — no UPDATE path exists)
    const insertResult = await pool.query<Addendum>(
      `INSERT INTO addenda (
        opportunity_id, addendum_type, title, body,
        version_number, is_required_change, published_by, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      RETURNING *`,
      [
        opportunityId,
        data.addendum_type,
        data.title,
        data.body,
        nextVersion,
        data.is_required_change ?? false,
        userId,
      ],
    );

    return insertResult.rows[0];
  }

  // DELETE is NOT IMPLEMENTED — addenda are immutable.
  // Any DELETE call is rejected at the route layer with 405 Method Not Allowed.
}

export const addendaService = new AddendaService();
