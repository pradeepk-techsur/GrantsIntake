/**
 * Client-side types mirroring server-side organization types.
 * These types correspond to the database schema in migration 010.
 */

export interface Organization {
  org_id: string;
  legal_name: string;
  dba_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  entity_type: string;
  ein?: string;
  uei?: string;
  sam_registered: boolean;
  sam_expiration_date?: string;
  tax_exempt_status?: string;
  congressional_district?: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone?: string;
  banking_readiness: 'ready' | 'not_ready' | 'unknown';
  indirect_cost_rate?: number;
  indirect_cost_base?: string;
  profile_completeness_pct: number;
  created_at: string;
  updated_at: string;
}

export interface OrgRole {
  role_id: string;
  org_id: string;
  user_id: string;
  roles: string[];
  invited_by?: string;
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  created_at: string;
  revoked_at?: string;
}

export type OrgDocumentType =
  | 'irs_determination_letter'
  | 'w9'
  | 'audit_report'
  | 'indirect_cost_agreement'
  | 'board_roster'
  | 'insurance_certificate'
  | 'letters_of_support'
  | 'other';

export interface OrgDocument {
  attachment_id: string;
  org_id: string;
  document_type: OrgDocumentType;
  custom_document_name?: string;
  version_number: number;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size_bytes: number;
  expiration_date?: string;
  is_active: boolean;
  uploaded_by: string;
  uploaded_at: string;
  expiration_status: 'valid' | 'expiring_soon' | 'expired';
}

export interface CredentialStatus {
  org_id: string;
  credentials: Array<{
    item_type: string;
    expiration_date?: string;
    status: 'valid' | 'expiring_soon' | 'expired';
    days_remaining: number;
  }>;
}
