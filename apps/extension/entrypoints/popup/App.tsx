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

  const displayedTabs = tabs;
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

  const groupTabs = useCallback(() => {
    const tabIds = [...selected];
    if (!tabIds.length) return;
    const msg: GroupRequest = { type: 'group', tabIds };
    return runAction(msg);
  }, [selected, runAction]);

  const moveToNewWindow = useCallback(() => {
    const tabIds = [...selected];
    if (!tabIds.length) return;
    const msg: MoveToNewWindowRequest = { type: 'moveToNewWindow', tabIds };
    return runAction(msg);
  }, [selected, runAction]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) setQuery('');
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
        e.preventDefault();
        const doc = displayedTabs[highlighted];
        if (doc) openTab(doc);
      }
    },
    [displayedTabs, highlighted, openTab, query],
  );

  const selectedCount = selected.size;

  const headerCount = useMemo(() => {
    const t = displayedTabs.length;
    const w = totalWindows;
    return `${t} tab${t === 1 ? '' : 's'} · ${w} window${w === 1 ? '' : 's'}`;
  }, [displayedTabs.length, totalWindows]);

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
            {displayedTabs.length} match{displayedTabs.length === 1 ? '' : 'es'}
          </p>
        )}
      </div>

      <div class="results">
        {displayedTabs.length === 0 ? (
          <div class="empty">{query ? 'No tabs match your search.' : 'No open tabs.'}</div>
        ) : (
          displayedTabs.map((t, i) => {
            const isSelected = selected.has(t.tabId);
            const isHighlighted = i === highlighted;
            return (
              <div
                key={t.tabId}
                class={`row${isSelected ? ' selected' : ''}${isHighlighted ? ' highlighted' : ''}`}
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
                  <button class="menu-item" onClick={groupTabs}>
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
