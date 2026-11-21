import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../shared/ui/Icon';
import './SearchBox.css';

type Props = {
  query: string;
  onChange: (query: string) => void;
  /** Shown as "N matches" while a query is typed. */
  matchCount: number;
  /** Whether bookmarks are searched too; the toggle button is hidden without `onToggleBookmarks`. */
  bookmarks?: boolean;
  /** Bookmarks matching the query; shown next to the tab count while `bookmarks` is on. */
  bookmarkCount?: number;
  onToggleBookmarks?: () => void | Promise<void>;
};

export function SearchBox({
  query,
  onChange,
  matchCount,
  bookmarks = false,
  bookmarkCount = 0,
  onToggleBookmarks,
}: Props) {
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // The chip and the in-input icon unmount on toggle, so hand focus back to the input.
  const toggleBookmarks = async () => {
    await onToggleBookmarks?.();
    inputRef.current?.focus();
  };

  return (
    <div class="searchwrap">
      <div class="searchrow">
      <div class={`searchbox${focused ? ' focused' : ''}`}>
        <span class="icon leading">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={bookmarks ? 'Search open tabs and bookmarks…' : 'Search open tabs…'}
          value={query}
          onInput={(e) => {
            const input = e.target as HTMLInputElement;
            // Leading spaces mean nothing, so a blank box stays blank (no search, no "N matches").
            // Spaces between words are kept for multi-word searches.
            const cleaned = input.value.replace(/^\s+/, '');
            if (cleaned !== input.value) input.value = cleaned;
            onChange(cleaned);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
        />
        {query && (
          <button class="clear" aria-label="clear" onClick={() => onChange('')}>
            <Icon name="x" size={16} />
          </button>
        )}
        {bookmarks && onToggleBookmarks && (
          <button
            type="button"
            class="bm-active"
            aria-pressed={true}
            aria-label="Also search bookmarks"
            title="Bookmarks included. Click to turn off."
            onClick={toggleBookmarks}
          >
            <Icon name="bookmark" size={13} />
          </button>
        )}
      </div>
      {!bookmarks && onToggleBookmarks && (
        <button
          type="button"
          class="bm-chip"
          aria-pressed={false}
          aria-label="Also search bookmarks"
          onClick={toggleBookmarks}
        >
          <Icon name="bookmark" size={12} />
          <span>Bookmarks</span>
        </button>
      )}
      </div>
      {query && (
        <p class="caption">
          {bookmarks
            ? `${matchCount} tab${matchCount === 1 ? '' : 's'} · ${bookmarkCount} bookmark${bookmarkCount === 1 ? '' : 's'}`
            : `${matchCount} match${matchCount === 1 ? '' : 'es'}`}
        </p>
      )}
    </div>
  );
}
