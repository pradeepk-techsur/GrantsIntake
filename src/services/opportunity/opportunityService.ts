import { z } from 'zod';
import { pool } from '../../db/client';
import {
  Opportunity,
  CreateOpportunityInput,
  UpdateOpportunityInput,
} from '../../types/opportunity';

// ─── Validation schemas ────────────────────────────────────────────────────────

const emailSchema = z.string().email();
const assistanceListingSchema = z.string().regex(/^\d{2}\.\d{3}$/);

// ─── OpportunityService class ─────────────────────────────────────────────────

export class OpportunityService {
  /**
   * Create a new opportunity from a template.
   * Copies default_metadata from the template as initial field values.
   * Writes OPPORTUNITY_CREATED audit event.
   */
  async create(
    programId: string,
    templateId: string | null,
    createdBy: string,
    data: CreateOpportunityInput,
  ): Promise<Opportunity> {
    // Verify the program belongs to the caller's org (IDOR guard done at route layer)
    // Fetch template default_metadata if templateId provided
    let defaultMetadata: Record<string, unknown> = {};
    if (templateId) {
      const templateResult = await pool.query<{ default_metadata: object }>(
        `SELECT default_metadata FROM opportunity_templates WHERE template_id = $1`,
        [templateId],
      );
      if (templateResult.rows.length > 0 && templateResult.rows[0].default_metadata) {
        defaultMetadata = templateResult.rows[0].default_metadata as Record<string, unknown>;
      }
    }

    // Merge template defaults with provided data (provided data wins)
    const merged = { ...defaultMetadata, ...data };

    const result = await pool.query<Opportunity>(
      `INSERT INTO opportunities (
        program_id, template_id, title, funding_source, announcement_type,
        opportunity_number, assistance_listing_number,
        funding_amount_min, funding_amount_max, total_program_funding,
        expected_awards_min, expected_awards_max,
        eligibility_summary, executive_summary,
        contact_name, contact_email, contact_phone, contact_title,
        program_area, geography, application_url,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7,
        $8, $9, $10,
        $11, $12,
        $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        'draft', $22
      ) RETURNING *`,
      [
        programId,
        templateId ?? null,
        merged.title ?? data.title,
        merged.funding_source ?? data.funding_source,
        merged.announcement_type ?? data.announcement_type,
        data.opportunity_number,
        data.assistance_listing_number ?? null,
        data.funding_amount_min ?? null,
        data.funding_amount_max ?? null,
        data.total_program_funding ?? null,
        data.expected_awards_min ?? null,
        data.expected_awards_max ?? null,
        data.eligibility_summary,
        data.executive_summary,
        data.contact_name,
        data.contact_email,
        data.contact_phone ?? null,
        data.contact_title ?? null,
        data.program_area,
        data.geography ? JSON.stringify(data.geography) : null,
        data.application_url ?? null,
        createdBy,
      ],
    );

    const opportunity = result.rows[0];

    // Write OPPORTUNITY_CREATED audit event
    await pool.query(
      `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
       VALUES ('OPPORTUNITY_CREATED', $1, 'opportunity', $2, $3::jsonb)`,
      [
        createdBy,
        opportunity.opportunity_id,
        JSON.stringify({ template_id: templateId, program_id: programId }),
      ],
    );

    return opportunity;
  }

