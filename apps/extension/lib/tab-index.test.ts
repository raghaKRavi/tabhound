import { beforeEach, describe, expect, it } from 'vitest';
import { makeTab } from '../test/factories';
import { TabStore, tabToDoc } from './tab-index';

describe('TabStore', () => {
  let store: TabStore;
  beforeEach(() => {
    store = new TabStore();
  });

  it('finds tabs by title, url, description and heading', () => {
    store.upsert(makeTab({ tabId: 1, title: 'Tiramisu recipe' }));
    store.upsert(makeTab({ tabId: 2, url: 'https://pasta.example/carbonara' }));
    store.upsert(makeTab({ tabId: 3, description: 'How to bake sourdough' }));
    store.upsert(makeTab({ tabId: 4, h1: 'Espresso guide' }));

    const ids = (q: string) => store.search(q).map((t) => t.tabId);
    expect(ids('tiramisu')).toEqual([1]);
    expect(ids('carbonara')).toEqual([2]);
    expect(ids('sourdough')).toEqual([3]);
    expect(ids('espresso')).toEqual([4]);
  });

  it('matches prefixes and tolerates small typos', () => {
    store.upsert(makeTab({ tabId: 1, title: 'Documentation' }));
    expect(store.search('docu').map((t) => t.tabId)).toEqual([1]);
    expect(store.search('documentaton').map((t) => t.tabId)).toEqual([1]);
  });

  it('ranks a title match above a url-only match', () => {
    store.upsert(makeTab({ tabId: 1, title: 'unrelated', url: 'https://x.dev/react' }));
    store.upsert(makeTab({ tabId: 2, title: 'React docs', url: 'https://y.dev/' }));
    expect(store.search('react').map((t) => t.tabId)).toEqual([2, 1]);
  });

  it('returns everything for an empty or blank query', () => {
    store.upsert(makeTab({ tabId: 1 }));
    store.upsert(makeTab({ tabId: 2 }));
    expect(store.search('')).toHaveLength(2);
    expect(store.search('   ')).toHaveLength(2);
  });

  it('replaces a tab on upsert instead of duplicating it', () => {
    store.upsert(makeTab({ tabId: 1, title: 'old title' }));
    store.upsert(makeTab({ tabId: 1, title: 'new title' }));

    expect(store.all()).toHaveLength(1);
    expect(store.search('old')).toEqual([]);
    expect(store.search('new').map((t) => t.tabId)).toEqual([1]);
  });

  it('forgets removed tabs, and ignores removing an unknown one', () => {
    store.upsert(makeTab({ tabId: 1, title: 'findable' }));
    store.remove(1);
    store.remove(999);

    expect(store.get(1)).toBeUndefined();
    expect(store.search('findable')).toEqual([]);
  });

  it('clears everything', () => {
    store.upsert(makeTab({ tabId: 1, title: 'findable' }));
    store.clear();

    expect(store.all()).toEqual([]);
    expect(store.search('findable')).toEqual([]);
  });
});

describe('tabToDoc', () => {
  const chromeTab = (o: Partial<chrome.tabs.Tab>) => ({ index: 0, ...o }) as chrome.tabs.Tab;

  it('maps a browser tab, including its group', () => {
    const doc = tabToDoc(
      chromeTab({ id: 5, windowId: 2, groupId: 9, title: 'T', url: 'https://a.test/', favIconUrl: 'f.ico' }),
    );
    expect(doc).toMatchObject({ tabId: 5, windowId: 2, groupId: 9, title: 'T', url: 'https://a.test/' });
  });

  it('defaults to "not in a group" when the browser reports no group', () => {
    expect(tabToDoc(chromeTab({ id: 1, windowId: 1 }))?.groupId).toBe(-1);
  });

  it('returns null for tabs without an id or window', () => {
    expect(tabToDoc(chromeTab({ windowId: 1 }))).toBeNull();
    expect(tabToDoc(chromeTab({ id: 1 }))).toBeNull();
  });

  it('keeps page metadata from the previous version of the tab', () => {
    const existing = makeTab({ tabId: 1, description: 'desc', h1: 'Heading', title: 'Old' });
    const doc = tabToDoc(chromeTab({ id: 1, windowId: 1, title: 'New' }), undefined, existing);
    expect(doc).toMatchObject({ title: 'New', description: 'desc', h1: 'Heading' });
  });

  it('falls back to the pending URL while a tab is still loading', () => {
    const doc = tabToDoc(chromeTab({ id: 1, windowId: 1, pendingUrl: 'https://loading.test/' }));
    expect(doc?.url).toBe('https://loading.test/');
  });
});
