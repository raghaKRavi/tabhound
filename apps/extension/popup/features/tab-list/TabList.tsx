import type { TabDoc } from '@/lib/tab-index';
import { GroupHeader } from './GroupHeader';
import { TabRow } from './TabRow';
import type { Row } from './types';
import './TabList.css';

type Props = {
  rows: Row[];
  /** Number of tabs matching the query (zero shows the empty message). */
  matchCount: number;
  query: string;
  selected: Set<number>;
  highlighted: number;
  windowLabels: Map<number, number>;
  totalWindows: number;
  onHighlight: (index: number) => void;
  onToggleTab: (tabId: number) => void;
  onToggleGroup: (tabIds: number[]) => void;
  onToggleCollapse: (groupId: number) => void;
  onOpen: (doc: TabDoc) => void;
};

/** Scrollable list of tab rows and group headers. */
export function TabList({
  rows,
  matchCount,
  query,
  selected,
  highlighted,
  windowLabels,
  totalWindows,
  onHighlight,
  onToggleTab,
  onToggleGroup,
  onToggleCollapse,
  onOpen,
}: Props) {
  return (
    <div class="results">
      {matchCount === 0 ? (
        <div class="empty">{query ? 'No tabs match your search.' : 'No open tabs.'}</div>
      ) : (
        rows.map((row) =>
          row.kind === 'header' ? (
            <GroupHeader
              key={`g${row.id}`}
              row={row}
              selected={selected}
              windowLabel={
                totalWindows > 1 ? `Window ${windowLabels.get(row.windowId) ?? '?'}` : undefined
              }
              onToggleSelect={onToggleGroup}
              onToggleCollapse={onToggleCollapse}
            />
          ) : (
            <TabRow
              key={row.doc.tabId}
              row={row}
              query={query}
              selected={selected.has(row.doc.tabId)}
              highlighted={row.index === highlighted}
              onHover={() => onHighlight(row.index)}
              onToggleSelect={onToggleTab}
              onOpen={onOpen}
            />
          ),
        )
      )}
    </div>
  );
}
