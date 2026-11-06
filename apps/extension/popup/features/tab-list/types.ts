import type { GroupColor } from '@/lib/messaging';
import type { TabDoc } from '@/lib/tab-index';

export type HeaderRow = {
  kind: 'header';
  id: number;
  title: string;
  color: GroupColor;
  windowId: number;
  count: number;
  /** Every tab in the group, including ones hidden by collapsing. */
  tabIds: number[];
  collapsed: boolean;
};

export type TabRowData = {
  kind: 'tab';
  doc: TabDoc;
  /** Position among the visible tabs; drives keyboard highlight. */
  index: number;
  /** Set when the tab belongs to a group. */
  color?: GroupColor;
  groupTitle?: string;
  /** Listed under its group's header. */
  nested: boolean;
  /** Last tab of its group's section. */
  last: boolean;
};

export type Row = HeaderRow | TabRowData;
