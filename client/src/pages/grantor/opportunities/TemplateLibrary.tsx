import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunityTemplates } from '../../../hooks/useOpportunityTemplates';
import { useCreateOpportunity, type CreateOpportunityPayload } from '../../../hooks/useOpportunity';

interface TemplateLibraryProps {
  programId: string;
  onClose: () => void;
}

// Group templates by grant_market
const MARKET_LABELS: Record<string, string> = {
  federal: 'Federal',
  state_local: 'State / Local',
  philanthropic: 'Philanthropic',
  corporate: 'Corporate',
  pass_through: 'Pass-Through',
};

// Brief description per template type
const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  federal_nofo: 'Federal Notice of Funding Opportunity following NOFO format requirements.',
  state_grant: 'State or local government grant with standardized sections.',
  philanthropic_rfp: 'Philanthropic Request for Proposals with foundation-focused sections.',
  corporate_grant: 'Corporate grant program aligned with corporate mission and giving guidelines.',
  pass_through_subaward: 'Pass-through subaward with prime award reference and flow-down requirements.',
};

/**
 * Full-page modal template library.
 * Shown when "Create New Opportunity" is clicked.
 * Groups templates by grant_market using USWDS gf-card components.
 * Blocks proceeding without template selection.
 */
export function TemplateLibrary({ programId, onClose }: TemplateLibraryProps) {
  const { templates, isLoading } = useOpportunityTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showSelectionError, setShowSelectionError] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createOpportunity = useCreateOpportunity(programId);
  const navigate = useNavigate();

  // Group by grant_market
  const groups: Record<string, typeof templates> = {};
  for (const template of templates) {
    const market = template.grant_market ?? 'other';
    if (!groups[market]) groups[market] = [];
    groups[market].push(template);
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowSelectionError(false);
  };

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      setShowSelectionError(true);
      return;
    }

    const selected = templates.find((t) => t.template_id === selectedTemplateId);
    if (!selected) return;

    // Create opportunity with minimal required fields from template defaults
    const payload: CreateOpportunityPayload = {
      template_id: selectedTemplateId,
      title: `New ${selected.template_name}`,
      funding_source: 'To be determined',
      announcement_type: 'Initial',
      opportunity_number: `DRAFT-${Date.now()}`,
      eligibility_summary: 'To be completed.',
      executive_summary: 'To be completed.',
      contact_name: 'To be determined',
      contact_email: 'contact@example.gov',
      program_area: 'To be determined',
    };

    try {
      setCreateError(null);
      const opportunity = await createOpportunity.mutateAsync(payload);
      navigate(`/grantor/opportunities/${opportunity.opportunity_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setCreateError(message);
    }
  };

  return (
    <div
      className="-overlay"
      data-testid="template-library-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '2rem 1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-library-title"
    >
      <div
        
        style={{
          background: 'white',
          maxWidth: '800px',
          width: '100%',
          borderRadius: '4px',
          padding: '2rem',
        }}
      >
        {/* Header */}
        <div className="gf-card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 id="template-library-title" className="gf-card__title">
            Select a Template
          </h2>
          <button
            type="button"
            className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
            onClick={onClose}
            aria-label="Close template library"
          >
            ✕
          </button>
        </div>

        <div className="gf-card__body">
          <p >
            Choose a funding opportunity template to get started. Each template provides sections and default settings appropriate for its type.
          </p>

          {/* Error alert when no template selected */}
          {showSelectionError && (
            <div
              className="gf-alert gf-alert gf-alert--error"
              role="alert"
              data-testid="template-selection-error"
            >
              <div >
                <p className="gf-alert__text">Please select a template before continuing.</p>
              </div>
            </div>
          )}

          {/* Error alert when opportunity creation fails */}
          {createError && (
            <div
              className="gf-alert gf-alert gf-alert--error"
              role="alert"
              data-testid="create-opportunity-error"
            >
              <div >
                <p className="gf-alert__text">
                  Could not create opportunity: {createError}
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div aria-busy="true" aria-label="Loading templates">
              Loading templates...
            </div>
          )}

          {/* Template groups */}
          {Object.entries(MARKET_LABELS).map(([market, label]) => {
            const marketTemplates = groups[market] ?? [];
            if (marketTemplates.length === 0) return null;

            return (
              <div key={market} style={{ marginTop: '1.5rem' }}>
                <h3 >{label}</h3>
                <div >
                  {marketTemplates.map((template) => {
                    const isSelected = selectedTemplateId === template.template_id;

                    return (
                      <div
                        key={template.template_id}
                        className="gf-card tablet:grid-col-6"
                        data-testid={`template-card-${template.template_type}`}
                      >
                        <div
                          
                          style={{
                            border: isSelected ? '3px solid #005ea2' : '1px solid #ddd',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleSelectTemplate(template.template_id)}
                        >
                          <div className="gf-card__header">
                            <h4 className="gf-card__title">{template.template_name}</h4>
                          </div>
                          <div className="gf-card__body">
                            <p>{TEMPLATE_DESCRIPTIONS[template.template_type] ?? template.template_name}</p>
                          </div>
                          <div className="gf-card__footer">
                            <button
                              type="button"
                              className={`gf-btn gf-btn--primary${isSelected ? '' : ' gf-btn gf-btn--outline'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTemplate(template.template_id);
                              }}
                              aria-pressed={isSelected}
                              data-testid={`select-template-${template.template_type}`}
                            >
                              {isSelected ? '✓ Selected' : 'Select Template'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="gf-card__footer" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="gf-btn gf-btn--primary gf-btn gf-btn--outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gf-btn gf-btn--primary"
            onClick={handleCreate}
            disabled={createOpportunity.isPending}
            data-testid="create-from-template-btn"
          >
            {createOpportunity.isPending ? 'Creating...' : 'Create Opportunity'}
          </button>
        </div>
      </div>
    </div>
  );
}
