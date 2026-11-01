# Building Tabhound from source

For AMO source-code review and for anyone reproducing the store builds.

## Requirements
- Node.js 20 or newer (built with 24.x)
- pnpm 11 (`corepack enable && corepack prepare pnpm@11.10.0 --activate`)
- No other tools, no network access needed at build time beyond `pnpm install`

## Steps
```sh
pnpm install --frozen-lockfile
pnpm build:firefox     # -> apps/extension/.output/firefox-mv3  (Firefox)
pnpm build             # -> apps/extension/.output/chrome-mv3    (Chrome, Brave, Vivaldi, Arc)
pnpm build:edge        # -> apps/extension/.output/edge-mv3      (Edge)
```
Store packages: `pnpm zip`, `pnpm zip:edge`, `pnpm zip:firefox`. The Firefox zip step also
writes `extension-<version>-sources.zip`, the archive uploaded to AMO.

The build is [WXT](https://wxt.dev) (Vite + Rolldown) compiling TypeScript and Preact. Bundled
libraries: `preact` (UI) and `minisearch` (in-memory search). No code is fetched at runtime.

## Notes for reviewers
- `web-ext lint` reports one warning, `UNSAFE_VAR_ASSIGNMENT` in `chunks/popup-*.js`. It comes from
  Preact's own `dangerouslySetInnerHTML` support; Tabhound never uses that prop.
- Host access (`<all_urls>`) is an **optional** permission. It is requested only when the user clicks
  "Turn on" for content search, after which the background registers `content-scripts/content.js`
  with `scripting.registerContentScripts`. The script reads only `meta[name=description]`
  (or `og:description`) and the first `<h1>`, and sends them to the extension's own background page.
- The extension makes no network requests.
