import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { externalSyncApi, type RefreshResult } from '../../api/externalSyncApi';

const LAST_SYNC_KEY = 'grants_gov_last_sync';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never';
  return d.toLocaleString();
}

/**
 * Grantor-admin card to trigger a manual Grants.gov refresh (Plan 08-04 Task 5,
 * PRD-INTAKE-019A). Shown only to grantor_admin (the parent gates rendering).
 * Last-sync time is tracked client-side (no server field for it).
 */
export function GrantsGovSyncCard() {
  const [lastSync, setLastSync] = useState<string | null>(() =>
    localStorage.getItem(LAST_SYNC_KEY),
  );
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await externalSyncApi.refreshNow();
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setErrorMsg(null);
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSync(now);
    },
    onError: () => {
      setErrorMsg('Sync failed. Please try again.');
      setResult(null);
    },
  });

  return (
    <div className="gf-card" data-testid="grants-gov-sync-card">
      <div
        className="gf-card__header"
        style={{ justifyContent: 'space-between' }}
      >
        <h2 className="gf-card__title">Grants.gov Sync</h2>
        <button
          type="button"
          className="gf-btn gf-btn--primary gf-btn--sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      <div style={{ padding: '4px 0' }}>
        <p className="gf-stat-card__sub" style={{ marginBottom: '8px' }}>
          Last sync: <strong>{formatTimestamp(lastSync)}</strong>
        </p>

        {syncMutation.isPending && (
          <p className="gf-stat-card__sub" aria-busy="true">
            Fetching the latest opportunities from Grants.gov…
          </p>
        )}

        {result && !syncMutation.isPending && (
          <div className="gf-alert gf-alert--success" role="status">
            Sync complete — {result.upserted} opportunit
            {result.upserted === 1 ? 'y' : 'ies'} updated
            {result.failed > 0 ? `, ${result.failed} failed` : ''}.
          </div>
        )}

        {errorMsg && (
          <div className="gf-alert gf-alert--error" role="alert">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
