import { useState } from 'preact/hooks';
import { canGroupTabs } from '../../shared/lib/capabilities';
import { Icon } from '../../shared/ui/Icon';
import './ActionBar.css';

type Props = {
  selectedCount: number;
  /** Every selected tab is already pinned, so the menu offers "Unpin". */
  allPinned: boolean;
  /** Some selected tab is in a group; pinning will take it out. */
  pinLeavesGroup: boolean;
  onTogglePin: () => void;
  onOpen: () => void;
  onCloseSelected: () => void;
  onGroup: () => void;
  onMoveToNewWindow: () => void;
  onCloseOthers: () => void;
};

/** Bar of bulk actions shown while tabs are selected. */
export function ActionBar({
  selectedCount,
  allPinned,
  pinLeavesGroup,
  onTogglePin,
  onOpen,
  onCloseSelected,
  onGroup,
  onMoveToNewWindow,
  onCloseOthers,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pick = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <div class="actionbar">
      <span class="count">{selectedCount} selected</span>
      {selectedCount === 1 && (
        <button onClick={onOpen}>
          <Icon name="arrow-right" size={14} />
          Open
        </button>
      )}
      <button class="danger" onClick={onCloseSelected}>
        <Icon name="x" size={14} />
        Close selected
      </button>
      <div class="menu-wrap">
        <button onClick={() => setMenuOpen((v) => !v)}>
          <Icon name="dots" size={14} />
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
            <button
              class="menu-item"
              onClick={pick(onTogglePin)}
              title={!allPinned && pinLeavesGroup ? 'Pinned tabs leave their group' : undefined}
            >
              <Icon name="pin" size={15} />
              {allPinned ? 'Unpin tabs' : 'Pin tabs'}
            </button>
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
