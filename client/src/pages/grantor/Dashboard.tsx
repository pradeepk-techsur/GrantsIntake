import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';

function hasRole(roles: string[], ...check: string[]): boolean {
  return roles.some((r) => check.includes(r));
}

/**
 * Role-appropriate grantor dashboard.
 *
 * - program_officer / grantor_admin: active opportunities summary + "Create New Opportunity" CTA
 * - intake_administrator: pending screening count + "Go to Intake Queue" CTA
 *
 * Uses USWDS usa-card components for summary panels.
 */
export function Dashboard() {
  const { user, grantor_memberships, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading dashboard">
        <div className="usa-card__container">
          <div className="usa-card__header">
            <h2 className="usa-card__heading">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Collect all roles across all memberships
  const allRoles = grantor_memberships.flatMap((m) => m.roles);
  const isProgramOfficerOrAdmin = hasRole(allRoles, 'grantor_admin', 'program_officer');
  const isIntakeAdmin = hasRole(allRoles, 'intake_administrator');

  return (
    <div>
      <h1 className="usa-prose">
        Welcome{user ? `, ${user.full_name}` : ''}
      </h1>

      <div className="usa-card-group">
        {isProgramOfficerOrAdmin && (
          <>
            <div className="usa-card tablet:grid-col-6">
              <div className="usa-card__container">
                <div className="usa-card__header">
                  <h2 className="usa-card__heading">Active Opportunities</h2>
                </div>
                <div className="usa-card__body">
                  <p>Manage your funding opportunities and track application activity.</p>
                </div>
                <div className="usa-card__footer">
                  <Link
                    to="/grantor/opportunities"
                    className="usa-button"
                    aria-label="View opportunities"
                  >
                    View Opportunities
                  </Link>
                </div>
              </div>
            </div>

            <div className="usa-card tablet:grid-col-6">
              <div className="usa-card__container">
                <div className="usa-card__header">
                  <h2 className="usa-card__heading">Create Opportunity</h2>
                </div>
                <div className="usa-card__body">
                  <p>Start a new funding opportunity from a template.</p>
                </div>
                <div className="usa-card__footer">
                  <Link
                    to="/grantor/opportunities/new"
                    className="usa-button usa-button--outline"
                    aria-label="Create New Opportunity"
                  >
                    Create New Opportunity
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {isIntakeAdmin && !isProgramOfficerOrAdmin && (
          <div className="usa-card tablet:grid-col-6">
            <div className="usa-card__container">
              <div className="usa-card__header">
                <h2 className="usa-card__heading">Intake Queue</h2>
              </div>
              <div className="usa-card__body">
                <p>Review and screen submitted applications pending intake disposition.</p>
              </div>
              <div className="usa-card__footer">
                <Link
                  to="/grantor/intake-queue"
                  className="usa-button"
                  aria-label="Go to Intake Queue"
                >
                  Go to Intake Queue
                </Link>
              </div>
            </div>
          </div>
        )}

        {!isProgramOfficerOrAdmin && !isIntakeAdmin && (
          <div className="usa-card tablet:grid-col-12">
            <div className="usa-card__container">
              <div className="usa-card__header">
                <h2 className="usa-card__heading">Grantor Portal</h2>
              </div>
              <div className="usa-card__body">
                <p>Welcome to the GrantsIntake Grantor Portal.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
