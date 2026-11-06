import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ListResponse, SearchResponse } from '@/lib/messaging';
import type { TabDoc } from '@/lib/tab-index';
import { send } from '../../shared/lib/messaging-client';

/**
 * Open tabs from the background index.
 * `allTabs` is everything; `tabs` is what matches `query` (all of them when it is empty).
 */
export function useTabs(query: string) {
  const [allTabs, setAllTabs] = useState<TabDoc[]>([]);
  const [tabs, setTabs] = useState<TabDoc[]>([]);
  const [windowCount, setWindowCount] = useState(0);

  useEffect(() => {
    send<ListResponse>({ type: 'list' }).then((r) => {
      setAllTabs(r.tabs);
      setTabs(r.tabs);
      setWindowCount(r.windowCount);
    });
  }, []);

  useEffect(() => {
    let cancel = false;
    if (!query.trim()) {
      setTabs(allTabs);
    } else {
      send<SearchResponse>({ type: 'search', query }).then((r) => {
        if (!cancel) setTabs(r.results);
      });
    }
    return () => {
      cancel = true;
    };
  }, [query, allTabs]);

  /** windowId -> "Window N" number, in order of first appearance. */
  const windowLabels = useMemo(() => {
    const map = new Map<number, number>();
    let n = 1;
    for (const t of allTabs) {
      if (!map.has(t.windowId)) map.set(t.windowId, n++);
    }
    return map;
  }, [allTabs]);

  const totalWindows = windowCount || windowLabels.size;

  return { allTabs, tabs, windowLabels, totalWindows };
}
