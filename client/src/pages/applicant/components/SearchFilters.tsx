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
  'Arts & Culture',
  'Climate',
  'Community Development',
  'Economic Development',
  'Education',
  'Environment',
  'Health',
  'Housing',
  'Human Services',
  'Public Safety',
  'Science & Technology',
  'Youth Development',
];

/**
 * USWDS filter sidebar for opportunity search.
 * Uses accordion sections for collapsible filter groups.
 * Active filter chips appear above results when filters are applied.
 * WCAG 2.1 AA: form labels associated with inputs.
 */
export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  const handleKeywordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onChange({ ...params, keyword: formData.get('keyword') as string || undefined, page: 1 });
  };

  const handleSelectChange = (field: keyof OpportunitySearchParams) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value || undefined;
    onChange({ ...params, [field]: value, page: 1 });
  };

  const handleInputChange = (field: keyof OpportunitySearchParams) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value || undefined;
    onChange({ ...params, [field]: value, page: 1 });
  };

  const handleNumberChange = (field: 'funding_min' | 'funding_max') => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value ? Number(e.target.value) : undefined;
    onChange({ ...params, [field]: value, page: 1 });
  };

  const clearAll = () => {
    onChange({ page: 1, page_size: params.page_size });
  };

  const hasActiveFilters =
    params.keyword ||
    params.funder ||
    params.program_area ||
    params.geography ||
    params.eligibility_type ||
    params.funding_min !== undefined ||
    params.funding_max !== undefined ||
    params.due_date_from ||
    params.due_date_to ||
    params.application_stage;

  return (
    <div>
      {/* Active filter chips */}
      {hasActiveFilters && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {params.keyword && (
              <ActiveFilterChip
                label={`Keyword: ${params.keyword}`}
                onRemove={() => onChange({ ...params, keyword: undefined, page: 1 })}
              />
            )}
            {params.funder && (
              <ActiveFilterChip
                label={`Funder: ${params.funder}`}
                onRemove={() => onChange({ ...params, funder: undefined, page: 1 })}
              />
            )}
            {params.program_area && (
              <ActiveFilterChip
                label={`Program Area: ${params.program_area}`}
                onRemove={() => onChange({ ...params, program_area: undefined, page: 1 })}
              />
            )}
            {params.geography && (
              <ActiveFilterChip
                label={`Geography: ${params.geography}`}
                onRemove={() => onChange({ ...params, geography: undefined, page: 1 })}
              />
            )}
            {params.eligibility_type && (
              <ActiveFilterChip
                label={`Eligibility: ${params.eligibility_type}`}
                onRemove={() => onChange({ ...params, eligibility_type: undefined, page: 1 })}
              />
            )}
            {params.funding_min !== undefined && (
              <ActiveFilterChip
                label={`Min: $${params.funding_min.toLocaleString()}`}
                onRemove={() => onChange({ ...params, funding_min: undefined, page: 1 })}
              />
            )}
            {params.funding_max !== undefined && (
              <ActiveFilterChip
                label={`Max: $${params.funding_max.toLocaleString()}`}
                onRemove={() => onChange({ ...params, funding_max: undefined, page: 1 })}
              />
            )}
            {params.due_date_from && (
              <ActiveFilterChip
                label={`From: ${params.due_date_from}`}
                onRemove={() => onChange({ ...params, due_date_from: undefined, page: 1 })}
              />
            )}
            {params.due_date_to && (
              <ActiveFilterChip
                label={`Due by: ${params.due_date_to}`}
                onRemove={() => onChange({ ...params, due_date_to: undefined, page: 1 })}
              />
            )}
            {params.application_stage && (
              <ActiveFilterChip
                label={`Stage: ${params.application_stage.replace('_', ' ')}`}
                onRemove={() => onChange({ ...params, application_stage: undefined, page: 1 })}
              />
            )}
            <button
              type="button"
              className="usa-button usa-button--unstyled"
              onClick={clearAll}
              style={{ fontSize: '0.875rem', textDecoration: 'underline' }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Keyword search */}
      <form onSubmit={handleKeywordSubmit} className="usa-search usa-search--big" role="search">
        <label className="usa-label" htmlFor="keyword-search">
          Search by keyword
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="keyword-search"
            name="keyword"
            className="usa-input"
            type="search"
            defaultValue={params.keyword || ''}
            placeholder="Search opportunities..."
            aria-label="Search opportunities by keyword"
          />
          <button type="submit" className="usa-button">
            Search
          </button>
        </div>
      </form>

      {/* Filter accordion */}
      <div className="usa-accordion" style={{ marginTop: '1.5rem' }}>
        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="filter-program-area"
          >
            Program Area
          </button>
        </h4>
        <div id="filter-program-area" className="usa-accordion__content">
          <label className="usa-label" htmlFor="program-area-select">
            Program Area
          </label>
          <select
            id="program-area-select"
            className="usa-select"
            value={params.program_area || ''}
            onChange={handleSelectChange('program_area')}
          >
            <option value="">All Program Areas</option>
            {PROGRAM_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-geography"
          >
            Geography
          </button>
        </h4>
        <div id="filter-geography" className="usa-accordion__content" hidden>
          <label className="usa-label" htmlFor="geography-input">
            Location (state, city, or region)
          </label>
          <input
            id="geography-input"
            className="usa-input"
            type="text"
            value={params.geography || ''}
            onChange={handleInputChange('geography')}
            placeholder="e.g., California, Northeast"
          />
        </div>

        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-eligibility"
          >
            Eligibility Type
          </button>
        </h4>
        <div id="filter-eligibility" className="usa-accordion__content" hidden>
          <label className="usa-label" htmlFor="eligibility-input">
            Eligibility Type
          </label>
          <input
            id="eligibility-input"
            className="usa-input"
            type="text"
            value={params.eligibility_type || ''}
            onChange={handleInputChange('eligibility_type')}
            placeholder="e.g., nonprofit, tribal"
          />
        </div>

        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-funding"
          >
            Funding Amount
          </button>
        </h4>
        <div id="filter-funding" className="usa-accordion__content" hidden>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <label className="usa-label" htmlFor="funding-min">
                Min ($)
              </label>
              <input
                id="funding-min"
                className="usa-input"
                type="number"
                min={0}
                value={params.funding_min ?? ''}
                onChange={handleNumberChange('funding_min')}
                placeholder="0"
              />
            </div>
            <div>
              <label className="usa-label" htmlFor="funding-max">
                Max ($)
              </label>
              <input
                id="funding-max"
                className="usa-input"
                type="number"
                min={0}
                value={params.funding_max ?? ''}
                onChange={handleNumberChange('funding_max')}
                placeholder="No max"
              />
            </div>
          </div>
        </div>

        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-dates"
          >
            Due Date
          </button>
        </h4>
        <div id="filter-dates" className="usa-accordion__content" hidden>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="usa-label" htmlFor="due-date-from">
                Deadline From
              </label>
              <input
                id="due-date-from"
                className="usa-input"
                type="date"
                value={params.due_date_from || ''}
                onChange={handleInputChange('due_date_from')}
              />
            </div>
            <div>
              <label className="usa-label" htmlFor="due-date-to">
                Deadline To
              </label>
              <input
                id="due-date-to"
                className="usa-input"
                type="date"
                value={params.due_date_to || ''}
                onChange={handleInputChange('due_date_to')}
              />
            </div>
          </div>
        </div>

        <h4 className="usa-accordion__heading">
          <button
            type="button"
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="filter-stage"
          >
            Application Stage
          </button>
        </h4>
        <div id="filter-stage" className="usa-accordion__content" hidden>
          <label className="usa-label" htmlFor="stage-select">
            Application Stage
          </label>
          <select
            id="stage-select"
            className="usa-select"
            value={params.application_stage || ''}
            onChange={handleSelectChange('application_stage')}
          >
            <option value="">All Stages</option>
            <option value="pre_application">Pre-Application</option>
            <option value="loi">Letter of Intent (LOI)</option>
            <option value="full_application">Full Application</option>
          </select>
        </div>
      </div>

      {/* Sort By */}
      <div style={{ marginTop: '1.5rem' }}>
        <label className="usa-label" htmlFor="sort-select">
          Sort By
        </label>
        <select
          id="sort-select"
          className="usa-select"
          value={params.sort_by || ''}
          onChange={handleSelectChange('sort_by')}
        >
          <option value="">Most Recent</option>
          <option value="relevance">Relevance</option>
          <option value="deadline">Deadline (Soonest)</option>
          <option value="amount">Funding Amount (Highest)</option>
        </select>
      </div>
    </div>
  );
}

// ─── ActiveFilterChip ──────────────────────────────────────────────────────────

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        border: '1px solid #00a91c',
        borderRadius: '2rem',
        padding: '0.2rem 0.75rem',
        fontSize: '0.875rem',
        gap: '0.5rem',
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: '1rem',
          lineHeight: 1,
          color: '#1a1a1a',
        }}
      >
        ×
      </button>
    </span>
  );
}
