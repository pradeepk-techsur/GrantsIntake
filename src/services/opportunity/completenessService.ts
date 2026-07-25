import { pool } from '../../db/client';
import { Opportunity } from '../../types/opportunity';

export interface CompletenessBlocker {
  field: string;
  section: string;
  message: string;
}

export interface CompletenessCheckResult {
  is_ready: boolean;
  blockers: CompletenessBlocker[];
}

/**
 * CompletenessService checks whether an opportunity is ready for publication.
 * Returns blockers for each required field that is missing or invalid.
 *
 * Required fields for F5 (PRD-INTAKE-006):
 * Metadata section: title, funding_source, announcement_type, opportunity_number,
 *   funding_amount_max, eligibility_summary, executive_summary,
 *   contact_name, contact_email, program_area
 * Deadlines section: application_open_date, application_close_date
 * Federal-specific: if funding_source contains 'federal', assistance_listing_number required
 * LOI: if loi_required=true, loi_deadline required
 *
 * Phase 2 blockers (commented out — not enforced in Phase 1):
 * - At least one eligibility rule
 * - At least one form section
 */
export class CompletenessService {
  async check(opportunityId: string): Promise<CompletenessCheckResult> {
    const result = await pool.query<Opportunity>(
      `SELECT * FROM opportunities WHERE opportunity_id = $1`,
      [opportunityId],
    );

    if (result.rows.length === 0) {
      const err = new Error('Opportunity not found') as Error & {
        status: number;
        code: string;
      };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const opp = result.rows[0];
    const blockers: CompletenessBlocker[] = [];

    // ── Metadata fields ──────────────────────────────────────────────────────

    if (!opp.title || String(opp.title).trim() === '') {
      blockers.push({ field: 'title', section: 'Metadata', message: 'Title is required' });
    }

    if (!opp.funding_source || String(opp.funding_source).trim() === '') {
      blockers.push({ field: 'funding_source', section: 'Metadata', message: 'Funding source is required' });
    }

    if (!opp.announcement_type || String(opp.announcement_type).trim() === '') {
      blockers.push({ field: 'announcement_type', section: 'Metadata', message: 'Announcement type is required' });
    }

    if (!opp.opportunity_number || String(opp.opportunity_number).trim() === '') {
      blockers.push({ field: 'opportunity_number', section: 'Metadata', message: 'Opportunity number is required' });
    }

    if (opp.funding_amount_max === null || opp.funding_amount_max === undefined) {
      blockers.push({ field: 'funding_amount_max', section: 'Metadata', message: 'Maximum funding amount is required' });
    }

    if (!opp.eligibility_summary || String(opp.eligibility_summary).trim() === '') {
      blockers.push({ field: 'eligibility_summary', section: 'Metadata', message: 'Eligibility summary is required' });
    }

    if (!opp.executive_summary || String(opp.executive_summary).trim() === '') {
      blockers.push({ field: 'executive_summary', section: 'Metadata', message: 'Executive summary is required' });
    }

    if (!opp.contact_name || String(opp.contact_name).trim() === '') {
      blockers.push({ field: 'contact_name', section: 'Metadata', message: 'Contact name is required' });
    }

    if (!opp.contact_email || String(opp.contact_email).trim() === '') {
      blockers.push({ field: 'contact_email', section: 'Metadata', message: 'Contact email is required' });
    }

    if (!opp.program_area || String(opp.program_area).trim() === '') {
      blockers.push({ field: 'program_area', section: 'Metadata', message: 'Program area is required' });
    }

    // ── Federal-specific: assistance_listing_number ──────────────────────────
    if (opp.funding_source && /federal/i.test(String(opp.funding_source))) {
      const aln = opp.assistance_listing_number;
      const alnValid = aln && /^\d{2}\.\d{3}$/.test(String(aln));
      if (!alnValid) {
        blockers.push({
          field: 'assistance_listing_number',
          section: 'Metadata',
          message: 'Assistance Listing Number is required for federal funding (format: XX.XXX)',
        });
      }
    }

    // ── Deadline fields ──────────────────────────────────────────────────────

    if (!opp.application_open_date) {
      blockers.push({
        field: 'application_open_date',
        section: 'Deadlines',
        message: 'Application open date is required',
      });
    }

    if (!opp.application_close_date) {
      blockers.push({
        field: 'application_close_date',
        section: 'Deadlines',
        message: 'Application close date is required',
      });
    }

    // ── LOI: if loi_required=true, loi_deadline must be set ─────────────────
    if (opp.loi_required && !opp.loi_deadline) {
      blockers.push({
        field: 'loi_deadline',
        section: 'Deadlines',
        message: 'LOI deadline is required when LOI submission is required',
      });
    }

    // TODO Phase 2: At least one eligibility rule must be configured
    // TODO Phase 2: At least one form section must be configured

    return {
      is_ready: blockers.length === 0,
      blockers,
    };
  }
}

export const completenessService = new CompletenessService();
