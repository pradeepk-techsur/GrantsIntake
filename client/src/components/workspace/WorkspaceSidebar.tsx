import type { WorkspaceSection, SectionType, SectionStatus } from '../../types/workspace';

interface WorkspaceSidebarProps {
  sections: WorkspaceSection[];
  activeSectionType: SectionType | null;
  onSectionSelect: (type: SectionType) => void;
}

function statusIndicator(status: SectionStatus): { icon: string; color: string } {
  switch (status) {
    case 'complete':    return { icon: '✓', color: 'var(--gf-success)' };
    case 'error':       return { icon: '✗', color: 'var(--gf-error)' };
    case 'in_progress': return { icon: '·', color: 'var(--gf-warning)' };
    default:            return { icon: '·', color: 'var(--gf-border)' };
  }
}

/**
 * WorkspaceSidebar — GrantFlow Design System v1.0.
 * Section navigation list with status indicators.
 * Matches Figma left-nav pattern with active highlight.
 */
export function WorkspaceSidebar({ sections, activeSectionType, onSectionSelect }: WorkspaceSidebarProps) {
  const visibleSections = sections.filter((s) => s.is_visible);

  return (
    <nav aria-label="Application sections">
      <ul className="gf-section-nav" role="list">
        {visibleSections.map((section) => {
          const isActive = section.section_type === activeSectionType;
          const { icon, color } = statusIndicator(section.status);

          return (
            <li key={section.section_id} className="gf-section-nav__item">
              <button
                type="button"
                className={`gf-section-nav__btn${isActive ? ' active' : ''}`}
                onClick={() => onSectionSelect(section.section_type)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    aria-hidden="true"
                    style={{ color, fontSize: '14px', fontWeight: 700, flexShrink: 0, width: '14px', textAlign: 'center' }}
                  >
                    {icon}
                  </span>
                  <span style={{ fontSize: '13px' }}>{section.section_name}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
