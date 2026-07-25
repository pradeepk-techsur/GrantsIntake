export type GrantorRole =
  | 'grantor_admin'
  | 'program_officer'
  | 'intake_administrator'
  | 'compliance_analyst'
  | 'reviewer';

export type ApplicantRole =
  | 'org_admin'
  | 'proposal_lead'
  | 'finance_contributor'
  | 'external_contributor'
  | 'authorized_representative';

export const GRANTOR_ROLES: GrantorRole[] = [
  'grantor_admin',
  'program_officer',
  'intake_administrator',
  'compliance_analyst',
  'reviewer',
];

export const APPLICANT_ROLES: ApplicantRole[] = [
  'org_admin',
  'proposal_lead',
  'finance_contributor',
  'external_contributor',
  'authorized_representative',
];