  /**
   * Get an opportunity by ID.
   * Throws 404 error if not found.
   */
  async getById(opportunityId: string): Promise<Opportunity> {
    const result = await pool.query<Opportunity>(
      `SELECT * FROM opportunities WHERE opportunity_id = $1`,
      [opportunityId],
    );

    if (result.rows.length === 0) {
      const err = new Error('Opportunity not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return result.rows[0];
  }

  /**
   * Update an opportunity with a patch.
   * Validates patch fields, computes diff, writes OPPORTUNITY_METADATA_UPDATED audit event.
   * IDOR guard: caller must verify program org matches user's org before calling.
   */
  async update(
    opportunityId: string,
    updatedBy: string,
    patch: UpdateOpportunityInput,
  ): Promise<Opportunity> {
    // Fetch current state for diff computation
    const current = await this.getById(opportunityId);

    // ── Validate patch fields ──────────────────────────────────────────────────

    // contact_email: RFC 5322 format
    if (patch.contact_email !== undefined) {
      const emailResult = emailSchema.safeParse(patch.contact_email);
      if (!emailResult.success) {
        const err = new Error('Invalid contact email format') as Error & {
          status: number;
          code: string;
        };
        err.status = 400;
        err.code = 'CONTACT_EMAIL_INVALID';
        throw err;
      }
    }

    // funding_amount_min <= funding_amount_max (when both provided)
    const effectiveMin =
      patch.funding_amount_min !== undefined ? patch.funding_amount_min : current.funding_amount_min;
    const effectiveMax =
      patch.funding_amount_max !== undefined ? patch.funding_amount_max : current.funding_amount_max;

    if (
      effectiveMin !== null &&
      effectiveMin !== undefined &&
      effectiveMax !== null &&
      effectiveMax !== undefined &&
      effectiveMin > effectiveMax
    ) {
      const err = new Error('funding_amount_min must be <= funding_amount_max') as Error & {
        status: number;
        code: string;
      };
      err.status = 400;
      err.code = 'FUNDING_RANGE_INVALID';
      throw err;
    }

    // assistance_listing_number: validate format when funding_source is federal
    const effectiveFundingSource = patch.funding_source ?? current.funding_source;
    const effectiveAln =
      patch.assistance_listing_number !== undefined
        ? patch.assistance_listing_number
        : current.assistance_listing_number;

    if (
      effectiveFundingSource &&
      /federal/i.test(effectiveFundingSource) &&
      effectiveAln !== null &&
      effectiveAln !== undefined &&
      effectiveAln !== ''
    ) {
      const alnResult = assistanceListingSchema.safeParse(effectiveAln);
      if (!alnResult.success) {
        const err = new Error(
          'Assistance Listing Number must be in format XX.XXX (e.g. 93.045)',
        ) as Error & { status: number; code: string };
        err.status = 400;
        err.code = 'ASSISTANCE_LISTING_FORMAT_INVALID';
        throw err;
      }
    }

    // opportunity_number uniqueness within program (if changed)
    if (
      patch.opportunity_number !== undefined &&
      patch.opportunity_number !== current.opportunity_number
    ) {
      const dupCheck = await pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM opportunities
         WHERE program_id = $1 AND opportunity_number = $2 AND opportunity_id != $3`,
        [current.program_id, patch.opportunity_number, opportunityId],
      );
      if (parseInt(dupCheck.rows[0].count) > 0) {
        const err = new Error('Duplicate opportunity number within program') as Error & {
          status: number;
          code: string;
        };
        err.status = 409;
        err.code = 'DUPLICATE_OPPORTUNITY_NUMBER';
        throw err;
      }
    }

    // ── Build SET clause dynamically ──────────────────────────────────────────
    const allowedFields: (keyof UpdateOpportunityInput)[] = [
      'title',
      'funding_source',
      'announcement_type',
      'opportunity_number',
      'assistance_listing_number',
      'funding_amount_min',
      'funding_amount_max',
      'total_program_funding',
      'expected_awards_min',
      'expected_awards_max',
      'eligibility_summary',
      'executive_summary',
      'contact_name',
      'contact_email',
      'contact_phone',
      'contact_title',
      'program_area',
      'geography',
      'application_url',
      'status',
      // Deadline fields (F4)
      'application_open_date',
      'application_close_date',
      'pre_application_deadline',
      'loi_deadline',
      'loi_required',
      'rolling_review_enabled',
      'rolling_review_cadence_days',
      'deadline_timezone',
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];
    const diff: Record<string, { old: unknown; new: unknown }> = {};

    for (const field of allowedFields) {
      if (!(field in patch)) continue;
      const newVal = patch[field];
      const oldVal = current[field as keyof Opportunity];

      // Only include in diff if actually changed
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[field] = { old: oldVal, new: newVal };
      }

      values.push(field === 'geography' && newVal != null ? JSON.stringify(newVal) : newVal);
      setClauses.push(`${field} = $${values.length}`);
    }

    if (setClauses.length === 0) {
      // Nothing to update
      return current;
    }

    // Always update updated_at
    values.push(new Date());
    setClauses.push(`updated_at = $${values.length}`);

    // Add opportunityId as last parameter for WHERE clause
    values.push(opportunityId);
    const whereIdx = values.length;

    const updateResult = await pool.query<Opportunity>(
      `UPDATE opportunities SET ${setClauses.join(', ')}
       WHERE opportunity_id = $${whereIdx}
       RETURNING *`,
      values,
    );

    const updated = updateResult.rows[0];

    // Write OPPORTUNITY_METADATA_UPDATED audit event with diff
    if (Object.keys(diff).length > 0) {
      await pool.query(
        `INSERT INTO audit_events (event_type, actor_user_id, entity_type, entity_id, payload)
         VALUES ('OPPORTUNITY_METADATA_UPDATED', $1, 'opportunity', $2, $3::jsonb)`,
        [
          updatedBy,
          opportunityId,
          JSON.stringify({ diff }),
        ],
      );
    }

    return updated;
  }

  /**
   * List non-archived opportunities for a program.
   * Ordered by created_at descending.
   */
  async listByProgram(programId: string): Promise<Opportunity[]> {
    const result = await pool.query<Opportunity>(
      `SELECT * FROM opportunities
       WHERE program_id = $1 AND status != 'archived'
       ORDER BY created_at DESC`,
      [programId],
    );
    return result.rows;
  }
}

export const opportunityService = new OpportunityService();
