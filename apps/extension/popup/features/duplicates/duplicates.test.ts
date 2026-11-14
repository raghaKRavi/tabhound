import { describe, expect, it } from 'vitest';
import type { TabDoc } from '@/lib/tab-index';
import { findDuplicates, normalizeUrl } from './duplicates';

const tab = (tabId: number, url: string, over: Partial<TabDoc> = {}): TabDoc => ({
  tabId,
  windowId: 1,
  groupId: -1,
  pinned: false,
  title: '',
  url,
  description: '',
  h1: '',
  ...over,
});

describe('normalizeUrl', () => {
  it('ignores fragments and a trailing slash but keeps the query', () => {
    expect(normalizeUrl('https://a.com/x/#top')).toBe('https://a.com/x');
    expect(normalizeUrl('https://a.com/x?q=1')).toBe('https://a.com/x?q=1');
  });
});

describe('findDuplicates', () => {
  const none = new Set<number>();

  it('finds nothing when every URL is unique', () => {
    const d = findDuplicates([tab(1, 'https://a.com'), tab(2, 'https://b.com')], none);
    expect(d.extras).toEqual([]);
    expect(d.setCount).toBe(0);
  });

  it('keeps the first tab of each set and lists the rest, across several sets', () => {
    const d = findDuplicates(
      [
        tab(1, 'https://g.com'),
        tab(2, 'https://g.com/'),
        tab(3, 'https://y.com'),
        tab(4, 'https://g.com#x'),
        tab(5, 'https://y.com'),
        tab(6, 'https://u.com'),
      ],
      none,
    );
    expect(d.setCount).toBe(2);
    expect(d.extras).toEqual([2, 4, 5]);
    expect(d.badges.get(4)).toEqual({ n: 3, of: 3 });
    expect(d.badges.get(6)).toBeUndefined();
  });

  it('keeps the active tab, then a pinned one, then a grouped one', () => {
    expect(findDuplicates([tab(1, 'https://a.com'), tab(2, 'https://a.com')], new Set([2])).extras).toEqual([1]);
    expect(
      findDuplicates([tab(1, 'https://a.com'), tab(2, 'https://a.com', { pinned: true })], none).extras,
    ).toEqual([1]);
    expect(
      findDuplicates([tab(1, 'https://a.com'), tab(2, 'https://a.com', { groupId: 5 })], none).extras,
    ).toEqual([1]);
  });
});
