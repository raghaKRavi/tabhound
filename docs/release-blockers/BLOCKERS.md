# Tabhound – Release Blockers (Chrome Web Store + Firefox AMO)

Status legend: `[ ]` open · `[~]` in progress · `[x]` fixed

Files referenced are under `apps/extension/`.

---

## 1. [x] DuckDuckGo favicon fallback leaks browsing data

**Where:** `entrypoints/popup/App.tsx` → `duckFavicon()` (~line 59–65)

**Problem:** When the local favicon fails, the popup requests
`https://icons.duckduckgo.com/ip3/<hostname>.ico` for the tab's hostname. That sends the
hostname of every open tab (including private/internal sites) to a third party each time the
popup opens.

**Why it blocks:**
- Chrome Web Store "User Data" policy: transmitting browsing data to a third party requires
  disclosure and a privacy policy, and it fails the "limited use" expectation for a tab search tool.
- AMO reviewers flag undisclosed remote requests; Firefox's data-collection declaration would
  have to list "browsing activity".
- It is the single worst privacy issue in the extension.

**Fix:**
- Remove `duckFavicon()` and its call sites.
- Fall back to a local generic icon (letter/globe glyph from `Icon.tsx`).
- Chrome: keep the `_favicon` API (see blocker 3 for Firefox).

**Done when:** no `http(s)://` requests are made by the popup (verify in DevTools → Network).

---

## 2. [x] Over-broad permissions

**Where:** `wxt.config.ts` (`permissions`, `host_permissions`), `entrypoints/content.ts`

**Problem:**

| Permission | Used? | Action |
|---|---|---|
| `scripting` | No usage in code | Remove |
| `storage` | No usage in code | Remove (re-add only if persistence is added) |
| `tabs` | Yes (title/url) | Keep |
| `tabGroups` | Yes (group action), Chrome only | Keep for Chrome, see blocker 4 |
| `favicon` | Yes, Chrome only | Keep for Chrome, see blocker 3 |
| `<all_urls>` host perm + content script on all pages | Only to read `meta description` / `<h1>` | **Decision needed** |

**Why it blocks:** Chrome review rejects unused permissions ("Purple Potassium") and treats
`<all_urls>` as a high-scrutiny permission needing a written justification; review is slow and
often rejected. AMO also shows an install-time warning for all-sites access.

**Decision for v1 (pick one):**
- **A (recommended):** drop the content script and `host_permissions`; index title + URL only.
  `tabs` already gives title/url. Smallest permission surface, fastest review.
