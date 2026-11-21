import { useEffect, useRef, useState } from 'preact/hooks';
import { canGroupTabs } from '../../shared/lib/capabilities';
import { Icon } from '../../shared/ui/Icon';
import './ActionBar.css';

type Props = {
  selectedCount: number;
  /** Names the selection when a bookmark bar is shown too, e.g. "tabs selected". */
  label?: string;
  /** Every selected tab is already pinned, so the menu offers "Unpin". */
  allPinned: boolean;
  /** Some selected tab is in a group; pinning will take it out. */
  pinLeavesGroup: boolean;
  onTogglePin: () => void;
  onOpen: () => void;
  onCloseSelected: () => void;
  onGroup: () => void;
  /** Some selected tab is in a group, so the menu offers "Ungroup tabs". */
  anyGrouped?: boolean;
  onUngroup?: () => void;
  /** The one selected tab has copies; offers "Select its duplicates". */
  hasDuplicates?: boolean;
  onSelectDuplicates?: () => void;
  onMoveToNewWindow: () => void;
  onCloseOthers: () => void;
};

/** Bar of bulk actions shown while tabs are selected. */
export function ActionBar({
  selectedCount,
  label = 'selected',
  allPinned,
  pinLeavesGroup,
  onTogglePin,
  onOpen,
  onCloseSelected,
  onGroup,
  anyGrouped = false,
  onUngroup,
  hasDuplicates = false,
  onSelectDuplicates,
  onMoveToNewWindow,
  onCloseOthers,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the menu on a click anywhere outside it, or on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const pick = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <div class="actionbar">
      <span class="count">
        {selectedCount} {label}
      </span>
      {selectedCount === 1 && (
        <button class="primary" onClick={onOpen}>
          <Icon name="arrow-right" size={14} />
          Open
        </button>
      )}
      <button class="danger" onClick={onCloseSelected}>
        Close selected
      </button>
      <div class="menu-wrap" ref={wrapRef}>
        <button onClick={() => setMenuOpen((v) => !v)}>
          Actions
          <Icon name="chevron-down" size={13} />
        </button>
        {menuOpen && (
          <div class="menu">
            {canGroupTabs && (
              <button class="menu-item" onClick={pick(onGroup)}>
                <Icon name="grid-add" size={15} />
                Group tabs
              </button>
            )}
            {canGroupTabs && anyGrouped && onUngroup && (
              <button class="menu-item" onClick={pick(onUngroup)}>
                <Icon name="ungroup" size={15} />
                Ungroup tabs
              </button>
            )}
            <button
              class="menu-item"
              onClick={pick(onTogglePin)}
              title={!allPinned && pinLeavesGroup ? 'Pinned tabs leave their group' : undefined}
            >
              <Icon name="pin" size={15} />
              {allPinned ? 'Unpin tabs' : 'Pin tabs'}
            </button>
            {selectedCount === 1 && hasDuplicates && onSelectDuplicates && (
              <button class="menu-item" onClick={pick(onSelectDuplicates)}>
                <Icon name="copy" size={15} />
                Select duplicates of this tab
              </button>
            )}
            <button class="menu-item" onClick={pick(onMoveToNewWindow)}>
              <Icon name="app-window" size={15} />
              Move to new window
            </button>
            <button class="menu-item danger" onClick={pick(onCloseOthers)}>
              <Icon name="x" size={15} />
              Close all others
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
