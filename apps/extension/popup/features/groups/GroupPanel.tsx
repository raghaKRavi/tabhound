import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GroupColor } from '@/lib/messaging';
import '../../shared/ui/group-colors.css';
import { GROUP_COLORS } from './group-colors';
import { defaultGroupName } from './group-name';
import type { PopupGroup } from './types';
import './GroupPanel.css';

/** Above this many existing groups the list gets a filter box and scrolls. */
const FILTER_THRESHOLD = 3;

type Props = {
  selectedCount: number;
  /** URL of the first selected tab, used for the default group name. */
  firstUrl: string | undefined;
  groups: PopupGroup[];
  windowLabels: Map<number, number>;
  onCreate: (title: string, color: GroupColor) => void;
  onAddTo: (groupId: number) => void;
  onCancel: () => void;
};

/** Panel for putting the selected tabs into a new group or an existing one. */
export function GroupPanel({
  selectedCount,
  firstUrl,
  groups,
  windowLabels,
  onCreate,
  onAddTo,
  onCancel,
}: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<GroupColor>('blue');
  const [filter, setFilter] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? groups.filter((g) => (g.title || 'unnamed group').toLowerCase().includes(q)) : groups;
  }, [groups, filter]);

  const create = () => onCreate(name.trim() || defaultGroupName(firstUrl), color);
  const long = groups.length > FILTER_THRESHOLD;

  return (
    <div
      class="grouppanel"
      role="dialog"
      aria-label="Group tabs"
      onKeyDown={(e) => {
        // keep Enter/arrows from triggering the tab list behind the panel
        e.stopPropagation();
        if (e.key === 'Escape') onCancel();
      }}
    >
      <p class="gp-title">
        Group {selectedCount} tab{selectedCount === 1 ? '' : 's'}
      </p>
      <div class="gp-new">
        <input
          type="text"
          ref={nameRef}
          value={name}
          placeholder={defaultGroupName(firstUrl)}
          maxLength={60}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              create();
            }
          }}
        />
        <button class="primary" onClick={create}>
          Create group
        </button>
      </div>
      <div class="gp-colors" role="radiogroup" aria-label="Group colour">
        {GROUP_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            class={`dot gc-${c}${color === c ? ' on' : ''}`}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      {groups.length > 0 && (
        <>
          <p class="gp-sub">Or add to an existing group</p>
          {long && (
            <input
              type="text"
              class="gp-filter"
              placeholder="Filter groups…"
              value={filter}
              onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                const only = filtered.length === 1 ? filtered[0] : undefined;
                if (e.key === 'Enter' && only) {
                  e.preventDefault();
                  onAddTo(only.id);
                }
              }}
            />
          )}
          <div class={`gp-list${long ? ' scroll' : ''}`}>
            {filtered.map((g) => (
              <button key={g.id} class="gp-item" onClick={() => onAddTo(g.id)}>
                <span class={`dot gc-${g.color}`} />
                <span class="gp-name">{g.title || 'Unnamed group'}</span>
                <span class="gp-win">Window {windowLabels.get(g.windowId) ?? '?'}</span>
              </button>
            ))}
            {filtered.length === 0 && <p class="gp-none">No groups match.</p>}
          </div>
        </>
      )}
      <button class="gp-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
