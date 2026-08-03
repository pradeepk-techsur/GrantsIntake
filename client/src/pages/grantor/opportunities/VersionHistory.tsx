import { useOpportunityVersions, type OpportunityVersion } from '../../../hooks/useOpportunity';

interface VersionHistoryProps {
  opportunityId: string;
}

/**
 * VersionHistory — F6: Immutable version history list
 * Fetches GET /api/v1/opportunities/:id/versions via React Query.
 * Shows versions in DESC order (highest version number first).
 * Shows "No version history" before first publication.
 */
export function VersionHistory({ opportunityId }: VersionHistoryProps) {
  const { data: versions, isLoading, error } = useOpportunityVersions(opportunityId);

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading version history">
        <p className="gf-hint">Loading version history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gf-alert gf-alert gf-alert--error" role="alert">
        <div >
          <p className="gf-alert__text">Failed to load version history.</p>
        </div>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div data-testid="version-history-empty">
        <p className="gf-hint" style={{ fontStyle: 'italic' }}>
          No version history — versions are created when this opportunity is published or modified
          after publication.
        </p>
      </div>
    );
  }

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getDeltaSummary = (version: OpportunityVersion): string => {
    if (!version.delta || Object.keys(version.delta).length === 0) {
      return 'No field changes';
    }
    const fields = Object.keys(version.delta);
    if (fields.length <= 3) {
      return fields.join(', ');
    }
    return `${fields.slice(0, 3).join(', ')} and ${fields.length - 3} more`;
  };

  return (
    <div data-testid="version-history">
      <div className="gf-table-container--scrollable" tabIndex={0}>
        <table className="gf-table gf-table" style={{ width: '100%' }}>
          <caption className="gf-sr-only">Opportunity version history</caption>
          <thead>
            <tr>
              <th scope="col">Version</th>
              <th scope="col">Modification Reason</th>
              <th scope="col">Changed Fields</th>
              <th scope="col">Modified At</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.version_id} data-testid={`version-row-${version.version_number}`}>
                <td>
                  <span
                    className="gf-badge gf-badge--neutral"
                    style={{ background: version.version_number === 1 ? '#2e7d32' : '#005ea2', color: 'white' }}
                  >
                    v{version.version_number}
                  </span>
                </td>
                <td>
                  {version.version_number === 1 && version.modification_reason === 'Initial publication'
                    ? <em>Initial publication</em>
                    : version.modification_reason}
                </td>
                <td>
                  <span className="gf-hint" style={{ fontSize: '0.85rem' }}>
                    {getDeltaSummary(version)}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.875rem' }}>{formatDate(version.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
