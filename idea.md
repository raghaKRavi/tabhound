# Tab Search Extension — Idea & Plan

## The idea

A browser extension that captures all open tabs in Chrome and lets the user
**search across them by content/title** and jump straight to the matching tab —
instead of manually clicking through every tab to find the one you want.

> Example: you have tab 1, tab 2, … tab N open, and a tiramisu recipe is on
> tab 7. Open the extension, search "tiramisu", click the result → it focuses
> tab 7 (even if it's in another window).

### Features
1. **Search & focus** — search open tabs, click a result to switch to that tab.
2. **Multi-select close** — select the tabs you want to keep, click "close
   others" → closes everything *except* the selected set. (Chrome's built-in
   "Close other tabs" only keeps one tab; this keeps multiple.)
3. **Cross-window** — works across all windows of the same profile (incl. a tab
   dragged out into a new window).

---

## Feasibility summary

| Requirement | v1 (no backend) | Notes |
|---|---|---|
| List tabs, search by title/URL, click to focus | ✅ | `chrome.tabs` API |
| Search meta description + h1 | ✅ | tiny content script |
| Close all tabs *except* multiple selected | ✅ | `chrome.tabs.remove([...])` |
| One profile, many windows (incl. dragged-out tab) | ✅ | `chrome.tabs.query({})` spans all windows |
| Full page-content search + summarize | ⚠️ v2 | bigger content script + index |
| Two *different* profiles / same profile on two *machines* | ❌ v3 | isolated sandboxes — needs a backend |

**Key insight:** an extension is sandboxed *per profile*. All windows of one
profile share one extension instance, so multi-window is free. Only genuinely
separate profiles or separate machines need a sync backend.

---

## Tech stack

- **TypeScript** + **Manifest V3**
- **WXT** (`npx wxt@latest init`) — extension framework, removes boilerplate,
  cross-browser (Chrome/Edge/Firefox) from one codebase
- **MiniSearch** — in-memory full-text search (fuzzy, prefix, field boosting)
- UI: plain TS or Preact/Svelte (tiny popup)

---

## Architecture (v1 — single profile, no backend)

```
┌─────────────────────────────────────────────┐
│                 Chrome Profile               │
│  ┌────────────┐   messaging    ┌─────────┐   │
│  │  Popup UI  │◄─────────────► │ Service │   │
│  │ search +   │                │ Worker  │   │
│  │ results    │                │(bg core)│   │
│  └────────────┘                └────┬────┘   │
│        ▲ live search                │ inject  │
│        │ over MiniSearch index      ▼         │
│        │                      ┌──────────┐    │
│        └───────────────────── │ Content  │    │
│                               │ Scripts  │    │
│                               │(meta only)│   │
│                               └──────────┘    │
│   chrome.storage.local ◄── cached index        │
└─────────────────────────────────────────────┘
```

**Service worker** keeps a live tab list (`onCreated/onUpdated/onRemoved`),
holds the search index in memory, persists to `chrome.storage.local`, and
handles actions: focus tab + raise its window, multi-close.

**Content script** (cheap) grabs only lightweight metadata per page.

**Popup UI** = search box + result rows + checkboxes + "Open" / "Close others".

### Focus a tab in another window
```ts
await chrome.tabs.update(tabId, { active: true });
await chrome.windows.update(windowId, { focused: true }); // raises the other window
```

### v1 indexes per tab
Free from `chrome.tabs`: `title`, `url`, `favIconUrl`.
Via tiny content script: `meta[name=description]` / `og:description`, first `<h1>`.

```ts
type TabDoc = {
  tabId: number; windowId: number;
  title: string; url: string; description: string; h1: string;
};
```

### Search config
```ts
const index = new MiniSearch({
  fields: ['title', 'description', 'h1', 'url'],
  storeFields: ['tabId', 'windowId', 'title', 'url', 'favIconUrl'],
  searchOptions: {
    boost: { title: 3, h1: 2, description: 1.5, url: 1 },
    fuzzy: 0.2,   // tolerates typos
    prefix: true, // matches as you type
  },
});
```

### Keep index fresh
```
onCreated   → add doc
onUpdated   → re-grab meta, replace doc
onRemoved   → remove doc
onActivated → (optional) recency boost
startup     → chrome.tabs.query({}) rebuilds whole index
```

### Permissions
- v1-lite (title+URL only): `tabs`, `storage` — easiest store review
- v1-meta (adds description+h1): `tabs`, `storage`, `scripting` + host perms

---

## Deployment

- **Chrome Web Store** — $5 one-time dev fee, zip the build, submit for review.
  Broad permissions → need a privacy policy + longer review.
- **Cross-browser** via WXT: Edge (Chrome store works too), Firefox (AMO, free).
- **CI/CD:** GitHub Actions → build + zip + `chrome-webstore-upload` on tag.
- **Backend (only if v3):** Node (Fastify/Hono) or Go + Postgres/Redis,
  WebSockets for cross-device "open this tab", auth to group devices,
  privacy policy + encryption.

---

## Roadmap / build order

- [ ] **v1** — WXT + TS + MiniSearch. List tabs, fuzzy search title+URL+meta,
      focus across windows, multi-select close. Single profile. No backend.
  - [ ] Scaffold: `npx wxt@latest init`
  - [ ] Service worker: tab list + index + storage persistence
  - [ ] Content script: grab title/description/h1 metadata
  - [ ] Popup UI: search box + results + focus action
  - [ ] Multi-select + "close all except selected"
  - [ ] Load unpacked in Chrome, test
  - [ ] Publish to Chrome Web Store
- [ ] **v2** — full page-content extraction + summarization (same pipeline,
      bigger content script + `content` field in the index).
- [ ] **v3** — cross-profile / cross-device sync via backend + auth.

---

## Next step

Scaffold **v1** (WXT + TypeScript + MiniSearch): working popup that lists,
searches title/URL/meta, focuses across windows, and multi-closes — loadable
unpacked in Chrome to try immediately. Build v1-meta but keep the metadata-grab
as one isolated module so it expands cleanly into v2's full content scan.
