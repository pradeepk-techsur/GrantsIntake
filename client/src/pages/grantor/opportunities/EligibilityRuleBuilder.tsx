import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EligibilityRule {
  rule_id: string;
  opportunity_id: string;
  rule_type: string;
  criterion_field: string;
  operator: string;
  criterion_value: string | string[] | number;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point?: 'pre_workspace' | 'pre_submission';
  explanation_text: string;
  rule_group_id?: string;
  rule_group_operator?: 'AND' | 'OR';
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface RuleFormData {
  rule_type: string;
  criterion_field: string;
  operator: string;
  criterion_value: string;
  severity: 'hard_blocker' | 'advisory';
  enforcement_point: 'pre_workspace' | 'pre_submission' | '';
  explanation_text: string;
  display_order: string;
  rule_group_id: string;
  rule_group_operator: 'AND' | 'OR' | '';
}

const EMPTY_FORM: RuleFormData = {
  rule_type: 'applicant_type',
  criterion_field: '',
  operator: 'equals',
  criterion_value: '',
  severity: 'advisory',
  enforcement_point: '',
  explanation_text: '',
  display_order: '0',
  rule_group_id: '',
  rule_group_operator: '',
};

const RULE_TYPE_OPTIONS = [
  { value: 'applicant_type', label: 'Applicant Type' },
  { value: 'geography', label: 'Geography' },
  { value: 'entity_status', label: 'Entity Status' },
  { value: 'uei_sam', label: 'UEI/SAM' },
  { value: 'nonprofit_status', label: 'Nonprofit Status' },
  { value: 'tribal_status', label: 'Tribal Status' },
  { value: 'state_local_status', label: 'State/Local Status' },
  { value: 'prior_award_status', label: 'Prior Award Status' },
  { value: 'match_requirement', label: 'Match Requirement' },
  { value: 'custom', label: 'Custom' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'includes', label: 'Includes' },
  { value: 'excludes', label: 'Excludes' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_true', label: 'Is True' },
  { value: 'is_false', label: 'Is False' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface EligibilityRuleBuilderProps {
  opportunityId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EligibilityRuleBuilder({ opportunityId }: EligibilityRuleBuilderProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [groupInputRuleId, setGroupInputRuleId] = useState<string | null>(null);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [groupOperatorInput, setGroupOperatorInput] = useState<'AND' | 'OR'>('AND');

  // ─── Fetch rules ──────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/v1/opportunities/${opportunityId}/eligibility-rules`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setLoadError('Failed to load eligibility rules');
        return;
      }
      const data = await res.json();
      setRules(data);
    } catch {
      setLoadError('Failed to load eligibility rules');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, accessToken]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // ─── Form validation ──────────────────────────────────────────────────────

  const validateForm = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.criterion_field.trim()) {
      errors.criterion_field = 'Criterion field is required';
    }
    if (!formData.criterion_value.trim()) {
      errors.criterion_value = 'Criterion value is required';
    }
    if (!formData.explanation_text.trim()) {
      errors.explanation_text = 'Explanation text is required';
    }
    // T-02-01 client-side: hard blocker requires enforcement_point
    if (formData.severity === 'hard_blocker' && !formData.enforcement_point) {
      errors.enforcement_point = 'Enforcement point is required for hard blocker rules';
    }
    return errors;
  }, [formData]);

  // ─── Parse criterion_value ────────────────────────────────────────────────

  const parseCriterionValue = (raw: string): string | string[] | number => {
    const trimmed = raw.trim();
    // If it looks like a number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    // If it looks like a JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
          return parsed as string[];
        }
      } catch {
        // fall through to string
      }
    }
    // Comma-separated as array shorthand
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s) => s.trim());
    }
    return trimmed;
  };

  // ─── Save rule ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    const payload = {
      rule_type: formData.rule_type,
      criterion_field: formData.criterion_field.trim(),
      operator: formData.operator,
      criterion_value: parseCriterionValue(formData.criterion_value),
      severity: formData.severity,
      enforcement_point: formData.enforcement_point || undefined,
      explanation_text: formData.explanation_text.trim(),
      display_order: parseInt(formData.display_order) || 0,
      rule_group_id: formData.rule_group_id || undefined,
      rule_group_operator: formData.rule_group_operator || undefined,
    };

    try {
      const url = editingRuleId
        ? `/api/v1/eligibility-rules/${editingRuleId}`
        : `/api/v1/opportunities/${opportunityId}/eligibility-rules`;
      const method = editingRuleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormErrors({ general: data.message ?? 'Failed to save rule' });
        return;
      }

      await fetchRules();
      setShowForm(false);
      setEditingRuleId(null);
      setFormData(EMPTY_FORM);
    } catch {
      setFormErrors({ general: 'Failed to save rule. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [formData, editingRuleId, opportunityId, accessToken, validateForm, fetchRules]);

  // ─── Edit rule ────────────────────────────────────────────────────────────

  const handleEdit = useCallback((rule: EligibilityRule) => {
    setEditingRuleId(rule.rule_id);
    setFormData({
      rule_type: rule.rule_type,
      criterion_field: rule.criterion_field,
      operator: rule.operator,
      criterion_value: Array.isArray(rule.criterion_value)
        ? rule.criterion_value.join(', ')
        : String(rule.criterion_value),
      severity: rule.severity,
      enforcement_point: rule.enforcement_point ?? '',
      explanation_text: rule.explanation_text,
      display_order: String(rule.display_order),
      rule_group_id: rule.rule_group_id ?? '',
      rule_group_operator: rule.rule_group_operator ?? '',
    });
    setShowForm(true);
    setFormErrors({});
  }, []);

  // ─── Delete rule ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (ruleId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/eligibility-rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await fetchRules();
        setDeleteConfirmId(null);
      }
    } catch {
      // noop
    } finally {
      setIsDeleting(false);
    }
  }, [accessToken, fetchRules]);

  // ─── Group assignment ─────────────────────────────────────────────────────

  const handleSaveGroup = useCallback(async (ruleId: string) => {
    await fetch(`/api/v1/eligibility-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rule_group_id: groupIdInput || undefined,
        rule_group_operator: groupOperatorInput,
      }),
    });
    await fetchRules();
    setGroupInputRuleId(null);
    setGroupIdInput('');
  }, [accessToken, fetchRules, groupIdInput, groupOperatorInput]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div aria-busy="true"><p>Loading eligibility rules...</p></div>;
  }

  if (loadError) {
    return (
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__text">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="eligibility-rules-heading" data-testid="eligibility-rule-builder">
      <h2 id="eligibility-rules-heading" className="usa-prose" style={{ marginTop: 0 }}>
        Eligibility Rules
      </h2>
      <p className="usa-prose">
        Define who can apply. Hard blockers prevent access; advisory indicators help applicants self-assess.
      </p>

      {!showForm && (
        <button
          type="button"
          className="usa-button"
          onClick={() => {
            setFormData(EMPTY_FORM);
            setEditingRuleId(null);
            setFormErrors({});
            setShowForm(true);
          }}
          data-testid="add-rule-button"
        >
          Add Rule
        </button>
      )}

      {/* ─── Inline form ─── */}
      {showForm && (
        <div
          className="usa-card"
          style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#f0f0f0' }}
          data-testid="rule-form"
        >
          <h3 style={{ marginTop: 0 }}>{editingRuleId ? 'Edit Rule' : 'Add Rule'}</h3>

          {formErrors.general && (
            <div className="usa-alert usa-alert--error" role="alert">
              <div className="usa-alert__body">
                <p className="usa-alert__text">{formErrors.general}</p>
              </div>
            </div>
          )}

          {/* Rule Type */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="rule-type">Rule Type</label>
            <select
              id="rule-type"
              className="usa-select"
              value={formData.rule_type}
              onChange={(e) => setFormData((f) => ({ ...f, rule_type: e.target.value }))}
              data-testid="field-rule-type"
            >
              {RULE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Criterion Field */}
          <div className={`usa-form-group${formErrors.criterion_field ? ' usa-form-group--error' : ''}`}>
            <label className="usa-label" htmlFor="criterion-field">
              Criterion Field <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
            </label>
            {formErrors.criterion_field && (
              <span className="usa-error-message" role="alert">{formErrors.criterion_field}</span>
            )}
            <input
              id="criterion-field"
              className={`usa-input${formErrors.criterion_field ? ' usa-input--error' : ''}`}
              type="text"
              placeholder="e.g. state_of_incorporation"
              value={formData.criterion_field}
              onChange={(e) => setFormData((f) => ({ ...f, criterion_field: e.target.value }))}
              data-testid="field-criterion-field"
            />
          </div>

          {/* Operator */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="operator">Operator</label>
            <select
              id="operator"
              className="usa-select"
              value={formData.operator}
              onChange={(e) => setFormData((f) => ({ ...f, operator: e.target.value }))}
              data-testid="field-operator"
            >
              {OPERATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Criterion Value */}
          <div className={`usa-form-group${formErrors.criterion_value ? ' usa-form-group--error' : ''}`}>
            <label className="usa-label" htmlFor="criterion-value">
              Criterion Value <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
            </label>
            <span className="usa-hint">
              For a list, separate values with commas (e.g. CA, OR, WA)
            </span>
            {formErrors.criterion_value && (
              <span className="usa-error-message" role="alert">{formErrors.criterion_value}</span>
            )}
            <input
              id="criterion-value"
              className={`usa-input${formErrors.criterion_value ? ' usa-input--error' : ''}`}
              type="text"
              value={formData.criterion_value}
              onChange={(e) => setFormData((f) => ({ ...f, criterion_value: e.target.value }))}
              data-testid="field-criterion-value"
            />
          </div>

          {/* Severity */}
          <div className="usa-form-group">
            <fieldset className="usa-fieldset">
              <legend className="usa-legend">Severity</legend>
              <div className="usa-radio">
                <input
                  id="severity-advisory"
                  className="usa-radio__input"
                  type="radio"
                  name="severity"
                  value="advisory"
                  checked={formData.severity === 'advisory'}
                  onChange={() => setFormData((f) => ({ ...f, severity: 'advisory', enforcement_point: '' }))}
                  data-testid="severity-advisory"
                />
                <label className="usa-radio__label" htmlFor="severity-advisory">Advisory</label>
              </div>
              <div className="usa-radio">
                <input
                  id="severity-hard-blocker"
                  className="usa-radio__input"
                  type="radio"
                  name="severity"
                  value="hard_blocker"
                  checked={formData.severity === 'hard_blocker'}
                  onChange={() => setFormData((f) => ({ ...f, severity: 'hard_blocker' }))}
                  data-testid="severity-hard-blocker"
                />
                <label className="usa-radio__label" htmlFor="severity-hard-blocker">Hard Blocker</label>
              </div>
            </fieldset>
          </div>

          {/* Enforcement Point — shown only for hard_blocker */}
          {formData.severity === 'hard_blocker' && (
            <div className={`usa-form-group${formErrors.enforcement_point ? ' usa-form-group--error' : ''}`}>
              <label className="usa-label" htmlFor="enforcement-point">
                Enforcement Point <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
              </label>
              {formErrors.enforcement_point && (
                <span
                  className="usa-error-message"
                  role="alert"
                  data-testid="enforcement-point-error"
                >
                  {formErrors.enforcement_point}
                </span>
              )}
              <select
                id="enforcement-point"
                className={`usa-select${formErrors.enforcement_point ? ' usa-input--error' : ''}`}
                value={formData.enforcement_point}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    enforcement_point: e.target.value as 'pre_workspace' | 'pre_submission' | '',
                  }))
                }
                data-testid="field-enforcement-point"
              >
                <option value="">-- Select enforcement point --</option>
                <option value="pre_workspace">Before Workspace</option>
                <option value="pre_submission">Before Submission</option>
              </select>
            </div>
          )}

          {/* Explanation Text */}
          <div className={`usa-form-group${formErrors.explanation_text ? ' usa-form-group--error' : ''}`}>
            <label className="usa-label" htmlFor="explanation-text">
              Explanation Text <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
            </label>
            <span className="usa-hint">Plain-language explanation shown to applicants</span>
            {formErrors.explanation_text && (
              <span className="usa-error-message" role="alert">{formErrors.explanation_text}</span>
            )}
            <textarea
              id="explanation-text"
              className={`usa-textarea${formErrors.explanation_text ? ' usa-input--error' : ''}`}
              rows={3}
              value={formData.explanation_text}
              onChange={(e) => setFormData((f) => ({ ...f, explanation_text: e.target.value }))}
              data-testid="field-explanation-text"
            />
          </div>

          {/* Display Order */}
          <div className="usa-form-group">
            <label className="usa-label" htmlFor="display-order">Display Order</label>
            <input
              id="display-order"
              className="usa-input"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData((f) => ({ ...f, display_order: e.target.value }))}
              data-testid="field-display-order"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="usa-button"
              onClick={handleSave}
              disabled={isSaving}
              data-testid="save-rule-button"
            >
              {isSaving ? 'Saving...' : 'Save Rule'}
            </button>
            <button
              type="button"
              className="usa-button usa-button--outline"
              onClick={() => {
                setShowForm(false);
                setEditingRuleId(null);
                setFormData(EMPTY_FORM);
                setFormErrors({});
              }}
              data-testid="cancel-rule-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Rules list ─── */}
      {rules.length === 0 && !showForm && (
        <div className="usa-alert usa-alert--info">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No eligibility rules defined yet. Click "Add Rule" to create one.</p>
          </div>
        </div>
      )}

      <div data-testid="rules-list">
        {rules.map((rule) => (
          <div key={rule.rule_id} style={{ marginBottom: '1rem' }}>
            {/* T-02-06: explanation_text rendered via React JSX (NOT dangerouslySetInnerHTML) */}
            <div
              className={`usa-alert ${rule.severity === 'hard_blocker' ? 'usa-alert--error' : 'usa-alert--warning'}`}
              data-testid={`rule-card-${rule.rule_id}`}
              data-severity={rule.severity}
            >
              <div className="usa-alert__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      className={`usa-tag ${rule.severity === 'hard_blocker' ? 'usa-tag--red' : 'usa-tag--yellow'}`}
                      style={{
                        background: rule.severity === 'hard_blocker' ? '#b50909' : '#ffbe2e',
                        color: rule.severity === 'hard_blocker' ? 'white' : '#1b1b1b',
                        marginBottom: '0.5rem',
                        display: 'inline-block',
                      }}
                    >
                      {rule.severity === 'hard_blocker' ? 'Hard Blocker' : 'Advisory'}
                    </span>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>{rule.criterion_field}</strong> {rule.operator}{' '}
                      {Array.isArray(rule.criterion_value)
                        ? rule.criterion_value.join(', ')
                        : String(rule.criterion_value)}
                    </p>
                    <p style={{ margin: '0.25rem 0' }} className="usa-prose">
                      {rule.explanation_text}
                    </p>
                    {rule.enforcement_point && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#565c65' }}>
                        Enforcement: {rule.enforcement_point === 'pre_workspace' ? 'Before Workspace' : 'Before Submission'}
                      </p>
                    )}
                    {rule.rule_group_id && (
                      <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#565c65' }}>
                        Group: {rule.rule_group_id} ({rule.rule_group_operator})
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled"
                      onClick={() => handleEdit(rule)}
                      data-testid={`edit-rule-${rule.rule_id}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled"
                      style={{ color: '#b50909' }}
                      onClick={() => setDeleteConfirmId(rule.rule_id)}
                      data-testid={`delete-rule-${rule.rule_id}`}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => {
                        setGroupInputRuleId(rule.rule_id);
                        setGroupIdInput(rule.rule_group_id ?? '');
                        setGroupOperatorInput(rule.rule_group_operator ?? 'AND');
                      }}
                      data-testid={`group-rule-${rule.rule_id}`}
                    >
                      Add to Group
                    </button>
                  </div>
                </div>

                {/* Group assignment inline form */}
                {groupInputRuleId === rule.rule_id && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="usa-input"
                      type="text"
                      placeholder="Group ID (UUID)"
                      value={groupIdInput}
                      onChange={(e) => setGroupIdInput(e.target.value)}
                      style={{ maxWidth: '240px' }}
                      data-testid="group-id-input"
                    />
                    <select
                      className="usa-select"
                      value={groupOperatorInput}
                      onChange={(e) => setGroupOperatorInput(e.target.value as 'AND' | 'OR')}
                      style={{ maxWidth: '100px' }}
                      data-testid="group-operator-select"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                    <button
                      type="button"
                      className="usa-button usa-button--outline"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => handleSaveGroup(rule.rule_id)}
                      data-testid="save-group-button"
                    >
                      Save Group
                    </button>
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled"
                      style={{ fontSize: '0.875rem' }}
                      onClick={() => setGroupInputRuleId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Delete confirm modal ─── */}
      {deleteConfirmId && (
        <div
          className="usa-modal-wrapper is-visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-rule-heading"
          data-testid="delete-confirm-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="usa-modal"
            style={{ background: 'white', padding: '2rem', maxWidth: '420px', width: '100%', borderRadius: '4px' }}
          >
            <h2 id="delete-rule-heading" className="usa-modal__heading">
              Delete Rule?
            </h2>
            <p>This action cannot be undone. Are you sure you want to delete this eligibility rule?</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="usa-button usa-button--secondary"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                data-testid="confirm-delete-button"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                className="usa-button usa-button--outline"
                onClick={() => setDeleteConfirmId(null)}
                data-testid="cancel-delete-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
