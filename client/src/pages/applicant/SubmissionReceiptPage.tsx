import { useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { submissionApi } from '../../api/submissionApi';
import type { SubmissionConfirmation } from '../../types/submission';

/**
 * SubmissionReceiptPage — Post-submission receipt with confirmation number and download links.
 * Route: /applicant/workspaces/:workspaceId/receipt
 *
 * If navigated from CertifySubmitPage (location.state.confirmation), renders
 * the confirmation immediately while the receipt query loads.
 */
export function SubmissionReceiptPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();

  // Navigation state from CertifySubmitPage submit success
  const navConfirmation = (location.state as { confirmation?: SubmissionConfirmation } | null)
    ?.confirmation;

  // Fetch receipt data from API
  const receiptQuery = useQuery({
    queryKey: ['receipt', workspaceId],
    queryFn: () => submissionApi.getReceipt(workspaceId!),
    enabled: !!workspaceId,
  });

  const receipt = receiptQuery.data;
  const confirmationNumber =
    receipt?.confirmation_number ?? navConfirmation?.confirmation_number;
  const submittedAt =
    receipt?.submitted_at ?? navConfirmation?.submitted_at;
  const opportunityTitle =
    receipt?.opportunity_title ?? navConfirmation?.opportunity_title;
  const orgName =
    receipt?.applicant_org_name ?? navConfirmation?.applicant_org_name;

  // Format date: "July 31, 2026 at 14:32 UTC"
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short',
      })
    : null;

  if (receiptQuery.isLoading && !navConfirmation) {
    return (
      <div className="usa-prose">
        <p>Loading submission receipt…</p>
      </div>
    );
  }

  if (receiptQuery.error && !navConfirmation) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <h4 className="usa-alert__heading">Receipt Not Found</h4>
          <p className="usa-alert__text">
            No submission receipt was found for this workspace. The application
            may not have been submitted yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="usa-prose" data-testid="submission-receipt-page">
      <h1>
        <span aria-hidden="true" style={{ marginRight: '0.5rem' }}>
          ✓
        </span>
        Application Submitted Successfully
      </h1>

      {/* Confirmation number */}
      <div
        className="usa-alert usa-alert--success"
        data-testid="confirmation-alert"
      >
        <div className="usa-alert__body">
          <h2
            className="usa-alert__heading"
            data-testid="confirmation-number"
            style={{ fontSize: '1.5rem' }}
          >
            {confirmationNumber}
          </h2>
          <p className="usa-alert__text">
            Your application confirmation number. Save this for your records.
          </p>
        </div>
      </div>

      {/* Submission details */}
      <div
        className="usa-card"
        style={{ marginTop: '1.5rem' }}
        data-testid="receipt-details"
      >
        <div className="usa-card__header">
          <h3 className="usa-card__heading">Submission Details</h3>
        </div>
        <div className="usa-card__body">
          <dl>
            <dt>
              <strong>Submitted At</strong>
            </dt>
            <dd data-testid="submitted-at">{formattedDate ?? '—'}</dd>

            <dt style={{ marginTop: '0.75rem' }}>
              <strong>Opportunity</strong>
            </dt>
            <dd data-testid="opportunity-title">{opportunityTitle ?? '—'}</dd>

            <dt style={{ marginTop: '0.75rem' }}>
              <strong>Organization</strong>
            </dt>
            <dd data-testid="org-name">{orgName ?? '—'}</dd>
          </dl>
        </div>
      </div>

      {/* Download section */}
      <div className="usa-card" style={{ marginTop: '1rem' }}>
        <div className="usa-card__header">
          <h3 className="usa-card__heading">Application Packages</h3>
        </div>
        <div className="usa-card__body">
          {receipt?.human_readable_pdf_path ? (
            <a
              href={receipt.human_readable_pdf_path}
              className="usa-button usa-button--outline"
              data-testid="download-human-readable"
            >
              Human-Readable Application Package
            </a>
          ) : (
            <p className="usa-hint">
              Human-readable package: Generating…
            </p>
          )}
          <p
            className="usa-hint"
            style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
          >
            Machine-readable JSON package: Available to intake administrators.
          </p>
        </div>
      </div>

      {/* Locked workspace notice */}
      <div
        className="usa-alert usa-alert--info"
        style={{ marginTop: '1rem' }}
        data-testid="locked-notice"
      >
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Your application workspace is now locked. Contact the grantor for
            modifications.
          </p>
        </div>
      </div>

      {/* Return link */}
      <div style={{ marginTop: '1.5rem' }}>
        <Link
          to="/applicant/applications"
          className="usa-button"
          data-testid="return-to-applications"
        >
          Return to My Applications
        </Link>
      </div>
    </div>
  );
}
