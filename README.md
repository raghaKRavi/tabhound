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
pnpm build           # → apps/extension/.output/chrome-mv3/
pnpm zip             # → zipped artifact for Chrome Web Store submission
```

## Typecheck

```powershell
pnpm typecheck
```

## Permissions

The manifest requests: `tabs`, `storage`, `scripting`, and `<all_urls>` host permission. These are needed to enumerate open tabs across windows, persist the search index, and inject the tiny content script that reads each page's `<title>`, `meta[name=description]`, and first `<h1>`.
