import MiniSearch from 'minisearch';

export type TabDoc = {
  tabId: number;
  windowId: number;
  groupId: number; // -1 = not in a group
  title: string;
  url: string;
  favIconUrl?: string;
  description: string;
  h1: string;
};

function makeIndex(): MiniSearch<TabDoc> {
  return new MiniSearch<TabDoc>({
    idField: 'tabId',
    fields: ['title', 'description', 'h1', 'url'],
    storeFields: ['tabId', 'windowId', 'title', 'url', 'favIconUrl', 'description', 'h1'],
    searchOptions: {
      boost: { title: 3, h1: 2, description: 1.5, url: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
}

export class TabStore {
  private index = makeIndex();
  private docs = new Map<number, TabDoc>();

  upsert(doc: TabDoc): void {
    if (this.docs.has(doc.tabId)) {
      this.index.replace(doc);
    } else {
      this.index.add(doc);
    }
    this.docs.set(doc.tabId, doc);
  }

  remove(tabId: number): void {
    if (!this.docs.has(tabId)) return;
    this.index.discard(tabId);
    this.docs.delete(tabId);
  }

  get(tabId: number): TabDoc | undefined {
    return this.docs.get(tabId);
  }

  all(): TabDoc[] {
    return [...this.docs.values()];
  }

  search(query: string): TabDoc[] {
    const q = query.trim();
    if (!q) return this.all();
    const results = this.index.search(q);
    const out: TabDoc[] = [];
    for (const r of results) {
      const doc = this.docs.get(r.id as number);
      if (doc) out.push(doc);
    }
    return out;
  }

  clear(): void {
    this.index.removeAll();
    this.docs.clear();
  }
}

export function tabToDoc(
  tab: chrome.tabs.Tab,
  meta?: { description: string; h1: string },
  existing?: TabDoc,
): TabDoc | null {
  if (tab.id == null || tab.windowId == null) return null;
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    groupId: tab.groupId ?? existing?.groupId ?? -1,
    title: tab.title ?? existing?.title ?? '',
    url: tab.url ?? tab.pendingUrl ?? existing?.url ?? '',
    favIconUrl: tab.favIconUrl ?? existing?.favIconUrl,
    description: meta?.description ?? existing?.description ?? '',
    h1: meta?.h1 ?? existing?.h1 ?? '',
  };
}
