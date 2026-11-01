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
    if (changeInfo.status === 'complete' || changeInfo.title || changeInfo.url || changeInfo.favIconUrl) {
      reindexTab(tab);
    }
  });

  chrome.tabs.onRemoved.addListener((tabId) => store.remove(tabId));

  chrome.tabs.onAttached.addListener(async (tabId) => {
    const tab = await chrome.tabs.get(tabId);
    reindexTab(tab);
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
          sendResponse({ type: 'ok' } as BackgroundResponse);
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
        const [gFirst, ...gRest] = msg.tabIds;
        if (gFirst == null) return { type: 'ok' };
        const groupId = await chrome.tabs.group({
          tabIds: [gFirst, ...gRest] as [number, ...number[]],
        });
        try {
          await chrome.tabGroups.update(groupId, { title: 'TabHound', color: 'blue' });
        } catch {
          /* tabGroups permission may not be granted */
        }
        return { type: 'ok' };
      }
      case 'moveToNewWindow': {
        const [first, ...rest] = msg.tabIds;
        if (first == null) return { type: 'ok' };
        const win = await new Promise<chrome.windows.Window | undefined>((resolve) => {
          chrome.windows.create({ tabId: first }, (w) => resolve(w));
        });
        if (rest.length && win?.id != null) {
          await chrome.tabs.move(rest, { windowId: win.id, index: -1 });
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
