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
2. **Multi-select actions** — check any set of tabs, then act on them in bulk:
   - **Close others** — closes everything *except* the selected set. (Chrome's
     built-in "Close other tabs" only keeps one tab; this keeps multiple.)
   - **Group** — put the selected tabs into a named tab group.
   - **Move to new window** — pull the selected tabs out into their own window.
   - **Open** — focus a single selected tab.
3. **Cross-window** — works across all windows of the same profile (incl. a tab
   dragged out into a new window).

### UX reference
Design to follow: [`design/popup-mockup.html`](design/popup-mockup.html) —
open it in a browser to see the target look & feel. Spec captured below in the
"Popup UX spec" section. Keep implementation faithful to this mockup.

---

## Feasibility summary

| Requirement | v1 (no backend) | Notes |
|---|---|---|
| List tabs, search by title/URL, click to focus | ✅ | `chrome.tabs` API |
| Search meta description + h1 | ✅ | tiny content script |
| Close all tabs *except* multiple selected | ✅ | `chrome.tabs.remove([...])` |
| Group selected tabs into a named group | ✅ | `chrome.tabs.group()` + `chrome.tabGroups.update()` (needs `tabGroups` perm) |
| Move selected tabs to a new window | ✅ | `chrome.windows.create({tabId})` + `chrome.tabs.move()` |
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
- **React 18** — popup UI
- **MiniSearch** — in-memory full-text search (fuzzy, prefix, field boosting)

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

**Popup UI** = search box + result rows + checkboxes + action bar
("Open" / "Group" / "New window" / "Close others"). See "Popup UX spec" below.

### Bulk actions on selected tabs
```ts
// Focus a tab in another window
await chrome.tabs.update(tabId, { active: true });
await chrome.windows.update(windowId, { focused: true }); // raises the other window

// Close all EXCEPT the selected set
const keep = new Set(selectedIds);
const toClose = allTabs.filter(t => !keep.has(t.id)).map(t => t.id);
await chrome.tabs.remove(toClose);

// Group the selected tabs (needs "tabGroups" permission)
const groupId = await chrome.tabs.group({ tabIds: selectedIds });
await chrome.tabGroups.update(groupId, { title: 'TabHound', color: 'blue' });

// Move the selected tabs into a brand-new window
const [first, ...rest] = selectedIds;
const win = await chrome.windows.create({ tabId: first });
if (rest.length) await chrome.tabs.move(rest, { windowId: win.id, index: -1 });
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
- Bulk actions add: `tabGroups` (for the Group action)

---

## Popup UX spec

Reference file to build against: [`design/popup-mockup.html`](design/popup-mockup.html).
Fixed popup size ~**380 × 520px**.

**States**
1. **Empty query** → show all tabs grouped by window; header shows
   "N tabs · M windows".
2. **Active query** → ranked results, matched term highlighted (`<mark>`),
   result count caption.
3. **1+ selected** → action bar appears at the bottom.

**Layout (top → bottom)**
- **Header** — "TabHound" + live "24 tabs · 3 windows" count.
- **Search box** — focused style, search icon, clear (`×`) button.
- **Result rows** — each: checkbox · favicon · title (with match highlight) ·
  url · window badge (`win 1/2/3`). Row hover + selected states.
- **Action bar** (when 1+ checked) — "N selected" + a primary **Open** button
  and an **Actions ▾** dropdown holding the bulk actions:
  **Group tabs** · **Move to new window** · (separator) · **Close all others**
  (danger styling). Dropdown keeps the bar clean at 380px width.

**Interactions**
- Type → live filter. `↑/↓` move highlight, `Enter` opens highlighted, `Esc`
  clears query. `Space` toggles the highlighted row's checkbox.
- Click a row (not the checkbox) → focus that tab, close popup.
- Open → focus the single checked tab. Group / New window / Close others → act
  on the checked set, then close popup.

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

- [ ] **v1** — WXT + React + TS + MiniSearch. List tabs, fuzzy search
      title+URL+meta, focus across windows, bulk actions. Single profile.
      No backend. Build to match [`design/popup-mockup.html`](design/popup-mockup.html).
  - [ ] Scaffold: `npx wxt@latest init` (React + TypeScript)
  - [ ] Service worker: tab list + index + storage persistence
  - [ ] Content script: grab title/description/h1 metadata
  - [ ] Popup UI: search box + results + focus action
  - [ ] Bulk actions: close others · group · move to new window
  - [ ] Keyboard nav (↑/↓/Enter/Esc/Space)
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
