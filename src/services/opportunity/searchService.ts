import { pool } from '../../db/client';
import { publicationService, StatusBadge } from './publicationService';

export interface OpportunitySearchParams {
  keyword?: string;
  funder?: string;
  program_area?: string;
  geography?: string;
  eligibility_type?: string;
  funding_min?: number;
  funding_max?: number;
  due_date_from?: string;
  due_date_to?: string;
  application_stage?: string;
  sort_by?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  page_size?: number;
}

export interface OpportunityCard {
  opportunity_id: string;
  title: string;
  funder_name: string | null;
  program_area: string;
  max_award_amount: number | null;
  application_close_date: Date | null;
  application_open_date: Date | null;
  status_badge: StatusBadge;
  public_slug: string | null;
  program_id: string;
  published_at: Date | null;
  source: string | null;
}

export interface SearchResult {
  opportunities: OpportunityCard[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * SearchService implements full-text and faceted search for published opportunities.
 *
 * Implements PRD-INTAKE-014 (F14) search and filter:
 * - Full-text keyword search via GIN index (plainto_tsquery — injection-safe)
 * - Faceted filtering: funder, program_area, geography, eligibility_type,
 *   funding_min/max, due_date, application_stage
 * - Three sort modes: relevance, deadline, amount
 * - Pagination: default 20, max 100
 *
 * Security (T-02-14):
 * - keyword truncated to 200 chars before passing to plainto_tsquery
 * - page_size capped at 100
 * - Base query hardcodes WHERE status='published' (T-02-13)
 * - All params are bind variables — no string interpolation
 */
export class SearchService {
  async search(params: OpportunitySearchParams): Promise<SearchResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.page_size ?? 20));
    const offset = (page - 1) * pageSize;

    // Truncate keyword for safety (T-02-14)
    const keyword = params.keyword ? params.keyword.substring(0, 200) : undefined;

    const conditions: string[] = ['o.status = \'published\''];
    const bindValues: (string | number)[] = [];
    let paramIndex = 1;

    // ── Full-text keyword search ────────────────────────────────────────────
    if (keyword) {
      conditions.push(
        `to_tsvector('english', coalesce(o.title,'') || ' ' || coalesce(o.executive_summary,'') || ' ' || coalesce(o.eligibility_summary,'') || ' ' || coalesce(o.program_area,'')) @@ plainto_tsquery('english', $${paramIndex})`,
      );
      bindValues.push(keyword);
      paramIndex++;
    }

    // ── Funder filter ───────────────────────────────────────────────────────
    if (params.funder) {
      conditions.push(
        `o.program_id IN (
          SELECT p.program_id FROM programs p
          JOIN grantor_organizations go ON p.grantor_org_id = go.org_id
          WHERE go.org_name ILIKE $${paramIndex}
        )`,
      );
      bindValues.push('%' + params.funder + '%');
      paramIndex++;
    }

    // ── Program area filter ─────────────────────────────────────────────────
    if (params.program_area) {
      conditions.push(`o.program_area ILIKE $${paramIndex}`);
      bindValues.push('%' + params.program_area + '%');
      paramIndex++;
    }

    // ── Geography filter ────────────────────────────────────────────────────
    if (params.geography) {
      conditions.push(`o.geography::text ILIKE $${paramIndex}`);
      bindValues.push('%' + params.geography + '%');
      paramIndex++;
    }

    // ── Eligibility type filter ─────────────────────────────────────────────
    // Search against eligibility_rules for the opportunity
    if (params.eligibility_type) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM eligibility_rules er
          WHERE er.opportunity_id = o.opportunity_id
          AND er.rule_type ILIKE $${paramIndex}
        )`,
      );
      bindValues.push('%' + params.eligibility_type + '%');
      paramIndex++;
    }

    // ── Funding amount filters ──────────────────────────────────────────────
    if (params.funding_min !== undefined && params.funding_min !== null) {
      conditions.push(`o.funding_amount_max >= $${paramIndex}`);
      bindValues.push(params.funding_min);
      paramIndex++;
    }

    if (params.funding_max !== undefined && params.funding_max !== null) {
      conditions.push(`o.funding_amount_max <= $${paramIndex}`);
      bindValues.push(params.funding_max);
      paramIndex++;
    }

    // ── Due date filters ────────────────────────────────────────────────────
    if (params.due_date_from) {
      conditions.push(`o.application_close_date >= $${paramIndex}`);
      bindValues.push(params.due_date_from);
      paramIndex++;
    }

    if (params.due_date_to) {
      conditions.push(`o.application_close_date <= $${paramIndex}`);
      bindValues.push(params.due_date_to);
      paramIndex++;
    }

    // ── Application stage filter ────────────────────────────────────────────
    // Map application_stage to loi_required or pre_application_deadline presence
    if (params.application_stage) {
      if (params.application_stage === 'loi') {
        conditions.push(`o.loi_required = true`);
      } else if (params.application_stage === 'pre_application') {
        conditions.push(`o.pre_application_deadline IS NOT NULL`);
      }
      // 'full_application' is the default — no additional filter
    }

    // ── Build ORDER BY ──────────────────────────────────────────────────────
    let orderBy: string;
    if (params.sort_by === 'relevance' && keyword) {
      orderBy = `ts_rank(
        to_tsvector('english', coalesce(o.title,'') || ' ' || coalesce(o.executive_summary,'') || ' ' || coalesce(o.eligibility_summary,'') || ' ' || coalesce(o.program_area,'')),
        plainto_tsquery('english', $${paramIndex})
      ) DESC`;
      bindValues.push(keyword);
      paramIndex++;
    } else if (params.sort_by === 'deadline') {
      orderBy = 'o.application_close_date ASC NULLS LAST';
    } else if (params.sort_by === 'amount') {
      orderBy = 'o.funding_amount_max DESC NULLS LAST';
    } else {
      orderBy = 'o.published_at DESC';
    }

    const whereClause = conditions.join(' AND ');

    // ── Count query ─────────────────────────────────────────────────────────
    const countSql = `
      SELECT COUNT(*) AS total
      FROM opportunities o
      WHERE ${whereClause}
    `;
    const countResult = await pool.query<{ total: string }>(countSql, bindValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // ── Data query ──────────────────────────────────────────────────────────
    // For relevance sort, the rank bind is already added; paginate adds LIMIT/OFFSET
    const dataSql = `
      SELECT
        o.opportunity_id,
        o.title,
        go.org_name AS funder_name,
        o.program_area,
        o.funding_amount_max AS max_award_amount,
        o.application_close_date,
        o.application_open_date,
        o.public_slug,
        o.program_id,
        o.published_at,
        o.source
      FROM opportunities o
      LEFT JOIN programs p ON o.program_id = p.program_id
      LEFT JOIN grantor_organizations go ON p.grantor_org_id = go.org_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    bindValues.push(pageSize);
    bindValues.push(offset);

    const dataResult = await pool.query<Omit<OpportunityCard, 'status_badge'>>(dataSql, bindValues);

    // ── Enrich with status_badge ────────────────────────────────────────────
    const opportunities: OpportunityCard[] = dataResult.rows.map((row) => ({
      ...row,
      status_badge: publicationService.getStatusBadge(row),
    }));

    return {
      opportunities,
      total,
      page,
      page_size: pageSize,
    };
  }
}

export const searchService = new SearchService();
