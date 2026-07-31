import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOpportunity, useUpdateOpportunity, type UpdateOpportunityPayload } from '../../../hooks/useOpportunity';
import { MetadataForm } from './MetadataForm';
import { DeadlineForm } from './DeadlineForm';
import { CompletenessChecklist } from './CompletenessChecklist';
import { VersionHistory } from './VersionHistory';
import { EligibilityRuleBuilder } from './EligibilityRuleBuilder';
import { PrescreeningBuilder } from './PrescreeningBuilder';
import { ConditionalSectionConfig } from './ConditionalSectionConfig';
import { AttachmentRequirementsConfig } from './AttachmentRequirementsConfig';
import { ScreeningCriteriaConfig } from './ScreeningCriteriaConfig';

type BuilderSection =
  | 'metadata'
  | 'deadlines'
  | 'versions'
  | 'eligibility-rules'
  | 'prescreening'
  | 'conditional-sections'
  | 'attachments'
  | 'screening'
  | 'qa';

/**
 * Main Opportunity Builder page.
 * Route: /grantor/opportunities/:id
 *
 * Shows:
 * - Navigation breadcrumb
 * - Status badge
 * - Tab nav: Metadata | Deadlines | Version History
 * - MetadataForm (auto-saves on blur)
 * - DeadlineForm (auto-saves on blur)
 * - VersionHistory (fetched from API)
 * - Sidebar: CompletenessChecklist (real-time readiness)
 *
 * When opportunity is published, PATCH requests show a modal requesting modification_reason.
 */
