import { useCallback, useMemo, useState } from 'preact/hooks';
import type { TabDoc } from '@/lib/tab-index';
import type { PopupGroup } from '../groups/types';
import { buildRows } from './buildRows';

/** Rows for the tab list plus which groups the user has folded away (per popup session). */
export function useTabRows(tabs: TabDoc[], query: string, groupById: Map<number, PopupGroup>) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const { rows, visibleTabs } = useMemo(
    () => buildRows({ tabs, query, groupById, collapsed }),
    [tabs, query, groupById, collapsed],
  );

  const toggleCollapsed = useCallback((groupId: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  return { rows, visibleTabs, toggleCollapsed };
}
