import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Icon } from './Icon';
import type { TabDoc } from '@/lib/tab-index';
import type {
  BackgroundResponse,
  CloseOthersRequest,
  CloseSelectedRequest,
  ErrorResponse,
  FocusRequest,
  GroupColor,
  GroupRequest,
  ListResponse,
  MoveToNewWindowRequest,
  PopupToBackground,
  SearchResponse,
} from '@/lib/messaging';
import './App.css';

function send<T extends BackgroundResponse>(msg: PopupToBackground): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else if ((res as BackgroundResponse | undefined)?.type === 'error') {
        reject(new Error((res as ErrorResponse).message));
      } else resolve(res as T);
    });
  });
}

function highlight(text: string, query: string): JSX.Element {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts: (string | JSX.Element)[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark>{text.slice(idx, idx + needle.length)}</mark>);
    i = idx + needle.length;
  }
  return <>{parts}</>;
}

// Capability checks, not browser sniffing: the manifest only declares
// `favicon` / `tabGroups` where the browser supports them.
const canUseFaviconApi = (chrome.runtime.getManifest().permissions ?? []).includes('favicon');
const canGroupTabs =
  typeof chrome.tabs?.group === 'function' && typeof chrome.tabGroups?.update === 'function';

function chromeFavicon(url: string, size = 32): string {
  const u = new URL(chrome.runtime.getURL('/_favicon/'));
  try {
    const origin = new URL(url).origin;
    u.searchParams.set('pageUrl', origin);
  } catch {
    u.searchParams.set('pageUrl', url);
  }
  u.searchParams.set('size', String(size));
  return u.toString();
}

function isInternalUrl(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    !url
  );
}

function Favicon({ url, favIconUrl }: { url: string; favIconUrl?: string }) {
  const chain = useMemo(() => {
    if (isInternalUrl(url)) return [];
    const list: string[] = [];
    // Browser's local favicon cache first (no network) where available.
    if (canUseFaviconApi) list.push(chromeFavicon(url));
    if (favIconUrl) list.push(favIconUrl);
    return list;
  }, [url, favIconUrl]);

  const [i, setI] = useState(0);
  const src = chain[i];
  if (!src) return <Icon name="world" size={13} />;
  return (
    <img
      src={src}
      alt=""
      referrerpolicy="no-referrer"
      onError={() => setI((n) => n + 1)}
    />
  );
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/\/$/, '');
  } catch {
    return url;
  }
}

const GROUP_COLORS: GroupColor[] = [
  'blue',
  'cyan',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'grey',
];

type ExistingGroup = { id: number; title: string; color: GroupColor; windowId: number };

function defaultGroupName(url: string | undefined): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '') || 'Tabhound';
  } catch {
    return 'Tabhound';
  }
}

type GroupInfo = { title: string; color: GroupColor; windowId: number };

type Row =
  | {
      kind: 'header';
      id: number;
      title: string;
      color: GroupColor;
      windowId: number;
      count: number;
      tabIds: number[];
      collapsed: boolean;
    }
  | { kind: 'tab'; doc: TabDoc; index: number; color?: GroupColor; nested: boolean; last?: boolean };

