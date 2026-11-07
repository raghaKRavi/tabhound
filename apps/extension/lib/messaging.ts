import type { TabDoc } from './tab-index';
import type { PageMeta } from './meta';

export type ListRequest = { type: 'list' };
export type ListResponse = { type: 'list'; tabs: TabDoc[]; windowCount: number };

export type SearchRequest = { type: 'search'; query: string };
export type SearchResponse = { type: 'search'; results: TabDoc[] };

export type FocusRequest = { type: 'focus'; tabId: number; windowId: number };
export type CloseOthersRequest = { type: 'closeOthers'; keepTabIds: number[] };
export type CloseSelectedRequest = { type: 'closeSelected'; tabIds: number[] };
export type GroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

export type GroupTarget =
  | { kind: 'new'; title: string; color: GroupColor }
  | { kind: 'existing'; groupId: number };

export type GroupRequest = { type: 'group'; tabIds: number[]; target: GroupTarget };
export type MoveToNewWindowRequest = { type: 'moveToNewWindow'; tabIds: number[] };

export type PinRequest = { type: 'pin'; tabIds: number[]; pinned: boolean };
export type EnableContentRequest = { type: 'enableContent' };
export type DisableContentRequest = { type: 'disableContent' };

export type MetaReport = { type: 'meta'; meta: PageMeta };

export type PopupToBackground =
  | ListRequest
  | SearchRequest
  | FocusRequest
  | CloseOthersRequest
  | CloseSelectedRequest
  | GroupRequest
  | MoveToNewWindowRequest
  | PinRequest
  | EnableContentRequest
  | DisableContentRequest;

export type ContentToBackground = MetaReport;

// background -> content script (via tabs.sendMessage)
export type BackgroundToContent = { type: 'requestMeta' };

export type ErrorResponse = { type: 'error'; message: string };

export type BackgroundResponse = ListResponse | SearchResponse | ErrorResponse | { type: 'ok' };
