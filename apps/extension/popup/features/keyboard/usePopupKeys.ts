import { useCallback } from 'preact/hooks';
import type { TabDoc } from '@/lib/tab-index';

type Args = {
  visibleTabs: TabDoc[];
  highlighted: number;
  query: string;
  /** A panel or confirmation is open and should close before anything else on Escape. */
  overlayOpen: boolean;
  moveHighlight: (delta: 1 | -1) => void;
  openTab: (doc: TabDoc) => void;
  clearQuery: () => void;
  closeOverlay: () => void;
};

/** Keyboard handling for the popup: arrows move, Enter opens, Escape backs out one level. */
export function usePopupKeys({
  visibleTabs,
  highlighted,
  query,
  overlayOpen,
  moveHighlight,
  openTab,
  clearQuery,
  closeOverlay,
}: Args) {
  return useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overlayOpen) closeOverlay();
        else if (query) clearQuery();
        else window.close();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveHighlight(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveHighlight(-1);
        return;
      }
      if (e.key === 'Enter') {
        if ((e.target as HTMLElement).closest?.('button')) return; // let the focused button handle it
        e.preventDefault();
        const doc = visibleTabs[highlighted];
        if (doc) openTab(doc);
      }
    },
    [visibleTabs, highlighted, query, overlayOpen, moveHighlight, openTab, clearQuery, closeOverlay],
  );
}
