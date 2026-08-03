import { useState, useCallback } from 'react';
import type {
  Opportunity,
  CompletenessBlocker,
  CompletenessResult,
} from '../../../hooks/useOpportunity';
import { useCheckReadiness, usePublishOpportunity } from '../../../hooks/useOpportunity';

interface CompletenessChecklistProps {
  opportunity: Opportunity;
}

interface ChecklistItem {
  id: string;
  label: string;
  complete: boolean;
  required: boolean;
}

/**
 * Derive client-side completeness state using same rules as server completenessService.
 * This gives real-time feedback without requiring a network call.
 */
function deriveChecklistItems(opportunity: Opportunity): ChecklistItem[] {
  const isFederal = opportunity.funding_source && /federal/i.test(opportunity.funding_source);

  const metadataFields: Array<{ field: keyof Opportunity; label: string }> = [
    { field: 'title', label: 'Title' },
    { field: 'funding_source', label: 'Funding Source' },
    { field: 'announcement_type', label: 'Announcement Type' },
    { field: 'opportunity_number', label: 'Opportunity Number' },
    { field: 'funding_amount_max', label: 'Maximum Funding Amount' },
    { field: 'eligibility_summary', label: 'Eligibility Summary' },
    { field: 'executive_summary', label: 'Executive Summary' },
    { field: 'contact_name', label: 'Contact Name' },
    { field: 'contact_email', label: 'Contact Email' },
    { field: 'program_area', label: 'Program Area' },
  ];

  const metadataComplete = metadataFields.every((mf) => {
    const val = opportunity[mf.field];
    return val !== null && val !== undefined && String(val).trim() !== '';
  });

  const items: ChecklistItem[] = [
    {
      id: 'metadata',
      label: 'Metadata fields complete',
      complete: metadataComplete,
      required: true,
    },
    {
      id: 'deadlines',
      label: 'Application window configured',
      complete: !!opportunity.application_open_date && !!opportunity.application_close_date,
      required: true,
    },
  ];

  // LOI deadline — shown only when loi_required=true
  if (opportunity.loi_required) {
    items.push({
      id: 'loi_deadline',
      label: 'LOI Deadline set',
      complete: !!opportunity.loi_deadline,
      required: true,
    });
  }

  // Assistance Listing Number — shown only for federal funding
  if (isFederal) {
    const alnValid =
      opportunity.assistance_listing_number &&
      /^\d{2}\.\d{3}$/.test(opportunity.assistance_listing_number);
    items.push({
      id: 'assistance_listing',
      label: 'Assistance Listing Number',
      complete: !!alnValid,
      required: true,
    });
  }

  return items;
}

/**
 * CompletenessChecklist — F5: Real-time publication readiness sidebar
 * Shows green check / red X per required field group.
 * "Check Readiness" calls dry_run publish endpoint.
 * "Publish" is disabled when any required items are incomplete.
 */
