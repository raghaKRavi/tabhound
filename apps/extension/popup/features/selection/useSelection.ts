import { useCallback, useMemo, useState } from 'preact/hooks';

/** The set of tabs the user has ticked. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = useCallback((tabId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  /** Selects all of `ids`, or deselects them if they are all selected already. */
  const toggleMany = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) for (const id of ids) next.delete(id);
      else for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const ids = useMemo(() => [...selected], [selected]);

  return { selected, ids, count: selected.size, toggle, toggleMany };
}
