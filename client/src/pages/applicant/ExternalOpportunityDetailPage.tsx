import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalOpportunitiesApi } from '../../api/externalOpportunitiesApi';
import { useAuthStore } from '../../store/authStore';
import {
  statusBadgeClass,
  statusBadgeLabel,
  formatAwardRange,
  formatDate,
} from '../../components/ExternalOpportunityCard';
import type { ExternalOpportunityVersion } from '../../types/externalOpportunity';

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return 'unknown';
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * ExternalOpportunityDetailPage — full Grants.gov opportunity detail.
 * Header, metadata grid, eligibility panel, source attribution, version-history
 * accordion, and an action bar with save/unsave + Import to Workspace
 * (PRD-INTAKE-019C/019E). Renders at /applicant/grants-gov/:id.
 */
export function ExternalOpportunityDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [versionsOpen, setVersionsOpen] = useState(false);

  const { data: opp, isLoading, isError } = useQuery({
    queryKey: ['external-opportunity', id],
    queryFn: () =>
      externalOpportunitiesApi.getExternalOpportunity(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: versionsData } = useQuery({
    queryKey: ['external-opportunity', id, 'versions'],
    queryFn: () =>
      externalOpportunitiesApi.getVersionHistory(id).then((r) => r.data),
    enabled: !!id && versionsOpen,
  });

  const { data: savedData } = useQuery({
    queryKey: ['external-opportunities', 'saved'],
    queryFn: () => externalOpportunitiesApi.listSaved().then((r) => r.data),
    enabled: !!accessToken,
  });

  const isSaved = !!savedData?.items?.some((o) => o.id === id);

  const saveMutation = useMutation({
    mutationFn: (saved: boolean) =>
      saved
        ? externalOpportunitiesApi.unsaveOpportunity(id)
        : externalOpportunitiesApi.saveOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['external-opportunities', 'saved'],
      });
    },
  });

  if (isLoading) {
    return (
      <div className="gf-loading" aria-busy="true" style={{ padding: 24 }}>
        Loading opportunity…
      </div>
    );
  }

  if (isError || !opp) {
    return (
      <div style={{ padding: 24 }}>
        <div className="gf-alert gf-alert--error" role="alert">
          <div>
            <p className="gf-alert__title">Opportunity not found</p>
            <p className="gf-alert__text">
              This opportunity could not be loaded.{' '}
              <Link to="/applicant/grants-gov">Back to browse</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const versions: ExternalOpportunityVersion[] = versionsData?.versions ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <p style={{ marginTop: 0 }}>
        <Link to="/applicant/grants-gov">← Back to browse</Link>
      </p>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="gf-page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="gf-page-title" data-testid="detail-title">
            {opp.title}
          </h1>
          <p className="gf-page-subtitle">
            {opp.agency ?? 'Unknown agency'} · FON:{' '}
            {opp.source_opportunity_number}
          </p>
        </div>
        <span className={statusBadgeClass(opp.opportunity_status)}>
          {statusBadgeLabel(opp.opportunity_status)}
        </span>
      </div>

      <p
        className="gf-text-muted"
        data-testid="detail-last-updated"
        style={{ color: 'var(--gf-text-muted, #555)' }}
      >
        Last updated from Grants.gov: {formatTimestamp(opp.last_fetched_at)}
      </p>

      {/* ── Metadata grid ──────────────────────────────────── */}
      <dl
        className="gf-meta-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px 24px',
          margin: '16px 0',
        }}
      >
        <div>
          <dt style={{ fontWeight: 600 }}>Due date</dt>
          <dd style={{ margin: 0 }}>{formatDate(opp.due_date)}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600 }}>Award range</dt>
          <dd style={{ margin: 0 }}>
            {formatAwardRange(opp.award_ceiling, opp.award_floor)}
          </dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600 }}>Assistance listing</dt>
          <dd style={{ margin: 0 }}>
            {opp.source_assistance_listing ?? '—'}
          </dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600 }}>Application package</dt>
          <dd style={{ margin: 0 }}>
            {opp.application_package_url ? (
              <a
                href={opp.application_package_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open package ↗
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt style={{ fontWeight: 600 }}>Source</dt>
          <dd style={{ margin: 0 }}>
            <a href={opp.source_url} target="_blank" rel="noopener noreferrer">
              View on Grants.gov ↗
            </a>
          </dd>
        </div>
      </dl>

      {/* ── Eligibility panel ──────────────────────────────── */}
      {opp.eligibility_summary && (
        <div
          className="gf-alert gf-alert--info"
          role="note"
          data-testid="detail-eligibility"
        >
          <div>
            <p className="gf-alert__title">Eligibility</p>
            <p className="gf-alert__text">{opp.eligibility_summary}</p>
          </div>
        </div>
      )}

      {/* ── Version history accordion ──────────────────────── */}
      <section style={{ margin: '24px 0' }}>
        <button
          type="button"
          className="gf-btn gf-btn--ghost"
          aria-expanded={versionsOpen}
          data-testid="version-history-toggle"
          onClick={() => setVersionsOpen((o) => !o)}
        >
          {versionsOpen ? '▾' : '▸'} Version history
        </button>

        {versionsOpen && (
          <div data-testid="version-history-panel" style={{ marginTop: 12 }}>
            {versions.length === 0 ? (
              <p className="gf-text-muted">No version history available.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {versions.map((v) => (
                  <li
                    key={v.id}
                    data-testid="version-history-item"
                    style={{
                      borderLeft: '3px solid var(--gf-primary, #005EA6)',
                      paddingLeft: 12,
                      marginBottom: 12,
                    }}
                  >
                    <strong>Version {v.version_number}</strong> ·{' '}
                    <span className="gf-text-muted">
                      {formatTimestamp(v.fetched_at)}
                    </span>
                    <div style={{ fontSize: '0.9rem' }}>
                      {v.changed_fields.length > 0 ? (
                        <>Changed: {v.changed_fields.join(', ')}</>
                      ) : (
                        <>Initial import</>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Action bar ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid var(--gf-border, #e2e8f0)',
        }}
      >
        <button
          type="button"
          className="gf-btn gf-btn--ghost"
          data-testid="detail-save"
          aria-pressed={isSaved}
          disabled={!accessToken || saveMutation.isPending}
          onClick={() => saveMutation.mutate(isSaved)}
        >
          <span aria-hidden="true">{isSaved ? '♥' : '♡'}</span>{' '}
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          className="gf-btn gf-btn--primary"
          data-testid="import-to-workspace"
          onClick={() =>
            navigate(`/applicant/grants-gov/${opp.id}/import`, {
              state: {
                title: opp.title,
                agency: opp.agency,
                source_opportunity_number: opp.source_opportunity_number,
                source_url: opp.source_url,
                application_package_url: opp.application_package_url,
              },
            })
          }
        >
          Import to Workspace
        </button>
      </div>

      {/* ── Source attribution footer ──────────────────────── */}
      <footer
        className="gf-text-muted"
        data-testid="source-attribution"
        style={{
          marginTop: 24,
          fontSize: '0.85rem',
          color: 'var(--gf-text-muted, #555)',
        }}
      >
        Source: Grants.gov API · Imported {formatTimestamp(opp.import_timestamp)}{' '}
        · Reference: {opp.source_opportunity_number}
      </footer>
    </div>
  );
}
