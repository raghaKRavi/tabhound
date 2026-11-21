import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

export type BookmarkHit = {
  id: string;
  title: string;
  url: string;
  /** Title of the folder it lives in, when known. */
  folder?: string;
};

export type BookmarkFolder = { id: string; title: string; depth: number };

const BOOKMARKS: chrome.permissions.Permissions = { permissions: ['bookmarks'] };
const PREF_KEY = 'tabhound.includeBookmarks';
const SHOW_LIMIT = 10;

function loadPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function savePref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? '1' : '0');
  } catch {
    /* storage unavailable; the choice lasts until the popup closes */
  }
}

/**
 * "Include bookmarks" for the search box. The `bookmarks` permission is optional: the first
 * time the toggle is switched on the browser asks for it, and nothing is read before that.
 */
export function useBookmarks(query: string) {
  const [granted, setGranted] = useState(false);
  const [pref, setPref] = useState(loadPref);
  const [hits, setHits] = useState<BookmarkHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  // The query `hits` belong to. Derived (not an effect-set flag) so the very first render after
  // typing already counts as searching, with no frame of "no results" in between.
  const [settledQuery, setSettledQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Bumped to search again for the same query (e.g. after moving bookmarks to another folder).
  const [reload, setReload] = useState(0);

  useEffect(() => {
    chrome.permissions
      ?.contains(BOOKMARKS)
      .then(setGranted)
      .catch(() => setGranted(false));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const [notice, setNotice] = useState<string | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);
  /** A short confirmation ("Removed 2 bookmarks.") that dismisses itself. */
  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((cur) => (cur === message ? null : cur)), 2500);
  }, []);

  const enabled = pref && granted;

  // permissions.request must run directly from the click (user gesture).
  const toggle = useCallback(async () => {
    if (enabled) {
      setPref(false);
      savePref(false);
      return;
    }
    setError(null);
    let ok = granted;
    if (!ok) {
      try {
        ok = await chrome.permissions.request(BOOKMARKS);
      } catch (err) {
        console.error('[tabhound] bookmarks permission request failed', err);
        setError(`Couldn't ask for bookmark access: ${err instanceof Error ? err.message : err}`);
        return;
      }
      setGranted(ok);
      if (!ok) {
        setError('Bookmark access was not granted.');
        return;
      }
    }
    if (ok) {
      setPref(true);
      savePref(true);
    }
  }, [enabled, granted]);

  useEffect(() => {
    const q = query.trim();
    if (!enabled || !q) {
      setHits([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const found = (await chrome.bookmarks.search(q))
          .filter((b) => b.url && !b.url.startsWith('javascript:'))
          .slice(0, SHOW_LIMIT);
        const parentIds = [...new Set(found.map((b) => b.parentId).filter((id): id is string => !!id))];
        const [firstId, ...restIds] = parentIds;
        const parents = firstId ? await chrome.bookmarks.get([firstId, ...restIds]) : [];
        const folderOf = new Map<string, string>(parents.map((p) => [p.id, p.title]));
        if (cancelled) return;
        setSettledQuery(q);
        setHits(
          found.map((b) => ({
            id: b.id,
            title: b.title || b.url!,
            url: b.url!,
            folder: (b.parentId && folderOf.get(b.parentId)) || undefined,
          })),
        );
      } catch (err) {
        console.error('[tabhound] bookmark search failed', err);
        if (!cancelled) {
          setSettledQuery(q);
          setHits([]);
          setError(`Bookmark search failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, query, reload]);

  const searching = enabled && query.trim() !== '' && settledQuery !== query.trim();

  // ── selection ─────────────────────────────────────────
  // Bookmark ids are strings in their own set, so they can never collide with tab ids.
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Selection follows what is on screen: a bookmark that left the results is deselected.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(hits.map((h) => h.id));
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [hits]);

  const selectedHits = useMemo(() => hits.filter((h) => selected.has(h.id)), [hits, selected]);

  // ── bulk actions ──────────────────────────────────────
  const done = useCallback(
    (message: string) => {
      clearSelection();
      flash(message);
    },
    [clearSelection, flash],
  );

  const fail = useCallback((what: string, err: unknown) => {
    console.error(`[tabhound] ${what}`, err);
    setError(`${what}: ${err instanceof Error ? err.message : err}`);
  }, []);

  /** Deletes the selected bookmarks from the browser (not just from this list). */
  const removeSelected = useCallback(async () => {
    const targets = selectedHits;
    try {
      await Promise.all(targets.map((h) => chrome.bookmarks.remove(h.id)));
      setHits((prev) => prev.filter((h) => !targets.some((t) => t.id === h.id)));
      done(`Removed ${targets.length} bookmark${targets.length === 1 ? '' : 's'}.`);
    } catch (err) {
      fail("Couldn't remove bookmarks", err);
    }
  }, [selectedHits, done, fail]);

  const openSelectedInTabs = useCallback(async () => {
    const targets = selectedHits;
    try {
      for (const [i, h] of targets.entries()) await chrome.tabs.create({ url: h.url, active: i === 0 });
      done(`Opened ${targets.length} bookmark${targets.length === 1 ? '' : 's'} in new tabs.`);
    } catch (err) {
      fail("Couldn't open bookmarks", err);
    }
  }, [selectedHits, done, fail]);

  const openSelectedInWindow = useCallback(async () => {
    const targets = selectedHits;
    try {
      await chrome.windows.create({ url: targets.map((h) => h.url) });
      done(`Opened ${targets.length} bookmark${targets.length === 1 ? '' : 's'} in a new window.`);
    } catch (err) {
      fail("Couldn't open a new window", err);
    }
  }, [selectedHits, done, fail]);

  const moveSelected = useCallback(
    async (folder: BookmarkFolder) => {
      const targets = selectedHits;
      try {
        for (const h of targets) await chrome.bookmarks.move(h.id, { parentId: folder.id });
        setReload((n) => n + 1); // folder tags changed; search again
        done(`Moved ${targets.length} bookmark${targets.length === 1 ? '' : 's'} to ${folder.title}.`);
      } catch (err) {
        fail("Couldn't move bookmarks", err);
      }
    },
    [selectedHits, done, fail],
  );

  return {
    enabled,
    hits,
    searching,
    toggle,
    error,
    clearError,
    notice,
    clearNotice,
    selected,
    selectedHits,
    toggleSelect,
    clearSelection,
    removeSelected,
    openSelectedInTabs,
    openSelectedInWindow,
    moveSelected,
  };
}

/** Folders a bookmark can be moved into, in tree order with their depth for indenting. */
export async function loadFolders(): Promise<BookmarkFolder[]> {
  const out: BookmarkFolder[] = [];
  const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number) => {
    for (const n of nodes) {
      if (n.url) continue;
      // The tree root (id "0") has no title and can't hold bookmarks.
      if (n.id !== '0') out.push({ id: n.id, title: n.title || 'Untitled folder', depth });
      if (n.children) walk(n.children, n.id === '0' ? depth : depth + 1);
    }
  };
  walk(await chrome.bookmarks.getTree(), 0);
  return out;
}
