import { describe, expect, it } from 'vitest';
import { groupMap, makeGroup, makeTab } from '../../../test/factories';
import { buildRows } from './buildRows';

const none = new Set<number>();

describe('buildRows', () => {
  it('lists ungrouped tabs flat, indexed in order', () => {
    const [a, b] = [makeTab(), makeTab()];
    const { rows, visibleTabs } = buildRows({ tabs: [a, b], query: '', groupById: new Map(), collapsed: none });

    expect(rows.map((r) => r.kind)).toEqual(['tab', 'tab']);
    expect(rows.map((r) => (r.kind === 'tab' ? r.index : -1))).toEqual([0, 1]);
    expect(visibleTabs).toEqual([a, b]);
  });

  it('puts a group header where its first tab is, with its tabs nested below', () => {
    const g = makeGroup({ id: 7, title: 'Work', color: 'red' });
    const [before, in1, between, in2] = [
      makeTab(),
      makeTab({ groupId: 7 }),
      makeTab(),
      makeTab({ groupId: 7 }),
    ];
    const { rows } = buildRows({
      tabs: [before, in1, between, in2],
      query: '',
      groupById: groupMap(g),
      collapsed: none,
    });

    // the group's tabs are gathered under one header, even though `between` sits between them
    expect(rows.map((r) => (r.kind === 'header' ? 'H' : r.doc.tabId))).toEqual([
      before.tabId,
      'H',
      in1.tabId,
      in2.tabId,
      between.tabId,
    ]);
    const header = rows[1];
    if (header?.kind !== 'header') throw new Error('expected a group header');
    expect(header).toMatchObject({ id: 7, title: 'Work', color: 'red', count: 2 });
    expect(header.tabIds).toEqual([in1.tabId, in2.tabId]);
  });

  it('marks nested rows and only the last tab of a group as last', () => {
    const g = makeGroup({ id: 7 });
    const tabs = [makeTab({ groupId: 7 }), makeTab({ groupId: 7 }), makeTab({ groupId: 7 })];
    const { rows } = buildRows({ tabs, query: '', groupById: groupMap(g), collapsed: none });

    const tabRows = rows.filter((r) => r.kind === 'tab');
    expect(tabRows.every((r) => r.kind === 'tab' && r.nested)).toBe(true);
    expect(tabRows.map((r) => r.kind === 'tab' && r.last)).toEqual([false, false, true]);
  });

  it('hides the tabs of a collapsed group but keeps them counted and selectable', () => {
    const g = makeGroup({ id: 7 });
    const [a, b] = [makeTab({ groupId: 7 }), makeTab({ groupId: 7 })];
    const { rows, visibleTabs } = buildRows({
      tabs: [a, b],
      query: '',
      groupById: groupMap(g),
      collapsed: new Set([7]),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'header', collapsed: true, count: 2, tabIds: [a.tabId, b.tabId] });
    expect(visibleTabs).toEqual([]); // keyboard navigation skips hidden tabs
  });

  it('treats a tab whose group is unknown as ungrouped', () => {
    const tab = makeTab({ groupId: 999 });
    const { rows } = buildRows({ tabs: [tab], query: '', groupById: new Map(), collapsed: none });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'tab', nested: false });
  });

  it('keeps search results flat in the given order, with the group colour as a stripe', () => {
    const g = makeGroup({ id: 7, color: 'green', title: 'Reading' });
    const [grouped, loose] = [makeTab({ groupId: 7 }), makeTab()];
    const { rows, visibleTabs } = buildRows({
      tabs: [loose, grouped], // relevance order
      query: 'x',
      groupById: groupMap(g),
      collapsed: new Set([7]), // ignored while searching
    });

    expect(rows.every((r) => r.kind === 'tab')).toBe(true);
    expect(visibleTabs).toEqual([loose, grouped]);
    expect(rows[1]).toMatchObject({ color: 'green', groupTitle: 'Reading', nested: false });
    expect(rows[0]).toMatchObject({ color: undefined });
  });

  it('lists pinned tabs first, keeping their order, ahead of groups and other tabs', () => {
    const g = makeGroup({ id: 7 });
    const loose = makeTab();
    const grouped = makeTab({ groupId: 7 });
    const [pinA, pinB] = [makeTab({ pinned: true }), makeTab({ pinned: true })];
    const { rows, visibleTabs } = buildRows({
      tabs: [loose, grouped, pinA, pinB],
      query: '',
      groupById: groupMap(g),
      collapsed: none,
    });

    expect(rows.map((r) => (r.kind === 'header' ? 'H' : r.doc.tabId))).toEqual([
      pinA.tabId,
      pinB.tabId,
      loose.tabId,
      'H',
      grouped.tabId,
    ]);
    expect(visibleTabs.map((t) => t.tabId)).toEqual([pinA.tabId, pinB.tabId, loose.tabId, grouped.tabId]);
  });

  it('keeps relevance order while searching, even for pinned tabs', () => {
    const [plain, pinned] = [makeTab(), makeTab({ pinned: true })];
    const { visibleTabs } = buildRows({
      tabs: [plain, pinned],
      query: 'x',
      groupById: new Map(),
      collapsed: none,
    });
    expect(visibleTabs).toEqual([plain, pinned]);
  });

  it('treats a whitespace-only query as no query', () => {
    const g = makeGroup({ id: 7 });
    const { rows } = buildRows({
      tabs: [makeTab({ groupId: 7 })],
      query: '   ',
      groupById: groupMap(g),
      collapsed: none,
    });
    expect(rows[0]?.kind).toBe('header');
  });
});
