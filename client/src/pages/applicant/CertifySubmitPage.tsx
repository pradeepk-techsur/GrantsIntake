import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { submissionApi } from '../../api/submissionApi';
import apiClient from '../../api/client';

/**
 * CertifySubmitPage — Pre-submission checklist and final submit confirmation.
 * Route: /applicant/workspaces/:workspaceId/certify-submit
 *
 * Fetches readiness data, certification status, and renders a checklist.
 * Only when all items are ✓ does the "Confirm and Submit Application" button enable.
 */
export function CertifySubmitPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  // Readiness data
  const readinessQuery = useQuery({
    queryKey: ['readiness', workspaceId],
    queryFn: () => workspaceApi.getReadiness(workspaceId!),
    enabled: !!workspaceId,
  });

  // Certification status
  const certQuery = useQuery({
    queryKey: ['certification', workspaceId],
    queryFn: async () => {
      const res = await apiClient.get<{
        certified: boolean;
        certification: unknown | null;
      }>(`/workspaces/${workspaceId}/certification`);
      return res.data;
    },
    enabled: !!workspaceId,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => submissionApi.submit(workspaceId!),
    onSuccess: (confirmation) => {
      navigate(`/applicant/workspaces/${workspaceId}/receipt`, {
        state: { confirmation },
      });
    },
  });

  const readiness = readinessQuery.data;
  const certData = certQuery.data;

  const isLoading = readinessQuery.isLoading || certQuery.isLoading;

  // Checklist conditions
  const allSectionsComplete = readiness
    ? readiness.overall_completion_pct === 100
    : false;
  const authRepAssigned = readiness?.authorized_rep_assigned ?? false;
  const isCertified = certData?.certified ?? false;
  const noBlockingErrors = readiness
    ? readiness.blocking_errors.length === 0
    : false;

  const allReady =
    allSectionsComplete && authRepAssigned && isCertified && noBlockingErrors;

  // Submission error state
  const submitError = submitMutation.error as
    | (Error & {
        code?: string;
        status?: number;
        blocking_errors?: Array<{ message: string; link: string }>;
      })
    | null;

  return (
    <div className="usa-prose" data-testid="certify-submit-page">
      {/* Breadcrumb */}
      <nav className="usa-breadcrumb" aria-label="Breadcrumbs">
        <ol className="usa-breadcrumb__list">
          <li className="usa-breadcrumb__list-item">
            <Link
              to="/applicant/applications"
              className="usa-breadcrumb__link"
            >
              My Applications
            </Link>
          </li>
          <li className="usa-breadcrumb__list-item">
            <Link
              to={`/applicant/workspaces/${workspaceId}`}
              className="usa-breadcrumb__link"
            >
              Workspace
            </Link>
          </li>
          <li
            className="usa-breadcrumb__list-item usa-current"
            aria-current="page"
          >
            Submit
          </li>
        </ol>
      </nav>

      <h1>Submit Your Application</h1>

      {isLoading && <p className="usa-hint">Loading pre-submission checklist…</p>}

      {!isLoading && (
        <>
          {/* Pre-submission checklist */}
          <div className="usa-card" data-testid="submission-checklist">
            <div className="usa-card__header">
              <h2 className="usa-card__heading">Pre-Submission Checklist</h2>
            </div>
            <div className="usa-card__body">
              <ul className="usa-list" data-testid="checklist-items">
                <li>
                  <span aria-hidden="true">
                    {allSectionsComplete ? '✓' : '✗'}{' '}
                  </span>
                  <strong>All sections complete</strong>
                  {!allSectionsComplete && readiness && (
                    <span className="usa-hint">
                      {' '}
                      — {readiness.overall_completion_pct}% complete
                    </span>
                  )}
                </li>
                <li>
                  <span aria-hidden="true">
                    {authRepAssigned ? '✓' : '✗'}{' '}
                  </span>
                  <strong>Authorized representative assigned</strong>
                  {!authRepAssigned && (
                    <span>
                      {' '}
                      —{' '}
                      <Link to="/applicant/profile/roles" className="usa-link">
                        Assign AR
                      </Link>
                    </span>
                  )}
                </li>
                <li>
                  <span aria-hidden="true">
                    {isCertified ? '✓' : '✗'}{' '}
                  </span>
                  <strong>Application certified</strong>
                  {!isCertified && (
                    <span>
                      {' '}
                      —{' '}
                      <Link
                        to={`/applicant/workspaces/${workspaceId}#section-certifications`}
                        className="usa-link"
                      >
                        Certify application
                      </Link>
                    </span>
                  )}
                </li>
                <li>
                  <span aria-hidden="true">
                    {noBlockingErrors ? '✓' : '✗'}{' '}
                  </span>
                  <strong>No blocking errors</strong>
                  {!noBlockingErrors && readiness && (
                    <span className="usa-hint">
                      {' '}
                      — {readiness.blocking_errors.length} blocking error(s)
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>

          {/* Ready alert */}
          {allReady && (
            <div
              className="usa-alert usa-alert--success"
              style={{ marginTop: '1rem' }}
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  Your application is ready to submit.
                </p>
              </div>
            </div>
          )}

          {/* Submission error alerts */}
          {submitError &&
            submitError.code === 'SUBMISSION_BLOCKED' &&
            submitError.blocking_errors && (
              <div
                className="usa-alert usa-alert--error"
                role="alert"
                style={{ marginTop: '1rem' }}
                data-testid="submit-blocked-alert"
              >
                <div className="usa-alert__body">
                  <h4 className="usa-alert__heading">Submission Blocked</h4>
                  <ul className="usa-list">
                    {submitError.blocking_errors.map((e, i) => (
                      <li key={i}>
                        <a href={e.link} className="usa-link">
                          {e.message}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          {submitError && submitError.code === 'ALREADY_SUBMITTED' && (
            <div
              className="usa-alert usa-alert--warning"
              role="alert"
              style={{ marginTop: '1rem' }}
              data-testid="already-submitted-alert"
            >
              <div className="usa-alert__body">
                <p className="usa-alert__text">
                  This application has already been submitted.{' '}
                  <Link
                    to={`/applicant/workspaces/${workspaceId}/receipt`}
                    className="usa-link"
                  >
                    View submission receipt
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Submit button */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="usa-button usa-button--big"
              disabled={!allReady || submitMutation.isPending}
              aria-disabled={!allReady || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              data-testid="confirm-submit-btn"
            >
              {submitMutation.isPending
                ? 'Submitting…'
                : 'Confirm and Submit Application'}
            </button>
          </div>

          {/* Legal disclaimer */}
          <p
            className="usa-hint"
            style={{ marginTop: '1rem', fontSize: '0.85rem' }}
          >
            By clicking Submit, you confirm that your authorized representative
            has reviewed and certified this application.
          </p>
        </>
      )}
    </div>
  );
}
