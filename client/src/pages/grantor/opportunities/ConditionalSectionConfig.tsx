import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionCondition {
  condition_type: 'applicant_type' | 'program' | 'geography' | 'funding_amount' | 'eligibility_response';
  field: string;
  operator: 'equals' | 'not_equals' | 'includes' | 'greater_than' | 'less_than';
  value: string;
}

interface SectionConditionConfig {
  config_id: string;
  opportunity_id: string;
  section_key: string;
  conditions: SectionCondition[];
  condition_group_operator: 'AND' | 'OR';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ConditionalSectionConfigProps {
  opportunityId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_TYPE_OPTIONS = [
  { value: 'applicant_type', label: 'Applicant Type' },
  { value: 'program', label: 'Program' },
  { value: 'geography', label: 'Geography' },
  { value: 'funding_amount', label: 'Funding Amount' },
  { value: 'eligibility_response', label: 'Eligibility Response' },
] as const;

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'includes', label: 'Includes' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
] as const;

const EMPTY_CONDITION: SectionCondition = {
  condition_type: 'applicant_type',
  field: '',
  operator: 'equals',
  value: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConditionalSectionConfig({ opportunityId }: ConditionalSectionConfigProps) {
  const { accessToken } = useAuthStore();
  const [configs, setConfigs] = useState<SectionConditionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding a new section condition
  const [sectionKey, setSectionKey] = useState('');
  const [conditions, setConditions] = useState<SectionCondition[]>([{ ...EMPTY_CONDITION }]);
  const [groupOperator, setGroupOperator] = useState<'AND' | 'OR'>('AND');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Fetch configs on mount ─────────────────────────────────────────────────

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/opportunities/${opportunityId}/sections/conditions`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch section conditions: ${res.status}`);
      }
      const data = await res.json() as SectionConditionConfig[];
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load section conditions');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, accessToken]);

  useEffect(() => {
    void fetchConfigs();
  }, [fetchConfigs]);

