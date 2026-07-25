import { useState, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { TemplateLibrary } from './opportunities/TemplateLibrary';
import apiClient from '../../api/client';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

// For the template library, we need a program ID.
// In Phase 1 we use the first available program from the user's org.
// If no program exists, the user must create one first.
function useFirstProgramId(): string | null {
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ program_id: string }[]>('/programs').then((res) => {
      if (res.data.length > 0) {
        setProgramId(res.data[0].program_id);
      }
    }).catch(() => {/* ignore */});
  }, []);

  return programId;
}

/**
 * Opportunities index page.
 * Shows "Create New Opportunity" button that opens the TemplateLibrary modal.
 * Phase 1: "No opportunities yet" message with CTA.
 */
export function OpportunitiesIndex() {
  const { grantor_memberships } = useCurrentUser();
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const canCreate = hasRole(allRoles, 'grantor_admin', 'program_officer');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const programId = useFirstProgramId();

  return (
    <div>
      <div className="usa-prose">
        <h1>Opportunities</h1>
      </div>

      <div
        className="usa-alert usa-alert--info"
        role="status"
        aria-label="No opportunities available"
      >
        <div className="usa-alert__body">
          <h4 className="usa-alert__heading">No opportunities yet</h4>
          <p className="usa-alert__text">
            No funding opportunities have been created for your organization.
          </p>
        </div>
      </div>

      {canCreate && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="usa-button"
            aria-label="Create New Opportunity"
            data-testid="create-opportunity-btn"
            onClick={() => setShowTemplateLibrary(true)}
          >
            Create New Opportunity
          </button>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && programId && (
        <TemplateLibrary
          programId={programId}
          onClose={() => setShowTemplateLibrary(false)}
        />
      )}

      {showTemplateLibrary && !programId && (
        <div className="usa-alert usa-alert--warning" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              You must create a program before creating an opportunity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
