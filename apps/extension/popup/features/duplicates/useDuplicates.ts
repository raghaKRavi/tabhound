import { useEffect, useMemo, useState } from 'preact/hooks';
import type { TabDoc } from '@/lib/tab-index';
import { findDuplicates } from './duplicates';

/**
 * Duplicate tabs. Badges cover every open tab; `visible` only looks at the tabs currently
 * listed, so "Select duplicates" never picks tabs hidden by a search.
 */
export function useDuplicates(allTabs: TabDoc[], visibleTabs: TabDoc[]) {
  const [activeIds, setActiveIds] = useState<Set<number>>(new Set());

  // The tab the user was on when they opened the popup is never offered for closing.
  useEffect(() => {
    chrome.tabs
      .query({ active: true })
      .then((tabs) => setActiveIds(new Set(tabs.flatMap((t) => (t.id == null ? [] : [t.id])))))
      .catch(() => {});
  }, []);

  const all = useMemo(() => findDuplicates(allTabs, activeIds), [allTabs, activeIds]);
  const visible = useMemo(
    () => (visibleTabs === allTabs ? all : findDuplicates(visibleTabs, activeIds)),
    [visibleTabs, allTabs, all, activeIds],
  );

  return { badges: all.badges, all, visible };
}
