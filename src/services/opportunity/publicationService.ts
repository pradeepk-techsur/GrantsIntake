import { pool } from '../../db/client';
import { Opportunity } from '../../types/opportunity';
import { completenessService } from './completenessService';
import { versioningService } from './versioningService';

export type StatusBadge = 'open' | 'closing_soon' | 'closed' | 'not_yet_open';

/**
 * PublicationService handles the grantor "publish" flow for opportunities.
 *
 * Implements PRD-INTAKE-013 (F13):
 * - Completeness check (blockers block publish)
 * - Unique public_slug generation (title-based with UUID suffix)
 * - Status transition: draft → published
 * - OPPORTUNITY_PUBLISHED audit event
 * - Status badge calculation for applicant-facing display
 */
export class PublicationService {
  /**
   * Slugify a string: lowercase, replace non-alphanumeric with hyphens, collapse runs, trim.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 150); // max slug prefix length
  }

  /**
   * Generate a unique public_slug for the opportunity.
   * Format: {slugified-title}-{first 8 chars of opportunity_id}
   * On collision: append -2, -3, ... until unique.
   */
  private async generateUniqueSlug(title: string, opportunityId: string): Promise<string> {
    const base = this.slugify(title) + '-' + opportunityId.substring(0, 8);
    let slug = base;
    let attempt = 2;

    while (true) {
      const existing = await pool.query(
        'SELECT opportunity_id FROM opportunities WHERE public_slug = $1',
        [slug],
      );
      if (existing.rows.length === 0) {
        return slug;
      }
      slug = base + '-' + attempt;
      attempt++;
    }
  }

  /**
   * Publish an opportunity.
   *
   * 1. Check completeness (block if blockers exist)
   * 2. Generate unique public_slug
   * 3. UPDATE opportunities SET status='published', public_slug, published_at, published_by
   * 4. Snapshot via VersioningService
   * 5. INSERT OPPORTUNITY_PUBLISHED audit event
   * 6. Return updated opportunity
   */
  async publish(opportunityId: string, userId: string): Promise<Opportunity> {
    // Step 1: Completeness check
    const completeness = await completenessService.check(opportunityId);
    if (!completeness.is_ready) {
      const err = new Error('Opportunity is not ready for publication') as Error & {
        status: number;
        code: string;
        blockers: typeof completeness.blockers;
      };
      err.status = 400;
      err.code = 'COMPLETENESS_BLOCKERS';
      err.blockers = completeness.blockers;
      throw err;
    }

    // Step 2: Fetch opportunity for slug generation
    const oppResult = await pool.query<Opportunity>(
      'SELECT * FROM opportunities WHERE opportunity_id = $1',
      [opportunityId],
    );
    if (oppResult.rows.length === 0) {
      const err = new Error('Opportunity not found') as Error & { status: number; code: string };
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    const opp = oppResult.rows[0];

    // Step 3: Generate unique slug
    const publicSlug = await this.generateUniqueSlug(opp.title, opportunityId);

    // Step 4: UPDATE opportunity status → published
    const updateResult = await pool.query<Opportunity>(
      `UPDATE opportunities
       SET status = 'published',
           public_slug = $1,
           published_at = now(),
           published_by = $2,
           updated_at = now()
       WHERE opportunity_id = $3
       RETURNING *`,
      [publicSlug, userId, opportunityId],
    );
    const published = updateResult.rows[0];

    // Step 5: Snapshot via VersioningService (best-effort — don't fail publish on version error)
    try {
      await versioningService.createSnapshot(
        opportunityId,
        userId,
        'OPPORTUNITY_PUBLISHED',
        opp,
        published,
      );
    } catch (err) {
      console.error('VersioningService snapshot failed (non-fatal):', err);
    }

    // Step 6: Write OPPORTUNITY_PUBLISHED audit event
    await pool.query(
      `INSERT INTO audit_events (event_type, entity_type, entity_id, actor_user_id, payload)
       VALUES ('OPPORTUNITY_PUBLISHED', 'opportunity', $1, $2, $3::jsonb)`,
      [opportunityId, userId, JSON.stringify({ public_slug: publicSlug })],
    );

    return published;
  }

  /**
   * Calculate the status badge for an opportunity based on its deadline dates.
   *
   * Returns:
   * - 'closed'       if application_close_date < now()
   * - 'not_yet_open' if application_open_date > now()
   * - 'closing_soon' if application_close_date - now() ≤ 7 days
   * - 'open'         otherwise
   */
  getStatusBadge(opportunity: Partial<Opportunity>): StatusBadge {
    const now = new Date();
    const closeDate = opportunity.application_close_date
      ? new Date(opportunity.application_close_date)
      : null;
    const openDate = opportunity.application_open_date
      ? new Date(opportunity.application_open_date)
      : null;

    if (closeDate && closeDate < now) {
      return 'closed';
    }

    if (openDate && openDate > now) {
      return 'not_yet_open';
    }

    if (closeDate) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (closeDate.getTime() - now.getTime() <= sevenDaysMs) {
        return 'closing_soon';
      }
    }

    return 'open';
  }
}

export const publicationService = new PublicationService();
