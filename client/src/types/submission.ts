export interface SubmissionConfirmation {
  snapshot_id: string;
  confirmation_number: string; // GI-{YEAR}-{8-digit-seq}
  submitted_at: string; // UTC ISO 8601
  opportunity_title: string;
  applicant_org_name: string;
  receipt_download_url: string;
}

export interface SubmissionBlockedError {
  error_code: 'SUBMISSION_BLOCKED';
  message: string;
  blocking_errors: Array<{
    section_id: string;
    field_label?: string;
    error_code: string;
    severity: 'blocking';
    message: string;
    link: string;
  }>;
}

export interface ReceiptData {
  snapshot_id: string;
  confirmation_number: string;
  submitted_at: string;
  opportunity_title: string;
  applicant_org_name: string;
  human_readable_pdf_path: string | null;
  machine_readable_json_path: string | null;
}
