import { PoolClient } from 'pg';
import { pool } from '../../db/client';
import {
  NormalizedOpportunity,
  ExternalOpportunity,
  ExternalOpportunityVersion,
  ChangeAlert,
  FilterParams,
  PaginatedResult,
} from '../../types/externalOpportunity';

// Fields compared to detect changes between fetches (drives version diffs + alerts).
const TRACKED_FIELDS: (keyof NormalizedOpportunity)[] = [
  'title',
  'agency',
  'opportunity_status',
  'eligibility_summary',
  'due_date',
  'award_ceiling',
  'award_floor',
  'application_package_url',
  'source_assistance_listing',
  'source_url',
];

// Map a changed field to the change_alert type it should raise (PRD-INTAKE-019D).
const FIELD_TO_ALERT_TYPE: Record<string, string> = {
  due_date: 'due_date_change',
  opportunity_status: 'status_change',
  application_package_url: 'package_change',
  eligibility_summary: 'instructions_change',
};

function rowToOpportunity(row: Record<string, unknown>): ExternalOpportunity {
  return {
    id: row.id as string,
    source: row.source as string,
    source_url: row.source_url as string,
    source_opportunity_number: row.source_opportunity_number as string,
    source_assistance_listing: (row.source_assistance_listing as string) ?? null,
    api_reference: (row.api_reference as Record<string, unknown>) ?? {},
    import_timestamp: row.import_timestamp as string,
    last_fetched_at: row.last_fetched_at as string,
    title: row.title as string,
    agency: (row.agency as string) ?? null,
    opportunity_status: (row.opportunity_status as string) ?? null,
    eligibility_summary: (row.eligibility_summary as string) ?? null,
    due_date: row.due_date ? String(row.due_date).slice(0, 10) : null,
    award_ceiling: row.award_ceiling !== null && row.award_ceiling !== undefined
      ? Number(row.award_ceiling)
      : null,
    award_floor: row.award_floor !== null && row.award_floor !== undefined
      ? Number(row.award_floor)
      : null,
    application_package_url: (row.application_package_url as string) ?? null,
    raw_metadata: (row.raw_metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Compare prior persisted record against incoming normalized data.
function computeChangedFields(
  prior: ExternalOpportunity | null,
  next: NormalizedOpportunity,
): string[] {
  if (!prior) return [];
  const changed: string[] = [];
  for (const field of TRACKED_FIELDS) {
    const priorVal = (prior as unknown as Record<string, unknown>)[field] ?? null;
    const nextVal = (next as unknown as Record<string, unknown>)[field] ?? null;
    // Normalize date to YYYY-MM-DD on both sides before comparing.
    const a = field === 'due_date' && priorVal ? String(priorVal).slice(0, 10) : priorVal;
    const b = field === 'due_date' && nextVal ? String(nextVal).slice(0, 10) : nextVal;
    if (String(a ?? '') !== String(b ?? '')) {
      changed.push(field);
    }
  }
  return changed;
}

class ExternalOpportunityService {
  /**
   * Upsert an opportunity by source_opportunity_number. Computes the diff vs the
   * prior record, writes a new immutable version row only when fields changed,
   * and creates change alerts for users tracking it (PRD-INTAKE-019D/019E).
   */
  async upsertOpportunity(
    normalized: NormalizedOpportunity,
  ): Promise<ExternalOpportunity> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Read prior record (if any) for diffing.
      const priorRes = await client.query<Record<string, unknown>>(
        `SELECT * FROM external_opportunities WHERE source_opportunity_number = $1 FOR UPDATE`,
        [normalized.source_opportunity_number],
      );
      const prior = priorRes.rows[0]
        ? rowToOpportunity(priorRes.rows[0])
        : null;

      const changedFields = computeChangedFields(prior, normalized);

      // Upsert canonical record. import_timestamp is preserved on conflict.
      const upsertRes = await client.query<Record<string, unknown>>(
        `INSERT INTO external_opportunities (
            source, source_url, source_opportunity_number, source_assistance_listing,
            api_reference, title, agency, opportunity_status, eligibility_summary,
            due_date, award_ceiling, award_floor, application_package_url, raw_metadata,
            last_fetched_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())
         ON CONFLICT (source_opportunity_number) DO UPDATE SET
            source_url = EXCLUDED.source_url,
            source_assistance_listing = EXCLUDED.source_assistance_listing,
            api_reference = EXCLUDED.api_reference,
            title = EXCLUDED.title,
            agency = EXCLUDED.agency,
            opportunity_status = EXCLUDED.opportunity_status,
            eligibility_summary = EXCLUDED.eligibility_summary,
            due_date = EXCLUDED.due_date,
            award_ceiling = EXCLUDED.award_ceiling,
            award_floor = EXCLUDED.award_floor,
            application_package_url = EXCLUDED.application_package_url,
            raw_metadata = EXCLUDED.raw_metadata,
            last_fetched_at = now(),
            updated_at = now()
         RETURNING *`,
        [
          normalized.source,
          normalized.source_url,
          normalized.source_opportunity_number,
          normalized.source_assistance_listing,
          JSON.stringify(normalized.api_reference),
          normalized.title,
          normalized.agency,
          normalized.opportunity_status,
          normalized.eligibility_summary,
          normalized.due_date,
          normalized.award_ceiling,
          normalized.award_floor,
          normalized.application_package_url,
          JSON.stringify(normalized.raw_metadata),
        ],
      );
      const opportunity = rowToOpportunity(upsertRes.rows[0]);

      // Version row: always create v1 on first insert; on update only when
      // tracked fields changed (PRD-INTAKE-019E).
      const isNew = prior === null;
      if (isNew || changedFields.length > 0) {
        await this.writeVersion(
          client,
          opportunity.id,
          isNew ? [] : changedFields,
          opportunity,
        );
      }

      // Change alerts for users tracking this opportunity, when fields changed.
      if (!isNew && changedFields.length > 0) {
        await this.createChangeAlerts(
          opportunity.id,
          changedFields,
          prior,
          opportunity,
          client,
        );
      }

      await client.query('COMMIT');
      return opportunity;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async writeVersion(
    client: PoolClient,
    externalOpportunityId: string,
    changedFields: string[],
    snapshot: ExternalOpportunity,
  ): Promise<void> {
    const nextVersionRes = await client.query<{ next: number }>(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next
         FROM external_opportunity_versions
        WHERE external_opportunity_id = $1`,
      [externalOpportunityId],
    );
    const versionNumber = nextVersionRes.rows[0].next;

    await client.query(
      `INSERT INTO external_opportunity_versions
         (external_opportunity_id, version_number, changed_fields, snapshot)
       VALUES ($1, $2, $3, $4)`,
      [
        externalOpportunityId,
        versionNumber,
        JSON.stringify(changedFields),
        JSON.stringify(snapshot),
      ],
    );
  }

  /**
   * Insert change_alerts rows for every user who saved the opportunity, for each
   * changed field that maps to an alert type (PRD-INTAKE-019D).
   */
  async createChangeAlerts(
    opportunityId: string,
    changedFields: string[],
    prior: ExternalOpportunity | null,
    next: ExternalOpportunity,
    existingClient?: PoolClient,
  ): Promise<void> {
    const client = existingClient ?? (await pool.connect());
    const ownClient = !existingClient;
    try {
      const saversRes = await client.query<{ user_id: string }>(
        `SELECT user_id FROM saved_external_opportunities WHERE external_opportunity_id = $1`,
        [opportunityId],
      );
      if (saversRes.rows.length === 0) return;

      const alertFields = changedFields.filter((f) => FIELD_TO_ALERT_TYPE[f]);
      if (alertFields.length === 0) return;

      for (const user of saversRes.rows) {
        for (const field of alertFields) {
          const alertType = FIELD_TO_ALERT_TYPE[field];
          const prevValue =
            prior !== null
              ? String((prior as unknown as Record<string, unknown>)[field] ?? '')
              : null;
          const newValue = String(
            (next as unknown as Record<string, unknown>)[field] ?? '',
          );
          await client.query(
            `INSERT INTO change_alerts
               (user_id, external_opportunity_id, alert_type, previous_value, new_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [user.user_id, opportunityId, alertType, prevValue, newValue],
          );
        }
      }
    } finally {
      if (ownClient) client.release();
    }
  }

  /** Save/track an opportunity for a user (PRD-INTAKE-019C). Idempotent. */
  async saveOpportunity(
    userId: string,
    externalOpportunityId: string,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO saved_external_opportunities (user_id, external_opportunity_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, external_opportunity_id) DO NOTHING`,
      [userId, externalOpportunityId],
    );
  }

  async unsaveOpportunity(
    userId: string,
    externalOpportunityId: string,
  ): Promise<void> {
    await pool.query(
      `DELETE FROM saved_external_opportunities
        WHERE user_id = $1 AND external_opportunity_id = $2`,
      [userId, externalOpportunityId],
    );
  }

  async listSavedOpportunities(
    userId: string,
  ): Promise<ExternalOpportunity[]> {
    const res = await pool.query<Record<string, unknown>>(
      `SELECT eo.* FROM external_opportunities eo
         JOIN saved_external_opportunities s ON s.external_opportunity_id = eo.id
        WHERE s.user_id = $1
        ORDER BY s.saved_at DESC`,
      [userId],
    );
    return res.rows.map(rowToOpportunity);
  }

  /** Search/list opportunities with filters + pagination (PRD-INTAKE-019C). */
  async listOpportunities(
    filters: FilterParams,
  ): Promise<PaginatedResult<ExternalOpportunity>> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`opportunity_status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.agency) {
      conditions.push(`agency ILIKE $${idx++}`);
      params.push(`%${filters.agency}%`);
    }
    if (filters.keyword) {
      conditions.push(
        `(title ILIKE $${idx} OR eligibility_summary ILIKE $${idx})`,
      );
      params.push(`%${filters.keyword}%`);
      idx++;
    }
    if (filters.due_after) {
      conditions.push(`due_date >= $${idx++}`);
      params.push(filters.due_after);
    }
    if (filters.due_before) {
      conditions.push(`due_date <= $${idx++}`);
      params.push(filters.due_before);
    }
    if (filters.award_min !== undefined) {
      conditions.push(`award_ceiling >= $${idx++}`);
      params.push(filters.award_min);
    }
    if (filters.award_max !== undefined) {
      conditions.push(`award_floor <= $${idx++}`);
      params.push(filters.award_max);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM external_opportunities ${where}`,
      params,
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const listRes = await pool.query<Record<string, unknown>>(
      `SELECT * FROM external_opportunities ${where}
        ORDER BY COALESCE(due_date, '9999-12-31') ASC, last_fetched_at DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );

    return {
      items: listRes.rows.map(rowToOpportunity),
      total,
      page,
      limit,
    };
  }

  async getOpportunityById(id: string): Promise<ExternalOpportunity | null> {
    const res = await pool.query<Record<string, unknown>>(
      `SELECT * FROM external_opportunities WHERE id = $1`,
      [id],
    );
    return res.rows[0] ? rowToOpportunity(res.rows[0]) : null;
  }

  async getVersionHistory(
    externalOpportunityId: string,
  ): Promise<ExternalOpportunityVersion[]> {
    const res = await pool.query<Record<string, unknown>>(
      `SELECT * FROM external_opportunity_versions
        WHERE external_opportunity_id = $1
        ORDER BY version_number ASC`,
      [externalOpportunityId],
    );
    return res.rows.map((row) => ({
      id: row.id as string,
      external_opportunity_id: row.external_opportunity_id as string,
      version_number: Number(row.version_number),
      changed_fields: (row.changed_fields as string[]) ?? [],
      snapshot: (row.snapshot as Record<string, unknown>) ?? {},
      fetched_at: row.fetched_at as string,
    }));
  }

  async getUnreadAlerts(userId: string): Promise<ChangeAlert[]> {
    const res = await pool.query<Record<string, unknown>>(
      `SELECT * FROM change_alerts
        WHERE user_id = $1 AND is_read = FALSE
        ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map((row) => ({
      id: row.id as string,
      user_id: row.user_id as string,
      external_opportunity_id: row.external_opportunity_id as string,
      alert_type: row.alert_type as string,
      previous_value: (row.previous_value as string) ?? null,
      new_value: (row.new_value as string) ?? null,
      is_read: row.is_read as boolean,
      created_at: row.created_at as string,
    }));
  }

  async markAlertRead(userId: string, alertId: string): Promise<void> {
    await pool.query(
      `UPDATE change_alerts SET is_read = TRUE
        WHERE id = $1 AND user_id = $2`,
      [alertId, userId],
    );
  }
}

export const externalOpportunityService = new ExternalOpportunityService();
export { ExternalOpportunityService };
