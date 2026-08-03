import { useState, useCallback, useEffect } from 'react';
import type { Opportunity, UpdateOpportunityPayload } from '../../../hooks/useOpportunity';

interface DeadlineFormProps {
  opportunity: Opportunity;
  onSave: (patch: UpdateOpportunityPayload) => Promise<void>;
}

interface FieldError {
  field: string;
  message: string;
}

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (Puerto Rico)' },
];

/**
 * DeadlineForm — F4: Configure intake windows and deadlines
 * Rendered within OpportunityBuilder as "Deadlines & Intake Window" section.
 * Auto-saves on blur via PATCH /api/v1/opportunities/:id.
 * Client-side validation mirrors server-side deadlineService rules.
 */
export function DeadlineForm({ opportunity, onSave }: DeadlineFormProps) {
  const toDatetimeLocal = (isoString: string | null): string => {
    if (!isoString) return '';
    // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
    return isoString.slice(0, 16);
  };

  const [fields, setFields] = useState({
    application_open_date: toDatetimeLocal(opportunity.application_open_date),
    application_close_date: toDatetimeLocal(opportunity.application_close_date),
    pre_application_deadline: toDatetimeLocal(opportunity.pre_application_deadline),
    loi_required: opportunity.loi_required,
    loi_deadline: toDatetimeLocal(opportunity.loi_deadline),
    rolling_review_enabled: opportunity.rolling_review_enabled,
    rolling_review_cadence_days: opportunity.rolling_review_cadence_days !== null
      ? String(opportunity.rolling_review_cadence_days)
      : '',
    deadline_timezone: opportunity.deadline_timezone || 'America/New_York',
  });

  const [errors, setErrors] = useState<FieldError[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update fields when opportunity prop changes
  useEffect(() => {
    setFields({
      application_open_date: toDatetimeLocal(opportunity.application_open_date),
      application_close_date: toDatetimeLocal(opportunity.application_close_date),
      pre_application_deadline: toDatetimeLocal(opportunity.pre_application_deadline),
      loi_required: opportunity.loi_required,
      loi_deadline: toDatetimeLocal(opportunity.loi_deadline),
      rolling_review_enabled: opportunity.rolling_review_enabled,
      rolling_review_cadence_days: opportunity.rolling_review_cadence_days !== null
        ? String(opportunity.rolling_review_cadence_days)
        : '',
      deadline_timezone: opportunity.deadline_timezone || 'America/New_York',
    });
  }, [opportunity]);

  const getFieldError = (field: string): string | null =>
    errors.find((e) => e.field === field)?.message ?? null;

  /**
   * Client-side validation — mirrors server deadlineService rules.
   * Returns list of errors for the current field context.
   */
  const validateDeadlines = useCallback(
    (updatedFields: typeof fields): FieldError[] => {
      const errs: FieldError[] = [];
      const openDate = updatedFields.application_open_date
        ? new Date(updatedFields.application_open_date)
        : null;
      const closeDate = updatedFields.application_close_date
        ? new Date(updatedFields.application_close_date)
        : null;
      const preAppDeadline = updatedFields.pre_application_deadline
        ? new Date(updatedFields.pre_application_deadline)
        : null;
      const loiDeadline = updatedFields.loi_deadline ? new Date(updatedFields.loi_deadline) : null;

      // Rule 1: close > open
      if (openDate && closeDate && openDate >= closeDate) {
        errs.push({
          field: 'application_close_date',
          message: 'Close date must be after open date',
        });
      }

      // Rule 2: pre_application_deadline < open
      if (preAppDeadline) {
        if (!openDate || preAppDeadline >= openDate) {
          errs.push({
            field: 'pre_application_deadline',
            message: 'Pre-application deadline must be before application open date',
          });
        }
      }

      // Rule 3: loi_deadline < close
      if (loiDeadline) {
        if (!closeDate || loiDeadline >= closeDate) {
          errs.push({
            field: 'loi_deadline',
            message: 'LOI deadline must be before application close date',
          });
        }
      }

      // Rule 4: loi_required requires loi_deadline
      if (updatedFields.loi_required && !loiDeadline) {
        errs.push({
          field: 'loi_deadline',
          message: 'LOI deadline is required when LOI submission is required',
        });
      }

      // Rule 5: rolling_review_enabled requires cadence > 0
      if (updatedFields.rolling_review_enabled) {
        const cadence = parseInt(updatedFields.rolling_review_cadence_days || '0', 10);
        if (isNaN(cadence) || cadence <= 0) {
          errs.push({
            field: 'rolling_review_cadence_days',
            message: 'Rolling review cadence must be a positive number of days',
          });
        }
      }

      return errs;
    },
    [],
  );

  const handleChange = (field: string, value: string | boolean) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  const handleBlur = useCallback(
    async (fieldName: string) => {
      // Build current effective field state
      const currentFields = { ...fields };
      const updatedErrors = validateDeadlines(currentFields);
      setErrors(updatedErrors);

      if (updatedErrors.length > 0) {
        return; // Don't save if validation errors
      }

      // Build patch — only the field that was blurred (and booleans that might have changed)
      const patch: UpdateOpportunityPayload = {};

      if (fieldName === 'rolling_review_cadence_days') {
        const val = parseInt(fields.rolling_review_cadence_days, 10);
        patch.rolling_review_cadence_days = fields.rolling_review_cadence_days === '' ? null : val;
      } else if (fieldName === 'loi_required' || fieldName === 'rolling_review_enabled') {
        (patch as Record<string, boolean>)[fieldName] = fields[fieldName as keyof typeof fields] as boolean;
      } else if (fieldName === 'deadline_timezone') {
        patch.deadline_timezone = fields.deadline_timezone;
      } else {
        // Date field
        const val = fields[fieldName as keyof typeof fields] as string;
        if (val) {
          (patch as Record<string, string>)[fieldName] = new Date(val).toISOString();
        } else {
          (patch as Record<string, null>)[fieldName] = null;
        }
      }

      setSaveStatus('saving');
      try {
        await onSave(patch);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch {
        setSaveStatus('error');
      }
    },
    [fields, onSave, validateDeadlines],
  );

  return (
    <section data-testid="deadline-form" aria-labelledby="deadline-section-heading">
      {/* Save status */}
      {saveStatus === 'saved' && (
        <div
          className="gf-alert gf-alert gf-alert--success"
          role="status"
          aria-live="polite"
          data-testid="deadline-save-success"
        >
          <div >
            <p className="gf-alert__text">Deadline settings saved</p>
          </div>
        </div>
      )}

      <h2 id="deadline-section-heading"  style={{ marginTop: '2rem' }}>
        Deadlines &amp; Intake Window
      </h2>

      <fieldset >
        <legend >Application Window</legend>

        {/* Deadline Timezone */}
        <div className="gf-form-group">
          <label className="gf-label" htmlFor="deadline-timezone">
            Deadline Timezone <abbr title="required" className="gf-hint">*</abbr>
          </label>
          <select
            id="deadline-timezone"
            name="deadline_timezone"
            className="gf-select"
            value={fields.deadline_timezone}
            onChange={(e) => handleChange('deadline_timezone', e.target.value)}
            onBlur={() => handleBlur('deadline_timezone')}
            data-testid="field-deadline-timezone"
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Application Open Date */}
        <div className={`gf-form-group${getFieldError('application_open_date') ? ' gf-form-group' : ''}`}>
          <label className="gf-label" htmlFor="app-open-date">
            Application Open Date <abbr title="required" className="gf-hint">*</abbr>
          </label>
          {getFieldError('application_open_date') && (
            <span className="gf-error-msg" role="alert">
              {getFieldError('application_open_date')}
            </span>
          )}
          <input
            id="app-open-date"
            name="application_open_date"
            type="datetime-local"
            className={`gf-input${getFieldError('application_open_date') ? ' gf-input--error' : ''}`}
            value={fields.application_open_date}
            onChange={(e) => handleChange('application_open_date', e.target.value)}
            onBlur={() => handleBlur('application_open_date')}
            data-testid="field-open-date"
          />
        </div>

        {/* Application Close Date */}
        <div className={`gf-form-group${getFieldError('application_close_date') ? ' gf-form-group' : ''}`}>
          <label className="gf-label" htmlFor="app-close-date">
            Application Close Date <abbr title="required" className="gf-hint">*</abbr>
          </label>
          {getFieldError('application_close_date') && (
            <span className="gf-error-msg" role="alert" data-testid="close-date-error">
              {getFieldError('application_close_date')}
            </span>
          )}
          <input
            id="app-close-date"
            name="application_close_date"
            type="datetime-local"
            className={`gf-input${getFieldError('application_close_date') ? ' gf-input--error' : ''}`}
            value={fields.application_close_date}
            onChange={(e) => handleChange('application_close_date', e.target.value)}
            onBlur={() => handleBlur('application_close_date')}
            data-testid="field-close-date"
          />
        </div>

        {/* Pre-Application Deadline */}
        <div className={`gf-form-group${getFieldError('pre_application_deadline') ? ' gf-form-group' : ''}`}>
          <label className="gf-label" htmlFor="pre-app-deadline">
            Pre-Application Deadline <span className="gf-hint">(optional — must be before open date)</span>
          </label>
          {getFieldError('pre_application_deadline') && (
            <span className="gf-error-msg" role="alert" data-testid="pre-app-error">
              {getFieldError('pre_application_deadline')}
            </span>
          )}
          <input
            id="pre-app-deadline"
            name="pre_application_deadline"
            type="datetime-local"
            className={`gf-input${getFieldError('pre_application_deadline') ? ' gf-input--error' : ''}`}
            value={fields.pre_application_deadline}
            onChange={(e) => handleChange('pre_application_deadline', e.target.value)}
            onBlur={() => handleBlur('pre_application_deadline')}
            data-testid="field-pre-app-deadline"
          />
        </div>
      </fieldset>

      <fieldset  style={{ marginTop: '1.5rem' }}>
        <legend >Letter of Intent (LOI)</legend>

        {/* LOI Required */}
        <div className="gf-form-group">
          <div className="gf-form-group">
            <input
              id="loi-required"
              name="loi_required"
              type="checkbox"
              
              checked={fields.loi_required}
              onChange={(e) => {
                handleChange('loi_required', e.target.checked);
                // Re-validate on next tick after state update
                setTimeout(() => {
                  const updated = { ...fields, loi_required: e.target.checked };
                  setErrors(validateDeadlines(updated));
                }, 0);
              }}
              onBlur={() => handleBlur('loi_required')}
              data-testid="field-loi-required"
            />
            <label htmlFor="loi-required" className="gf-label">
              LOI Required
            </label>
          </div>
        </div>

        {/* LOI Deadline — shown when loi_required is checked */}
        {fields.loi_required && (
          <div
            className={`gf-form-group${getFieldError('loi_deadline') ? ' gf-form-group' : ''}`}
            data-testid="loi-deadline-field"
          >
            <label className="gf-label" htmlFor="loi-deadline">
              LOI Deadline <abbr title="required" className="gf-hint">*</abbr>{' '}
              <span className="gf-hint">(must be before close date)</span>
            </label>
            {getFieldError('loi_deadline') && (
              <span className="gf-error-msg" role="alert" data-testid="loi-deadline-error">
                {getFieldError('loi_deadline')}
              </span>
            )}
            <input
              id="loi-deadline"
              name="loi_deadline"
              type="datetime-local"
              className={`gf-input${getFieldError('loi_deadline') ? ' gf-input--error' : ''}`}
              value={fields.loi_deadline}
              onChange={(e) => handleChange('loi_deadline', e.target.value)}
              onBlur={() => handleBlur('loi_deadline')}
              data-testid="field-loi-deadline"
            />
          </div>
        )}
      </fieldset>

      <fieldset  style={{ marginTop: '1.5rem' }}>
        <legend >Rolling Review</legend>

        {/* Enable Rolling Review */}
        <div className="gf-form-group">
          <div className="gf-form-group">
            <input
              id="rolling-review-enabled"
              name="rolling_review_enabled"
              type="checkbox"
              
              checked={fields.rolling_review_enabled}
              onChange={(e) => {
                handleChange('rolling_review_enabled', e.target.checked);
                setTimeout(() => {
                  const updated = { ...fields, rolling_review_enabled: e.target.checked };
                  setErrors(validateDeadlines(updated));
                }, 0);
              }}
              onBlur={() => handleBlur('rolling_review_enabled')}
              data-testid="field-rolling-review"
            />
            <label htmlFor="rolling-review-enabled" className="gf-label">
              Enable Rolling Review
            </label>
          </div>
        </div>

        {/* Rolling Review Cadence — shown when rolling_review_enabled is checked */}
        {fields.rolling_review_enabled && (
          <div
            className={`gf-form-group${getFieldError('rolling_review_cadence_days') ? ' gf-form-group' : ''}`}
            data-testid="rolling-cadence-field"
          >
            <label className="gf-label" htmlFor="rolling-cadence">
              Rolling Review Cadence (days) <abbr title="required" className="gf-hint">*</abbr>
            </label>
            {getFieldError('rolling_review_cadence_days') && (
              <span className="gf-error-msg" role="alert" data-testid="rolling-cadence-error">
                {getFieldError('rolling_review_cadence_days')}
              </span>
            )}
            <input
              id="rolling-cadence"
              name="rolling_review_cadence_days"
              type="number"
              min={1}
              className={`gf-input${getFieldError('rolling_review_cadence_days') ? ' gf-input--error' : ''}`}
              value={fields.rolling_review_cadence_days}
              onChange={(e) => handleChange('rolling_review_cadence_days', e.target.value)}
              onBlur={() => handleBlur('rolling_review_cadence_days')}
              data-testid="field-rolling-cadence"
            />
          </div>
        )}
      </fieldset>
    </section>
  );
}
