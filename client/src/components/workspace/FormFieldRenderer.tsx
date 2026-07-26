import React from 'react';
import type { FormFieldDefinition } from '../../types/formField';

interface FormFieldRendererProps {
  field: FormFieldDefinition;
  value: string | unknown;          // current value (string for most; object for JSON types)
  onChange: (val: string | unknown) => void;
  onBlur: () => void;               // triggers field-level validation
  error?: string;                   // inline error message
  disabled?: boolean;
  allFieldValues?: Record<string, string | unknown>; // for calculated fields
}

/**
 * Renders the correct USWDS input component for each field_type.
 * Supports all 11 field types: text, textarea, number, currency, date,
 * picklist, multi_select, checkbox, file_upload, calculated, repeating_table.
 */
export function FormFieldRenderer({
  field,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  allFieldValues = {},
}: FormFieldRendererProps) {
  const vc = field.validation_config ?? {};
  const fieldInputId = `field-${field.field_id}`;

  // ─── File upload handler ────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size validation (T-04-13)
    if (vc.max_size_mb && file.size > vc.max_size_mb * 1024 * 1024) {
      onChange({ error: `File exceeds maximum size of ${vc.max_size_mb}MB` });
      return;
    }

    // Client-side format validation
    if (vc.file_formats && vc.file_formats.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const allowedExts = vc.file_formats.map((f) => f.replace(/^\./, '').toLowerCase());
      if (!allowedExts.includes(ext)) {
        onChange({ error: `File format not allowed. Accepted: ${vc.file_formats.join(', ')}` });
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // strip data:*/* prefix
      onChange({
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        content_base64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // ─── Calculated field formula evaluator ────────────────────────────────────
  const computeCalcValue = (formula: string | undefined): string => {
    if (!formula) return '';
    // Simple SUM formula: =SUM(field_id1, field_id2, ...)
    const sumMatch = formula.match(/^=SUM\(([^)]+)\)$/i);
    if (sumMatch) {
      const fieldIds = sumMatch[1].split(',').map((s) => s.trim());
      const total = fieldIds.reduce((acc, fid) => {
        const val = allFieldValues[fid];
        const num = parseFloat(String(val));
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
      return total.toString();
    }
    return formula;
  };

  // ─── Repeating table row management ────────────────────────────────────────
  const tableRows = Array.isArray(value) ? (value as Record<string, string>[]) : [];

  const addTableRow = () => {
    const newRow: Record<string, string> = {};
    (field.columns ?? []).forEach((col) => { newRow[col.key] = ''; });
    onChange([...tableRows, newRow]);
  };

  const removeTableRow = (idx: number) => {
    const updated = tableRows.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const updateTableCell = (rowIdx: number, colKey: string, cellVal: string) => {
    const updated = tableRows.map((row, i) =>
      i === rowIdx ? { ...row, [colKey]: cellVal } : row,
    );
    onChange(updated);
  };

  // ─── Multi-select value management ─────────────────────────────────────────
  const selectedValues: string[] = Array.isArray(value) ? (value as string[]) : [];

  const toggleMultiSelect = (optionVal: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, optionVal]);
    } else {
      onChange(selectedValues.filter((v) => v !== optionVal));
    }
  };

  // ─── Render input by field_type ─────────────────────────────────────────────
  const renderInput = () => {
    switch (field.field_type) {

      case 'text':
        return (
          <input
            id={fieldInputId}
            className={`usa-input${error ? ' usa-input--error' : ''}`}
            type="text"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            maxLength={vc.max_chars}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-describedby={error ? `${fieldInputId}-error` : undefined}
          />
        );

      case 'textarea':
        return (
          <>
            <textarea
              id={fieldInputId}
              className={`usa-textarea${error ? ' usa-input--error' : ''}`}
              value={String(value ?? '')}
              placeholder={field.placeholder}
              maxLength={vc.max_chars}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              aria-describedby={error ? `${fieldInputId}-error` : undefined}
              rows={6}
            />
            {vc.max_chars && (
              <span className="usa-hint" aria-live="polite">
                {String(value ?? '').length}/{vc.max_chars} characters
              </span>
            )}
          </>
        );

      case 'number':
        return (
          <input
            id={fieldInputId}
            className={`usa-input${error ? ' usa-input--error' : ''}`}
            type="number"
            value={String(value ?? '')}
            placeholder={field.placeholder}
            min={vc.min}
            max={vc.max}
            step={vc.decimal_places ? Math.pow(10, -vc.decimal_places) : 1}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-describedby={error ? `${fieldInputId}-error` : undefined}
          />
        );

      case 'currency':
        return (
          <div className="usa-input-group">
            <span className="usa-input-prefix" aria-hidden="true">$</span>
            <input
              id={fieldInputId}
              className={`usa-input${error ? ' usa-input--error' : ''}`}
              type="number"
              value={String(value ?? '')}
              placeholder={field.placeholder ?? '0.00'}
              min={0}
              step="0.01"
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              aria-describedby={error ? `${fieldInputId}-error` : undefined}
            />
          </div>
        );

      case 'date':
        return (
          <input
            id={fieldInputId}
            className={`usa-input usa-date-picker__external-input${error ? ' usa-input--error' : ''}`}
            type="date"
            value={String(value ?? '')}
            min={vc.min_date}
            max={vc.max_date}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-describedby={error ? `${fieldInputId}-error` : undefined}
          />
        );

      case 'picklist':
        return (
          <select
            id={fieldInputId}
            className={`usa-select${error ? ' usa-input--error' : ''}`}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-describedby={error ? `${fieldInputId}-error` : undefined}
          >
            <option value="">-- Select --</option>
            {(vc.allowed_values ?? []).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <fieldset className="usa-fieldset" onBlur={onBlur}>
            <legend className="usa-sr-only">{field.label} — select all that apply</legend>
            {(vc.allowed_values ?? []).map((v) => (
              <div className="usa-checkbox" key={v}>
                <input
                  className="usa-checkbox__input"
                  type="checkbox"
                  id={`${fieldInputId}-${v}`}
                  value={v}
                  checked={selectedValues.includes(v)}
                  onChange={(e) => toggleMultiSelect(v, e.target.checked)}
                  disabled={disabled}
                />
                <label className="usa-checkbox__label" htmlFor={`${fieldInputId}-${v}`}>
                  {v}
                </label>
              </div>
            ))}
          </fieldset>
        );

      case 'checkbox':
        return (
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id={fieldInputId}
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              onBlur={onBlur}
              disabled={disabled}
            />
            <label className="usa-checkbox__label" htmlFor={fieldInputId}>
              {field.label}
            </label>
          </div>
        );

      case 'file_upload': {
        const fileValue = value as { file_name?: string } | null | '';
        const selectedFileName = typeof fileValue === 'object' && fileValue !== null && 'file_name' in fileValue
          ? fileValue.file_name
          : undefined;
        return (
          <>
            <input
              id={fieldInputId}
              type="file"
              className="usa-file-input"
              accept={vc.file_formats?.join(',') ?? undefined}
              onChange={handleFileChange}
              onBlur={onBlur}
              disabled={disabled}
              aria-describedby={error ? `${fieldInputId}-error` : undefined}
            />
            {selectedFileName && (
              <span className="usa-hint" style={{ marginTop: '0.25rem', display: 'block' }}>
                Selected: {selectedFileName}
              </span>
            )}
          </>
        );
      }

      case 'calculated':
        return (
          <div
            className="usa-input"
            aria-readonly="true"
            role="status"
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
          >
            {computeCalcValue(field.formula) || <span className="usa-hint">Calculated value</span>}
          </div>
        );

      case 'repeating_table':
        return (
          <div style={{ overflowX: 'auto' }}>
            <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
              <thead>
                <tr>
                  {(field.columns ?? []).map((col) => (
                    <th key={col.key} scope="col">{col.label}</th>
                  ))}
                  <th scope="col">
                    <span className="usa-sr-only">Remove row</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {(field.columns ?? []).map((col) => (
                      <td key={col.key}>
                        <input
                          className="usa-input"
                          type="text"
                          value={row[col.key] ?? ''}
                          onChange={(e) => updateTableCell(rowIdx, col.key, e.target.value)}
                          onBlur={onBlur}
                          disabled={disabled}
                          aria-label={`${col.label} row ${rowIdx + 1}`}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="usa-button usa-button--unstyled"
                        onClick={() => removeTableRow(rowIdx)}
                        disabled={disabled}
                        aria-label={`Remove row ${rowIdx + 1}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="usa-button usa-button--outline"
              onClick={addTableRow}
              disabled={disabled}
              style={{ marginTop: '0.5rem' }}
            >
              + Add Row
            </button>
          </div>
        );

      default:
        return (
          <div className="usa-alert usa-alert--warning usa-alert--slim">
            <div className="usa-alert__body">
              <p className="usa-alert__text">Unknown field type: {(field as FormFieldDefinition).field_type}</p>
            </div>
          </div>
        );
    }
  };

  // ─── Wrapper with label, help text, error message ──────────────────────────
  return (
    <div className={`usa-form-group${error ? ' usa-form-group--error' : ''}`} style={{ marginBottom: '1.5rem' }}>
      {/* Label (skip for checkbox — label is rendered inline) */}
      {field.field_type !== 'checkbox' && (
        <label className="usa-label" htmlFor={fieldInputId}>
          {field.label}
          {field.is_required && (
            <span className="usa-hint" style={{ color: '#e52207', marginLeft: '0.25rem' }} aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Help text */}
      {field.help_text && (
        <div className="usa-hint" id={`${fieldInputId}-hint`}>
          {field.help_text}
        </div>
      )}

      {/* Error message (USWDS error pattern) */}
      {error && (
        <span className="usa-error-message" id={`${fieldInputId}-error`} role="alert">
          {error}
        </span>
      )}

      {/* Input */}
      {renderInput()}
    </div>
  );
}
