import { useParams, Link } from 'react-router-dom';
import { useOpportunity, useUpdateOpportunity, type UpdateOpportunityPayload } from '../../../hooks/useOpportunity';
import { MetadataForm } from './MetadataForm';

/**
 * Main Opportunity Builder page.
 * Route: /grantor/opportunities/:id
 *
 * Shows:
 * - Navigation breadcrumb
 * - Status badge
 * - MetadataForm (auto-saves on blur)
 * - Sidebar readiness checklist (static placeholder for this phase)
 */
export function OpportunityBuilder() {
  const { id } = useParams<{ id: string }>();
  const { opportunity, isLoading, error } = useOpportunity(id ?? null);
  const updateOpportunity = useUpdateOpportunity(id ?? null);

  const handleSave = async (patch: UpdateOpportunityPayload): Promise<void> => {
    await updateOpportunity.mutateAsync(patch);
  };

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading opportunity">
        <p>Loading opportunity...</p>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h4 className="usa-alert__heading">Opportunity Not Found</h4>
          <p className="usa-alert__text">
            This opportunity could not be loaded.{' '}
            <Link to="/grantor/opportunities">Return to Opportunities</Link>
          </p>
        </div>
      </div>
    );
  }

  const statusLabelMap: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
    archived: 'Archived',
  };

  const statusColorMap: Record<string, string> = {
    draft: '#9e9e9e',
    published: '#2e7d32',
    closed: '#c62828',
    archived: '#616161',
  };

  const statusLabel = statusLabelMap[opportunity.status] ?? opportunity.status;
  const statusColor = statusColorMap[opportunity.status] ?? '#9e9e9e';

  return (
    <div data-testid="opportunity-builder">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="usa-breadcrumb">
        <ol className="usa-breadcrumb__list">
          <li className="usa-breadcrumb__list-item">
            <Link to="/grantor/opportunities" className="usa-breadcrumb__link">
              Opportunities
            </Link>
          </li>
          <li className="usa-breadcrumb__list-item usa-current" aria-current="page">
            <span>{opportunity.title}</span>
          </li>
        </ol>
      </nav>

      {/* Page header with status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 className="usa-prose" style={{ margin: 0 }}>
          {opportunity.title}
        </h1>
        <span
          className="usa-tag"
          style={{ background: statusColor, color: 'white' }}
          aria-label={`Status: ${statusLabel}`}
          data-testid="opportunity-status-badge"
        >
          {statusLabel}
        </span>
      </div>

      {/* Two-column layout: form + sidebar */}
      <div className="grid-row grid-gap">
        {/* Main form */}
        <div className="desktop:grid-col-9">
          <MetadataForm opportunity={opportunity} onSave={handleSave} />
        </div>

        {/* Sidebar readiness checklist */}
        <div className="desktop:grid-col-3">
          <div
            className="usa-card"
            style={{ position: 'sticky', top: '1rem' }}
            data-testid="readiness-checklist"
          >
            <div className="usa-card__container">
              <div className="usa-card__header">
                <h3 className="usa-card__heading">Readiness Checklist</h3>
              </div>
              <div className="usa-card__body">
                <ul className="usa-list">
                  <li>
                    <input type="checkbox" disabled aria-label="Metadata section" />
                    {' '}Metadata
                  </li>
                  <li>
                    <input type="checkbox" disabled aria-label="Deadlines section" />
                    {' '}Deadlines
                  </li>
                  <li>
                    <input type="checkbox" disabled aria-label="Eligibility Rules section" />
                    {' '}Eligibility Rules
                  </li>
                  <li>
                    <input type="checkbox" disabled aria-label="Form Sections section" />
                    {' '}Form Sections
                  </li>
                </ul>
                <p className="usa-hint" style={{ fontSize: '0.875rem' }}>
                  Completeness validation configured in next phase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