- **B:** keep the content script; write a justification ("reads page meta description and
  first heading to make tabs searchable; data never leaves the device"). Also fix the rebuild
  bug below.

**Related bug (only if B):** `background.ts` rebuilds the index on every service-worker start and
that drops description/h1 for already-open tabs, since the content script reports only once at
`document_idle`. Persist index in `storage.session` or re-request meta from tabs on rebuild.

**Done when:** manifest lists only permissions the code uses, and the choice A/B is recorded here.

---

## 3. [x] `favicon` permission / `/_favicon/` API is Chrome-only

**Where:** `wxt.config.ts` (`'favicon'`), `App.tsx` → `chromeFavicon()`

**Problem:** Firefox has no `favicon` permission and no `chrome-extension://…/_favicon/`
endpoint. The Firefox build will warn about an unknown permission and icons will be broken.

**Fix:**
- Chrome: keep `_favicon` URL.
- Firefox: use `tab.favIconUrl` (already stored in `TabDoc`), else the local fallback icon.
- Make the `favicon` permission Chrome-only via a per-browser manifest in `wxt.config.ts`
  (`manifest: ({ browser }) => ({ ... })`).

**Done when:** `pnpm build:firefox` has no unknown-permission warning and icons render in Firefox.

---

## 4. [x] `tabGroups` unsupported in Firefox

**Where:** `wxt.config.ts`, `entrypoints/background.ts` (`case 'group'`), popup group button

**Problem:** `chrome.tabGroups` / `tabs.group` are not available in Firefox (older ESR) or have
different behavior. The group action throws or silently fails.

**Fix:**
- Add `tabGroups` permission only in the Chrome manifest.
- Feature-detect (`typeof chrome.tabs.group === 'function' && chrome.tabGroups`) and hide the
  Group button when unsupported; send capability flag in the `list` response or check in popup.

**Done when:** Firefox popup has no broken Group button; Chrome unchanged.

---

## 5. [x] Firefox manifest requirements missing

**Where:** `wxt.config.ts`

**Problem:** AMO requires:
- `browser_specific_settings.gecko.id` (e.g. `tabhound@<your-domain-or-email>`) – needed for
  stable updates/storage.
- `browser_specific_settings.gecko.data_collection_permissions` (required for new AMO
  submissions) – declare `required: ["none"]` once blocker 1 is fixed.
- `strict_min_version` set to a version supporting everything used.
- Firefox MV3 runs the background as an **event page**, not a service worker – WXT generates this
  but must be tested (`pnpm dev:firefox`).

**Fix:** add to the manifest for `browser === 'firefox'` only. Run `npx web-ext lint` on the
Firefox build output and fix all errors/warnings.

**Done when:** `web-ext lint` is clean and the extension loads via `about:debugging`.

---

## 6. [x] No privacy policy

**Problem:** Chrome Web Store requires a privacy policy URL for extensions that handle URLs /
browsing activity (this one reads all tab titles and URLs). AMO expects a clear disclosure too.

**Fix:** write `docs/PRIVACY.md` stating:
- What is read: tab titles, URLs, favicons (and page description/h1 if blocker 2 = B).
- All processing is local; nothing is sent anywhere; no analytics; no remote code.
- Host it at a public URL (GitHub Pages / repo raw page) and paste into both store dashboards.
- Fill the Chrome "Privacy practices" tab and "Single purpose" statement consistently with it.

**Done when:** policy is published at a stable URL.

---

## Also required before submission (non-blocking but needed)

- Add `LICENSE` file; set `homepage_url` / `author` in manifest.
- Remove scaffold leftovers: `public/wxt.svg`, `assets/react.svg`, `apps/extension/README.md`,
  `<meta name="manifest.type">` in `popup/index.html`.
- Unify name casing (`Tabhound` vs `TabHound`).
- Error handling: `background.ts` replies `{type:'ok'}` on failure; wrap `onAttached` in try/catch.
- Confirm dialog / undo for "close others" (destructive).
- Store assets: 1280×800 screenshots, 440×280 promo tile (Chrome), description, category.
- AMO: sources zip + build instructions (`pnpm zip:firefox` produces it).
- Rebuild from clean (`.output` is stale: title casing differs from config).

---

## Fix order

1 → 2 → 3 → 4 → 5 → 6, then the "Also required" list.

---

## Resolution log

### Blocker 1 – done
Removed `duckFavicon()`; popup makes no third-party requests.

### Blocker 2 – done (decision: optional host permission, content search is opt-in)
- Removed unused `storage`. Kept `scripting` (needed to register the content script at runtime; no install warning).
- `<all_urls>` moved from `host_permissions` to `optional_host_permissions`. A `build:manifestGenerated` hook in `wxt.config.ts` strips the `host_permissions` / `content_scripts` WXT would otherwise add for a runtime script.
- Content script uses `registration: 'runtime'`. Popup has a "Turn on / Turn off" bar; on enable it calls `permissions.request` (user gesture), then the background registers the script (`persistAcrossSessions`) and injects it into already-open tabs.
- Background keeps registration in sync with the permission on every worker start, and clears description/h1 when access is revoked.
- Fixed the "meta lost after worker restart" bug: after an index rebuild the background sends `requestMeta` to tabs and the content script re-reports.
- Install prompt is now just "Read your browsing history" (from `tabs`); no all-sites warning.

**v2 plan (full-page text search), not started:** extractor in the content script, index persisted in IndexedDB (no permission needed), exclusions (incognito, sensitive domains), privacy policy + store disclosures updated before release.

**Needs manual testing:** load unpacked in Chrome; verify (a) fresh install shows no all-sites warning, (b) Turn on prompts and then description/h1 searches work, (c) Turn off removes access, (d) works after the service worker idles.

### Blocker 3 – done
- `favicon` permission is now Chrome-only (per-browser manifest in `wxt.config.ts`).
- Popup favicon order: Chrome → `/_favicon/` (local cache) then `tab.favIconUrl`; Firefox → `tab.favIconUrl` only; both fall back to the globe icon. The `_favicon` code is dead-code-eliminated from the Firefox bundle.
- Verified: Firefox manifest has no `favicon`; Chrome unchanged. Remaining Firefox warnings are blocker 5.

### Targets (decision)
Chrome, Edge, Brave, Vivaldi, Arc (Chromium build), and Firefox. **Safari and Opera are out of scope.**
Scripts: `build`, `build:edge`, `build:firefox`, `zip`, `zip:edge`, `zip:firefox`.

### Blocker 3 (revised)
Popup no longer sniffs the browser. It checks `chrome.runtime.getManifest().permissions` for `favicon`, so any build that declares it uses the local favicon cache.

### Blocker 4 – done
`tabGroups` is declared only on Chromium builds. The popup hides "Group tabs" when `chrome.tabs.group` / `chrome.tabGroups` don't exist (runtime detection); background also guards the call.

### Blocker 5 – done
- `manifestVersion: 3` forced for all browsers (WXT defaulted Firefox to MV2).
- Firefox manifest: `browser_specific_settings.gecko` with a generated permanent ID `{ec888a38-1813-442c-9c55-f58391b01c69}`, `strict_min_version 140.0`, `data_collection_permissions: { required: ['none'] }`.
- Chrome, Edge and Firefox builds produce no WXT warnings. `web-ext lint`: 0 errors; one remaining warning is Preact's own innerHTML handling (library code, accepted by AMO).
- Keep that gecko ID forever; changing it after the first AMO upload makes a new add-on.

### Blocker 6 – drafted
`docs/PRIVACY.md` written. **Remaining:** fill in the contact line, host at a public URL (e.g. GitHub Pages or the repo's rendered page), paste the URL into both store dashboards, and make the dashboard "privacy practices" answers match it.

### Blocker 6 – done (all targets)
- `docs/PRIVACY.md` contact = GitHub issues URL. Policy URL for all stores: `https://github.com/raghaKRavi/tabhound/blob/main/docs/PRIVACY.md` (repo must be public + `main` pushed).
- `docs/store/LISTING.md`: shared copy, single purpose, per-permission justifications, Chrome data-usage answers, Edge and AMO notes, Brave/Vivaldi/Arc note.
- `docs/BUILD.md` + sources zip now ships the whole workspace (lockfile, base tsconfig, docs). **Verified:** unzipped into an empty folder, `pnpm install --frozen-lockfile && pnpm build:firefox` reproduces byte-identical `manifest.json`, `background.js`, `content.js`.

### "Also required" list – done
- LICENSE (MIT, 2026 Ragha Ravi); `author` + `homepage_url` in manifest; manifest description rewritten (≤132 chars).
- Removed `public/wxt.svg`, `assets/react.svg`, stray `apps/extension/package-lock.json`, template README, `manifest.type` meta.
- Name unified to "Tabhound" (popup header, group title, action title).
- Errors: background now replies `{type:'error'}`; popup shows a dismissible banner instead of silently closing. `onAttached` wrapped in try/catch.
- "Close all others" asks for confirmation (shows how many tabs will close).
- Clean rebuilds of Chrome, Edge, Firefox; zips for Chrome, Edge, Firefox(+sources).

### Still manual
Screenshots + 440×280 promo tile (list in `docs/store/LISTING.md`), make repo public and push `main`, create store developer accounts (Chrome one-time $5, Edge free, AMO free), per-browser smoke test (Edge, Brave, Vivaldi, Firefox).
