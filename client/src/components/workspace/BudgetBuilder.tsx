import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import type { BudgetCategory, BudgetLineItem, BudgetValidationError, CreateLineItemInput } from '../../types/budget';

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  personnel: 'Personnel',
  fringe: 'Fringe Benefits',
  travel: 'Travel',
  equipment: 'Equipment',
  supplies: 'Supplies',
  contractual: 'Contractual',
  indirect: 'Indirect Costs',
  other_direct: 'Other Direct',
  match_cash: 'Match - Cash',
  match_in_kind: 'Match - In-Kind',
};

const BUDGET_CATEGORIES_ORDERED: BudgetCategory[] = [
  'personnel', 'fringe', 'travel', 'equipment', 'supplies',
  'contractual', 'indirect', 'other_direct', 'match_cash', 'match_in_kind',
];

interface AddLineItemFormState {
  description: string;
  quantity: string;
  unit_cost: string;
  total_cost: string;
  personnel_name: string;
  fte: string;
  annual_salary: string;
  fringe_rate: string;
  match_source: string;
  match_type: string;
  justification_text: string;
}

const emptyForm: AddLineItemFormState = {
  description: '',
  quantity: '',
  unit_cost: '',
  total_cost: '',
  personnel_name: '',
  fte: '',
  annual_salary: '',
  fringe_rate: '',
  match_source: '',
  match_type: '',
  justification_text: '',
};

interface BudgetBuilderProps {
  workspaceId: string;
  isLocked?: boolean; // When true, all budget editing controls are disabled
}

