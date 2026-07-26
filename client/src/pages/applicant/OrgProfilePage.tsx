import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../../api/organizationsApi';
import type { CreateOrgInput, Organization, CredentialStatus } from '../../api/organizationsApi';

const ENTITY_TYPES = [
  { value: 'nonprofit_501c3', label: '501(c)(3) Nonprofit' },
  { value: 'nonprofit_501c4', label: '501(c)(4) Nonprofit' },
  { value: 'government_federal', label: 'Federal Government' },
  { value: 'government_state', label: 'State Government' },
  { value: 'government_local', label: 'Local Government' },
  { value: 'institution_of_higher_education', label: 'Institution of Higher Education' },
  { value: 'for_profit', label: 'For-Profit Organization' },
  { value: 'tribal', label: 'Tribal Organization' },
  { value: 'individual', label: 'Individual' },
  { value: 'other', label: 'Other' },
];

const TAX_EXEMPT_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: '501c3', label: '501(c)(3)' },
  { value: '501c4', label: '501(c)(4)' },
  { value: '501c6', label: '501(c)(6)' },
  { value: 'government', label: 'Government Entity' },
  { value: 'none', label: 'Not Tax Exempt' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','PR','VI','GU','AS','MP',
];

const LOCAL_STORAGE_KEY = 'applicant_org_id';

function getStoredOrgId(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeOrgId(orgId: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, orgId);
  } catch {
    // ignore storage errors
  }
}

function clearStoredOrgId() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

/**
 * OrgProfilePage — Organization profile create/edit form.
 *
 * On mount:
 * 1. Reads org_id from localStorage key `applicant_org_id`
 * 2. If present, fetches GET /organizations/:org_id — on 403/404 clears localStorage
 * 3. Shows completeness percentage as progress bar
 * 4. Shows credential warning banners (expired/expiring_soon)
 * 5. Create (POST) or edit (PUT) org on save
 *
 * Links to /applicant/profile/roles and /applicant/profile/documents.
 */
