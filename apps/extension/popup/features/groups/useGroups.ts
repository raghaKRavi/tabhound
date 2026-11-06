import { useEffect, useMemo, useState } from 'preact/hooks';
import type { GroupColor } from '@/lib/messaging';
import { canGroupTabs } from '../../shared/lib/capabilities';
import type { PopupGroup } from './types';

/** Loads the browser's tab groups once when the popup opens (empty where unsupported). */
export function useGroups() {
  const [groups, setGroups] = useState<PopupGroup[]>([]);

  useEffect(() => {
    if (!canGroupTabs) return;
    chrome.tabGroups
      .query({})
      .then((found) =>
        setGroups(
          found.map((g) => ({
            id: g.id,
            title: g.title ?? '',
            color: g.color as GroupColor,
            windowId: g.windowId,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  return { groups, groupById };
}
