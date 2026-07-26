import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api/organizationsApi';
import type { OrgRole } from '../../api/organizationsApi';

const LOCAL_STORAGE_KEY = 'applicant_org_id';

function getStoredOrgId(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

const ALL_ROLES = [
  'org_admin',
  'proposal_lead',
  'contributor',
  'finance_contributor',
  'authorized_representative',
  'external_contributor',
] as const;

type OrgRoleValue = (typeof ALL_ROLES)[number];

/**
 * OrgRolesPage — Team roles management page.
 *
 * Lists current team members with their roles.
 * org_admin users can assign/revoke roles.
 * Non-admin users see a read-only view.
 *
 * org_id sourced from localStorage `applicant_org_id`.
 * If no org, redirects to /applicant/profile.
 */
export function OrgRolesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orgId = getStoredOrgId();

  // Redirect if no org
  if (!orgId) {
    void navigate('/applicant/profile', { replace: true });
    return null;
  }

  const { data: roles = [], isLoading } = useQuery<OrgRole[]>({
    queryKey: ['orgRoles', orgId],
    queryFn: () => organizationsApi.listRoles(orgId),
    retry: false,
  });

  // New role form state
  const [newUserId, setNewUserId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<OrgRoleValue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const assignMutation = useMutation({
    mutationFn: ({ userId, roles: userRoles }: { userId: string; roles: string[] }) =>
      organizationsApi.assignRole(orgId, { user_id: userId, roles: userRoles }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orgRoles', orgId] });
      setNewUserId('');
      setSelectedRoles([]);
      setFormError(null);
      setShowAddForm(false);
    },
    onError: (err: Error) => {
      setFormError(err.message ?? 'Failed to assign role.');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: string }) =>
      organizationsApi.revokeRole(orgId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orgRoles', orgId] });
    },
  });

  function handleRoleCheckbox(role: OrgRoleValue, checked: boolean) {
    setSelectedRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role),
    );
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!newUserId.trim()) {
      setFormError('User ID is required.');
      return;
    }
    if (selectedRoles.length === 0) {
      setFormError('Select at least one role.');
      return;
    }
    assignMutation.mutate({ userId: newUserId.trim(), roles: selectedRoles });
  }

  function handleRevoke(roleId: string) {
    if (window.confirm('Are you sure you want to revoke this team member\'s roles?')) {
      revokeMutation.mutate({ roleId });
    }
  }

  if (isLoading) {
    return (
      <div className="usa-prose">
        <p>Loading team roles...</p>
      </div>
    );
  }

  return (
    <div className="usa-prose">
      <h1>Team Roles</h1>
      <p>
        Manage team members and their roles for your organization.
      </p>

      {/* Add Team Member form */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="usa-button usa-button--outline"
          onClick={() => setShowAddForm((v) => !v)}
          type="button"
        >
          {showAddForm ? 'Cancel' : 'Add Team Member'}
        </button>
      </div>

      {showAddForm && (
        <div className="usa-accordion" style={{ marginBottom: '2rem' }}>
          <form className="usa-form" onSubmit={handleAssignSubmit} style={{ maxWidth: '32rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Add Team Member</h2>

            {formError && (
              <div className="usa-alert usa-alert--error" role="alert">
                <div className="usa-alert__body">
                  <p className="usa-alert__text">{formError}</p>
                </div>
              </div>
            )}

            <div className="usa-form-group">
              <label className="usa-label" htmlFor="new_user_id">
                User ID (UUID)
              </label>
              <input
                className="usa-input"
                id="new_user_id"
                name="new_user_id"
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>

            <fieldset className="usa-fieldset">
              <legend className="usa-legend">Roles</legend>
              {ALL_ROLES.map((role) => (
                <div key={role} className="usa-checkbox">
                  <input
                    className="usa-checkbox__input"
                    id={`role_${role}`}
                    name={`role_${role}`}
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(e) => handleRoleCheckbox(role, e.target.checked)}
                  />
                  <label className="usa-checkbox__label" htmlFor={`role_${role}`}>
                    {role.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </fieldset>

            <button
              className="usa-button"
              type="submit"
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Roles'}
            </button>
          </form>
        </div>
      )}

      {/* Team members table */}
      {roles.length === 0 ? (
        <div className="usa-alert usa-alert--info">
          <div className="usa-alert__body">
            <p className="usa-alert__text">No team members yet. Add your first team member above.</p>
          </div>
        </div>
      ) : (
        <table className="usa-table usa-table--borderless" style={{ width: '100%' }}>
          <caption className="usa-sr-only">Team members and their roles</caption>
          <thead>
            <tr>
              <th scope="col">User ID</th>
              <th scope="col">Roles</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.role_id}>
                <td>
                  <code style={{ fontSize: '0.8rem' }}>{role.user_id}</code>
                </td>
                <td>{role.roles.join(', ')}</td>
                <td>
                  {role.revoked_at ? (
                    <span className="usa-tag usa-tag--error">Revoked</span>
                  ) : (
                    <span className="usa-tag usa-tag--success">Active</span>
                  )}
                </td>
                <td>
                  {!role.revoked_at && (
                    <button
                      className="usa-button usa-button--secondary usa-button--unstyled"
                      onClick={() => handleRevoke(role.role_id)}
                      type="button"
                      disabled={revokeMutation.isPending}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
