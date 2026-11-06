import { CheckZone } from '../../shared/ui/CheckZone';
import { Icon } from '../../shared/ui/Icon';
import '../../shared/ui/group-colors.css';
import type { HeaderRow } from './types';
import './GroupHeader.css';

type Props = {
  row: HeaderRow;
  selected: Set<number>;
  /** "Window N" label, shown only when there is more than one window. */
  windowLabel?: string;
  onToggleSelect: (tabIds: number[]) => void;
  onToggleCollapse: (groupId: number) => void;
};

/** Header of a group section: select the whole group, or fold/unfold it. */
export function GroupHeader({ row, selected, windowLabel, onToggleSelect, onToggleCollapse }: Props) {
  const picked = row.tabIds.filter((id) => selected.has(id)).length;
  const all = picked === row.tabIds.length;

  return (
    <div class={`grouphead gc-${row.color}${row.collapsed ? ' collapsed' : ''}`}>
      <CheckZone
        checked={all}
        indeterminate={picked > 0 && !all}
        title="Select whole group"
        label={`Select all tabs in ${row.title || 'this group'}`}
        onToggle={() => onToggleSelect(row.tabIds)}
      />
      <button
        class="gh-toggle"
        aria-expanded={!row.collapsed}
        onClick={() => onToggleCollapse(row.id)}
      >
        <Icon name="chevron-down" size={13} />
        <span class="dot" />
        <span class="gh-name">{row.title || 'Unnamed group'}</span>
        {windowLabel && <span class="gh-win">{windowLabel}</span>}
        <span class="gh-count">{row.count}</span>
      </button>
    </div>
  );
}
