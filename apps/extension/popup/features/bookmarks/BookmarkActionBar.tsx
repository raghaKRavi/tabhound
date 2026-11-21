import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../shared/ui/Icon';
import '../actions/ActionBar.css';
import { loadFolders, type BookmarkFolder } from './useBookmarks';

type Props = {
  selectedCount: number;
  /** Names the selection when a tab bar is shown too, e.g. "bookmarks selected". */
  label?: string;
  onOpenTabs: () => void;
  onOpenWindow: () => void;
  onMove: (folder: BookmarkFolder) => void;
  onRemove: () => void;
};

/** Bulk actions for selected bookmarks; shown above/below the tab bar when both are selected. */
export function BookmarkActionBar({
  selectedCount,
  label = 'selected',
  onOpenTabs,
  onOpenWindow,
  onMove,
  onRemove,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [folders, setFolders] = useState<BookmarkFolder[] | null>(null);
  // Removing deletes the bookmark from the browser for good, so it asks first.
  const [confirming, setConfirming] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setFolders(null);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const pick = (action: () => void) => () => {
    closeMenu();
    action();
  };

  const showFolders = () => {
    loadFolders()
      .then(setFolders)
      .catch(() => setFolders([]));
  };

  if (confirming) {
    return (
      <div class="actionbar">
        <span class="count">
          Delete {selectedCount} bookmark{selectedCount === 1 ? '' : 's'} from your browser?
        </span>
        <button onClick={() => setConfirming(false)}>Cancel</button>
        <button
          class="danger"
          onClick={() => {
            setConfirming(false);
            onRemove();
          }}
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div class="actionbar">
      <span class="count">
        {selectedCount} {label}
      </span>
      {selectedCount === 1 && (
        <button class="primary" onClick={onOpenTabs}>
          <Icon name="arrow-right" size={14} />
          Open
        </button>
      )}
      <button class="danger" onClick={() => setConfirming(true)}>
        Remove
      </button>
      <div class="menu-wrap" ref={wrapRef}>
        <button onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}>
          Actions
          <Icon name="chevron-down" size={13} />
        </button>
        {menuOpen && (
          <div class="menu">
            {folders ? (
              <div class="folder-list" role="menu" aria-label="Move to folder">
                {folders.length === 0 && <p class="menu-note">No folders found.</p>}
                {folders.map((f) => (
                  <button
                    key={f.id}
                    class="menu-item"
                    style={{ paddingLeft: `${10 + f.depth * 12}px` }}
                    onClick={pick(() => onMove(f))}
                  >
                    <Icon name="bookmark" size={14} />
                    {f.title}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button class="menu-item" onClick={pick(onOpenTabs)}>
                  <Icon name="arrow-right" size={15} />
                  Open in new tabs
                </button>
                <button class="menu-item" onClick={pick(onOpenWindow)}>
                  <Icon name="app-window" size={15} />
                  Open in new window
                </button>
                <button class="menu-item" onClick={showFolders}>
                  <Icon name="bookmark" size={15} />
                  Move to folder…
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
