import './ContentSearchBar.css';

type Props = { enabled: boolean; onToggle: () => void };

/** Footer strip that explains and toggles searching page descriptions and headings. */
export function ContentSearchBar({ enabled, onToggle }: Props) {
  return (
    <div class="contentbar">
      <span>
        {enabled
          ? 'Searching page descriptions & headings. Stays on this device.'
          : 'Also search page descriptions & headings (needs access to all sites).'}
      </span>
      <button onClick={onToggle}>{enabled ? 'Turn off' : 'Turn on'}</button>
    </div>
  );
}
