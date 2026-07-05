import type { TabDoc } from './tab-index';

export type SearchRequest = { type: 'search'; query: string };
export type SearchResponse = { type: 'search'; results: TabDoc[] };

export type FocusRequest = { type: 'focus'; tabId: number; windowId: number };
export type CloseOthersRequest = { type: 'closeOthers'; keepTabIds: number[] };

export type PopupToBackground = SearchRequest | FocusRequest | CloseOthersRequest;
export type BackgroundToPopup = SearchResponse;
