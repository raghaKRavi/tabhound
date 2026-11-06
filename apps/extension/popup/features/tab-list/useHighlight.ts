import { useCallback, useEffect, useState } from 'preact/hooks';

/**
 * Keyboard/mouse highlight over `count` visible tabs.
 * Goes back to the first tab whenever any of `resetOn` changes (new query, new tab list).
 */
export function useHighlight(count: number, resetOn: unknown[]) {
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    setHighlighted(0);
  }, resetOn);

  const move = useCallback(
    (delta: 1 | -1) => setHighlighted((h) => Math.max(0, Math.min(h + delta, count - 1))),
    [count],
  );

  return { highlighted, setHighlighted, move };
}
