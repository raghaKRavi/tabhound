import MiniSearch from 'minisearch';

export type TabDoc = {
  tabId: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  description: string;
  h1: string;
};

export function createIndex(): MiniSearch<TabDoc> {
  return new MiniSearch<TabDoc>({
    idField: 'tabId',
    fields: ['title', 'description', 'h1', 'url'],
    storeFields: ['tabId', 'windowId', 'title', 'url', 'favIconUrl'],
    searchOptions: {
      boost: { title: 3, h1: 2, description: 1.5, url: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
}
