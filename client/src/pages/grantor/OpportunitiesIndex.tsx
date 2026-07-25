import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

/**
 * Opportunities index page.
 * Phase 1 placeholder: shows "No opportunities yet" with Create CTA for eligible roles.
 * Wired into GrantorLayout via react-router-dom.
 */
export function OpportunitiesIndex() {
  const { grantor_memberships } = useCurrentUser();
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const canCreate = hasRole(allRoles, 'grantor_admin', 'program_officer');

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
          <Link
            to="/grantor/opportunities/new"
            className="usa-button"
            aria-label="Create New Opportunity"
          >
            Create New Opportunity
          </Link>
        </div>
      )}
    </div>
  );
}
