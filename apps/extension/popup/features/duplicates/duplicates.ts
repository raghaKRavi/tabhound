import type { TabDoc } from '@/lib/tab-index';

export type DupBadge = { n: number; of: number };

export type Duplicates = {
  /** Position of each duplicated tab within its set ("2 of 4"). */
  badges: Map<number, DupBadge>;
  /** The tabs to close: every set minus the one tab it keeps. */
  extras: number[];
  /** Number of sets (distinct URLs open more than once). */
  setCount: number;
  /** tabId -> every tab id in its set, kept tab included. */
  setOf: Map<number, number[]>;
  /** tabId -> the extra copies in its set (the set minus the tab it keeps). */
  extrasOf: Map<number, number[]>;
};

/** Same page = same URL once `#fragment` and a trailing slash are ignored. */
export function normalizeUrl(url: string): string {
  const noHash = url.split('#')[0] ?? '';
  return noHash.length > 1 ? noHash.replace(/\/+$/, '') : noHash;
}

/**
 * Finds tabs open more than once. Each set keeps one tab, preferring the tab the user is
 * on, then a pinned one, then one in a group, then the first in the list.
 */
export function findDuplicates(tabs: TabDoc[], activeIds: Set<number>): Duplicates {
  const sets = new Map<string, TabDoc[]>();
  for (const t of tabs) {
    if (!t.url) continue;
    const key = normalizeUrl(t.url);
    sets.set(key, [...(sets.get(key) ?? []), t]);
  }

  const badges = new Map<number, DupBadge>();
  const setOf = new Map<number, number[]>();
  const extrasOf = new Map<number, number[]>();
  const extras: number[] = [];
  let setCount = 0;

  for (const members of sets.values()) {
    if (members.length < 2) continue;
    setCount++;
    const ids = members.map((m) => m.tabId);
    const rank = (t: TabDoc) => (activeIds.has(t.tabId) ? 0 : t.pinned ? 1 : t.groupId >= 0 ? 2 : 3);
    // Array.prototype.sort is stable, so ties fall back to list order.
    const keep = [...members].sort((a, b) => rank(a) - rank(b))[0]!;
    const setExtras = ids.filter((id) => id !== keep.tabId);
    extras.push(...setExtras);
    members.forEach((m, i) => {
      badges.set(m.tabId, { n: i + 1, of: members.length });
      setOf.set(m.tabId, ids);
      extrasOf.set(m.tabId, setExtras);
    });
  }

  return { badges, extras, setCount, setOf, extrasOf };
}
