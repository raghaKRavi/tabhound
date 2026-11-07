import { TabStore, tabToDoc } from '@/lib/tab-index';
import type {
  BackgroundToContent,
  ContentToBackground,
  PopupToBackground,
  BackgroundResponse,
} from '@/lib/messaging';

export default defineBackground(() => {
  const store = new TabStore();
  let ready: Promise<void>;

  // ── opt-in content search ─────────────────────────────
  const CS_ID = 'tabhound-meta';
  const CS_FILE = 'content-scripts/content.js';
  const ALL_URLS = { origins: ['<all_urls>'] };

  const hasHostAccess = () => chrome.permissions.contains(ALL_URLS).catch(() => false);

  async function registerContentScript() {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [CS_ID] });
    if (existing.length) return;
    await chrome.scripting.registerContentScripts([
      {
        id: CS_ID,
        js: [CS_FILE],
        matches: ['http://*/*', 'https://*/*'],
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ]);
  }

  async function unregisterContentScript() {
    try {
      await chrome.scripting.unregisterContentScripts({ ids: [CS_ID] });
    } catch {
      /* not registered */
    }
  }

  // Keep registration in line with the permission (e.g. user revoked it in browser settings).
  async function syncContentScript(): Promise<boolean> {
    if (await hasHostAccess()) {
      await registerContentScript();
      return true;
    }
    await unregisterContentScript();
    return false;
  }

  // Run the script in tabs that were already open when the user opted in.
  async function injectIntoOpenTabs() {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    await Promise.all(
      tabs.map((t) =>
        t.id == null
          ? undefined
          : chrome.scripting
              .executeScript({ target: { tabId: t.id }, files: [CS_FILE] })
              .catch(() => {
                /* restricted page (e.g. web store) or tab gone */
              }),
      ),
    );
  }

  // Ask already-injected tabs to re-report description/h1 after an index rebuild.
  async function requestMetaFromTabs(tabs: chrome.tabs.Tab[]) {
    await Promise.all(
      tabs.map((t) =>
        t.id == null
          ? undefined
          : chrome.tabs
              .sendMessage(t.id, { type: 'requestMeta' } satisfies BackgroundToContent)
              .catch(() => {
                /* no content script in this tab */
              }),
      ),
    );
  }

  function clearAllMeta() {
    for (const d of store.all()) store.upsert({ ...d, description: '', h1: '' });
  }

  async function rebuildFromScratch() {
    store.clear();
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      const doc = tabToDoc(t);
      if (doc) store.upsert(doc);
    }
    if (await syncContentScript()) void requestMetaFromTabs(tabs);
  }

  function scheduleRebuild() {
    ready = rebuildFromScratch();
  }

  chrome.permissions.onRemoved.addListener((p) => {
    if (p.origins?.length) {
      void unregisterContentScript();
      clearAllMeta();
    }
  });

  function reindexTab(tab: chrome.tabs.Tab) {
    const existing = tab.id != null ? store.get(tab.id) : undefined;
    const doc = tabToDoc(tab, undefined, existing);
    if (doc) store.upsert(doc);
  }

  // ── lifecycle ─────────────────────────────────────────
  chrome.runtime.onStartup.addListener(scheduleRebuild);
  chrome.runtime.onInstalled.addListener(scheduleRebuild);
  scheduleRebuild(); // fire on every SW start too

  // ── tab events ────────────────────────────────────────
  chrome.tabs.onCreated.addListener((tab) => reindexTab(tab));

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.groupId !== undefined || changeInfo.pinned !== undefined || changeInfo.title || changeInfo.url || changeInfo.favIconUrl) {
      reindexTab(tab);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => store.remove(tabId));

  chrome.tabs.onAttached.addListener(async (tabId) => {
    try {
      const tab = await chrome.tabs.get(tabId);
      reindexTab(tab);
    } catch {
      /* tab may be gone */
    }
  });
  chrome.tabs.onDetached.addListener(async (tabId) => {
    try {
      const tab = await chrome.tabs.get(tabId);
      reindexTab(tab);
    } catch {
      /* tab may be gone */
    }
  });

  // ── messages ──────────────────────────────────────────
  chrome.runtime.onMessage.addListener(
    (msg: PopupToBackground | ContentToBackground, sender, sendResponse) => {
      handle(msg, sender)
        .then((res) => sendResponse(res))
        .catch((err) => {
          console.error('[tabhound]', err);
          sendResponse({
            type: 'error',
            message: err instanceof Error ? err.message : 'Something went wrong.',
          } as BackgroundResponse);
        });
      return true; // async
    },
  );

  async function handle(
    msg: PopupToBackground | ContentToBackground,
    sender: chrome.runtime.MessageSender,
  ): Promise<BackgroundResponse> {
    switch (msg.type) {
      case 'list': {
        await ready;
        const tabs = store.all();
        const windowCount = new Set(tabs.map((t) => t.windowId)).size;
        return { type: 'list', tabs, windowCount };
      }
      case 'search': {
        await ready;
        return { type: 'search', results: store.search(msg.query) };
      }
      case 'focus': {
        await chrome.tabs.update(msg.tabId, { active: true });
        await chrome.windows.update(msg.windowId, { focused: true });
        return { type: 'ok' };
      }
      case 'closeOthers': {
        const keep = new Set(msg.keepTabIds);
        const toClose = store.all().map((d) => d.tabId).filter((id) => !keep.has(id));
        if (toClose.length) await chrome.tabs.remove(toClose);
        return { type: 'ok' };
      }
      case 'closeSelected': {
        if (msg.tabIds.length) await chrome.tabs.remove(msg.tabIds);
        return { type: 'ok' };
      }
      case 'group': {
        if (typeof chrome.tabs.group !== 'function') return { type: 'ok' }; // unsupported browser
        const [gFirst, ...gRest] = msg.tabIds;
        if (gFirst == null) return { type: 'ok' };
        const tabIds = [gFirst, ...gRest] as [number, ...number[]];
        const reindexAll = async () => {
          for (const id of tabIds) {
            const t = await chrome.tabs.get(id).catch(() => undefined);
            if (t) reindexTab(t);
          }
        };
        if (msg.target.kind === 'existing') {
          // Tabs from other windows are moved into the group's window.
          await chrome.tabs.group({ tabIds, groupId: msg.target.groupId });
          await reindexAll();
          return { type: 'ok' };
        }
        const first = await chrome.tabs.get(gFirst);
        const groupId = await chrome.tabs.group({
          tabIds,
          createProperties: { windowId: first.windowId },
        });
        await chrome.tabGroups.update(groupId, {
          title: msg.target.title,
          color: msg.target.color,
        });
        await reindexAll();
        return { type: 'ok' };
      }
      case 'moveToNewWindow': {
        const [first, ...rest] = msg.tabIds;
        if (first == null) return { type: 'ok' };

        // Moving a tab to another window drops it from its group, so remember each group's
        // look now (Chrome deletes a group once it is empty) and rebuild it in the new window.
        const canGroup = typeof chrome.tabs.group === 'function' && !!chrome.tabGroups;
        const regroup = new Map<number, { tabIds: number[]; title: string; color: string }>();
        if (canGroup) {
          for (const id of msg.tabIds) {
            const t = await chrome.tabs.get(id).catch(() => undefined);
            if (!t || t.groupId == null || t.groupId < 0) continue;
            let entry = regroup.get(t.groupId);
            if (!entry) {
              const g = await chrome.tabGroups.get(t.groupId).catch(() => undefined);
              entry = { tabIds: [], title: g?.title ?? '', color: g?.color ?? 'grey' };
              regroup.set(t.groupId, entry);
            }
            entry.tabIds.push(id);
          }
        }

        const win = await new Promise<chrome.windows.Window | undefined>((resolve) => {
          chrome.windows.create({ tabId: first }, (w) => resolve(w));
        });
        if (rest.length && win?.id != null) {
          await chrome.tabs.move(rest, { windowId: win.id, index: -1 });
        }

        if (win?.id != null) {
          for (const g of regroup.values()) {
            const [head, ...tail] = g.tabIds;
            if (head == null) continue;
            try {
              const groupId = await chrome.tabs.group({
                tabIds: [head, ...tail] as [number, ...number[]],
                createProperties: { windowId: win.id },
              });
              await chrome.tabGroups.update(groupId, {
                title: g.title,
                color: g.color as chrome.tabGroups.Color,
              });
            } catch {
              /* e.g. pinned tabs can't be grouped; the move itself already worked */
            }
          }
          const moved = await Promise.all(msg.tabIds.map((id) => chrome.tabs.get(id).catch(() => undefined)));
          for (const t of moved) if (t) reindexTab(t);
        }
        return { type: 'ok' };
      }
      case 'pin': {
        // Browsers take a pinned tab out of its group, so reindex to pick up both changes.
        for (const id of msg.tabIds) {
          const tab = await chrome.tabs.update(id, { pinned: msg.pinned });
          if (tab) reindexTab(tab);
        }
        return { type: 'ok' };
      }
      case 'enableContent': {
        if (!(await hasHostAccess())) return { type: 'ok' };
        await registerContentScript();
        await injectIntoOpenTabs();
        return { type: 'ok' };
      }
      case 'disableContent': {
        await unregisterContentScript();
        clearAllMeta();
        return { type: 'ok' };
      }
      case 'meta': {
        const tabId = sender.tab?.id;
        if (tabId == null) return { type: 'ok' };
        const existing = store.get(tabId);
        if (existing) {
          store.upsert({ ...existing, description: msg.meta.description, h1: msg.meta.h1 });
        }
        return { type: 'ok' };
      }
    }
  }

});
