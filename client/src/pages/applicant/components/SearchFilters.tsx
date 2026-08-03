interface OpportunitySearchParams {
  keyword?: string;
  funder?: string;
  program_area?: string;
  geography?: string;
  eligibility_type?: string;
  funding_min?: number;
  funding_max?: number;
  due_date_from?: string;
  due_date_to?: string;
  application_stage?: string;
  sort_by?: 'relevance' | 'deadline' | 'amount';
  page?: number;
  page_size?: number;
}

interface SearchFiltersProps {
  params: OpportunitySearchParams;
  onChange: (params: OpportunitySearchParams) => void;
}

const PROGRAM_AREAS = [
  'Arts & Culture', 'Climate', 'Community Development', 'Economic Development',
  'Education', 'Environment', 'Health', 'Housing', 'Human Services',
  'Public Safety', 'Science & Technology', 'Youth Development',
];

/**
 * Search filters — GrantFlow Design System v1.0.
 * Clean filter panel with labeled sections, gf-input/gf-select controls.
 * Active filter chips rendered above each section's field.
 * WCAG 2.1 AA: form labels associated with inputs.
 */
export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  const handleKeywordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onChange({ ...params, keyword: (formData.get('keyword') as string) || undefined, page: 1 });
  };

  const handleSelectChange = (field: keyof OpportunitySearchParams) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onChange({ ...params, [field]: e.target.value || undefined, page: 1 });
  };

  const handleInputChange = (field: keyof OpportunitySearchParams) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...params, [field]: e.target.value || undefined, page: 1 });
  };

  const handleNumberChange = (field: 'funding_min' | 'funding_max') => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({ ...params, [field]: e.target.value ? Number(e.target.value) : undefined, page: 1 });
  };

  const clearAll = () => onChange({ page: 1, page_size: params.page_size });

  const activeChips: { label: string; clear: () => void }[] = [
    ...(params.keyword ? [{ label: `Keyword: ${params.keyword}`, clear: () => onChange({ ...params, keyword: undefined, page: 1 }) }] : []),
    ...(params.funder ? [{ label: `Funder: ${params.funder}`, clear: () => onChange({ ...params, funder: undefined, page: 1 }) }] : []),
    ...(params.program_area ? [{ label: `Area: ${params.program_area}`, clear: () => onChange({ ...params, program_area: undefined, page: 1 }) }] : []),
    ...(params.geography ? [{ label: `Location: ${params.geography}`, clear: () => onChange({ ...params, geography: undefined, page: 1 }) }] : []),
    ...(params.eligibility_type ? [{ label: `Eligibility: ${params.eligibility_type}`, clear: () => onChange({ ...params, eligibility_type: undefined, page: 1 }) }] : []),
    ...(params.funding_min !== undefined ? [{ label: `Min: $${params.funding_min.toLocaleString()}`, clear: () => onChange({ ...params, funding_min: undefined, page: 1 }) }] : []),
    ...(params.funding_max !== undefined ? [{ label: `Max: $${params.funding_max.toLocaleString()}`, clear: () => onChange({ ...params, funding_max: undefined, page: 1 }) }] : []),
    ...(params.due_date_from ? [{ label: `From: ${params.due_date_from}`, clear: () => onChange({ ...params, due_date_from: undefined, page: 1 }) }] : []),
    ...(params.due_date_to ? [{ label: `Due by: ${params.due_date_to}`, clear: () => onChange({ ...params, due_date_to: undefined, page: 1 }) }] : []),
    ...(params.application_stage ? [{ label: `Stage: ${params.application_stage.replace('_', ' ')}`, clear: () => onChange({ ...params, application_stage: undefined, page: 1 }) }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p className="gf-filter-panel__title" style={{ margin: 0 }}>Filters</p>
        {activeChips.length > 0 && (
          <button
            type="button"
            className="gf-btn gf-btn--ghost gf-btn--sm"
            onClick={clearAll}
            style={{ fontSize: '12px' }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active chips */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {activeChips.map((chip) => (
            <span key={chip.label} className="gf-chip">
              {chip.label}
              <button
                type="button"
                className="gf-chip__remove"
                onClick={chip.clear}
                aria-label={`Remove filter: ${chip.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Keyword search */}
      <div className="gf-filter-section">
        <form onSubmit={handleKeywordSubmit} role="search">
          <span className="gf-filter-section__label" id="keyword-label">Keyword</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              id="keyword-search"
              name="keyword"
              className="gf-input"
              type="search"
              defaultValue={params.keyword || ''}
              placeholder="Search opportunities…"
              aria-labelledby="keyword-label"
              style={{ fontSize: '13px', padding: '6px 10px' }}
            />
            <button type="submit" className="gf-btn gf-btn--primary gf-btn--sm">
              Go
            </button>
          </div>
        </form>
      </div>

      {/* Sort */}
      <div className="gf-filter-section">
        <label className="gf-filter-section__label" htmlFor="sort-select">Sort by</label>
        <select
          id="sort-select"
          className="gf-select"
          value={params.sort_by || ''}
          onChange={handleSelectChange('sort_by')}
          style={{ fontSize: '13px', padding: '6px 32px 6px 10px' }}
        >
          <option value="">Most recent</option>
          <option value="relevance">Relevance</option>
          <option value="deadline">Deadline (soonest)</option>
          <option value="amount">Funding (highest)</option>
        </select>
      </div>

      {/* Program Area */}
      <div className="gf-filter-section">
        <label className="gf-filter-section__label" htmlFor="program-area-select">Program area</label>
        <select
          id="program-area-select"
          className="gf-select"
          value={params.program_area || ''}
          onChange={handleSelectChange('program_area')}
          style={{ fontSize: '13px', padding: '6px 32px 6px 10px' }}
        >
          <option value="">All areas</option>
          {PROGRAM_AREAS.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Geography */}
      <div className="gf-filter-section">
        <label className="gf-filter-section__label" htmlFor="geography-input">Location</label>
        <input
          id="geography-input"
          className="gf-input"
          type="text"
          value={params.geography || ''}
          onChange={handleInputChange('geography')}
          placeholder="State, city, or region"
          style={{ fontSize: '13px', padding: '6px 10px' }}
        />
      </div>

      {/* Eligibility */}
      <div className="gf-filter-section">
        <label className="gf-filter-section__label" htmlFor="eligibility-input">Eligibility type</label>
        <input
          id="eligibility-input"
          className="gf-input"
          type="text"
          value={params.eligibility_type || ''}
          onChange={handleInputChange('eligibility_type')}
          placeholder="e.g. nonprofit, tribal"
          style={{ fontSize: '13px', padding: '6px 10px' }}
        />
      </div>

      {/* Funding range */}
      <div className="gf-filter-section">
        <span className="gf-filter-section__label">Funding amount</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label className="gf-hint" htmlFor="funding-min" style={{ fontSize: '11px', marginBottom: '4px' }}>Min ($)</label>
            <input
              id="funding-min"
              className="gf-input"
              type="number"
              min={0}
              value={params.funding_min ?? ''}
              onChange={handleNumberChange('funding_min')}
              placeholder="0"
              style={{ fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="gf-hint" htmlFor="funding-max" style={{ fontSize: '11px', marginBottom: '4px' }}>Max ($)</label>
            <input
              id="funding-max"
              className="gf-input"
              type="number"
              min={0}
              value={params.funding_max ?? ''}
              onChange={handleNumberChange('funding_max')}
              placeholder="Any"
              style={{ fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
        </div>
      </div>

      {/* Due date */}
      <div className="gf-filter-section">
        <span className="gf-filter-section__label">Deadline</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label className="gf-hint" htmlFor="due-date-from" style={{ fontSize: '11px', marginBottom: '4px' }}>From</label>
            <input
              id="due-date-from"
              className="gf-input"
              type="date"
              value={params.due_date_from || ''}
              onChange={handleInputChange('due_date_from')}
              style={{ fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
          <div>
            <label className="gf-hint" htmlFor="due-date-to" style={{ fontSize: '11px', marginBottom: '4px' }}>To</label>
            <input
              id="due-date-to"
              className="gf-input"
              type="date"
              value={params.due_date_to || ''}
              onChange={handleInputChange('due_date_to')}
              style={{ fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
        </div>
      </div>

      {/* Application stage */}
      <div className="gf-filter-section">
        <label className="gf-filter-section__label" htmlFor="stage-select">Application stage</label>
        <select
          id="stage-select"
          className="gf-select"
          value={params.application_stage || ''}
          onChange={handleSelectChange('application_stage')}
          style={{ fontSize: '13px', padding: '6px 32px 6px 10px' }}
        >
          <option value="">All stages</option>
          <option value="pre_application">Pre-Application</option>
          <option value="loi">Letter of Intent (LOI)</option>
          <option value="full_application">Full Application</option>
        </select>
      </div>
    </div>
  );
}
