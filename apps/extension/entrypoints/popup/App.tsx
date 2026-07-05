import { useState } from 'preact/hooks';
import './App.css';

export function App() {
  const [query, setQuery] = useState('');

  return (
    <div class="tabhound">
      <input
        class="search"
        type="text"
        placeholder="Search open tabs…"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        autoFocus
      />
      <ul class="results">
        {/* TODO(v1): render tab results from background messaging */}
      </ul>
    </div>
  );
}
