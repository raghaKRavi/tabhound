import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { ListResponse, SearchResponse } from '@/lib/messaging';
import { tabToDoc, type TabDoc } from '@/lib/tab-index';
import { send } from '../../shared/lib/messaging-client';

/**
 * Open tabs from the background index.
 * `allTabs` is everything; `tabs` is what matches `query` (all of them when it is empty).
 */
export function useTabs(query: string) {
  const [allTabs, setAllTabs] = useState<TabDoc[]>([]);
  const [tabs, setTabs] = useState<TabDoc[]>([]);
  const [windowCount, setWindowCount] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read tabs straight from the browser: no wait for the background worker to wake up and
    // re-index. Falls back to the background list if the direct query fails.
    const apply = (list: TabDoc[]) => {
      setAllTabs(list);
      setTabs(list);
      setWindowCount(new Set(list.map((t) => t.windowId)).size);
    };
    chrome.tabs
      .query({})
      .then((found) => {
        const docs: TabDoc[] = [];
        for (const t of found) {
          const doc = tabToDoc(t);
          if (doc) docs.push(doc);
        }
        apply(docs);
      })
      .catch(() =>
        send<ListResponse>({ type: 'list' }).then((r) => {
          apply(r.tabs);
          setWindowCount(r.windowCount);
        }),
      )
      .catch(() => {
        /* nothing available; show the empty state */
      })
      .finally(() => setLoading(false));
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

  /** Drops a closed tab from the lists without refetching. */
  const removeTab = useCallback((tabId: number) => {
    setAllTabs((prev) => prev.filter((t) => t.tabId !== tabId));
    setTabs((prev) => prev.filter((t) => t.tabId !== tabId));
  }, []);

  /** windowId ->"Window N" number, in order of first appearance. */
  const windowLabels = useMemo(() => {
    const map = new Map<number, number>();
    let n = 1;
    for (const t of allTabs) {
      if (!map.has(t.windowId)) map.set(t.windowId, n++);
    }
    return map;
  }, [allTabs]);

  const totalWindows = windowCount || windowLabels.size;

  return { allTabs, tabs, windowLabels, totalWindows, loading, removeTab };
}