export function OpportunityBuilder() {
  const { id } = useParams<{ id: string }>();
  const { opportunity, isLoading, error } = useOpportunity(id ?? null);
  const updateOpportunity = useUpdateOpportunity(id ?? null);

  const [activeSection, setActiveSection] = useState<BuilderSection>('metadata');
  const [modReasonModal, setModReasonModal] = useState<{
    open: boolean;
    pendingPatch: UpdateOpportunityPayload | null;
  }>({ open: false, pendingPatch: null });
  const [modReasonInput, setModReasonInput] = useState('');
  const [modReasonError, setModReasonError] = useState('');

  /**
   * Save handler — if opportunity is published, show modification reason modal first.
   * Otherwise, save directly.
   */
  const handleSave = useCallback(
    async (patch: UpdateOpportunityPayload): Promise<void> => {
      if (opportunity?.status === 'published') {
        // Open modal requesting modification reason
        setModReasonModal({ open: true, pendingPatch: patch });
        setModReasonInput('');
        setModReasonError('');
        // Return a Promise that resolves after modal interaction
        // The actual save happens in handleModReasonSubmit
        return;
      }
      await updateOpportunity.mutateAsync(patch);
    },
    [opportunity?.status, updateOpportunity],
  );

  /**
   * Submit handler for the modification reason modal.
   */
  const handleModReasonSubmit = useCallback(async () => {
    if (!modReasonInput.trim()) {
      setModReasonError('Please provide a modification reason');
      return;
    }
    if (!modReasonModal.pendingPatch) return;

    const patchWithReason: UpdateOpportunityPayload = {
      ...modReasonModal.pendingPatch,
      modification_reason: modReasonInput.trim(),
    };

    try {
      await updateOpportunity.mutateAsync(patchWithReason);
      setModReasonModal({ open: false, pendingPatch: null });
      setModReasonInput('');
      setModReasonError('');
    } catch {
      setModReasonError('Failed to save. Please try again.');
    }
  }, [modReasonInput, modReasonModal.pendingPatch, updateOpportunity]);

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
      {/* Modification reason modal */}
      {modReasonModal.open && (
        <div
          className="usa-modal-wrapper is-visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mod-reason-heading"
          data-testid="modification-reason-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="usa-modal"
            style={{ background: 'white', padding: '2rem', maxWidth: '480px', width: '100%', borderRadius: '4px' }}
          >
            <h2 id="mod-reason-heading" className="usa-modal__heading">
              Modification Reason Required
            </h2>
            <p>
              This opportunity is published. Please explain why you are making this change.
            </p>
            <div className={`usa-form-group${modReasonError ? ' usa-form-group--error' : ''}`}>
              <label className="usa-label" htmlFor="mod-reason-input">
                Reason for modification <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
              </label>
              {modReasonError && (
                <span className="usa-error-message" role="alert" data-testid="mod-reason-error">
                  {modReasonError}
                </span>
              )}
              <textarea
                id="mod-reason-input"
                name="modification_reason"
                className={`usa-textarea${modReasonError ? ' usa-input--error' : ''}`}
                rows={3}
                value={modReasonInput}
                onChange={(e) => {
                  setModReasonInput(e.target.value);
                  setModReasonError('');
                }}
                data-testid="mod-reason-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="usa-button"
                onClick={handleModReasonSubmit}
                disabled={updateOpportunity.isPending}
                data-testid="mod-reason-submit"
              >
                {updateOpportunity.isPending ? 'Saving...' : 'Save Change'}
              </button>
              <button
                type="button"
                className="usa-button usa-button--unstyled"
                onClick={() => {
                  setModReasonModal({ open: false, pendingPatch: null });
                  setModReasonInput('');
                  setModReasonError('');
                }}
                data-testid="mod-reason-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Section navigation tabs */}
      <nav aria-label="Opportunity builder sections" style={{ marginBottom: '1.5rem' }}>
        <ul
          className="usa-sidenav"
          style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', padding: 0, listStyle: 'none', margin: 0 }}
        >
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'metadata' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('metadata')}
              aria-current={activeSection === 'metadata' ? 'page' : undefined}
              data-testid="tab-metadata"
            >
              Metadata
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'deadlines' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('deadlines')}
              aria-current={activeSection === 'deadlines' ? 'page' : undefined}
              data-testid="tab-deadlines"
            >
              Deadlines &amp; Intake Window
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'versions' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('versions')}
              aria-current={activeSection === 'versions' ? 'page' : undefined}
              data-testid="tab-versions"
            >
              Version History
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'eligibility-rules' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('eligibility-rules')}
              aria-current={activeSection === 'eligibility-rules' ? 'page' : undefined}
              data-testid="tab-eligibility-rules"
            >
              Eligibility Rules
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'prescreening' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('prescreening')}
              aria-current={activeSection === 'prescreening' ? 'page' : undefined}
              data-testid="tab-prescreening"
            >
              Pre-Screening
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'conditional-sections' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('conditional-sections')}
              aria-current={activeSection === 'conditional-sections' ? 'page' : undefined}
              data-testid="tab-conditional-sections"
            >
              Conditional Sections
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'attachments' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('attachments')}
              aria-current={activeSection === 'attachments' ? 'page' : undefined}
              data-testid="tab-attachments"
            >
              Attachments
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'screening' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('screening')}
              aria-current={activeSection === 'screening' ? 'page' : undefined}
              data-testid="tab-screening"
            >
              Screening Criteria
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`usa-button${activeSection === 'qa' ? '' : ' usa-button--outline'}`}
              onClick={() => setActiveSection('qa')}
              aria-current={activeSection === 'qa' ? 'page' : undefined}
              data-testid="tab-qa"
            >
              Q&amp;A Management
            </button>
          </li>
        </ul>
      </nav>

      {/* Two-column layout: form + sidebar */}
      <div className="grid-row grid-gap">
        {/* Main form area */}
        <div className="desktop:grid-col-9">
          {activeSection === 'metadata' && (
            <MetadataForm opportunity={opportunity} onSave={handleSave} />
          )}
          {activeSection === 'deadlines' && (
            <DeadlineForm opportunity={opportunity} onSave={handleSave} />
          )}
          {activeSection === 'versions' && (
            <section aria-labelledby="version-history-heading">
              <h2 id="version-history-heading" className="usa-prose" style={{ marginTop: 0 }}>
                Version History
              </h2>
              <VersionHistory opportunityId={opportunity.opportunity_id} />
            </section>
          )}
          {activeSection === 'eligibility-rules' && (
            <EligibilityRuleBuilder opportunityId={opportunity.opportunity_id} />
          )}
          {activeSection === 'prescreening' && (
            <PrescreeningBuilder opportunityId={opportunity.opportunity_id} />
          )}
          {activeSection === 'conditional-sections' && (
            <ConditionalSectionConfig opportunityId={opportunity.opportunity_id} />
          )}
          {activeSection === 'attachments' && (
            <AttachmentRequirementsConfig opportunityId={opportunity.opportunity_id} />
          )}
          {activeSection === 'screening' && (
            <ScreeningCriteriaConfig opportunityId={opportunity.opportunity_id} />
          )}
          {activeSection === 'qa' && id && (
            <section aria-labelledby="qa-management-heading">
              <h2 id="qa-management-heading" className="usa-prose" style={{ marginTop: 0 }}>
                Q&amp;A Management
              </h2>
              <p className="usa-prose">
                Manage applicant questions and publish public answers for this opportunity.
              </p>
              <Link
                to={`/grantor/opportunities/${id}/qa`}
                className="usa-button"
                data-testid="open-qa-management-link"
              >
                Open Q&amp;A Management Page
              </Link>
            </section>
          )}
        </div>

        {/* Sidebar: CompletenessChecklist (always visible) */}
        <div className="desktop:grid-col-3">
          <CompletenessChecklist opportunity={opportunity} />
        </div>
      </div>
    </div>
  );
}