export function OrgProfilePage() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState<string | null>(getStoredOrgId);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ueiError, setUeiError] = useState<string | null>(null);

  // Fetch existing org if we have an org_id
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery<Organization, Error>({
    queryKey: ['org', orgId],
    queryFn: () => organizationsApi.getOrg(orgId!),
    enabled: !!orgId,
    retry: false,
  });

  // Clear stored org_id on 403/404
  useEffect(() => {
    if (orgError) {
      const status = (orgError as unknown as { response?: { status: number } }).response?.status;
      if (status === 403 || status === 404) {
        clearStoredOrgId();
        setOrgId(null);
      }
    }
  }, [orgError]);

  // Fetch credential status if org exists
  const { data: credentialStatus } = useQuery<CredentialStatus>({
    queryKey: ['credentialStatus', orgId],
    queryFn: () => organizationsApi.getCredentialStatus(orgId!),
    enabled: !!orgId && !!org,
    retry: false,
  });

  // Form state — initialized from org data or empty
  const [form, setForm] = useState<Partial<CreateOrgInput>>({
    legal_name: '',
    dba_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    entity_type: '',
    ein: '',
    uei: '',
    sam_registered: false,
    sam_expiration_date: '',
    tax_exempt_status: '',
    congressional_district: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    banking_readiness: 'unknown',
    indirect_cost_rate: undefined,
    indirect_cost_base: '',
  });

  // Populate form when org data loads
  useEffect(() => {
    if (org) {
      setForm({
        legal_name: org.legal_name ?? '',
        dba_name: org.dba_name ?? '',
        address_line1: org.address_line1 ?? '',
        address_line2: org.address_line2 ?? '',
        city: org.city ?? '',
        state: org.state ?? '',
        zip: org.zip ?? '',
        country: org.country ?? 'US',
        entity_type: org.entity_type ?? '',
        ein: org.ein ?? '',
        uei: org.uei ?? '',
        sam_registered: org.sam_registered ?? false,
        // API returns ISO datetime (2026-07-24T00:00:00.000Z); date input needs YYYY-MM-DD
        sam_expiration_date: org.sam_expiration_date ? org.sam_expiration_date.substring(0, 10) : '',
        tax_exempt_status: org.tax_exempt_status ?? '',
        congressional_district: org.congressional_district ?? '',
        primary_contact_name: org.primary_contact_name ?? '',
        primary_contact_email: org.primary_contact_email ?? '',
        primary_contact_phone: org.primary_contact_phone ?? '',
        banking_readiness: org.banking_readiness ?? 'unknown',
        indirect_cost_rate: org.indirect_cost_rate ?? undefined,
        indirect_cost_base: org.indirect_cost_base ?? '',
      });
    }
  }, [org]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateOrgInput) => organizationsApi.createOrg(input),
    onSuccess: (newOrg) => {
      storeOrgId(newOrg.org_id);
      setOrgId(newOrg.org_id);
      setSuccessMessage('Organization profile created successfully.');
      void queryClient.invalidateQueries({ queryKey: ['org', newOrg.org_id] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: Partial<CreateOrgInput>) =>
      organizationsApi.updateOrg(orgId!, input),
    onSuccess: (updatedOrg) => {
      setSuccessMessage('Organization profile saved successfully.');
      void queryClient.invalidateQueries({ queryKey: ['org', updatedOrg.org_id] });
    },
  });

  function handleFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function validateForm(): boolean {
    setUeiError(null);
    if (form.uei && !/^[A-Z0-9]{12}$/.test(form.uei.toUpperCase())) {
      setUeiError('UEI must be 12 alphanumeric characters');
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    // Strip empty strings from optional fields so they are omitted (not sent as "")
    // which would fail server-side Zod validation for regex/enum optional fields.
    const stripped = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '' && v !== undefined)
    );
    const input = {
      ...stripped,
      uei: form.uei ? form.uei.toUpperCase() : undefined,
    } as CreateOrgInput;

    if (orgId) {
      updateMutation.mutate(input);
    } else {
      createMutation.mutate(input);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const submitError = createMutation.error ?? updateMutation.error;

  if (orgLoading) {
    return (
      <div className="usa-prose">
        <p>Loading your organization profile...</p>
      </div>
    );
  }

  return (
    <div className="usa-prose">
      <h1>{org ? 'Organization Profile' : 'Create Organization Profile'}</h1>

      {/* Completeness percentage */}
      {org && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 'bold' }}>
            Profile {org.profile_completeness_pct}% complete
          </p>
          <div
            role="progressbar"
            aria-valuenow={org.profile_completeness_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
            style={{
              background: '#dfe1e2',
              borderRadius: '4px',
              height: '12px',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#005ea2',
                height: '100%',
                width: `${org.profile_completeness_pct}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Credential warning banners */}
      <div data-testid="credential-status-section">
        {credentialStatus?.credentials.map((cred, idx) => {
          if (cred.status === 'expired') {
            return (
              <div
                key={idx}
                className="usa-alert usa-alert--error"
                role="alert"
                style={{ marginBottom: '1rem' }}
              >
                <div className="usa-alert__body">
                  <p className="usa-alert__text">
                    Your {cred.item_type} is expired. Please update immediately.
                  </p>
                </div>
              </div>
            );
          }
          if (cred.status === 'expiring_soon') {
            return (
              <div
                key={idx}
                className="usa-alert usa-alert--warning"
                role="alert"
                style={{ marginBottom: '1rem' }}
              >
                <div className="usa-alert__body">
                  <p className="usa-alert__text">
                    Your {cred.item_type} expires in {cred.days_remaining} days. Please renew soon.
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="usa-alert usa-alert--success" role="status" style={{ marginBottom: '1rem' }}>
          <div className="usa-alert__body">
            <p className="usa-alert__text">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="usa-alert usa-alert--error" role="alert" style={{ marginBottom: '1rem' }}>
          <div className="usa-alert__body">
            <p className="usa-alert__text">
              {(submitError as Error).message ?? 'An error occurred. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Profile navigation links */}
      {org && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <Link to="/applicant/profile/roles" className="usa-button usa-button--unstyled">
            Team Roles
          </Link>
          <Link to="/applicant/profile/documents" className="usa-button usa-button--unstyled">
            Documents
          </Link>
        </div>
      )}

      {/* Organization form */}
      <form className="usa-form" onSubmit={handleSubmit} style={{ maxWidth: '42rem' }}>
        {/* Legal Name */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="legal_name">
            Legal Name <span className="usa-error-message" aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="legal_name"
            name="legal_name"
            type="text"
            required
            value={form.legal_name ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* DBA Name */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="dba_name">
            DBA Name (Doing Business As)
          </label>
          <input
            className="usa-input"
            id="dba_name"
            name="dba_name"
            type="text"
            value={form.dba_name ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Address Line 1 */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="address_line1">
            Address Line 1 <span aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="address_line1"
            name="address_line1"
            type="text"
            required
            value={form.address_line1 ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Address Line 2 */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="address_line2">
            Address Line 2
          </label>
          <input
            className="usa-input"
            id="address_line2"
            name="address_line2"
            type="text"
            value={form.address_line2 ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* City */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="city">
            City <span aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="city"
            name="city"
            type="text"
            required
            value={form.city ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* State */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="state">
            State <span aria-hidden="true"> *</span>
          </label>
          <select
            className="usa-select"
            id="state"
            name="state"
            required
            value={form.state ?? ''}
            onChange={handleFieldChange}
          >
            <option value="">— Select state —</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* ZIP */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="zip">
            ZIP Code <span aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="zip"
            name="zip"
            type="text"
            required
            maxLength={10}
            value={form.zip ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Country */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="country">
            Country
          </label>
          <input
            className="usa-input"
            id="country"
            name="country"
            type="text"
            value={form.country ?? 'US'}
            onChange={handleFieldChange}
          />
        </div>

        {/* Entity Type */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="entity_type">
            Entity Type <span aria-hidden="true"> *</span>
          </label>
          <select
            className="usa-select"
            id="entity_type"
            name="entity_type"
            required
            value={form.entity_type ?? ''}
            onChange={handleFieldChange}
          >
            <option value="">— Select entity type —</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        {/* EIN */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="ein">
            EIN (Employer Identification Number)
          </label>
          <input
            className="usa-input"
            id="ein"
            name="ein"
            type="text"
            pattern="^\d{9}$"
            maxLength={9}
            placeholder="9 digits, no dashes"
            value={form.ein ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* UEI */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="uei">
            UEI (Unique Entity Identifier)
          </label>
          {ueiError && (
            <span className="usa-error-message" id="uei-error" role="alert">
              {ueiError}
            </span>
          )}
          <input
            className={`usa-input${ueiError ? ' usa-input--error' : ''}`}
            id="uei"
            name="uei"
            type="text"
            maxLength={12}
            placeholder="12 alphanumeric characters"
            aria-describedby={ueiError ? 'uei-error' : undefined}
            value={form.uei ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* SAM Registered */}
        <div className="usa-form-group">
          <div className="usa-checkbox">
            <input
              className="usa-checkbox__input"
              id="sam_registered"
              name="sam_registered"
              type="checkbox"
              checked={form.sam_registered ?? false}
              onChange={handleFieldChange}
            />
            <label className="usa-checkbox__label" htmlFor="sam_registered">
              SAM.gov Registered
            </label>
          </div>
        </div>

        {/* SAM Expiration Date */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="sam_expiration_date">
            SAM Expiration Date
          </label>
          <input
            className="usa-input"
            id="sam_expiration_date"
            name="sam_expiration_date"
            type="date"
            value={form.sam_expiration_date ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Tax Exempt Status */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="tax_exempt_status">
            Tax Exempt Status
          </label>
          <select
            className="usa-select"
            id="tax_exempt_status"
            name="tax_exempt_status"
            value={form.tax_exempt_status ?? ''}
            onChange={handleFieldChange}
          >
            {TAX_EXEMPT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Congressional District */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="congressional_district">
            Congressional District
          </label>
          <input
            className="usa-input"
            id="congressional_district"
            name="congressional_district"
            type="text"
            value={form.congressional_district ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Primary Contact Name */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="primary_contact_name">
            Primary Contact Name <span aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="primary_contact_name"
            name="primary_contact_name"
            type="text"
            required
            value={form.primary_contact_name ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Primary Contact Email */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="primary_contact_email">
            Primary Contact Email <span aria-hidden="true"> *</span>
          </label>
          <input
            className="usa-input"
            id="primary_contact_email"
            name="primary_contact_email"
            type="email"
            required
            value={form.primary_contact_email ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Primary Contact Phone */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="primary_contact_phone">
            Primary Contact Phone
          </label>
          <input
            className="usa-input"
            id="primary_contact_phone"
            name="primary_contact_phone"
            type="tel"
            value={form.primary_contact_phone ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Banking Readiness */}
        <div className="usa-form-group">
          <fieldset className="usa-fieldset">
            <legend className="usa-legend">Banking Readiness</legend>
            {(['ready', 'not_ready', 'unknown'] as const).map((val) => (
              <div key={val} className="usa-radio">
                <input
                  className="usa-radio__input"
                  id={`banking_readiness_${val}`}
                  name="banking_readiness"
                  type="radio"
                  value={val}
                  checked={form.banking_readiness === val}
                  onChange={handleFieldChange}
                />
                <label className="usa-radio__label" htmlFor={`banking_readiness_${val}`}>
                  {val === 'ready'
                    ? 'Ready'
                    : val === 'not_ready'
                      ? 'Not Ready'
                      : 'Unknown'}
                </label>
              </div>
            ))}
          </fieldset>
        </div>

        {/* Indirect Cost Rate */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="indirect_cost_rate">
            Indirect Cost Rate (%)
          </label>
          <input
            className="usa-input"
            id="indirect_cost_rate"
            name="indirect_cost_rate"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.indirect_cost_rate ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Indirect Cost Base */}
        <div className="usa-form-group">
          <label className="usa-label" htmlFor="indirect_cost_base">
            Indirect Cost Base
          </label>
          <input
            className="usa-input"
            id="indirect_cost_base"
            name="indirect_cost_base"
            type="text"
            value={form.indirect_cost_base ?? ''}
            onChange={handleFieldChange}
          />
        </div>

        {/* Submit button */}
        <button
          className="usa-button"
          type="submit"
          data-testid="save-org-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : org ? 'Save Profile' : 'Create Profile'}
        </button>
      </form>

      {/* Team links — shown below form if org exists */}
      {org && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Profile Sections</h2>
          <ul>
            <li>
              <Link to="/applicant/profile/roles">Team Roles — manage team members and permissions</Link>
            </li>
            <li>
              <Link to="/applicant/profile/documents">Documents — upload and manage org documents</Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
