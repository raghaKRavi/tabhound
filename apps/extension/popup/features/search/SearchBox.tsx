import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../shared/ui/Icon';
import './SearchBox.css';

type Props = {
  query: string;
  onChange: (query: string) => void;
  /** Shown as "N matches" while a query is typed. */
  matchCount: number;
};

export function SearchBox({ query, onChange, matchCount }: Props) {
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div class="searchwrap">
      <div class={`searchbox${focused ? ' focused' : ''}`}>
        <span class="icon leading">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search open tabs…"
          value={query}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
        />
        {query && (
          <button class="clear" aria-label="clear" onClick={() => onChange('')}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      {query && (
        <p class="caption">
          {matchCount} match{matchCount === 1 ? '' : 'es'}
        </p>
      )}
    </div>
  );
}