  // ─── Add / update a condition row ──────────────────────────────────────────

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { ...EMPTY_CONDITION }]);
  };

  const handleConditionChange = (
    index: number,
    field: keyof SectionCondition,
    value: string,
  ) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Save section conditions ─────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!sectionKey.trim()) {
      setSaveError('Section key is required');
      return;
    }
    if (conditions.length === 0) {
      setSaveError('At least one condition is required');
      return;
    }
    for (const cond of conditions) {
      if (!cond.field.trim() || !cond.value.trim()) {
        setSaveError('All conditions must have a field and value');
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(
        `/api/v1/opportunities/${opportunityId}/sections/${encodeURIComponent(sectionKey.trim())}/conditions`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            conditions,
            condition_group_operator: groupOperator,
          }),
        },
      );

      if (!res.ok) {
        const errorBody = await res.json() as { message?: string };
        throw new Error(errorBody.message ?? 'Failed to save section conditions');
      }

      setSaveSuccess(true);
      setSectionKey('');
      setConditions([{ ...EMPTY_CONDITION }]);
      setGroupOperator('AND');
      await fetchConfigs();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save section conditions');
    } finally {
      setIsSaving(false);
    }
  }, [opportunityId, accessToken, sectionKey, conditions, groupOperator, fetchConfigs]);

  // ─── Delete a section condition config ───────────────────────────────────

  const handleDelete = useCallback(async (sectionKeyToDelete: string) => {
    try {
      const res = await fetch(
        `/api/v1/opportunities/${opportunityId}/sections/${encodeURIComponent(sectionKeyToDelete)}/conditions`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete section condition');
      }
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section condition');
    }
  }, [opportunityId, accessToken, fetchConfigs]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section aria-labelledby="conditional-sections-heading">
      <h2 id="conditional-sections-heading" className="usa-prose" style={{ marginTop: 0 }}>
        Conditional Section Display
      </h2>
      <p className="usa-prose">
        Configure which form sections appear based on applicant characteristics.
      </p>

      {/* Add new section condition form */}
      <div
        className="usa-card"
        style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #dfe1e2' }}
        data-testid="section-condition-form"
      >
        <h3 className="usa-prose" style={{ marginTop: 0 }}>
          Add Section Display Condition
        </h3>

        <div className="usa-form-group">
          <label className="usa-label" htmlFor="section-key-input">
            Section Key
          </label>
          <span className="usa-hint">Identifier for the form section (e.g., budget_section)</span>
          <input
            id="section-key-input"
            className="usa-input"
            type="text"
            value={sectionKey}
            onChange={(e) => setSectionKey(e.target.value)}
            placeholder="budget_section"
            data-testid="section-key-input"
          />
        </div>

        {/* Conditions builder */}
        {conditions.map((cond, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
              gap: '0.75rem',
              marginBottom: '0.75rem',
              alignItems: 'end',
            }}
            data-testid={`condition-row-${idx}`}
          >
            <div className="usa-form-group" style={{ margin: 0 }}>
              <label className="usa-label" htmlFor={`condition-type-${idx}`} style={{ fontSize: '0.875rem' }}>
                Condition Type
              </label>
              <select
                id={`condition-type-${idx}`}
                className="usa-select"
                value={cond.condition_type}
                onChange={(e) => handleConditionChange(idx, 'condition_type', e.target.value)}
                data-testid={`condition-type-${idx}`}
              >
                {CONDITION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="usa-form-group" style={{ margin: 0 }}>
              <label className="usa-label" htmlFor={`condition-field-${idx}`} style={{ fontSize: '0.875rem' }}>
                Field
              </label>
              <input
                id={`condition-field-${idx}`}
                className="usa-input"
                type="text"
                value={cond.field}
                onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                placeholder="entity_type"
                data-testid={`condition-field-${idx}`}
              />
            </div>

            <div className="usa-form-group" style={{ margin: 0 }}>
              <label className="usa-label" htmlFor={`condition-operator-${idx}`} style={{ fontSize: '0.875rem' }}>
                Operator
              </label>
              <select
                id={`condition-operator-${idx}`}
                className="usa-select"
                value={cond.operator}
                onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                data-testid={`condition-operator-${idx}`}
              >
                {OPERATOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="usa-form-group" style={{ margin: 0 }}>
              <label className="usa-label" htmlFor={`condition-value-${idx}`} style={{ fontSize: '0.875rem' }}>
                Value
              </label>
              <input
                id={`condition-value-${idx}`}
                className="usa-input"
                type="text"
                value={cond.value}
                onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                placeholder="nonprofit"
                data-testid={`condition-value-${idx}`}
              />
            </div>

            <button
              type="button"
              className="usa-button usa-button--secondary"
              onClick={() => handleRemoveCondition(idx)}
              disabled={conditions.length === 1}
              aria-label={`Remove condition ${idx + 1}`}
              style={{ alignSelf: 'flex-end' }}
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          className="usa-button usa-button--outline"
          onClick={handleAddCondition}
          data-testid="add-condition-btn"
          style={{ marginBottom: '1rem' }}
        >
          + Add Condition
        </button>

        {/* Condition group operator */}
        <fieldset className="usa-fieldset" style={{ marginBottom: '1rem' }}>
          <legend className="usa-legend">Condition Group Operator</legend>
          <div className="usa-radio" style={{ display: 'inline-flex', gap: '1.5rem' }}>
            <div>
              <input
                className="usa-radio__input"
                id="group-operator-and"
                type="radio"
                name="group-operator"
                value="AND"
                checked={groupOperator === 'AND'}
                onChange={() => setGroupOperator('AND')}
                data-testid="group-operator-and"
              />
              <label className="usa-radio__label" htmlFor="group-operator-and">
                AND (all conditions must match)
              </label>
            </div>
            <div>
              <input
                className="usa-radio__input"
                id="group-operator-or"
                type="radio"
                name="group-operator"
                value="OR"
                checked={groupOperator === 'OR'}
                onChange={() => setGroupOperator('OR')}
                data-testid="group-operator-or"
              />
              <label className="usa-radio__label" htmlFor="group-operator-or">
                OR (any condition must match)
              </label>
            </div>
          </div>
        </fieldset>

        {saveError && (
          <div className="usa-alert usa-alert--error usa-alert--slim" role="alert">
            <div className="usa-alert__body">
              <p className="usa-alert__text">{saveError}</p>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="usa-alert usa-alert--success usa-alert--slim" role="status">
            <div className="usa-alert__body">
              <p className="usa-alert__text">Section conditions saved successfully.</p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="usa-button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          data-testid="save-conditions-btn"
        >
          {isSaving ? 'Saving...' : 'Save Conditions'}
        </button>
      </div>

      {/* Existing section condition cards */}
      {isLoading ? (
        <p>Loading section conditions...</p>
      ) : error ? (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      ) : configs.length === 0 ? (
        <p className="usa-prose">No section conditions configured yet.</p>
      ) : (
        <div data-testid="section-condition-cards">
          {configs.map((config) => (
            <div
              key={config.config_id}
              className="usa-card"
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                border: '1px solid #dfe1e2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
              data-testid={`section-card-${config.section_key}`}
            >
              <div>
                <strong data-testid={`section-key-label-${config.section_key}`}>
                  {config.section_key}
                </strong>
                <span
                  className="usa-tag"
                  style={{ marginLeft: '0.75rem', background: '#005ea2', color: 'white', fontSize: '0.75rem' }}
                  data-testid={`section-operator-badge-${config.section_key}`}
                >
                  {config.condition_group_operator}
                </span>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#565c65' }}>
                  {config.conditions.length} condition{config.conditions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                className="usa-button usa-button--secondary usa-button--unstyled"
                onClick={() => void handleDelete(config.section_key)}
                aria-label={`Delete section condition for ${config.section_key}`}
                data-testid={`delete-section-${config.section_key}`}
                style={{ color: '#e41d3d', fontWeight: 'bold' }}
              >
                ✕ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
