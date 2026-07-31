export interface QAItem {
  qa_id: string;
  opportunity_id: string;
  submitter_org_id: string;
  submitter_user_id: string;
  question_text: string;
  answer_text: string | null;
  status: 'submitted' | 'under_review' | 'answered' | 'archived';
  submitted_at: string;
  published_by: string | null;
  published_at: string | null;
}
