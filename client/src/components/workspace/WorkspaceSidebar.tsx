import type { WorkspaceSection, SectionType, SectionStatus } from '../../types/workspace';

interface WorkspaceSidebarProps {
  sections: WorkspaceSection[];
  activeSectionType: SectionType | null;
  onSectionSelect: (type: SectionType) => void;
}

// Status badge helper
const STATUS_LABELS: Record<SectionStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'usa-tag' },
  in_progress: { label: 'In Progress', className: 'usa-tag usa-tag--info' },
  complete: { label: 'Complete', className: 'usa-tag usa-tag--success' },
  error: { label: 'Error', className: 'usa-tag usa-tag--error' },
  locked: { label: 'Locked', className: 'usa-tag' },
};

export function WorkspaceSidebar({ sections, activeSectionType, onSectionSelect }: WorkspaceSidebarProps) {
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <nav aria-label="Application sections" className="usa-sidenav">
      <ul className="usa-sidenav__list">
        {visibleSections.map((section) => {
          const isActive = section.section_type === activeSectionType;
          const statusInfo = STATUS_LABELS[section.status] ?? STATUS_LABELS.not_started;

          return (
            <li key={section.section_id} className="usa-sidenav__item">
              <button
                type="button"
                role="button"
                className={isActive ? 'usa-current' : undefined}
                onClick={() => onSectionSelect(section.section_type)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{section.section_name}</span>
                <span className={statusInfo.className} style={{ fontSize: '0.75rem' }}>
                  {statusInfo.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
