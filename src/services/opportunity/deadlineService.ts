export interface DeadlineConfig {
  application_open_date?: Date | null;
  application_close_date?: Date | null;
  pre_application_deadline?: Date | null;
  loi_deadline?: Date | null;
  loi_required: boolean;
  rolling_review_enabled: boolean;
  rolling_review_cadence_days?: number | null;
}

export interface DeadlineValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

/**
 * DeadlineService validates deadline configuration for opportunities.
 * All 5 rules from F4 (PRD-INTAKE-005) are enforced.
 */
export class DeadlineService {
  /**
   * Validate deadline configuration.
   * Returns { valid, errors } where errors is an array of field-level validation errors.
   *
   * Rules:
   * 1. application_open_date < application_close_date (if both provided)
   * 2. pre_application_deadline < application_open_date (if pre_application_deadline provided)
   * 3. loi_deadline < application_close_date (if loi_deadline provided)
   * 4. If loi_required=true, loi_deadline must be set
   * 5. If rolling_review_enabled=true, rolling_review_cadence_days must be > 0
   */
  validate(config: DeadlineConfig): DeadlineValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    const openDate = config.application_open_date
      ? new Date(config.application_open_date)
      : null;
    const closeDate = config.application_close_date
      ? new Date(config.application_close_date)
      : null;
    const preAppDeadline = config.pre_application_deadline
      ? new Date(config.pre_application_deadline)
      : null;
    const loiDeadline = config.loi_deadline ? new Date(config.loi_deadline) : null;

    // Rule 1: open_date < close_date
    if (openDate !== null && closeDate !== null) {
      if (openDate >= closeDate) {
        errors.push({
          field: 'application_close_date',
          message: 'Close date must be after open date',
        });
      }
    }

    // Rule 2: pre_application_deadline < application_open_date
    if (preAppDeadline !== null) {
      if (openDate === null || preAppDeadline >= openDate) {
        errors.push({
          field: 'pre_application_deadline',
          message: 'Pre-application deadline must be before application open date',
        });
      }
    }

    // Rule 3: loi_deadline < application_close_date
    if (loiDeadline !== null) {
      if (closeDate === null || loiDeadline >= closeDate) {
        errors.push({
          field: 'loi_deadline',
          message: 'LOI deadline must be before application close date',
        });
      }
    }

    // Rule 4: If loi_required=true, loi_deadline must be set
    if (config.loi_required && (loiDeadline === null)) {
      errors.push({
        field: 'loi_deadline',
        message: 'LOI deadline is required when LOI required is enabled',
      });
    }

    // Rule 5: If rolling_review_enabled=true, rolling_review_cadence_days must be > 0
    if (config.rolling_review_enabled) {
      if (
        config.rolling_review_cadence_days === null ||
        config.rolling_review_cadence_days === undefined ||
        config.rolling_review_cadence_days <= 0
      ) {
        errors.push({
          field: 'rolling_review_cadence_days',
          message: 'Rolling review cadence must be a positive number of days',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const deadlineService = new DeadlineService();
