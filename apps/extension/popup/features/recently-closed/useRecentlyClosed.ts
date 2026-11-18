import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { canUseSessions } from '../../shared/lib/capabilities';

export type ClosedTab = {
  sessionId: string;
  title: string;
  url: string;
  favIconUrl?: string;
  /** Seconds since the epoch. */
  closedAt: number;
};

const FETCH_LIMIT = 25; // chrome.sessions.MAX_SESSION_RESULTS
const SHOW_LIMIT = 10;
const DISMISSED_KEY = 'tabhound.dismissedClosed';

// Chrome has no API to delete a session entry, so "dismiss" is remembered locally.
function loadDismissed(): Set<string> {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* storage unavailable; the dismissal lasts until the popup closes */
  }
}

/** Recently closed tabs (from chrome.sessions) that match `query`, minus the ones dismissed. */
export function useRecentlyClosed(query: string) {
  const [all, setAll] = useState<ClosedTab[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const refresh = useCallback(() => {
    if (!canUseSessions) return;
    chrome.sessions
      .getRecentlyClosed({ maxResults: FETCH_LIMIT })
      .then((sessions) => {
        const tabs: ClosedTab[] = [];
        for (const s of sessions) {
          const t = s.tab;
          if (!t?.sessionId || !t.url) continue;
          tabs.push({
            sessionId: t.sessionId,
            title: t.title || t.url,
            url: t.url,
            favIconUrl: t.favIconUrl,
            closedAt: s.lastModified,
          });
        }
        setAll(tabs);
      })
      .catch(() => {
        /* no history available; the section stays hidden */
      });
  }, []);

  useEffect(refresh, [refresh]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((t) => !dismissed.has(t.sessionId))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q))
      .slice(0, SHOW_LIMIT);
  }, [all, dismissed, query]);

  const dismiss = useCallback((tab: ClosedTab) => {
    setDismissed((prev) => {
      const next = new Set(prev).add(tab.sessionId);
      saveDismissed(next);
      return next;
    });
  }, []);

  /** Restores the tab (back into its old window when that is still open). */
  const reopen = useCallback(async (tab: ClosedTab) => {
    try {
      await chrome.sessions.restore(tab.sessionId);
    } catch {
      /* the entry has expired; drop it from the list below */
    }
    setAll((prev) => prev.filter((t) => t.sessionId !== tab.sessionId));
  }, []);

  return { items, reopen, dismiss, refresh };
}
