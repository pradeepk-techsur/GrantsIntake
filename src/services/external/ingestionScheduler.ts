import cron, { ScheduledTask } from 'node-cron';
import { grantsGovService } from './grantsGovService';
import { externalOpportunityService } from './externalOpportunityService';

const DEFAULT_CRON = '0 */6 * * *'; // every 6 hours
const DEFAULT_MAX_PAGES = 5;
const DEFAULT_PAGE_SIZE = 25;

/** Read a positive integer env var, falling back to a default. */
function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export interface RefreshResult {
  fetched: number;
  upserted: number;
  failed: number;
  errors: Array<{ opportunityNumber?: string; message: string }>;
}

class IngestionScheduler {
  private task: ScheduledTask | null = null;

  /**
   * Fetch the most-recently-posted opportunities across PAGES pages, fetch full
   * detail for each, normalize, and upsert. Failures on a single opportunity are
   * logged and skipped — the batch never aborts on one failure (PRD-INTAKE-019A).
   */
  async refreshAll(): Promise<RefreshResult> {
    const result: RefreshResult = {
      fetched: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    const maxPages = envInt('GRANTS_GOV_MAX_PAGES', DEFAULT_MAX_PAGES);
    const pageSize = envInt('GRANTS_GOV_PAGE_SIZE', DEFAULT_PAGE_SIZE);

    for (let page = 0; page < maxPages; page++) {
      let hits;
      try {
        hits = await grantsGovService.searchOpportunities({
          rows: pageSize,
          startRecordNum: page * pageSize,
          oppStatuses: 'posted',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push({ message: `search page ${page}: ${message}` });
        continue;
      }

      if (hits.length === 0) break;

      for (const hit of hits) {
        result.fetched++;
        try {
          const detail = await grantsGovService.getOpportunityDetail(
            hit.opportunityId,
          );
          const normalized = grantsGovService.normalizeOpportunity(detail);
          if (!normalized.source_opportunity_number) {
            throw new Error('missing source_opportunity_number after normalize');
          }
          await externalOpportunityService.upsertOpportunity(normalized);
          result.upserted++;
        } catch (err) {
          result.failed++;
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            opportunityNumber: hit.opportunityNumber,
            message,
          });
          // eslint-disable-next-line no-console
          console.error(
            `[ingestion] failed to ingest ${hit.opportunityNumber}: ${message}`,
          );
        }
      }
    }

    return result;
  }

  /**
   * On-demand fetch of a single opportunity by its funding opportunity number.
   * Searches by keyword to resolve the internal id, then fetches detail + upserts.
   */
  async refreshSingle(opportunityNumber: string): Promise<RefreshResult> {
    const result: RefreshResult = {
      fetched: 0,
      upserted: 0,
      failed: 0,
      errors: [],
    };

    try {
      const hits = await grantsGovService.searchOpportunities({
        keyword: opportunityNumber,
        rows: envInt('GRANTS_GOV_PAGE_SIZE', DEFAULT_PAGE_SIZE),
        oppStatuses: 'forecasted|posted|closed|archived',
      });
      const match =
        hits.find((h) => h.opportunityNumber === opportunityNumber) ?? hits[0];
      if (!match) {
        result.errors.push({
          opportunityNumber,
          message: 'no matching opportunity found',
        });
        return result;
      }

      result.fetched++;
      const detail = await grantsGovService.getOpportunityDetail(
        match.opportunityId,
      );
      const normalized = grantsGovService.normalizeOpportunity(detail);
      await externalOpportunityService.upsertOpportunity(normalized);
      result.upserted++;
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ opportunityNumber, message });
    }

    return result;
  }

  /**
   * Start the cron schedule. Schedule is configurable via GRANTS_GOV_REFRESH_CRON.
   * No-op when GRANTS_GOV_INGESTION_ENABLED is explicitly 'false' or in test mode.
   */
  start(): void {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.GRANTS_GOV_INGESTION_ENABLED === 'false') return;
    if (this.task) return;

    const schedule = process.env.GRANTS_GOV_REFRESH_CRON ?? DEFAULT_CRON;
    if (!cron.validate(schedule)) {
      // eslint-disable-next-line no-console
      console.error(
        `[ingestion] invalid GRANTS_GOV_REFRESH_CRON "${schedule}"; falling back to default`,
      );
    }
    const effective = cron.validate(schedule) ? schedule : DEFAULT_CRON;

    this.task = cron.schedule(effective, () => {
      this.refreshAll()
        .then((r) => {
          // eslint-disable-next-line no-console
          console.log(
            `[ingestion] refreshAll complete: ${r.upserted} upserted, ${r.failed} failed`,
          );
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[ingestion] refreshAll crashed:', err);
        });
    });

    // eslint-disable-next-line no-console
    console.log(`[ingestion] scheduler started with cron "${effective}"`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }
}

export const ingestionScheduler = new IngestionScheduler();
export { IngestionScheduler };
