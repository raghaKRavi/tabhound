import type { TabDoc } from '@/lib/tab-index';
import type { PopupGroup } from '../groups/types';
import type { Row } from './types';

type Input = {
  tabs: TabDoc[];
  query: string;
  groupById: Map<number, PopupGroup>;
  /** Ids of groups whose tabs are folded away. */
  collapsed: Set<number>;
};

/**
 * Turns matching tabs into the rows the list renders.
 *
 * With no query, tabs sit under collapsible group headers (a group appears where its first
 * tab does). While searching the list stays flat so relevance order is kept, and group
 * membership is shown as a coloured stripe only.
 */
export function buildRows({ tabs, query, groupById, collapsed }: Input) {
  const rows: Row[] = [];
  const visibleTabs: TabDoc[] = [];
  const groupOf = (t: TabDoc) => (t.groupId >= 0 ? groupById.get(t.groupId) : undefined);

  const addTab = (doc: TabDoc, group: PopupGroup | undefined, nested: boolean, last = false) => {
    rows.push({
      kind: 'tab',
      doc,
      index: visibleTabs.length,
      color: group?.color,
      groupTitle: group?.title,
      nested,
      last,
    });
    visibleTabs.push(doc);
  };

  if (query.trim()) {
    for (const t of tabs) addTab(t, groupOf(t), false);
    return { rows, visibleTabs };
  }

  const members = new Map<number, TabDoc[]>();
  for (const t of tabs) {
    if (groupOf(t)) members.set(t.groupId, [...(members.get(t.groupId) ?? []), t]);
  }

  const emitted = new Set<number>();
  for (const t of tabs) {
    const group = groupOf(t);
    if (!group) {
      addTab(t, undefined, false);
      continue;
    }
    if (emitted.has(t.groupId)) continue;
    emitted.add(t.groupId);

    const list = members.get(t.groupId) ?? [];
    const isCollapsed = collapsed.has(t.groupId);
    rows.push({
      kind: 'header',
      id: t.groupId,
      title: group.title,
      color: group.color,
      windowId: group.windowId,
      count: list.length,
      tabIds: list.map((m) => m.tabId),
      collapsed: isCollapsed,
    });
    if (!isCollapsed) list.forEach((m, n) => addTab(m, group, true, n === list.length - 1));
  }
  return { rows, visibleTabs };
}
