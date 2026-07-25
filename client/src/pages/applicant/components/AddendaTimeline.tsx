import { useEffect, useState } from 'react';

type AddendumType =
  | 'date_change'
  | 'requirement_change'
  | 'clarification'
  | 'correction'
  | 'other';

interface Addendum {
  addendum_id: string;
  addendum_type: AddendumType;
  title: string;
  body: string;
  version_number: number;
  is_required_change: boolean;
  published_at: string;
  superseded_at: string | null;
}

const ADDENDUM_TYPE_LABELS: Record<AddendumType, string> = {
  date_change: 'Date Change',
  requirement_change: 'Requirement Change',
  clarification: 'Clarification',
  correction: 'Correction',
  other: 'Other',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isRecent(dateStr: string): boolean {
  const publishedAt = new Date(dateStr);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  return publishedAt > fourteenDaysAgo;
}

/**
 * Parse ISO date strings from date_change addendum body.
 * Looks for two ISO date patterns: "Previous deadline: YYYY-MM-DD" and "New deadline: YYYY-MM-DD"
 * Falls back to displaying raw body text if parsing fails.
 */
function parseDateChangeBody(body: string): { previous?: string; next?: string } | null {
  const prevMatch = body.match(/previous deadline[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  const newMatch = body.match(/new deadline[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i);
  if (prevMatch || newMatch) {
    return {
      previous: prevMatch ? prevMatch[1] : undefined,
      next: newMatch ? newMatch[1] : undefined,
    };
  }
  return null;
}

interface AddendaTimelineProps {
  opportunityId: string;
}

/**
 * Displays the Updates & Addenda timeline for a published opportunity.
 *
 * Implements PRD-INTAKE-018 (F17):
 * - Reverse-chronological order (published_at DESC)
 * - "Required Change" warning for is_required_change=true entries
 * - "Updated" badge for entries published within 14 days
 * - date_change type shows before/after deadline values
 * - Addendum type badge (usa-tag)
 */
export function AddendaTimeline({ opportunityId }: AddendaTimelineProps) {
  const [addenda, setAddenda] = useState<Addendum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/opportunities/${opportunityId}/addenda`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load addenda');
        return res.json() as Promise<Addendum[]>;
      })
      .then((data) => {
        setAddenda(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [opportunityId]);

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading updates">
        <span className="usa-sr-only">Loading updates…</span>
        <div style={{ color: '#565c65', fontStyle: 'italic' }}>Loading updates…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">Could not load updates: {error}</p>
        </div>
      </div>
    );
  }

  if (addenda.length === 0) {
    return (
      <p className="usa-prose" style={{ color: '#565c65', fontStyle: 'italic' }}>
        No updates posted yet.
      </p>
    );
  }

  return (
    <ol className="usa-process-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
      {addenda.map((addendum) => {
        const dateChangeParsed =
          addendum.addendum_type === 'date_change'
            ? parseDateChangeBody(addendum.body)
            : null;
        const recent = isRecent(addendum.published_at);

        return (
          <li
            key={addendum.addendum_id}
            className="usa-process-list__item"
            style={{
              borderLeft: '4px solid #005ea2',
              paddingLeft: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Required Change warning */}
            {addendum.is_required_change && (
              <div
                className="usa-alert usa-alert--warning usa-alert--slim"
                role="alert"
                style={{ marginBottom: '0.75rem' }}
              >
                <div className="usa-alert__body">
                  <p className="usa-alert__text">Required Change</p>
                </div>
              </div>
            )}

            {/* Header row: date, type badge, updated badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <time
                dateTime={addendum.published_at}
                style={{ fontSize: '0.875rem', color: '#565c65' }}
              >
                {formatDate(addendum.published_at)}
              </time>
              <span
                className="usa-tag"
                style={{
                  backgroundColor: '#005ea2',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.5rem',
                  borderRadius: '2px',
                }}
              >
                {ADDENDUM_TYPE_LABELS[addendum.addendum_type] ?? addendum.addendum_type}
              </span>
              {recent && (
                <span
                  className="usa-tag usa-tag--new"
                  style={{
                    backgroundColor: '#00a91c',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '2px',
                  }}
                >
                  Updated
                </span>
              )}
            </div>

            {/* Title */}
            <h4
              className="usa-process-list__heading"
              style={{ marginTop: 0, marginBottom: '0.5rem' }}
            >
              {addendum.title}
            </h4>

            {/* Date change: show before/after values */}
            {dateChangeParsed && (addendum.addendum_type === 'date_change') ? (
              <div className="usa-prose">
                {dateChangeParsed.previous && (
                  <p style={{ marginBottom: '0.25rem' }}>
                    <strong>Previous deadline:</strong>{' '}
                    {formatDate(dateChangeParsed.previous)}
                  </p>
                )}
                {dateChangeParsed.next && (
                  <p style={{ marginBottom: '0.25rem' }}>
                    <strong>New deadline:</strong>{' '}
                    {formatDate(dateChangeParsed.next)}
                  </p>
                )}
                {!dateChangeParsed.previous && !dateChangeParsed.next && (
                  <p>{addendum.body}</p>
                )}
              </div>
            ) : (
              <div className="usa-prose">
                <p>{addendum.body}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