export function CompletenessChecklist({ opportunity }: CompletenessChecklistProps) {
  const [serverResult, setServerResult] = useState<CompletenessResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const checkReadiness = useCheckReadiness(opportunity.opportunity_id);
  const publishOpportunity = usePublishOpportunity(opportunity.opportunity_id);

  const checklistItems = deriveChecklistItems(opportunity);
  const requiredItems = checklistItems.filter((i) => i.required);
  const allRequiredComplete = requiredItems.every((i) => i.complete);

  const isPublished = opportunity.status === 'published';

  const handleCheckReadiness = useCallback(async () => {
    setServerResult(null);
    setPublishError(null);
    try {
      const result = await checkReadiness.mutateAsync();
      setServerResult(result);
    } catch {
      setPublishError('Failed to check readiness. Please try again.');
    }
  }, [checkReadiness]);

  const handlePublish = useCallback(async () => {
    setPublishError(null);
    setPublishSuccess(false);
    try {
      await publishOpportunity.mutateAsync();
      setPublishSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; blockers?: CompletenessBlocker[] } } };
      if (error.response?.data?.error === 'PUBLICATION_BLOCKED') {
        const blockers = error.response.data.blockers ?? [];
        setServerResult({ is_ready: false, blockers });
      } else if (error.response?.data?.error === 'ALREADY_PUBLISHED') {
        setPublishError('This opportunity is already published.');
      } else {
        setPublishError('Publication failed. Please check all fields and try again.');
      }
    }
  }, [publishOpportunity]);

  return (
    <div
      className="gf-card"
      style={{ position: 'sticky', top: '1rem' }}
      data-testid="completeness-checklist"
    >
      <div >
        <div className="gf-card__header">
          <h3 className="gf-card__title">Publication Readiness</h3>
        </div>
        <div className="gf-card__body">
          {/* Status badge for published opportunities */}
          {isPublished && publishSuccess && (
            <div
              className="gf-alert gf-alert gf-alert--success"
              role="alert"
              data-testid="publish-success-alert"
            >
              <div >
                <p className="gf-alert__text">Opportunity published successfully</p>
              </div>
            </div>
          )}

          {/* Checklist items */}
          <ul  style={{ marginBottom: '1rem' }}>
            {checklistItems.map((item) => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0',
                }}
                data-testid={`checklist-item-${item.id}`}
              >
                {item.complete ? (
                  <span
                    aria-label="Complete"
                    style={{ color: '#2e7d32', fontSize: '1.1rem', fontWeight: 'bold' }}
                    data-testid={`check-${item.id}`}
                  >
                    ✓
                  </span>
                ) : (
                  <span
                    aria-label="Incomplete"
                    style={{ color: '#c62828', fontSize: '1.1rem', fontWeight: 'bold' }}
                    data-testid={`x-${item.id}`}
                  >
                    ✗
                  </span>
                )}
                <span style={{ fontSize: '0.875rem' }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {/* Server readiness result (from dry run) */}
          {serverResult && !serverResult.is_ready && (
            <div
              className="gf-alert gf-alert gf-alert--error"
              role="alert"
              data-testid="readiness-blockers-alert"
            >
              <div >
                <h4 className="gf-alert__title" style={{ fontSize: '0.875rem' }}>
                  Publication Blocked
                </h4>
                <ul  style={{ fontSize: '0.8rem', margin: 0 }}>
                  {serverResult.blockers.map((blocker, i) => (
                    <li key={i}>
                      <strong>{blocker.section}:</strong> {blocker.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {serverResult && serverResult.is_ready && (
            <div
              className="gf-alert gf-alert gf-alert--success"
              role="alert"
              data-testid="readiness-ready-alert"
            >
              <div >
                <p className="gf-alert__text">Ready to publish</p>
              </div>
            </div>
          )}

          {publishError && (
            <div
              className="gf-alert gf-alert gf-alert--error"
              role="alert"
              data-testid="publish-error-alert"
            >
              <div >
                <p className="gf-alert__text">{publishError}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {!isPublished && (
              <>
                <button
                  type="button"
                  className="gf-btn gf-btn--primary gf-btn gf-btn--outline"
                  onClick={handleCheckReadiness}
                  disabled={checkReadiness.isPending}
                  data-testid="check-readiness-button"
                >
                  {checkReadiness.isPending ? 'Checking...' : 'Check Readiness'}
                </button>

                <button
                  type="button"
                  className="gf-btn gf-btn--primary"
                  onClick={handlePublish}
                  disabled={!allRequiredComplete || publishOpportunity.isPending}
                  aria-disabled={!allRequiredComplete}
                  data-testid="publish-button"
                >
                  {publishOpportunity.isPending ? 'Publishing...' : 'Publish Opportunity'}
                </button>
              </>
            )}

            {isPublished && (
              <div
                className="gf-badge gf-badge--neutral"
                style={{ background: '#2e7d32', color: 'white', textAlign: 'center', padding: '0.5rem' }}
                data-testid="published-badge"
              >
                Published
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
