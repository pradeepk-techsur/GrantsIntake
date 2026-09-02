import { PoolClient } from 'pg';
import { pool } from '../../db/client';
import { ExternalOpportunity } from '../../types/externalOpportunity';
import { externalOpportunityService } from './externalOpportunityService';

// System org/program that hosts all Grants.gov-imported opportunities. Imported
// opportunities do not belong to a real grantor tenant, so they live under a
// dedicated system org so the existing programs → opportunities FK chain holds.
const IMPORT_ORG_NAME = 'Grants.gov Imports';
const IMPORT_ORG_TYPE = 'federal_agency';
const IMPORT_SOURCE = 'grants_gov_import';
const IMPORT_STATUS = 'imported';

export interface ImportResult {
  opportunity_id: string;
  workspace_url: string;
  already_imported: boolean;
}

export interface ImportedOpportunityListItem {
  opportunity_id: string;
  title: string;
  funder_name: string | null;
  program_area: string;
  max_award_amount: number | null;
  application_close_date: string | null;
  status_badge: 'open' | 'closing_soon' | 'closed';
  source: 'grants_gov_import';
  import_timestamp: string | null;
}

/** Normalize a pg DATE/TIMESTAMPTZ value to a YYYY-MM-DD string (or null). */
function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Normalize a pg TIMESTAMPTZ value to an ISO string (or null). */
function formatTimestamp(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Derive a coarse status badge from the application close date, matching the
 * rules the applicant OpportunityCard expects: no date → open; past → closed;
 * within 7 days → closing_soon; otherwise → open.
 */
function deriveStatusBadge(
  closeDate: string | null,
): ImportedOpportunityListItem['status_badge'] {
  if (!closeDate) return 'open';
  const close = new Date(closeDate);
  if (Number.isNaN(close.getTime())) return 'open';
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = Math.floor((close.getTime() - now.getTime()) / msPerDay);
  if (daysUntil < 0) return 'closed';
  if (daysUntil <= 7) return 'closing_soon';
  return 'open';
}

export class ExternalOpportunityImportService {
  /**
   * Import a Grants.gov external opportunity into the internal workspace system.
   *
   * Creates (or reuses) a system grantor org + program, then inserts an internal
   * `opportunities` row pre-populated from the external metadata and linked back
   * to its external source via `external_opportunity_id`. Emits an
   * OPPORTUNITY_IMPORTED audit event. Idempotent: re-importing the same external
   * opportunity returns the existing internal record (PRD-INTAKE-019C).
   */
  async importOpportunity(
    externalId: string,
    actorUserId: string,
  ): Promise<ImportResult | null> {
    const external = await externalOpportunityService.getOpportunityById(
      externalId,
    );
    if (!external) {
      return null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Idempotency: if this external opp was already imported, return it.
      const existing = await client.query<{ opportunity_id: string }>(
        `SELECT opportunity_id FROM opportunities WHERE external_opportunity_id = $1`,
        [externalId],
      );
      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        const oppId = existing.rows[0].opportunity_id;
        return {
          opportunity_id: oppId,
          workspace_url: `/applicant/workspaces?opportunity_id=${oppId}`,
          already_imported: true,
        };
      }

      const grantorOrgId = await this.findOrCreateImportOrg(client);
      const programId = await this.findOrCreateProgram(
        client,
        grantorOrgId,
        external.agency ?? 'Grants.gov',
        actorUserId,
      );

      const opportunityId = await this.insertOpportunity(
        client,
        programId,
        external,
        actorUserId,
      );

      // OPPORTUNITY_IMPORTED audit event (PRD-INTAKE-019C).
      await client.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('OPPORTUNITY_IMPORTED', $1, 'opportunity', $2, $3::jsonb)`,
        [
          actorUserId,
          opportunityId,
          JSON.stringify({
            external_opportunity_id: external.id,
            source_opportunity_number: external.source_opportunity_number,
          }),
        ],
      );

      await client.query('COMMIT');

      return {
        opportunity_id: opportunityId,
        workspace_url: `/applicant/workspaces?opportunity_id=${opportunityId}`,
        already_imported: false,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * List the internal opportunities the given applicant created via the
   * Grants.gov import flow (source='grants_gov_import', status='imported').
   * Read-only surface for the applicant portal so a freshly imported
   * opportunity is visible after the redirect to /applicant/applications
   * (PRD-INTAKE-019C). Scoped per-caller via `created_by` (populated by
   * insertOpportunity) so an applicant only ever sees their own imports.
   */
  async listImportedOpportunities(
    actorUserId: string,
  ): Promise<ImportedOpportunityListItem[]> {
    const result = await pool.query<{
      opportunity_id: string;
      title: string;
      funder_name: string | null;
      program_area: string;
      max_award_amount: string | number | null;
      application_close_date: Date | string | null;
      source: string;
      import_timestamp: Date | string | null;
    }>(
      `SELECT o.opportunity_id,
              o.title,
              go.org_name              AS funder_name,
              o.program_area,
              o.funding_amount_max     AS max_award_amount,
              o.application_close_date,
              o.source,
              o.created_at             AS import_timestamp
         FROM opportunities o
         LEFT JOIN programs p ON o.program_id = p.program_id
         LEFT JOIN grantor_organizations go ON p.grantor_org_id = go.org_id
        WHERE o.source = $1 AND o.status = $2 AND o.created_by = $3
        ORDER BY o.created_at DESC`,
      [IMPORT_SOURCE, IMPORT_STATUS, actorUserId],
    );

    return result.rows.map((row) => {
      const closeDate = formatDate(row.application_close_date);
      return {
        opportunity_id: row.opportunity_id,
        title: row.title,
        funder_name: row.funder_name ?? null,
        program_area: row.program_area,
        max_award_amount:
          row.max_award_amount === null || row.max_award_amount === undefined
            ? null
            : Number(row.max_award_amount),
        application_close_date: closeDate,
        status_badge: deriveStatusBadge(closeDate),
        source: 'grants_gov_import',
        import_timestamp: formatTimestamp(row.import_timestamp),
      };
    });
  }

  /** Find or create the system org that hosts imported opportunities. */
  private async findOrCreateImportOrg(client: PoolClient): Promise<string> {
    const found = await client.query<{ org_id: string }>(
      `SELECT org_id FROM grantor_organizations WHERE org_name = $1 LIMIT 1`,
      [IMPORT_ORG_NAME],
    );
    if (found.rows.length > 0) {
      return found.rows[0].org_id;
    }
    const created = await client.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [IMPORT_ORG_NAME, IMPORT_ORG_TYPE],
    );
    return created.rows[0].org_id;
  }

  /** Find or create a program for the given agency under the import org. */
  private async findOrCreateProgram(
    client: PoolClient,
    grantorOrgId: string,
    agencyName: string,
    actorUserId: string,
  ): Promise<string> {
    const programName = agencyName.slice(0, 250);
    const found = await client.query<{ program_id: string }>(
      `SELECT program_id FROM programs
        WHERE grantor_org_id = $1 AND program_name = $2 AND archived_at IS NULL
        LIMIT 1`,
      [grantorOrgId, programName],
    );
    if (found.rows.length > 0) {
      return found.rows[0].program_id;
    }
    const created = await client.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, program_area, is_federal, created_by)
       VALUES ($1, $2, $3, TRUE, $4) RETURNING program_id`,
      [grantorOrgId, programName, 'Federal Grants', actorUserId],
    );
    return created.rows[0].program_id;
  }

  /**
   * Insert the internal opportunity, mapping fields from the external record and
   * supplying safe defaults for the internal schema's NOT NULL columns.
   */
  private async insertOpportunity(
    client: PoolClient,
    programId: string,
    external: ExternalOpportunity,
    actorUserId: string,
  ): Promise<string> {
    // funding_amount_max is NOT NULL in the internal schema; the external source
    // may lack an award ceiling, so fall back to award_floor then a nominal 0.
    const fundingMax =
      external.award_ceiling ?? external.award_floor ?? 0;
    const fundingMin =
      external.award_floor !== null && external.award_floor !== undefined
        ? external.award_floor
        : null;

    const res = await client.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
          program_id, title, funding_source, announcement_type, opportunity_number,
          assistance_listing_number, funding_amount_min, funding_amount_max,
          eligibility_summary, executive_summary,
          contact_name, contact_email, program_area,
          application_url, application_close_date,
          status, source, external_opportunity_id, created_by
       ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10,
          $11, $12, $13,
          $14, $15,
          $16, $17, $18, $19
       ) RETURNING opportunity_id`,
      [
        programId,
        external.title.slice(0, 250),
        external.agency ? external.agency.slice(0, 250) : 'Grants.gov',
        'Initial',
        external.source_opportunity_number.slice(0, 100),
        external.source_assistance_listing
          ? external.source_assistance_listing.slice(0, 10)
          : null,
        fundingMin,
        fundingMax,
        external.eligibility_summary ?? 'See source opportunity for eligibility details.',
        `Imported from Grants.gov. Source: ${external.source_url}`,
        'Grants.gov Import',
        'noreply@grants.gov',
        'Federal Grants',
        external.source_url ? external.source_url.slice(0, 2048) : null,
        external.due_date ?? null,
        IMPORT_STATUS,
        IMPORT_SOURCE,
        external.id,
        actorUserId,
      ],
    );
    return res.rows[0].opportunity_id;
  }
}

export const externalOpportunityImportService =
  new ExternalOpportunityImportService();
