export type DispositionStatus =
  | 'pending_screening'
  | 'accepted_for_review'
  | 'returned_for_correction'
  | 'ineligible'
  | 'late'
  | 'duplicate'
  | 'withdrawn'
  | 'administratively_rejected';

export interface QueueEntrySummary {
  entry_id: string;
  workspace_id: string;
  opportunity_id: string;
  opportunity_title: string;
  org_id: string;
  org_name: string;
  snapshot_id: string;
  status: DispositionStatus;
  routed_to: string | null;
  created_at: string;
  submission_timestamp: string;
  confirmation_number: string;
  requested_amount: number | null;
  attachment_count: number;
  eligibility_result: string | null;
  validation_summary: Record<string, unknown> | null;
  disposition_id: string | null;
}

export interface QueueListResponse {
  entries: QueueEntrySummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface DispositionRecord {
  disposition_id: string;
  entry_id: string;
  disposition: DispositionStatus;
  rationale: string | null;
  screening_criteria_results: unknown[] | null;
  applied_by: string;
  applied_at: string;
}

export interface QueueEntryDetail extends QueueEntrySummary {
  org_profile_snapshot: Record<string, unknown>;
  eligibility_snapshot: Record<string, unknown>;
  sections_snapshot: Record<string, unknown>;
  budget_snapshot: Record<string, unknown>;
  attachment_refs: unknown[];
  correction_requests: unknown[];
  disposition_history: DispositionRecord[];
}

export interface Notification {
  notification_id: string;
  notification_type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}
