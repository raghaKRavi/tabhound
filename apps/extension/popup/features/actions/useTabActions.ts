import { useCallback, useState } from 'preact/hooks';
import type { GroupRequest, PopupToBackground } from '@/lib/messaging';
import type { TabDoc } from '@/lib/tab-index';
import { send } from '../../shared/lib/messaging-client';

/**
 * Things the user can do to tabs. Each sends a request to the background, closes the popup
 * on success, and keeps the failure message in `error` otherwise.
 */
export function useTabActions(selectedIds: number[], allTabs: TabDoc[]) {
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (msg: PopupToBackground) => {
    try {
      await send(msg);
      window.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }, []);

  const openTab = useCallback(
    (doc: TabDoc) => run({ type: 'focus', tabId: doc.tabId, windowId: doc.windowId }),
    [run],
  );

  const openSelected = useCallback(() => {
    const doc = allTabs.find((t) => t.tabId === selectedIds[0]);
    if (doc) return openTab(doc);
  }, [allTabs, selectedIds, openTab]);

  const closeSelected = useCallback(() => {
    if (selectedIds.length) return run({ type: 'closeSelected', tabIds: selectedIds });
  }, [selectedIds, run]);

  const closeOthers = useCallback(() => {
    if (selectedIds.length) return run({ type: 'closeOthers', keepTabIds: selectedIds });
  }, [selectedIds, run]);

  const moveToNewWindow = useCallback(() => {
    if (selectedIds.length) return run({ type: 'moveToNewWindow', tabIds: selectedIds });
  }, [selectedIds, run]);

  const setPinned = useCallback(
    (pinned: boolean) => {
      if (selectedIds.length) return run({ type: 'pin', tabIds: selectedIds, pinned });
    },
    [selectedIds, run],
  );

  const groupInto = useCallback(
    (target: GroupRequest['target']) => {
      if (selectedIds.length) return run({ type: 'group', tabIds: selectedIds, target });
    },
    [selectedIds, run],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    error,
    clearError,
    openTab,
    openSelected,
    closeSelected,
    closeOthers,
    moveToNewWindow,
    setPinned,
    groupInto,
  };
}
