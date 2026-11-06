import type { TabDoc } from '@/lib/tab-index';
import type { PopupGroup } from '@/popup/features/groups/types';

let nextId = 1;

/** A tab with sensible defaults; override what the test cares about. */
export function makeTab(overrides: Partial<TabDoc> = {}): TabDoc {
  const id = overrides.tabId ?? nextId++;
  return {
    tabId: id,
    windowId: 1,
    groupId: -1,
    title: `Tab ${id}`,
    url: `https://example.com/${id}`,
    description: '',
    h1: '',
    ...overrides,
  };
}

export function makeGroup(overrides: Partial<PopupGroup> = {}): PopupGroup {
  return { id: 100, title: 'Group', color: 'blue', windowId: 1, ...overrides };
}

export const groupMap = (...groups: PopupGroup[]) => new Map(groups.map((g) => [g.id, g]));
