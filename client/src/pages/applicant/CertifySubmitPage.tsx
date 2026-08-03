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
    <div  data-testid="certify-submit-page">
      {/* Breadcrumb */}
      <nav  aria-label="Breadcrumbs">
        <ol >
          <li className="-item">
            <Link
              to="/applicant/applications"
              
            >
              My Applications
            </Link>
          </li>
          <li className="-item">
            <Link
              to={`/applicant/workspaces/${workspaceId}`}
              
            >
              Workspace
            </Link>
          </li>
          <li
            className="-item active"
            aria-current="page"
          >
            Submit
          </li>
        </ol>
      </nav>

      <h1>Submit Your Application</h1>

      {isLoading && <p className="gf-hint">Loading pre-submission checklist…</p>}

      {!isLoading && (
        <>
          {/* Pre-submission checklist */}
          <div className="gf-card" data-testid="submission-checklist">
            <div className="gf-card__header">
              <h2 className="gf-card__title">Pre-Submission Checklist</h2>
            </div>
            <div className="gf-card__body">
              <ul  data-testid="checklist-items">
                <li>
                  <span aria-hidden="true">
                    {allSectionsComplete ? '✓' : '✗'}{' '}
                  </span>
                  <strong>All sections complete</strong>
                  {!allSectionsComplete && readiness && (
                    <span className="gf-hint">
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
                      <Link to="/applicant/profile/roles" >
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
                    <span className="gf-hint">
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
              className="gf-alert gf-alert gf-alert--success"
              style={{ marginTop: '1rem' }}
            >
              <div >
                <p className="gf-alert__text">
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
                className="gf-alert gf-alert gf-alert--error"
                role="alert"
                style={{ marginTop: '1rem' }}
                data-testid="submit-blocked-alert"
              >
                <div >
                  <h4 className="gf-alert__title">Submission Blocked</h4>
                  <ul >
                    {submitError.blocking_errors.map((e, i) => (
                      <li key={i}>
                        <a href={e.link} >
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
              className="gf-alert gf-alert gf-alert--warning"
              role="alert"
              style={{ marginTop: '1rem' }}
              data-testid="already-submitted-alert"
            >
              <div >
                <p className="gf-alert__text">
                  This application has already been submitted.{' '}
                  <Link
                    to={`/applicant/workspaces/${workspaceId}/receipt`}
                    
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
              className="gf-btn gf-btn--primary gf-btn gf-btn--primary"
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
            className="gf-hint"
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
