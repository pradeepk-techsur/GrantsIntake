import type { ValidationResult } from '../../types/validation';

interface Props {
  validation: ValidationResult | null;
  sectionId?: string; // If provided, only show errors for this section
}

/**
 * ValidationBanner — three-tier USWDS alert display for inline section validation.
 *
 * Renders:
 * - usa-alert--error (red) for blocking errors with link to field anchor
 * - usa-alert--warning (yellow) for warnings with link
 * - usa-alert--info (blue) for informational items
 * - null if no errors/warnings/info
 */
export function ValidationBanner({ validation, sectionId }: Props) {
  if (!validation) return null;

  const blocking = sectionId
    ? validation.blocking.filter((e) => e.section_id === sectionId)
    : validation.blocking;
  const warnings = sectionId
    ? validation.warnings.filter((w) => w.section_id === sectionId)
    : validation.warnings;
  const informational = sectionId ? [] : validation.informational;

  if (blocking.length === 0 && warnings.length === 0 && informational.length === 0) return null;

  return (
    <div className="validation-banner" data-testid="validation-banner">
      {blocking.map((err, i) => (
        <div key={`blocking-${i}`} className="usa-alert usa-alert--error usa-alert--slim" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              <a href={err.link} className="usa-link">
                {err.field_label ? `${err.field_label}: ` : ''}{err.message}
              </a>
            </p>
          </div>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={`warning-${i}`} className="usa-alert usa-alert--warning usa-alert--slim" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              <a href={w.link} className="usa-link">
                {w.field_label ? `${w.field_label}: ` : ''}{w.message}
              </a>
            </p>
          </div>
        </div>
      ))}
      {informational.map((info, i) => (
        <div key={`info-${i}`} className="usa-alert usa-alert--info usa-alert--slim" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{info.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
