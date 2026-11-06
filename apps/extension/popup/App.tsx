import { useCallback, useMemo, useState } from 'preact/hooks';
import { ActionBar } from './features/actions/ActionBar';
import { ConfirmCloseOthers } from './features/actions/ConfirmCloseOthers';
import { useTabActions } from './features/actions/useTabActions';
import { ContentSearchBar } from './features/content-search/ContentSearchBar';
import { useContentSearch } from './features/content-search/useContentSearch';
import { GroupPanel } from './features/groups/GroupPanel';
import { useGroups } from './features/groups/useGroups';
import { Header } from './features/header/Header';
import { usePopupKeys } from './features/keyboard/usePopupKeys';
import { SearchBox } from './features/search/SearchBox';
import { useSelection } from './features/selection/useSelection';
import { useTabs } from './features/tabs/useTabs';
import { TabList } from './features/tab-list/TabList';
import { useHighlight } from './features/tab-list/useHighlight';
import { useTabRows } from './features/tab-list/useTabRows';
import { NoticeBar } from './shared/ui/NoticeBar';
import './App.css';

/** At most one panel/confirmation is open at a time, above the action bar. */
type Overlay = 'none' | 'group' | 'confirmCloseOthers';

/** Wires the popup's features together; each feature owns its own state and markup. */
export function App() {
  const [query, setQuery] = useState('');
  const [overlay, setOverlay] = useState<Overlay>('none');

  const { allTabs, tabs, windowLabels, totalWindows } = useTabs(query);
  const { groups, groupById } = useGroups();
  const { rows, visibleTabs, toggleCollapsed } = useTabRows(tabs, query, groupById);
  const selection = useSelection();
  const actions = useTabActions(selection.ids, allTabs);
  const content = useContentSearch();
  const { highlighted, setHighlighted, move } = useHighlight(visibleTabs.length, [query, allTabs]);

  const closeOverlay = useCallback(() => setOverlay('none'), []);
  const clearQuery = useCallback(() => setQuery(''), []);

  const onKeyDown = usePopupKeys({
    visibleTabs,
    highlighted,
    query,
    overlayOpen: overlay !== 'none',
    moveHighlight: move,
    openTab: actions.openTab,
    clearQuery,
    closeOverlay,
  });

  const firstSelectedUrl = useMemo(
    () => allTabs.find((t) => t.tabId === selection.ids[0])?.url,
    [allTabs, selection.ids],
  );

  return (
    <div class="popup" onKeyDown={onKeyDown}>
      <Header tabCount={tabs.length} windowCount={totalWindows} />
      <SearchBox query={query} onChange={setQuery} matchCount={tabs.length} />

      <TabList
        rows={rows}
        matchCount={tabs.length}
        query={query}
        selected={selection.selected}
        highlighted={highlighted}
        windowLabels={windowLabels}
        totalWindows={totalWindows}
        onHighlight={setHighlighted}
        onToggleTab={selection.toggle}
        onToggleGroup={selection.toggleMany}
        onToggleCollapse={toggleCollapsed}
        onOpen={actions.openTab}
      />

      <ContentSearchBar enabled={content.enabled} onToggle={content.toggle} />

      {actions.error && (
        <NoticeBar actions={<button onClick={actions.clearError}>Dismiss</button>}>
          {actions.error}
        </NoticeBar>
      )}

      {overlay === 'group' && (
        <GroupPanel
          selectedCount={selection.count}
          firstUrl={firstSelectedUrl}
          groups={groups}
          windowLabels={windowLabels}
          onCreate={(title, color) => actions.groupInto({ kind: 'new', title, color })}
          onAddTo={(groupId) => actions.groupInto({ kind: 'existing', groupId })}
          onCancel={closeOverlay}
        />
      )}

      {overlay === 'confirmCloseOthers' && (
        <ConfirmCloseOthers
          closeCount={Math.max(allTabs.length - selection.count, 0)}
          keepCount={selection.count}
          onCancel={closeOverlay}
          onConfirm={actions.closeOthers}
        />
      )}

      {selection.count > 0 && (
        <ActionBar
          selectedCount={selection.count}
          onOpen={actions.openSelected}
          onCloseSelected={actions.closeSelected}
          onGroup={() => setOverlay('group')}
          onMoveToNewWindow={actions.moveToNewWindow}
          onCloseOthers={() => setOverlay('confirmCloseOthers')}
        />
      )}
    </div>
  );
}
