import {
  GrantsGovSearchParams,
  GrantsGovSearchResult,
  GrantsGovSearchHit,
  GrantsGovDetail,
  NormalizedOpportunity,
} from '../../types/externalOpportunity';

// Grants.gov public REST API base (no API key required for public search).
// PRD-INTAKE-019A: opportunity ingestion via REST (not S2S).
const GRANTS_GOV_BASE =
  process.env.GRANTS_GOV_API_BASE ?? 'https://api.grants.gov/v1/api';

const SEARCH_ENDPOINT = `${GRANTS_GOV_BASE}/search2/opportunities/search`;
const DETAIL_ENDPOINT = (id: string) => `${GRANTS_GOV_BASE}/opportunities/${id}`;
const PUBLIC_DETAIL_URL = (id: string) =>
  `https://www.grants.gov/search-results-detail/${id}`;

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Normalize a variety of Grants.gov date strings to ISO YYYY-MM-DD (or null).
function toIsoDateOrNull(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Grants.gov commonly returns MM/DD/YYYY
  const mdy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy) {
    return `${mdy[3]}-${mdy[1]}-${mdy[2]}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

class GrantsGovService {
  /**
   * Search Grants.gov opportunities (PRD-INTAKE-019A).
   * POST /search2/opportunities/search with a JSON body. Returns the flattened
   * list of hits for the requested page.
   */
  async searchOpportunities(
    params: GrantsGovSearchParams = {},
  ): Promise<GrantsGovSearchResult[]> {
    const body = {
      rows: params.rows ?? 25,
      startRecordNum: params.startRecordNum ?? 0,
      oppStatuses: params.oppStatuses ?? 'posted',
      keyword: params.keyword ?? '',
      ...(params.agencies ? { agencies: params.agencies } : {}),
    };

    const res = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        `Grants.gov search failed: ${res.status} ${res.statusText}`,
      );
    }

    const json = (await res.json()) as {
      data?: { oppHits?: GrantsGovSearchHit[]; hitCount?: number };
      oppHits?: GrantsGovSearchHit[];
    };

    // The search2 API nests results under `data.oppHits`; tolerate a flat shape too.
    const hits: GrantsGovSearchHit[] =
      json.data?.oppHits ?? json.oppHits ?? [];

    return hits.map((hit) => ({
      opportunityId: String(hit.id),
      opportunityNumber: hit.number,
      title: hit.title,
      agency: hit.agencyName ?? hit.agency,
      status: hit.oppStatus,
      closeDate: hit.closeDate,
      cfdaNumbers: hit.cfdaList,
      raw: hit,
    }));
  }

  /**
   * Fetch full detail for a single opportunity by its Grants.gov internal id.
   */
  async getOpportunityDetail(opportunityId: string): Promise<GrantsGovDetail> {
    const res = await fetch(DETAIL_ENDPOINT(opportunityId), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(
        `Grants.gov detail fetch failed for ${opportunityId}: ${res.status} ${res.statusText}`,
      );
    }

    const json = (await res.json()) as {
      data?: GrantsGovDetail;
    } & GrantsGovDetail;

    // Tolerate both `{ data: {...} }` and a flat detail object.
    return (json.data ?? json) as GrantsGovDetail;
  }

  /**
   * Map a raw Grants.gov detail response to the internal canonical schema
   * (PRD-INTAKE-019B). Also preserves source attribution (PRD-INTAKE-019E).
   */
  normalizeOpportunity(raw: GrantsGovDetail): NormalizedOpportunity {
    const opportunityId = String(raw.opportunityId ?? raw.id ?? '');

    const cfda = raw.cfdaNumbers ?? raw.cfdaList ?? [];
    const assistanceListing = cfda.length > 0 ? String(cfda[0]) : null;

    const eligibilityParts: string[] = [];
    if (Array.isArray(raw.eligibilityTypes) && raw.eligibilityTypes.length > 0) {
      eligibilityParts.push(raw.eligibilityTypes.join(', '));
    }
    const eligDesc = raw.applicantEligibilityDesc ?? raw.eligibilityDesc;
    if (eligDesc && typeof eligDesc === 'string' && eligDesc.trim()) {
      eligibilityParts.push(eligDesc.trim());
    }
    const eligibilitySummary =
      eligibilityParts.length > 0 ? eligibilityParts.join(' — ') : null;

    const packageUrl =
      Array.isArray(raw.packages) && raw.packages[0]?.packageURL
        ? String(raw.packages[0].packageURL)
        : null;

    // Preserve synopsis addendum + per-package instructions so scheduled
    // re-fetches can detect addenda_change / instructions_change (PRD-INTAKE-019D).
    const synopsisAddendum =
      raw.synopsis && typeof raw.synopsis.synopsisAddendum === 'string'
        ? raw.synopsis.synopsisAddendum
        : null;
    const packageInstructions = Array.isArray(raw.packages)
      ? raw.packages
          .map((p) =>
            typeof p?.instructions === 'string' ? p.instructions : null,
          )
          .filter((v): v is string => v !== null)
      : [];

    return {
      source: 'grants.gov',
      source_url: PUBLIC_DETAIL_URL(opportunityId),
      source_opportunity_number: String(raw.opportunityNumber ?? ''),
      source_assistance_listing: assistanceListing,
      api_reference: raw as Record<string, unknown>,
      title: String(raw.opportunityTitle ?? ''),
      agency: raw.agencyName ? String(raw.agencyName) : null,
      opportunity_status: raw.opportunityStatus
        ? String(raw.opportunityStatus)
        : null,
      eligibility_summary: eligibilitySummary,
      due_date: toIsoDateOrNull(raw.closeDate),
      award_ceiling: toNumberOrNull(raw.awardCeiling),
      award_floor: toNumberOrNull(raw.awardFloor),
      application_package_url: packageUrl,
      raw_metadata: {
        opportunityId,
        cfdaNumbers: cfda,
        eligibilityTypes: raw.eligibilityTypes ?? [],
        synopsisAddendum,
        packageInstructions,
      },
    };
  }
}

export const grantsGovService = new GrantsGovService();
export { GrantsGovService };