export function App() {
  const [query, setQuery] = useState('');
  const [tabs, setTabs] = useState<TabDoc[]>([]);
  const [allTabs, setAllTabs] = useState<TabDoc[]>([]);
  const [windowCount, setWindowCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [highlighted, setHighlighted] = useState(0);
  const [focusedInput, setFocusedInput] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contentOn, setContentOn] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.permissions
      .contains({ origins: ['<all_urls>'] })
      .then(setContentOn)
      .catch(() => setContentOn(false));
  }, []);

  // permissions.request must run directly from the click (user gesture).
  const toggleContent = useCallback(async () => {
    const origins = ['<all_urls>'];
    if (contentOn) {
      await send({ type: 'disableContent' });
      await chrome.permissions.remove({ origins });
      setContentOn(false);
      return;
    }
    const granted = await chrome.permissions.request({ origins });
    if (!granted) return;
    setContentOn(true);
    await send({ type: 'enableContent' });
  }, [contentOn]);

  useEffect(() => {
    send<ListResponse>({ type: 'list' }).then((r) => {
      setAllTabs(r.tabs);
      setTabs(r.tabs);
      setWindowCount(r.windowCount);
    });
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancel = false;
    if (!query.trim()) {
      setTabs(allTabs);
    } else {
      send<SearchResponse>({ type: 'search', query }).then((r) => {
        if (!cancel) setTabs(r.results);
      });
    }
    setHighlighted(0);
    return () => {
      cancel = true;
    };
  }, [query, allTabs]);

  const windowLabels = useMemo(() => {
    const map = new Map<number, number>();
    let n = 1;
    for (const t of allTabs) {
      if (!map.has(t.windowId)) map.set(t.windowId, n++);
    }
    return map;
  }, [allTabs]);

  const totalWindows = windowCount || windowLabels.size;

  const toggleSelect = useCallback((tabId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  }, []);

  const [error, setError] = useState<string | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [groupPanel, setGroupPanel] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState<GroupColor>('blue');
  const [groups, setGroups] = useState<ExistingGroup[]>([]);
  const [groupFilter, setGroupFilter] = useState('');
  const groupInputRef = useRef<HTMLInputElement>(null);
  const [groupInfo, setGroupInfo] = useState<Map<number, GroupInfo>>(new Map());
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!canGroupTabs) return;
    chrome.tabGroups
      .query({})
      .then((found) =>
        setGroupInfo(
          new Map(
            found.map((g) => [
              g.id,
              { title: g.title ?? '', color: g.color as GroupColor, windowId: g.windowId },
            ]),
          ),
        ),
      )
      .catch(() => {});
  }, []);

  const toggleGroupSelected = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) for (const id of ids) next.delete(id);
      else for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // With no query, tabs are listed under collapsible group headers. While searching the list
  // stays flat so relevance order is kept, and group membership shows as a coloured stripe.
  const { rows, displayedTabs } = useMemo(() => {
    const info = (t: TabDoc) => (t.groupId >= 0 ? groupInfo.get(t.groupId) : undefined);
    const rows: Row[] = [];
    const visible: TabDoc[] = [];
    const addTab = (doc: TabDoc, color: GroupColor | undefined, nested: boolean, last = false) => {
      rows.push({ kind: 'tab', doc, index: visible.length, color, nested, last });
      visible.push(doc);
    };

    if (query.trim()) {
      for (const t of tabs) addTab(t, info(t)?.color, false);
      return { rows, displayedTabs: visible };
    }

    const members = new Map<number, TabDoc[]>();
    for (const t of tabs) {
      if (info(t)) members.set(t.groupId, [...(members.get(t.groupId) ?? []), t]);
    }
    const emitted = new Set<number>();
    for (const t of tabs) {
      const g = info(t);
      if (!g) {
        addTab(t, undefined, false);
        continue;
      }
      if (emitted.has(t.groupId)) continue;
      emitted.add(t.groupId);
      const list = members.get(t.groupId) ?? [];
      const isCollapsed = collapsed.has(t.groupId);
      rows.push({
        kind: 'header',
        id: t.groupId,
        title: g.title,
        color: g.color,
        windowId: g.windowId,
        count: list.length,
        tabIds: list.map((m) => m.tabId),
        collapsed: isCollapsed,
      });
      if (!isCollapsed) list.forEach((m, n) => addTab(m, g.color, true, n === list.length - 1));
    }
    return { rows, displayedTabs: visible };
  }, [tabs, query, groupInfo, collapsed]);

  useEffect(() => {
    if (groupPanel) groupInputRef.current?.focus();
  }, [groupPanel]);

  // Runs a background action; closes the popup on success, shows the error otherwise.
  const runAction = useCallback(async (msg: PopupToBackground) => {
    try {
      await send(msg);
      window.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }, []);

  const openTab = useCallback(
    (doc: TabDoc) => {
      const msg: FocusRequest = { type: 'focus', tabId: doc.tabId, windowId: doc.windowId };
      return runAction(msg);
    },
    [runAction],
  );

  const openSelected = useCallback(async () => {
    const [id] = [...selected];
    if (id == null) return;
    const doc = displayedTabs.find((t) => t.tabId === id) ?? tabs.find((t) => t.tabId === id);
    if (doc) await openTab(doc);
  }, [selected, displayedTabs, tabs, openTab]);

  const closeSelected = useCallback(() => {
    const tabIds = [...selected];
    if (!tabIds.length) return;
    const msg: CloseSelectedRequest = { type: 'closeSelected', tabIds };
    return runAction(msg);
  }, [selected, runAction]);

  const closeOthers = useCallback(() => {
    const keepTabIds = [...selected];
    if (!keepTabIds.length) return;
    const msg: CloseOthersRequest = { type: 'closeOthers', keepTabIds };
    return runAction(msg);
  }, [selected, runAction]);

  const firstSelectedUrl = useMemo(() => {
    const [id] = [...selected];
    return allTabs.find((t) => t.tabId === id)?.url;
  }, [selected, allTabs]);

  const openGroupPanel = useCallback(async () => {
    setMenuOpen(false);
    setConfirmOthers(false);
    setGroupName('');
    setGroupFilter('');
    try {
      const found = await chrome.tabGroups.query({});
      setGroups(
        found.map((g) => ({
          id: g.id,
          title: g.title ?? '',
          color: g.color as GroupColor,
          windowId: g.windowId,
        })),
      );
    } catch {
      setGroups([]);
    }
    setGroupPanel(true);
  }, []);

  const groupInto = useCallback(
    (target: GroupRequest['target']) => {
      const tabIds = [...selected];
      if (!tabIds.length) return;
      const msg: GroupRequest = { type: 'group', tabIds, target };
      return runAction(msg);
    },
    [selected, runAction],
  );

  const filteredGroups = useMemo(() => {
    const q = groupFilter.trim().toLowerCase();
    return q ? groups.filter((g) => (g.title || 'unnamed group').toLowerCase().includes(q)) : groups;
  }, [groups, groupFilter]);

  const createGroup = useCallback(() => {
    const title = groupName.trim() || defaultGroupName(firstSelectedUrl);
    return groupInto({ kind: 'new', title, color: groupColor });
  }, [groupName, groupColor, firstSelectedUrl, groupInto]);

  const moveToNewWindow = useCallback(() => {
    const tabIds = [...selected];
    if (!tabIds.length) return;
    const msg: MoveToNewWindowRequest = { type: 'moveToNewWindow', tabIds };
    return runAction(msg);
  }, [selected, runAction]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (groupPanel || confirmOthers) {
          setGroupPanel(false);
          setConfirmOthers(false);
        } else if (query) setQuery('');
        else window.close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, displayedTabs.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        if ((e.target as HTMLElement).closest?.('button')) return; // let the focused button handle it
        e.preventDefault();
        const doc = displayedTabs[highlighted];
        if (doc) openTab(doc);
      }
    },
    [displayedTabs, highlighted, openTab, query, groupPanel, confirmOthers],
  );

  const selectedCount = selected.size;

  const headerCount = useMemo(() => {
    const t = tabs.length;
    const w = totalWindows;
    return `${t} tab${t === 1 ? '' : 's'} · ${w} window${w === 1 ? '' : 's'}`;
  }, [tabs.length, totalWindows]);

  return (
    <div class="popup" onKeyDown={onKeyDown}>
      <div class="head">
        <span class="icon">
          <Icon name="search" size={18} />
        </span>
        <span class="title">Tabhound</span>
        <span class="count">{headerCount}</span>
      </div>

      <div class="searchwrap">
        <div class={`searchbox${focusedInput ? ' focused' : ''}`}>
          <span class="icon leading">
            <Icon name="search" size={16} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search open tabs…"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onFocus={() => setFocusedInput(true)}
            onBlur={() => setFocusedInput(false)}
            autoFocus
          />
          {query && (
            <button class="clear" aria-label="clear" onClick={() => setQuery('')}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        {query && (
          <p class="caption">
            {tabs.length} match{tabs.length === 1 ? '' : 'es'}
          </p>
        )}
      </div>

      <div class="results">
        {tabs.length === 0 ? (
          <div class="empty">{query ? 'No tabs match your search.' : 'No open tabs.'}</div>
        ) : (
          rows.map((r) => {
            if (r.kind === 'header') {
              const picked = r.tabIds.filter((id) => selected.has(id)).length;
              const all = picked === r.tabIds.length;
              return (
                <div
                  key={`g${r.id}`}
                  class={`grouphead gc-${r.color}${r.collapsed ? ' collapsed' : ''}`}
                >
                  <div
                    class={`checkzone${all ? ' checked' : ''}`}
                    title="Select whole group"
                    onClick={() => toggleGroupSelected(r.tabIds)}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select all tabs in ${r.title || 'this group'}`}
                      checked={all}
                      indeterminate={picked > 0 && !all}
                      onChange={() => toggleGroupSelected(r.tabIds)}
                    />
                  </div>
                  <button
                    class="gh-toggle"
                    aria-expanded={!r.collapsed}
                    onClick={() => toggleCollapsed(r.id)}
                  >
                    <Icon name="chevron-down" size={13} />
                    <span class="dot" />
                    <span class="gh-name">{r.title || 'Unnamed group'}</span>
                    {totalWindows > 1 && (
                      <span class="gh-win">Window {windowLabels.get(r.windowId) ?? '?'}</span>
                    )}
                    <span class="gh-count">{r.count}</span>
                  </button>
                </div>
              );
            }
            const t = r.doc;
            const i = r.index;
            const isSelected = selected.has(t.tabId);
            const isHighlighted = i === highlighted;
            return (
              <div
                key={t.tabId}
                class={`row${isSelected ? ' selected' : ''}${isHighlighted ? ' highlighted' : ''}${r.color ? ` ingroup gc-${r.color}` : ''}${r.nested ? ' nested' : ''}${r.last ? ' last' : ''}`}
                title={r.color && !r.nested ? groupInfo.get(t.groupId)?.title || 'In a group' : undefined}
                onMouseEnter={() => setHighlighted(i)}
              >
                <div
                  class={`checkzone${isSelected ? ' checked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(t.tabId);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(t.tabId)}
                  />
                </div>
                <div class="row-body" onClick={() => openTab(t)}>
                  <div class="fav">
                    <Favicon url={t.url} favIconUrl={t.favIconUrl} />
                  </div>
                  <div class="meta">
                    <p class="row-title">{highlight(t.title || shortUrl(t.url), query)}</p>
                    <p class="row-url">{highlight(shortUrl(t.url), query)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div class="contentbar">
        <span>
          {contentOn
            ? 'Searching page descriptions & headings. Stays on this device.'
            : 'Also search page descriptions & headings (needs access to all sites).'}
        </span>
        <button onClick={toggleContent}>{contentOn ? 'Turn off' : 'Turn on'}</button>
      </div>

      {error && (
        <div class="errorbar" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {groupPanel && (
        <div
          class="grouppanel"
          role="dialog"
          aria-label="Group tabs"
          onKeyDown={(e) => {
            // keep Enter/arrows from triggering the tab list behind the panel
            e.stopPropagation();
            if (e.key === 'Escape') setGroupPanel(false);
          }}
        >
          <p class="gp-title">
            Group {selectedCount} tab{selectedCount === 1 ? '' : 's'}
          </p>
          <div class="gp-new">
            <input
              type="text"
              ref={groupInputRef}
              value={groupName}
              placeholder={defaultGroupName(firstSelectedUrl)}
              maxLength={60}
              onInput={(e) => setGroupName((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createGroup();
                }
              }}
            />
            <button class="primary" onClick={createGroup}>
              Create group
            </button>
          </div>
          <div class="gp-colors" role="radiogroup" aria-label="Group colour">
            {GROUP_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={groupColor === c}
                aria-label={c}
                class={`dot gc-${c}${groupColor === c ? ' on' : ''}`}
                onClick={() => setGroupColor(c)}
              />
            ))}
          </div>
          {groups.length > 0 && (
            <>
              <p class="gp-sub">Or add to an existing group</p>
              {groups.length > 3 && (
                <input
                  type="text"
                  class="gp-filter"
                  placeholder="Filter groups…"
                  value={groupFilter}
                  onInput={(e) => setGroupFilter((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    const only = filteredGroups.length === 1 ? filteredGroups[0] : undefined;
                    if (e.key === 'Enter' && only) {
                      e.preventDefault();
                      groupInto({ kind: 'existing', groupId: only.id });
                    }
                  }}
                />
              )}
              <div class={`gp-list${groups.length > 3 ? ' scroll' : ''}`}>
                {filteredGroups.map((g) => (
                  <button
                    key={g.id}
                    class="gp-item"
                    onClick={() => groupInto({ kind: 'existing', groupId: g.id })}
                  >
                    <span class={`dot gc-${g.color}`} />
                    <span class="gp-name">{g.title || 'Unnamed group'}</span>
                    <span class="gp-win">Window {windowLabels.get(g.windowId) ?? '?'}</span>
                  </button>
                ))}
                {filteredGroups.length === 0 && <p class="gp-none">No groups match.</p>}
              </div>
            </>
          )}
          <button class="gp-cancel" onClick={() => setGroupPanel(false)}>
            Cancel
          </button>
        </div>
      )}

      {confirmOthers && (
        <div class="errorbar confirm" role="alertdialog">
          <span>
            Close {Math.max(allTabs.length - selectedCount, 0)} other tab
            {allTabs.length - selectedCount === 1 ? '' : 's'}? Only the {selectedCount} selected will
            stay open.
          </span>
          <button onClick={() => setConfirmOthers(false)}>Cancel</button>
          <button class="danger" onClick={closeOthers}>
            Close them
          </button>
        </div>
      )}

      {selectedCount > 0 && (
        <div class="actionbar">
          <span class="count">{selectedCount} selected</span>
          {selectedCount === 1 && (
            <button onClick={openSelected}>
              <Icon name="arrow-right" size={14} />
              Open
            </button>
          )}
          <button class="danger" onClick={closeSelected}>
            <Icon name="x" size={14} />
            Close selected
          </button>
          <div class="menu-wrap">
            <button onClick={() => setMenuOpen((v) => !v)}>
              <Icon name="dots" size={14} />
              Actions
              <Icon name="chevron-down" size={13} />
            </button>
            {menuOpen && (
              <div class="menu">
                {canGroupTabs && (
                  <button class="menu-item" onClick={openGroupPanel}>
                    <Icon name="grid-add" size={15} />
                    Group tabs
                  </button>
                )}
                <button class="menu-item" onClick={moveToNewWindow}>
                  <Icon name="app-window" size={15} />
                  Move to new window
                </button>
                <button
                  class="menu-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOthers(true);
                  }}
                >
                  <Icon name="x" size={15} />
                  Close all others
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
