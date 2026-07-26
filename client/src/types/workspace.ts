/**
 * Client-side types mirroring server-side workspace types.
 * These types correspond to the database schema in migration 012.
 */

export interface Workspace {
  workspace_id: string;
  opportunity_id: string;
  org_id: string;
  track_id?: string;
  status: WorkspaceStatus;
  visibility: 'grantee_private' | 'shared';
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type WorkspaceStatus =
  | 'workspace_created' | 'in_progress' | 'ready_for_internal_review'
  | 'ready_to_submit' | 'submitted' | 'intake_screening' | 'returned_for_correction'
  | 'resubmitted' | 'accepted_for_review' | 'withdrawn' | 'administratively_rejected';

export interface WorkspaceSection {
  section_id: string;
  workspace_id: string;
  section_type: SectionType;
  section_name: string;
  status: SectionStatus;
  is_visible: boolean;
  is_locked: boolean;
  display_order: number;
  owner_id?: string;
  internal_due_date?: string;
  validation_status: string;
  validation_errors?: ValidationError[];
  visibility: 'grantee_private';
  created_at: string;
  updated_at: string;
}

export type SectionType =
  | 'org_profile' | 'eligibility' | 'narrative' | 'budget'
  | 'workplan' | 'performance_measures' | 'attachments'
  | 'certifications' | 'review_submit' | 'custom';

export type SectionStatus = 'not_started' | 'in_progress' | 'complete' | 'error' | 'locked';

export interface ValidationError {
  field_id?: string;
  severity: 'blocking' | 'warning' | 'info';
  message: string;
  field_label?: string;
}

export interface WorkspaceTask {
  task_id: string;
  workspace_id: string;
  section_id?: string;
  task_title: string;
  assignee_id: string;
  task_due_date?: string;
  task_notes?: string;
  status: 'open' | 'complete';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export interface WorkspaceComment {
  comment_id: string;
  workspace_id: string;
  section_id?: string;
  comment_text: string;
  visibility: 'internal';
  posted_by: string;
  posted_at: string;
}

export interface CreateWorkspaceInput {
  opportunity_id: string;
  track_id?: string;
}

export interface AssignSectionInput {
  owner_id?: string;
  internal_due_date?: string;
}

export interface CreateTaskInput {
  section_id?: string;
  task_title: string;
  assignee_id: string;
  task_due_date?: string;
  task_notes?: string;
}

export interface CreateCommentInput {
  section_id?: string;
  comment_text: string;
}

/**
 * ReadinessSummary — returned by GET /workspaces/:id/readiness (PRD-INTAKE-035 / F34).
 * Mirrors the server-side ReadinessSummary interface in readinessService.ts.
 */
export interface ReadinessSummary {
  workspace_id: string;
  overall_completion_pct: number;
  is_ready_to_submit: boolean;
  authorized_rep_assigned: boolean;
  blocking_errors: Array<{
    section_id: string;
    section_name: string;
    field_id?: string;
    field_label?: string;
    error_code: string;
    message: string;
    severity: 'blocking';
    link: string;
  }>;
  warnings: Array<{ section_id: string; field_label?: string; message: string; severity: 'warning' }>;
  informational: Array<{ message: string; severity: 'info' }>;
  attachment_status: Array<{
    requirement_id: string;
    document_type: string;
    is_required: boolean;
    is_fulfilled: boolean;
    document_name?: string;
  }>;
}
