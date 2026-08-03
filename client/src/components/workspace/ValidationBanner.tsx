import type { ValidationResult } from '../../types/validation';

interface Props {
  validation: ValidationResult | null;
  sectionId?: string;
}

/**
 * ValidationBanner — GrantFlow Design System v1.0.
 * Left-border colored alert panels for inline validation feedback.
 * Matches Figma "Alerts and status" component:
 * - error (red left border) for blocking errors
 * - warning (amber left border) for warnings
 * - info (teal left border) for informational items
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
        <div
          key={`blocking-${i}`}
          className="gf-alert gf-alert--error"
          role="alert"
        >
          <div>
            <p className="gf-alert__title">Submission blocked</p>
            <p className="gf-alert__text">
              <a
                href={err.link}
                style={{ color: 'inherit', fontWeight: 500 }}
              >
                {err.field_label ? `${err.field_label}: ` : ''}{err.message}
              </a>
            </p>
          </div>
        </div>
      ))}
      {warnings.map((w, i) => (
        <div
          key={`warning-${i}`}
          className="gf-alert gf-alert--warning"
          role="alert"
        >
          <div>
            <p className="gf-alert__title">Budget needs attention</p>
            <p className="gf-alert__text">
              <a
                href={w.link}
                style={{ color: 'inherit', fontWeight: 500 }}
              >
                {w.field_label ? `${w.field_label}: ` : ''}{w.message}
              </a>
            </p>
          </div>
        </div>
      ))}
      {informational.map((info, i) => (
        <div
          key={`info-${i}`}
          className="gf-alert gf-alert--info"
          role="status"
        >
          <div>
            <p className="gf-alert__title">Program update</p>
            <p className="gf-alert__text">{info.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
