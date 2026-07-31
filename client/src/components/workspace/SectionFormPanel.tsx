import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { FormFieldRenderer } from './FormFieldRenderer';
import type { WorkspaceSection } from '../../types/workspace';

interface SectionFormPanelProps {
  section: WorkspaceSection;
  workspaceId: string;
  onFieldBlur?: () => void; // Optional callback for workspace-level validation trigger
}

/**
 * Renders all form fields for a workspace section.
 * - Fetches field definitions + current responses via React Query
 * - Saves field responses onBlur (not on every keystroke)
 * - Triggers server-side section validation 500ms after each blur
 * - Displays inline USWDS error-message on validation failures
 */
export function SectionFormPanel({ section, workspaceId, onFieldBlur }: SectionFormPanelProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string | unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Fetch field definitions + current responses ──────────────────────────
  const { data: fields, refetch } = useQuery({
    queryKey: ['section-fields', workspaceId, section.section_id],
    queryFn: () => workspaceApi.getFields(workspaceId, section.section_id),
    enabled: !!workspaceId && !!section.section_id,
  });

  // ─── Initialize field values from loaded responses ────────────────────────
  useEffect(() => {
    if (fields) {
      const initial: Record<string, string | unknown> = {};
      for (const f of fields) {
        if (f.current_response) {
          initial[f.field_id] = f.current_response.response_json ?? f.current_response.response_value ?? '';
        } else {
          initial[f.field_id] = '';
        }
      }
      setFieldValues(initial);
    }
  }, [fields]);

  // ─── Save field response mutation ─────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: ({ fieldId, value }: { fieldId: string; value: string | unknown }) => {
      const isJson = typeof value === 'object' && value !== null;
      return workspaceApi.saveField(workspaceId, section.section_id, fieldId, {
        response_value: isJson ? undefined : (value as string),
        response_json: isJson ? value : undefined,
      });
    },
    onSuccess: () => {
      refetch();
      // Clear the "Saved ✓" indicator after 2 s so it doesn't persist
      // while the user edits subsequent fields (TanStack Query v5 keeps
      // isSuccess === true until reset() is called explicitly).
      setTimeout(() => saveMutation.reset(), 2000);
    },
  });

  // ─── Validate section mutation ────────────────────────────────────────────
  const validateMutation = useMutation({
    mutationFn: () => workspaceApi.validateSection(workspaceId, section.section_id),
    onSuccess: (result) => {
      // Populate inline errors from validation result
      const newErrors: Record<string, string> = {};
      for (const err of result.errors) {
        if (err.field_id) newErrors[err.field_id] = err.message;
      }
      setFieldErrors(newErrors);
    },
  });

  // ─── onBlur handler: save field then validate section ────────────────────
  // Field save fires on blur (not every keystroke) per PRD-INTAKE-038.
  // Server-side validation is triggered 500ms after blur.
  const handleFieldBlur = (fieldId: string) => {
    const value = fieldValues[fieldId];
    saveMutation.mutate({ fieldId, value });

    // Client-side immediate validation (before server responds)
    const field = fields?.find((f) => f.field_id === fieldId);
    if (field?.is_required && !value) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: `${field.label} is required` }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }

    // Trigger server-side section validation after short delay
    setTimeout(() => validateMutation.mutate(), 500);

    // Also trigger workspace-level validation (for ReadinessDashboard updates)
    if (onFieldBlur) onFieldBlur();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div data-testid="section-form-panel">
      {/* Auto-save status indicator */}
      {saveMutation.isPending && (
        <span className="usa-hint" data-testid="save-status-saving" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Saving…
        </span>
      )}
      {saveMutation.isSuccess && !saveMutation.isPending && (
        <span
          className="usa-hint"
          data-testid="save-status-saved"
          style={{ display: 'block', marginBottom: '0.5rem', color: '#2e8540' }}
        >
          Saved ✓
        </span>
      )}
      {fields && fields.length > 0 ? (
        <>
          {fields.map((field) => (
            <FormFieldRenderer
              key={field.field_id}
              field={field}
              value={fieldValues[field.field_id] ?? ''}
              onChange={(val) => setFieldValues((prev) => ({ ...prev, [field.field_id]: val }))}
              onBlur={() => handleFieldBlur(field.field_id)}
              error={fieldErrors[field.field_id]}
              allFieldValues={fieldValues}
            />
          ))}
        </>
      ) : (
        <div className="usa-prose">
          <p className="usa-hint">No form fields have been configured for this section yet.</p>
        </div>
      )}
    </div>
  );
}
