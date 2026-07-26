import apiClient from './client';
import type { Organization, OrgRole, OrgDocument, CredentialStatus } from '../types/organization';

// Re-export types for convenience
export type { Organization, OrgRole, OrgDocument, CredentialStatus };

export interface CreateOrgInput {
  legal_name: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  entity_type: string;
  primary_contact_name: string;
  primary_contact_email: string;
  banking_readiness?: 'ready' | 'not_ready' | 'unknown';
  dba_name?: string;
  address_line2?: string;
  country?: string;
  ein?: string;
  uei?: string;
  sam_registered?: boolean;
  sam_expiration_date?: string;
  tax_exempt_status?: string;
  congressional_district?: string;
  primary_contact_phone?: string;
  indirect_cost_rate?: number;
  indirect_cost_base?: string;
}

export interface AssignRoleInput {
  user_id: string;
  roles: string[];
}

/**
 * API client functions for organization CRUD, credential-status, roles, and documents.
 * Uses the shared apiClient (axios instance with auth interceptors).
 *
 * org_id persistence: After create/get, caller stores org_id in localStorage key
 * `applicant_org_id` for cross-page access. org_id is a non-sensitive UUID;
 * org data itself requires a valid Bearer token to access (T-03-10 accepted risk).
 */
export const organizationsApi = {
  async createOrg(input: CreateOrgInput): Promise<Organization> {
    const { data } = await apiClient.post('/organizations', input);
    return data;
  },

  async getOrg(orgId: string): Promise<Organization> {
    const { data } = await apiClient.get(`/organizations/${orgId}`);
    return data;
  },

  async updateOrg(orgId: string, input: Partial<CreateOrgInput>): Promise<Organization> {
    const { data } = await apiClient.put(`/organizations/${orgId}`, input);
    return data;
  },

  async getCredentialStatus(orgId: string): Promise<CredentialStatus> {
    const { data } = await apiClient.get(`/organizations/${orgId}/credential-status`);
    return data;
  },

  async listRoles(orgId: string): Promise<OrgRole[]> {
    const { data } = await apiClient.get(`/organizations/${orgId}/roles`);
    return data;
  },

  async assignRole(orgId: string, input: AssignRoleInput): Promise<OrgRole> {
    const { data } = await apiClient.post(`/organizations/${orgId}/roles`, input);
    return data;
  },

  async revokeRole(orgId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/roles/${roleId}`);
  },

  async listDocuments(orgId: string): Promise<OrgDocument[]> {
    const { data } = await apiClient.get(`/organizations/${orgId}/documents`);
    return data;
  },

  async uploadDocument(orgId: string, formData: FormData): Promise<OrgDocument> {
    const { data } = await apiClient.post(`/organizations/${orgId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async listDocumentVersions(orgId: string, docId: string): Promise<OrgDocument[]> {
    const { data } = await apiClient.get(`/organizations/${orgId}/documents/${docId}/versions`);
    return data;
  },
};
