import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import apiClient from '../../../api/client';

interface GuidancePrompt {
  prompt_id: string;
  field_id: string;
  prompt_text: string;
  example_text: string | null;
  uswds_tips: string[] | null;
}

interface GuidancePanelProps {
  fieldId: string;
  value?: string;
}

/**
 * Collapsible USWDS accordion guidance panel.
 * Fetches and renders guidance prompt for the given field.
 * Toggle state persisted to sessionStorage per field (defaults to expanded).
 * T-03-06: Uses React Query to cache guidance prompts for the session.
 */
export function GuidancePanel({ fieldId }: GuidancePanelProps) {
  const sessionKey = `guidance_toggle_${fieldId}`;

  // Load persisted toggle state (default: expanded)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const stored = sessionStorage.getItem(sessionKey);
    return stored === null ? true : stored === 'true';
  });

  // Persist toggle state on change
  useEffect(() => {
    sessionStorage.setItem(sessionKey, String(isExpanded));
  }, [isExpanded, sessionKey]);

  // Fetch all guidance prompts (cached query)
  const { data: prompts } = useQuery<GuidancePrompt[]>({
    queryKey: ['guidance-prompts'],
    queryFn: async () => {
      const response = await apiClient.get<GuidancePrompt[]>('/guidance-prompts');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const prompt = prompts?.find((p) => p.field_id === fieldId);

  if (!prompt) {
    return null;
  }

  return (
    <div
      className="usa-accordion usa-accordion--bordered"
      data-testid={`guidance-panel-${fieldId}`}
      style={{ marginTop: '0.5rem' }}
    >
      <h4 className="usa-accordion__heading">
        <button
          type="button"
          className="usa-accordion__button"
          aria-expanded={isExpanded}
          aria-controls={`guidance-panel-content-${fieldId}`}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          Writing Guidance
        </button>
      </h4>
      <div
        id={`guidance-panel-content-${fieldId}`}
        className="usa-accordion__content usa-prose"
        hidden={!isExpanded}
      >
        <p>{prompt.prompt_text}</p>

        {prompt.example_text && (
          <div style={{ marginTop: '0.75rem' }}>
            <strong>Example:</strong>
            <p
              style={{
                background: '#f0f0f0',
                padding: '0.75rem',
                borderLeft: '4px solid #005ea2',
                marginTop: '0.25rem',
              }}
            >
              {prompt.example_text}
            </p>
          </div>
        )}

        {prompt.uswds_tips && prompt.uswds_tips.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <strong>Tips:</strong>
            <ul>
              {prompt.uswds_tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
