# Tabhound

A browser extension that captures all your open tabs and lets you **search across them by title, URL, and page metadata** — then jump straight to the matching tab instead of clicking through every window.

> Example: you have 40 tabs open and a tiramisu recipe is on tab 7. Open Tabhound, type "tiramisu", click the result → it focuses tab 7, even if it's in another window.

## Features (v1)

- **Search & focus** — fuzzy search open tabs by title, URL, meta description, and `<h1>`; click a result to switch to that tab.
- **Cross-window** — works across all windows of the same Chrome profile.
- **Multi-select close** — keep the tabs you check, close everything else. (Chrome's built-in "Close other tabs" only keeps one; this keeps many.)

See [idea.md](./idea.md) for the full roadmap (v2: full page-content search, v3: cross-device sync).

## Stack

- [WXT](https://wxt.dev) — Manifest V3 extension framework, cross-browser build
- TypeScript + Preact (via `@preact/preset-vite`)
- [MiniSearch](https://lucaong.github.io/minisearch/) — in-memory fuzzy search index
- pnpm workspaces

## Layout

```
tabhound/
├─ apps/
│  ├─ extension/     # the WXT extension (v1)
│  └─ server/        # reserved for v3 sync backend
├─ idea.md
└─ README.md
```

## Prerequisites

- **Node.js** 20+ (this repo was set up on 24.5.0)
- **pnpm** — if you don't have it, enable via corepack:
  ```powershell
  corepack enable
  corepack prepare pnpm@latest --activate
  ```

## Setup

```powershell
cd tabhound
pnpm install
```

If pnpm complains about ignored build scripts (esbuild, spawn-sync), approve them once:

```powershell
pnpm approve-builds --all
```

## Run in dev mode

```powershell
pnpm dev
```

This starts WXT in watch mode and outputs to `apps/extension/.output/chrome-mv3-dev/`.

**Load it in Chrome (one-time):**

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `apps/extension/.output/chrome-mv3-dev`
5. Pin the Tabhound icon in the toolbar

Edits to source files auto-reload the extension. Content-script edits require refreshing affected tabs.

## Production build

```powershell
pnpm build            # Chrome, Brave, Vivaldi, Arc  → apps/extension/.output/chrome-mv3/
pnpm build:edge       # Edge                         → .output/edge-mv3/
pnpm build:firefox    # Firefox                      → .output/firefox-mv3/
pnpm zip / zip:edge / zip:firefox   # store-ready zips (Firefox also writes the AMO sources zip)
```

Supported: Chrome, Edge, Brave, Vivaldi, Arc, Firefox 140+. Not targeted: Safari, Opera.
Publishing material lives in [docs/](./docs): [PRIVACY.md](./docs/PRIVACY.md), [BUILD.md](./docs/BUILD.md), [store/LISTING.md](./docs/store/LISTING.md).

## Typecheck

```powershell
pnpm typecheck
```

## Permissions

| Permission | Why |
|---|---|
| `tabs` | Read tab titles/URLs; focus, close, group, move tabs |
| `tabGroups`, `favicon` (Chromium only) | Tab groups; local favicon cache |
| `scripting` | Register the content script after the user opts in |
| `<all_urls>` (**optional**) | Requested only when the user turns on content search in the popup; reads each page's `meta[name=description]` and first `<h1>` |

Nothing leaves the device. See [docs/PRIVACY.md](./docs/PRIVACY.md).
