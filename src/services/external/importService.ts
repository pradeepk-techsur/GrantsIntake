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
