import { useCallback, useMemo, useState } from 'preact/hooks';
import { ActionBar } from './features/actions/ActionBar';
import { ConfirmCloseOthers } from './features/actions/ConfirmCloseOthers';
import { useTabActions } from './features/actions/useTabActions';
import { useContentSearch } from './features/content-search/useContentSearch';
import { DuplicateStrip } from './features/duplicates/DuplicateStrip';
import { useDuplicates } from './features/duplicates/useDuplicates';
import { GroupPanel } from './features/groups/GroupPanel';
import { useGroups } from './features/groups/useGroups';
import { Header } from './features/header/Header';
import { usePopupKeys } from './features/keyboard/usePopupKeys';
import { RecentlyClosed } from './features/recently-closed/RecentlyClosed';
import { useRecentlyClosed } from './features/recently-closed/useRecentlyClosed';
import { SearchBox } from './features/search/SearchBox';
import { SettingsPanel } from './features/settings/SettingsPanel';
import { SelectAllBar } from './features/selection/SelectAllBar';
import { useSelection } from './features/selection/useSelection';
import { useTabs } from './features/tabs/useTabs';
import { TabList } from './features/tab-list/TabList';
import { useHighlight } from './features/tab-list/useHighlight';
import { useTabRows } from './features/tab-list/useTabRows';
import type { TabDoc } from '@/lib/tab-index';
import { NoticeBar } from './shared/ui/NoticeBar';
import './App.css';

/** At most one panel/confirmation is open at a time, above the action bar. */
type Overlay = 'none' | 'group' | 'confirmCloseOthers' | 'settings';

/** Wires the popup's features together; each feature owns its own state and markup. */
export function App() {
  const [query, setQuery] = useState('');
  const [overlay, setOverlay] = useState<Overlay>('none');

  const { allTabs, tabs, windowLabels, totalWindows, loading, removeTab } = useTabs(query);
  const { groups, groupById } = useGroups();
  const { rows, visibleTabs, toggleCollapsed } = useTabRows(tabs, query, groupById);
  const selection = useSelection();
  const actions = useTabActions(selection.ids, allTabs);
  const content = useContentSearch();
  const closed = useRecentlyClosed(query);
  const { highlighted, setHighlighted, move } = useHighlight(visibleTabs.length, [query, allTabs]);

  const closeOne = useCallback(
    async (doc: TabDoc) => {
      if (await actions.closeTab(doc.tabId)) {
        removeTab(doc.tabId);
        selection.drop(doc.tabId);
        closed.refresh();
      }
    },
    [actions.closeTab, removeTab, selection.drop, closed.refresh],
  );

  const closeOverlay =useCallback(() => setOverlay('none'), []);
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

  const selectedTabs = useMemo(
    () => allTabs.filter((t) => selection.selected.has(t.tabId)),
    [allTabs, selection.selected],
  );
  const allPinned = selectedTabs.length > 0 && selectedTabs.every((t) => t.pinned);
  const pinLeavesGroup = selectedTabs.some((t) => t.groupId >= 0);
  const anyGrouped = pinLeavesGroup;

  const dups = useDuplicates(allTabs, tabs);

  /** Badge click: keep this tab and select the other copies in its set (click again to clear). */
  const keepThisCopy = useCallback(
    (doc: TabDoc) => {
      const set = dups.all.setOf.get(doc.tabId) ?? [];
      const others = set.filter((id) => id !== doc.tabId);
      const alreadyPicked =
        !selection.selected.has(doc.tabId) && others.every((id) => selection.selected.has(id));
      const rest = selection.ids.filter((id) => !set.includes(id));
      selection.setAll(alreadyPicked ? rest : [...rest, ...others]);
    },
    [dups.all, selection.selected, selection.ids, selection.setAll],
  );
  const allExtrasSelected =
    dups.visible.extras.length > 0 && dups.visible.extras.every((id) => selection.selected.has(id));
  // With one tab ticked: select its other copies and leave the ticked one open.
  const onlySelectedId = selection.count === 1 ? selection.ids[0] : undefined;
  const copiesOfSelected =
    onlySelectedId == null
      ? []
      : (dups.all.setOf.get(onlySelectedId) ?? []).filter((id) => id !== onlySelectedId);

  return (
    <div class="popup" onKeyDown={onKeyDown}>
      <Header
        tabCount={tabs.length}
        windowCount={totalWindows}
        onSettings={() => setOverlay((o) => (o === 'settings' ? 'none' : 'settings'))}
      />
      <SearchBox query={query} onChange={setQuery} matchCount={tabs.length} />

      {overlay === 'settings' && (
        <SettingsPanel
          contentSearchEnabled={content.enabled}
          onToggleContentSearch={content.toggle}
          onClose={closeOverlay}
        />
      )}

      {!loading && (
        <SelectAllBar
          total={tabs.length}
          selectedCount={tabs.filter((t) => selection.selected.has(t.tabId)).length}
          onSelectAll={() => selection.setAll(tabs.map((t) => t.tabId))}
          onClear={() => selection.setAll([])}
        />
      )}

      {!loading && (
        <DuplicateStrip
          extraCount={dups.visible.extras.length}
          setCount={dups.visible.setCount}
          allSelected={allExtrasSelected}
          onSelect={() => selection.setAll(dups.visible.extras)}
          onClear={() => selection.setAll([])}
        />
      )}

      <TabList
        dupBadges={dups.badges}
        onDupClick={keepThisCopy}
        rows={rows}
        loading={loading}
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
        onClose={closeOne}
      >
        <RecentlyClosed items={closed.items} onReopen={closed.reopen} onDismiss={closed.dismiss} />
      </TabList>

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
          allPinned={allPinned}
          pinLeavesGroup={pinLeavesGroup}
          onTogglePin={() => actions.setPinned(!allPinned)}
          onOpen={actions.openSelected}
          onCloseSelected={actions.closeSelected}
          onGroup={() => setOverlay('group')}
          hasDuplicates={copiesOfSelected.length > 0}
          onSelectDuplicates={() => selection.setAll(copiesOfSelected)}
          anyGrouped={anyGrouped}
          onUngroup={actions.ungroup}
          onMoveToNewWindow={actions.moveToNewWindow}
          onCloseOthers={() => setOverlay('confirmCloseOthers')}
        />
      )}
    </div>
  );
}
