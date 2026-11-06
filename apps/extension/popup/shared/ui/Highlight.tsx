import type { JSX } from 'preact';

/** Renders `text` with every case-insensitive occurrence of `query` wrapped in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }): JSX.Element {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts: (string | JSX.Element)[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark>{text.slice(idx, idx + needle.length)}</mark>);
    i = idx + needle.length;
  }
  return <>{parts}</>;
}