export function BudgetBuilder({ workspaceId, isLocked = false }: BudgetBuilderProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<BudgetCategory>>(new Set());
  const [addingCategory, setAddingCategory] = useState<BudgetCategory | null>(null);
  const [formState, setFormState] = useState<AddLineItemFormState>(emptyForm);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: BudgetValidationError[] } | null>(null);

  const { data: budget, isLoading, error } = useQuery({
    queryKey: ['budget', workspaceId],
    queryFn: () => workspaceApi.getBudget(workspaceId),
  });

  const addLineItemMutation = useMutation({
    mutationFn: (input: CreateLineItemInput) => workspaceApi.addLineItem(workspaceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', workspaceId] });
      setAddingCategory(null);
      setFormState(emptyForm);
    },
  });

  const deleteLineItemMutation = useMutation({
    mutationFn: (lineId: string) => workspaceApi.deleteLineItem(workspaceId, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', workspaceId] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => workspaceApi.validateBudget(workspaceId),
    onSuccess: (result) => {
      setValidationResult(result);
      queryClient.invalidateQueries({ queryKey: ['budget', workspaceId] });
    },
  });

  function toggleCategory(cat: BudgetCategory) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function handleFormChange(field: keyof AddLineItemFormState, value: string) {
    setFormState(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate total_cost from quantity × unit_cost
      if (field === 'quantity' || field === 'unit_cost') {
        const q = parseFloat(next.quantity);
        const u = parseFloat(next.unit_cost);
        if (!isNaN(q) && !isNaN(u)) {
          next.total_cost = (q * u).toFixed(2);
        }
      }
      return next;
    });
  }

  function handleAddLineItem(category: BudgetCategory) {
    const input: CreateLineItemInput = {
      category,
      description: formState.description,
      total_cost: parseFloat(formState.total_cost) || 0,
    };
    if (formState.quantity) input.quantity = parseFloat(formState.quantity);
    if (formState.unit_cost) input.unit_cost = parseFloat(formState.unit_cost);
    if (formState.personnel_name) input.personnel_name = formState.personnel_name;
    if (formState.fte) input.fte = parseFloat(formState.fte);
    if (formState.annual_salary) input.annual_salary = parseFloat(formState.annual_salary);
    if (formState.fringe_rate) input.fringe_rate = parseFloat(formState.fringe_rate);
    if (formState.match_source) input.match_source = formState.match_source;
    if (formState.match_type) input.match_type = formState.match_type;
    if (formState.justification_text) input.justification_text = formState.justification_text;

    addLineItemMutation.mutate(input);
  }

  function getCategorySubtotal(category: BudgetCategory): number {
    if (!budget?.line_items) return 0;
    return budget.line_items
      .filter((li: BudgetLineItem) => li.category === category)
      .reduce((sum: number, li: BudgetLineItem) => sum + Number(li.total_cost), 0);
  }

  const isPersonnelCategory = (cat: BudgetCategory) => cat === 'personnel' || cat === 'fringe';
  const isMatchCategory = (cat: BudgetCategory) => cat === 'match_cash' || cat === 'match_in_kind';

  if (isLoading) {
    return <div ><p className="gf-hint">Loading budget…</p></div>;
  }

  if (error) {
    return (
      <div className="gf-alert gf-alert gf-alert--error">
        <div >
          <p className="gf-alert__text">Failed to load budget. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="budget-builder">
      {/* Budget totals summary */}
      <div className="gf-card" style={{ marginBottom: '1.5rem' }}>
        <div className="gf-card__header">
          <h3 className="gf-card__title">Budget Summary</h3>
        </div>
        <div className="gf-card__body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div>
              <strong>Total Federal Request:</strong><br />
              <span data-testid="budget-total-federal" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                ${(Number(budget?.total_federal_request ?? 0)).toFixed(2)}
              </span>
            </div>
            <div>
              <strong>Total Match:</strong><br />
              <span style={{ fontSize: '1.25rem' }}>
                ${(Number(budget?.total_match ?? 0)).toFixed(2)}
              </span>
            </div>
            <div>
              <strong>Total Indirect:</strong><br />
              <span>${(Number(budget?.total_indirect ?? 0)).toFixed(2)}</span>
            </div>
            <div>
              <strong>Total Project Cost:</strong><br />
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                ${(Number(budget?.total_project_cost ?? 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation result alert */}
      {validationResult && (
        <div className={`gf-alert ${validationResult.valid ? 'gf-alert gf-alert--success' : 'gf-alert gf-alert--error'}`}>
          <div >
            <h4 className="gf-alert__title">
              {validationResult.valid ? 'Budget Valid' : 'Budget Validation Issues'}
            </h4>
            {!validationResult.valid && (
              <ul >
                {validationResult.errors.map((err, idx) => (
                  <li key={idx} className="gf-alert__text">
                    <strong>[{err.error_code}]</strong> {err.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Validate button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="gf-btn gf-btn--primary gf-btn gf-btn--outline"
          data-testid="validate-budget-btn"
          onClick={() => validateMutation.mutate()}
          disabled={validateMutation.isPending}
        >
          {validateMutation.isPending ? 'Validating…' : 'Validate Budget'}
        </button>
      </div>

      {/* Budget categories */}
      {BUDGET_CATEGORIES_ORDERED.map(category => {
        const lineItems = (budget?.line_items ?? []).filter((li: BudgetLineItem) => li.category === category);
        const subtotal = getCategorySubtotal(category);
        const isExpanded = expandedCategories.has(category);
        const isAdding = addingCategory === category;

        return (
          <div
            key={category}
            data-testid={`budget-category-${category}`}
            
            style={{ marginBottom: '0.5rem', border: '1px solid #dcdee0', borderRadius: '4px' }}
          >
            <h4 >
              <button
                type="button"
                className="gf-btn gf-btn--ghost"
                aria-expanded={isExpanded}
                onClick={() => toggleCategory(category)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
              >
                <span>{CATEGORY_LABELS[category]}</span>
                <span className="gf-hint">${subtotal.toFixed(2)}</span>
              </button>
            </h4>

            {/* Always-visible add button — outside accordion content */}
            {!isAdding && (
              <div style={{ padding: '0.5rem 1rem' }}>
                <button
                  type="button"
                  className="gf-btn gf-btn--primary gf-btn gf-btn--outline gf-btn--sm"
                  data-testid={`add-line-item-btn-${category}`}
                  onClick={() => {
                    setAddingCategory(category);
                    setFormState(emptyForm);
                    setExpandedCategories(prev => new Set(prev).add(category));
                  }}
                  disabled={isLocked}
                >
                  + Add {CATEGORY_LABELS[category]} Line Item
                </button>
              </div>
            )}

            {/* Accordion content: line items table + add form (only when expanded) */}
            {isExpanded && (
              <div  style={{ padding: '1rem' }}>
                {/* Line items table */}
                {lineItems.length > 0 && (
                  <table className="gf-table gf-table" style={{ width: '100%', marginBottom: '1rem' }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        {isPersonnelCategory(category) && <th>Name / FTE</th>}
                        <th>Qty</th>
                        <th>Unit Cost</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((li: BudgetLineItem) => (
                        <tr key={li.line_id}>
                          <td>
                            {li.description}
                            {li.justification_text && (
                              <div className="gf-hint" style={{ fontSize: '0.85rem' }}>{li.justification_text}</div>
                            )}
                          </td>
                          {isPersonnelCategory(category) && (
                            <td>
                              {li.personnel_name ?? '—'}
                              {li.fte != null && <div className="gf-hint">{li.fte} FTE</div>}
                            </td>
                          )}
                          <td>{li.quantity ?? '—'}</td>
                          <td>{li.unit_cost != null ? `$${Number(li.unit_cost).toFixed(2)}` : '—'}</td>
                          <td>${Number(li.total_cost).toFixed(2)}</td>
                           <td>
                             <button
                               type="button"
                               className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
                               onClick={() => deleteLineItemMutation.mutate(li.line_id)}
                               disabled={deleteLineItemMutation.isPending || isLocked}
                               style={{ color: '#b50909' }}
                             >
                               Remove
                             </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={isPersonnelCategory(category) ? 4 : 3}><strong>Subtotal</strong></td>
                        <td><strong>${subtotal.toFixed(2)}</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* Add line item inline form (shown when isAdding for this category) */}
                {isAdding && (
                  <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <h5 style={{ marginTop: 0 }}>Add {CATEGORY_LABELS[category]} Line Item</h5>

                     <label className="gf-label" htmlFor={`desc-${category}`}>Description *</label>
                     <input
                       id={`desc-${category}`}
                       className="gf-input"
                       type="text"
                       value={formState.description}
                       onChange={e => handleFormChange('description', e.target.value)}
                       maxLength={500}
                       required
                       disabled={isLocked}
                     />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <div>
                         <label className="gf-label" htmlFor={`qty-${category}`}>Quantity</label>
                         <input
                           id={`qty-${category}`}
                           className="gf-input"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formState.quantity}
                           onChange={e => handleFormChange('quantity', e.target.value)}
                           disabled={isLocked}
                         />
                       </div>
                       <div>
                         <label className="gf-label" htmlFor={`uc-${category}`}>Unit Cost ($)</label>
                         <input
                           id={`uc-${category}`}
                           className="gf-input"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formState.unit_cost}
                           onChange={e => handleFormChange('unit_cost', e.target.value)}
                           disabled={isLocked}
                         />
                       </div>
                       <div>
                         <label className="gf-label" htmlFor={`tc-${category}`}>Total Cost ($) *</label>
                         <input
                           id={`tc-${category}`}
                           className="gf-input"
                           type="number"
                           min="0"
                           step="0.01"
                           value={formState.total_cost}
                           onChange={e => handleFormChange('total_cost', e.target.value)}
                           required
                           disabled={isLocked}
                         />
                      </div>
                    </div>

                    {/* Personnel-specific fields */}
                    {isPersonnelCategory(category) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div>
                           <label className="gf-label" htmlFor={`pname-${category}`}>Personnel Name</label>
                           <input
                             id={`pname-${category}`}
                             className="gf-input"
                             type="text"
                             value={formState.personnel_name}
                             onChange={e => handleFormChange('personnel_name', e.target.value)}
                             disabled={isLocked}
                           />
                         </div>
                         <div>
                           <label className="gf-label" htmlFor={`fte-${category}`}>FTE (0.001–1.000)</label>
                           <input
                             id={`fte-${category}`}
                             className="gf-input"
                             type="number"
                             min="0.001"
                             max="1.000"
                             step="0.001"
                             value={formState.fte}
                             onChange={e => handleFormChange('fte', e.target.value)}
                             disabled={isLocked}
                           />
                         </div>
                         <div>
                           <label className="gf-label" htmlFor={`salary-${category}`}>Annual Salary ($)</label>
                           <input
                             id={`salary-${category}`}
                             className="gf-input"
                             type="number"
                             min="0"
                             step="0.01"
                             value={formState.annual_salary}
                             onChange={e => handleFormChange('annual_salary', e.target.value)}
                             disabled={isLocked}
                           />
                         </div>
                         <div>
                           <label className="gf-label" htmlFor={`fringe-${category}`}>Fringe Rate (%)</label>
                           <input
                             id={`fringe-${category}`}
                             className="gf-input"
                             type="number"
                             min="0"
                             max="100"
                             step="0.01"
                             value={formState.fringe_rate}
                             onChange={e => handleFormChange('fringe_rate', e.target.value)}
                             disabled={isLocked}
                           />
                         </div>
                      </div>
                    )}

                    {/* Match-specific fields */}
                    {isMatchCategory(category) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div>
                         <label className="gf-label" htmlFor={`msrc-${category}`}>Match Source</label>
                           <input
                             id={`msrc-${category}`}
                             className="gf-input"
                             type="text"
                             value={formState.match_source}
                             onChange={e => handleFormChange('match_source', e.target.value)}
                             disabled={isLocked}
                           />
                         </div>
                         <div>
                           <label className="gf-label" htmlFor={`mtype-${category}`}>Match Type</label>
                           <input
                             id={`mtype-${category}`}
                             className="gf-input"
                             type="text"
                             value={formState.match_type}
                             onChange={e => handleFormChange('match_type', e.target.value)}
                             disabled={isLocked}
                           />
                        </div>
                      </div>
                    )}

                    {/* Justification */}
                     <label className="gf-label" htmlFor={`just-${category}`} style={{ marginTop: '0.5rem' }}>Justification</label>
                     <textarea
                       id={`just-${category}`}
                       className="gf-textarea"
                       value={formState.justification_text}
                       onChange={e => handleFormChange('justification_text', e.target.value)}
                       rows={2}
                       disabled={isLocked}
                     />

                     <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                       <button
                         type="button"
                         className="gf-btn gf-btn--primary"
                         onClick={() => handleAddLineItem(category)}
                         disabled={!formState.description || !formState.total_cost || addLineItemMutation.isPending || isLocked}
                       >
                         {addLineItemMutation.isPending ? 'Adding…' : 'Add Line Item'}
                       </button>
                       <button
                         type="button"
                         className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
                         onClick={() => { setAddingCategory(null); setFormState(emptyForm); }}
                       >
                         Cancel
                       </button>
                     </div>

                    {addLineItemMutation.isError && (
                      <p className="gf-error-msg">Failed to add line item. Please try again.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Grand total */}
      <div style={{ textAlign: 'right', padding: '1rem', borderTop: '2px solid #1b1b1b', marginTop: '1rem' }}>
        <strong>Grand Total Project Cost: </strong>
        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          ${(Number(budget?.total_project_cost ?? 0)).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
