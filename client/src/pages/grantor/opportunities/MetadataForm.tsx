import { useState, useEffect, useCallback } from 'react';
import { GuidancePanel } from './GuidancePanel';
import { ReadabilityIndicator } from '../../../components/guidance/ReadabilityIndicator';
import type { Opportunity, UpdateOpportunityPayload } from '../../../hooks/useOpportunity';

interface MetadataFormProps {
  opportunity: Opportunity;
  onSave: (patch: UpdateOpportunityPayload) => Promise<void>;
}

interface FieldError {
  field: string;
  message: string;
}

/**
 * Multi-section form for all F1 metadata fields.
 * Auto-saves on blur.
 * Includes GuidancePanel and ReadabilityIndicator for narrative fields.
 * Field-level validation with USWDS error styling.
 */
export function MetadataForm({ opportunity, onSave }: MetadataFormProps) {
  const [fields, setFields] = useState({
    title: opportunity.title,
    opportunity_number: opportunity.opportunity_number,
    funding_source: opportunity.funding_source,
    announcement_type: opportunity.announcement_type,
    program_area: opportunity.program_area,
    funding_amount_max: String(opportunity.funding_amount_max ?? ''),
    funding_amount_min: opportunity.funding_amount_min != null ? String(opportunity.funding_amount_min) : '',
    total_program_funding: opportunity.total_program_funding != null ? String(opportunity.total_program_funding) : '',
    expected_awards_min: opportunity.expected_awards_min != null ? String(opportunity.expected_awards_min) : '',
    expected_awards_max: opportunity.expected_awards_max != null ? String(opportunity.expected_awards_max) : '',
    assistance_listing_number: opportunity.assistance_listing_number ?? '',
    executive_summary: opportunity.executive_summary,
    eligibility_summary: opportunity.eligibility_summary,
    contact_name: opportunity.contact_name,
    contact_email: opportunity.contact_email,
    contact_phone: opportunity.contact_phone ?? '',
    contact_title: opportunity.contact_title ?? '',
  });

  const [errors, setErrors] = useState<FieldError[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Check if federal funding source (for assistance_listing_number)
  const isFederal = /federal/i.test(fields.funding_source);

  // Client-side validation
  const validate = useCallback((patch: UpdateOpportunityPayload): FieldError[] => {
    const errs: FieldError[] = [];

    if (patch.contact_email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patch.contact_email)) {
        errs.push({ field: 'contact_email', message: 'Enter a valid email address' });
      }
    }

    if (patch.funding_amount_min !== undefined && patch.funding_amount_max !== undefined) {
      if (patch.funding_amount_min > patch.funding_amount_max) {
        errs.push({
          field: 'funding_amount_min',
          message: 'Minimum award must be less than or equal to maximum award',
        });
      }
    }

    // If saving both min and max, check against each other
    if (patch.funding_amount_min !== undefined) {
      const max = patch.funding_amount_max !== undefined
        ? patch.funding_amount_max
        : parseFloat(fields.funding_amount_max);
      if (!isNaN(max) && patch.funding_amount_min > max) {
        errs.push({
          field: 'funding_amount_min',
          message: 'Minimum award must be less than or equal to maximum award',
        });
      }
    }

    return errs;
  }, [fields.funding_amount_max]);

  const getFieldError = (field: string): string | null => {
    return errors.find((e) => e.field === field)?.message ?? null;
  };

  // Auto-save on blur
  const handleBlur = useCallback(async (fieldName: string, value: string | number | undefined) => {
    const patch: UpdateOpportunityPayload = {};

    // Parse numeric fields
    if (
      fieldName === 'funding_amount_max' ||
      fieldName === 'funding_amount_min' ||
      fieldName === 'total_program_funding' ||
      fieldName === 'expected_awards_min' ||
      fieldName === 'expected_awards_max'
    ) {
      const numVal = parseFloat(String(value));
      if (value === '' || value === null || value === undefined) {
        (patch as Record<string, null>)[fieldName] = null;
      } else if (!isNaN(numVal)) {
        (patch as Record<string, number>)[fieldName] = numVal;
      }
    } else {
      (patch as Record<string, string>)[fieldName] = String(value ?? '');
    }

    // Client-side validation
    const clientErrors = validate(patch);
    // Remove old errors for this field, add new ones
    setErrors((prev) => [
      ...prev.filter((e) => e.field !== fieldName),
      ...clientErrors.filter((e) => e.field === fieldName),
    ]);

    if (clientErrors.length > 0) {
      return; // Don't save if client validation failed
    }

    setSaveStatus('saving');
    try {
      await onSave(patch);
      setSaveStatus('saved');
      // Clear save status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      setSaveStatus('error');

      // Handle server-side errors
      if (error.response?.data?.error === 'DUPLICATE_OPPORTUNITY_NUMBER') {
        setErrors((prev) => [
          ...prev.filter((e) => e.field !== 'opportunity_number'),
          { field: 'opportunity_number', message: 'This opportunity number already exists in this program' },
        ]);
      } else if (error.response?.data?.error === 'FUNDING_RANGE_INVALID') {
        setErrors((prev) => [
          ...prev.filter((e) => e.field !== 'funding_amount_min'),
          { field: 'funding_amount_min', message: 'Minimum award must not exceed maximum award' },
        ]);
      } else if (error.response?.data?.error === 'CONTACT_EMAIL_INVALID') {
        setErrors((prev) => [
          ...prev.filter((e) => e.field !== 'contact_email'),
          { field: 'contact_email', message: 'Enter a valid email address' },
        ]);
      } else if (error.response?.data?.error === 'ASSISTANCE_LISTING_FORMAT_INVALID') {
        setErrors((prev) => [
          ...prev.filter((e) => e.field !== 'assistance_listing_number'),
          { field: 'assistance_listing_number', message: 'Format must be XX.XXX (e.g. 93.045)' },
        ]);
      }
    }
  }, [onSave, validate]);

  const handleChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  // Update fields when opportunity prop changes
  useEffect(() => {
    setFields({
      title: opportunity.title,
      opportunity_number: opportunity.opportunity_number,
      funding_source: opportunity.funding_source,
      announcement_type: opportunity.announcement_type,
      program_area: opportunity.program_area,
      funding_amount_max: String(opportunity.funding_amount_max ?? ''),
      funding_amount_min: opportunity.funding_amount_min != null ? String(opportunity.funding_amount_min) : '',
      total_program_funding: opportunity.total_program_funding != null ? String(opportunity.total_program_funding) : '',
      expected_awards_min: opportunity.expected_awards_min != null ? String(opportunity.expected_awards_min) : '',
      expected_awards_max: opportunity.expected_awards_max != null ? String(opportunity.expected_awards_max) : '',
      assistance_listing_number: opportunity.assistance_listing_number ?? '',
      executive_summary: opportunity.executive_summary,
      eligibility_summary: opportunity.eligibility_summary,
      contact_name: opportunity.contact_name,
      contact_email: opportunity.contact_email,
      contact_phone: opportunity.contact_phone ?? '',
      contact_title: opportunity.contact_title ?? '',
    });
  }, [opportunity]);

  return (
    <form data-testid="metadata-form" noValidate>
      {/* Save status toast */}
      {saveStatus === 'saved' && (
        <div
          className="usa-alert usa-alert--success usa-alert--slim"
          role="status"
          aria-live="polite"
          data-testid="save-success-toast"
        >
          <div className="usa-alert__body">
            <p className="usa-alert__text">Changes saved</p>
          </div>
        </div>
      )}

      {/* ── Section 1: Basic Information ─────────────────────────────── */}
      <fieldset className="usa-fieldset">
        <legend className="usa-legend usa-legend--large">Basic Information</legend>

        {/* title */}
        <div className={`usa-form-group${getFieldError('title') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-title">
            Opportunity Title <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('title') && (
            <span className="usa-error-message" role="alert">{getFieldError('title')}</span>
          )}
          <input
            id="opp-title"
            name="title"
            className={`usa-input${getFieldError('title') ? ' usa-input--error' : ''}`}
            type="text"
            maxLength={250}
            required
            value={fields.title}
            onChange={(e) => handleChange('title', e.target.value)}
            onBlur={(e) => handleBlur('title', e.target.value)}
            data-testid="field-title"
          />
        </div>

        {/* opportunity_number */}
        <div className={`usa-form-group${getFieldError('opportunity_number') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-number">
            Opportunity Number <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('opportunity_number') && (
            <span className="usa-error-message" role="alert">{getFieldError('opportunity_number')}</span>
          )}
          <input
            id="opp-number"
            name="opportunity_number"
            className={`usa-input${getFieldError('opportunity_number') ? ' usa-input--error' : ''}`}
            type="text"
            maxLength={100}
            required
            value={fields.opportunity_number}
            onChange={(e) => handleChange('opportunity_number', e.target.value)}
            onBlur={(e) => handleBlur('opportunity_number', e.target.value)}
            data-testid="field-opportunity-number"
          />
        </div>

        {/* funding_source */}
        <div className={`usa-form-group${getFieldError('funding_source') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-funding-source">
            Funding Source <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('funding_source') && (
            <span className="usa-error-message" role="alert">{getFieldError('funding_source')}</span>
          )}
          <input
            id="opp-funding-source"
            name="funding_source"
            className={`usa-input${getFieldError('funding_source') ? ' usa-input--error' : ''}`}
            type="text"
            maxLength={250}
            required
            value={fields.funding_source}
            onChange={(e) => handleChange('funding_source', e.target.value)}
            onBlur={(e) => handleBlur('funding_source', e.target.value)}
            data-testid="field-funding-source"
          />
        </div>

        {/* announcement_type */}
        <div className={`usa-form-group${getFieldError('announcement_type') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-announcement-type">
            Announcement Type <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          <select
            id="opp-announcement-type"
            name="announcement_type"
            className="usa-select"
            required
            value={fields.announcement_type}
            onChange={(e) => handleChange('announcement_type', e.target.value)}
            onBlur={(e) => handleBlur('announcement_type', e.target.value)}
            data-testid="field-announcement-type"
          >
            <option value="Initial">Initial</option>
            <option value="Modified">Modified</option>
            <option value="Continuation">Continuation</option>
            <option value="Extension">Extension</option>
            <option value="Closeout">Closeout</option>
          </select>
        </div>

        {/* program_area */}
        <div className={`usa-form-group${getFieldError('program_area') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-program-area">
            Program Area <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('program_area') && (
            <span className="usa-error-message" role="alert">{getFieldError('program_area')}</span>
          )}
          <input
            id="opp-program-area"
            name="program_area"
            className={`usa-input${getFieldError('program_area') ? ' usa-input--error' : ''}`}
            type="text"
            maxLength={100}
            required
            value={fields.program_area}
            onChange={(e) => handleChange('program_area', e.target.value)}
            onBlur={(e) => handleBlur('program_area', e.target.value)}
            data-testid="field-program-area"
          />
        </div>
      </fieldset>

      {/* ── Section 2: Funding Details ────────────────────────────────── */}
      <fieldset className="usa-fieldset" style={{ marginTop: '2rem' }}>
        <legend className="usa-legend usa-legend--large">Funding Details</legend>

        {/* funding_amount_max */}
        <div className={`usa-form-group${getFieldError('funding_amount_max') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-amount-max">
            Maximum Award Amount <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('funding_amount_max') && (
            <span className="usa-error-message" role="alert">{getFieldError('funding_amount_max')}</span>
          )}
          <input
            id="opp-amount-max"
            name="funding_amount_max"
            className={`usa-input${getFieldError('funding_amount_max') ? ' usa-input--error' : ''}`}
            type="number"
            min={0}
            required
            value={fields.funding_amount_max}
            onChange={(e) => handleChange('funding_amount_max', e.target.value)}
            onBlur={(e) => handleBlur('funding_amount_max', e.target.value)}
            data-testid="field-funding-amount-max"
          />
        </div>

        {/* funding_amount_min */}
        <div className={`usa-form-group${getFieldError('funding_amount_min') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-amount-min">
            Minimum Award Amount (optional)
          </label>
          {getFieldError('funding_amount_min') && (
            <span className="usa-error-message" role="alert" data-testid="funding-min-error">{getFieldError('funding_amount_min')}</span>
          )}
          <input
            id="opp-amount-min"
            name="funding_amount_min"
            className={`usa-input${getFieldError('funding_amount_min') ? ' usa-input--error' : ''}`}
            type="number"
            min={0}
            value={fields.funding_amount_min}
            onChange={(e) => handleChange('funding_amount_min', e.target.value)}
            onBlur={(e) => handleBlur('funding_amount_min', e.target.value)}
            data-testid="field-funding-amount-min"
          />
        </div>

        {/* total_program_funding */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="opp-total-funding">
            Total Program Funding (optional)
          </label>
          <input
            id="opp-total-funding"
            name="total_program_funding"
            className="usa-input"
            type="number"
            min={0}
            value={fields.total_program_funding}
            onChange={(e) => handleChange('total_program_funding', e.target.value)}
            onBlur={(e) => handleBlur('total_program_funding', e.target.value)}
          />
        </div>

        {/* expected_awards_min + max */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="opp-awards-min">
            Expected Number of Awards — Minimum (optional)
          </label>
          <input
            id="opp-awards-min"
            name="expected_awards_min"
            className="usa-input"
            type="number"
            min={1}
            value={fields.expected_awards_min}
            onChange={(e) => handleChange('expected_awards_min', e.target.value)}
            onBlur={(e) => handleBlur('expected_awards_min', e.target.value)}
          />
        </div>
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="opp-awards-max">
            Expected Number of Awards — Maximum (optional)
          </label>
          <input
            id="opp-awards-max"
            name="expected_awards_max"
            className="usa-input"
            type="number"
            min={1}
            value={fields.expected_awards_max}
            onChange={(e) => handleChange('expected_awards_max', e.target.value)}
            onBlur={(e) => handleBlur('expected_awards_max', e.target.value)}
          />
        </div>

        {/* assistance_listing_number — shown and required when federal */}
        {isFederal && (
          <div className={`usa-form-group${getFieldError('assistance_listing_number') ? ' usa-form-group--error' : ''}`}>
            <label className="usa-label" htmlFor="opp-aln">
              Assistance Listing Number{' '}
              <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
              <span className="usa-hint"> (Required for federal funding — format: XX.XXX)</span>
            </label>
            {getFieldError('assistance_listing_number') && (
              <span className="usa-error-message" role="alert" data-testid="aln-error">
                {getFieldError('assistance_listing_number')}
              </span>
            )}
            <input
              id="opp-aln"
              name="assistance_listing_number"
              className={`usa-input${getFieldError('assistance_listing_number') ? ' usa-input--error' : ''}`}
              type="text"
              maxLength={10}
              placeholder="e.g. 93.045"
              required
              value={fields.assistance_listing_number}
              onChange={(e) => handleChange('assistance_listing_number', e.target.value)}
              onBlur={(e) => handleBlur('assistance_listing_number', e.target.value)}
              data-testid="field-assistance-listing-number"
            />
          </div>
        )}
      </fieldset>

      {/* ── Section 3: Narrative Fields ───────────────────────────────── */}
      <fieldset className="usa-fieldset" style={{ marginTop: '2rem' }}>
        <legend className="usa-legend usa-legend--large">Narrative Fields</legend>

        {/* executive_summary */}
        <div className={`usa-form-group${getFieldError('executive_summary') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-exec-summary">
            Executive Summary <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('executive_summary') && (
            <span className="usa-error-message" role="alert">{getFieldError('executive_summary')}</span>
          )}
          <textarea
            id="opp-exec-summary"
            name="executive_summary"
            className={`usa-textarea${getFieldError('executive_summary') ? ' usa-input--error' : ''}`}
            required
            rows={5}
            value={fields.executive_summary}
            onChange={(e) => handleChange('executive_summary', e.target.value)}
            onBlur={(e) => handleBlur('executive_summary', e.target.value)}
            data-testid="field-executive-summary"
          />
          <ReadabilityIndicator text={fields.executive_summary} />
          <GuidancePanel fieldId="executive_summary" value={fields.executive_summary} />
        </div>

        {/* eligibility_summary */}
        <div
          className={`usa-form-group${getFieldError('eligibility_summary') ? ' usa-form-group--error' : ''}`}
          style={{ marginTop: '1.5rem' }}
        >
          <label className="usa-label" htmlFor="opp-eligibility-summary">
            Eligibility Summary <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('eligibility_summary') && (
            <span className="usa-error-message" role="alert">{getFieldError('eligibility_summary')}</span>
          )}
          <textarea
            id="opp-eligibility-summary"
            name="eligibility_summary"
            className={`usa-textarea${getFieldError('eligibility_summary') ? ' usa-input--error' : ''}`}
            required
            rows={5}
            value={fields.eligibility_summary}
            onChange={(e) => handleChange('eligibility_summary', e.target.value)}
            onBlur={(e) => handleBlur('eligibility_summary', e.target.value)}
            data-testid="field-eligibility-summary"
          />
          <ReadabilityIndicator text={fields.eligibility_summary} />
          <GuidancePanel fieldId="eligibility_summary" value={fields.eligibility_summary} />
        </div>
      </fieldset>

      {/* ── Section 4: Contact Information ───────────────────────────── */}
      <fieldset className="usa-fieldset" style={{ marginTop: '2rem' }}>
        <legend className="usa-legend usa-legend--large">Contact Information</legend>

        {/* contact_name */}
        <div className={`usa-form-group${getFieldError('contact_name') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-contact-name">
            Contact Name <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('contact_name') && (
            <span className="usa-error-message" role="alert">{getFieldError('contact_name')}</span>
          )}
          <input
            id="opp-contact-name"
            name="contact_name"
            className={`usa-input${getFieldError('contact_name') ? ' usa-input--error' : ''}`}
            type="text"
            maxLength={250}
            required
            value={fields.contact_name}
            onChange={(e) => handleChange('contact_name', e.target.value)}
            onBlur={(e) => handleBlur('contact_name', e.target.value)}
            data-testid="field-contact-name"
          />
        </div>

        {/* contact_email */}
        <div className={`usa-form-group${getFieldError('contact_email') ? ' usa-form-group--error' : ''}`}>
          <label className="usa-label" htmlFor="opp-contact-email">
            Contact Email <abbr title="required" className="usa-hint usa-hint--required">*</abbr>
          </label>
          {getFieldError('contact_email') && (
            <span className="usa-error-message" role="alert" data-testid="contact-email-error">
              {getFieldError('contact_email')}
            </span>
          )}
          <input
            id="opp-contact-email"
            name="contact_email"
            className={`usa-input${getFieldError('contact_email') ? ' usa-input--error' : ''}`}
            type="email"
            maxLength={320}
            required
            value={fields.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            onBlur={(e) => handleBlur('contact_email', e.target.value)}
            data-testid="field-contact-email"
          />
        </div>

        {/* contact_phone */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="opp-contact-phone">
            Contact Phone (optional)
          </label>
          <input
            id="opp-contact-phone"
            name="contact_phone"
            className="usa-input"
            type="tel"
            maxLength={30}
            value={fields.contact_phone}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
            onBlur={(e) => handleBlur('contact_phone', e.target.value)}
          />
        </div>

        {/* contact_title */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="opp-contact-title">
            Contact Title (optional)
          </label>
          <input
            id="opp-contact-title"
            name="contact_title"
            className="usa-input"
            type="text"
            maxLength={250}
            value={fields.contact_title}
            onChange={(e) => handleChange('contact_title', e.target.value)}
            onBlur={(e) => handleBlur('contact_title', e.target.value)}
          />
        </div>
      </fieldset>
    </form>
  );
}
