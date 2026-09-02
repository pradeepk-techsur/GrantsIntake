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

const SEARCH_ENDPOINT = `${GRANTS_GOV_BASE}/search2`;
// Detail is a POST to /fetchOpportunity with a JSON body of { opportunityId }.
// The prior GET /opportunities/:id path returned 403 Forbidden on the live API
// (verified 2026-09-02 round-trip); /fetchOpportunity returns 200 with the
// opportunity nested under `data`.
const DETAIL_ENDPOINT = `${GRANTS_GOV_BASE}/fetchOpportunity`;
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

// Extract the application-package URL and per-package instructions from either
// the flat `packages[]` array (test/pre-normalized shape) or the live
// `opportunityPkgs` object (keyed "0","1",…). The live package object carries
// no direct download URL, so we synthesize the public instructions-download URL
// from its packageId when present.
function normalizePackages(raw: GrantsGovDetail): {
  packageUrl: string | null;
  instructions: string[];
} {
  const flat = Array.isArray(raw.packages) ? raw.packages : [];
  if (flat.length > 0) {
    const packageUrl = flat[0]?.packageURL ? String(flat[0].packageURL) : null;
    const instructions = flat
      .map((p) => (typeof p?.instructions === 'string' ? p.instructions : null))
      .filter((v): v is string => v !== null);
    return { packageUrl, instructions };
  }

  const pkgObj = raw.opportunityPkgs as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (pkgObj && typeof pkgObj === 'object') {
    const entries = Object.values(pkgObj);
    const first = entries[0];
    let packageUrl: string | null = null;
    if (first) {
      if (typeof first.packageURL === 'string') {
        packageUrl = first.packageURL;
      } else if (first.packageId != null) {
        packageUrl = `https://apply07.grants.gov/apply/opportunities/instructions/PKG-${String(
          first.packageId,
        )}-instructions.pdf`;
      }
    }
    const instructions = entries
      .map((p) =>
        typeof p?.instructions === 'string' ? (p.instructions as string) : null,
      )
      .filter((v): v is string => v !== null);
    return { packageUrl, instructions };
  }

  return { packageUrl: null, instructions: [] };
}

class GrantsGovService {
  /**
   * Search Grants.gov opportunities (PRD-INTAKE-019A).
   * POST /search2 with a JSON body. Returns the flattened list of hits for the
   * requested page.
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
   * POST /fetchOpportunity with a JSON body of { opportunityId }; the detail is
   * returned nested under `data`. (The prior GET /opportunities/:id path 403s.)
   */
  async getOpportunityDetail(opportunityId: string): Promise<GrantsGovDetail> {
    const res = await fetch(DETAIL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ opportunityId: Number(opportunityId) || opportunityId }),
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

    // The live /fetchOpportunity envelope nests most descriptive fields under
    // `synopsis`, agency under `agencyDetails`, listings under `cfdas[]`, and
    // application packages under `opportunityPkgs` (an object keyed "0","1",…).
    // The flat fields (opportunityTitle, agencyName, closeDate, awardCeiling,
    // eligibilityTypes, packages[], synopsis.synopsisAddendum) are also honored
    // so pre-normalized/test-fixture shapes continue to work.
    const synopsis = (raw.synopsis ?? {}) as Record<string, unknown>;
    const agencyDetails = (raw.agencyDetails ?? {}) as Record<string, unknown>;
    const pkgs = normalizePackages(raw);

    // ── Assistance listing (CFDA) ──────────────────────────────────────────
    const cfdaFromObjects = Array.isArray(raw.cfdas)
      ? (raw.cfdas as Array<Record<string, unknown>>)
          .map((c) =>
            c && c.cfdaNumber != null ? String(c.cfdaNumber) : null,
          )
          .filter((v): v is string => v !== null)
      : [];
    const cfda =
      cfdaFromObjects.length > 0
        ? cfdaFromObjects
        : raw.cfdaNumbers ?? raw.cfdaList ?? [];
    const assistanceListing = cfda.length > 0 ? String(cfda[0]) : null;

    // ── Eligibility summary ────────────────────────────────────────────────
    const eligibilityParts: string[] = [];
    const applicantTypes = synopsis.applicantTypes;
    if (Array.isArray(raw.eligibilityTypes) && raw.eligibilityTypes.length > 0) {
      eligibilityParts.push(raw.eligibilityTypes.join(', '));
    } else if (Array.isArray(applicantTypes) && applicantTypes.length > 0) {
      const labels = (applicantTypes as Array<Record<string, unknown>>)
        .map((t) => (t && t.description ? String(t.description) : null))
        .filter((v): v is string => v !== null);
      if (labels.length > 0) eligibilityParts.push(labels.join(', '));
    }
    const eligDesc =
      raw.applicantEligibilityDesc ??
      raw.eligibilityDesc ??
      (typeof synopsis.applicantEligibilityDesc === 'string'
        ? (synopsis.applicantEligibilityDesc as string)
        : undefined);
    if (eligDesc && typeof eligDesc === 'string' && eligDesc.trim()) {
      eligibilityParts.push(eligDesc.trim());
    }
    const eligibilitySummary =
      eligibilityParts.length > 0 ? eligibilityParts.join(' — ') : null;

    // ── Application package URL ─────────────────────────────────────────────
    const packageUrl = pkgs.packageUrl;

    // ── Fields that may live flat or under synopsis ─────────────────────────
    const agency = raw.agencyName
      ? String(raw.agencyName)
      : agencyDetails.agencyName
        ? String(agencyDetails.agencyName)
        : synopsis.agencyName
          ? String(synopsis.agencyName)
          : null;

    const dueDate =
      toIsoDateOrNull(raw.closeDate) ??
      toIsoDateOrNull(synopsis.responseDateStr) ??
      toIsoDateOrNull(synopsis.responseDate);

    const awardCeiling =
      toNumberOrNull(raw.awardCeiling) ?? toNumberOrNull(synopsis.awardCeiling);
    const awardFloor =
      toNumberOrNull(raw.awardFloor) ?? toNumberOrNull(synopsis.awardFloor);

    const status = raw.opportunityStatus
      ? String(raw.opportunityStatus)
      : raw.oppStatus
        ? String(raw.oppStatus)
        : null;

    // Preserve synopsis addendum + per-package instructions so scheduled
    // re-fetches can detect addenda_change / instructions_change (PRD-INTAKE-019D).
    const synopsisAddendum =
      typeof synopsis.synopsisAddendum === 'string'
        ? (synopsis.synopsisAddendum as string)
        : null;

    return {
      source: 'grants.gov',
      source_url: PUBLIC_DETAIL_URL(opportunityId),
      source_opportunity_number: String(raw.opportunityNumber ?? ''),
      source_assistance_listing: assistanceListing,
      api_reference: raw as Record<string, unknown>,
      title: String(raw.opportunityTitle ?? ''),
      agency,
      opportunity_status: status,
      eligibility_summary: eligibilitySummary,
      due_date: dueDate,
      award_ceiling: awardCeiling,
      award_floor: awardFloor,
      application_package_url: packageUrl,
      raw_metadata: {
        opportunityId,
        cfdaNumbers: cfda,
        eligibilityTypes: raw.eligibilityTypes ?? [],
        synopsisAddendum,
        packageInstructions: pkgs.instructions,
      },
    };
  }
}

export const grantsGovService = new GrantsGovService();
export { GrantsGovService };
