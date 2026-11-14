# Deploying Tabhound

Checklist for publishing to **Chrome Web Store**, **Firefox AMO**, **Microsoft Edge Add-ons**, and
**Brave** (Brave has no store of its own).

| Browser | How it ships | Package | Cost | Typical review |
|---|---|---|---|---|
| Chrome | Chrome Web Store | `pnpm zip` | $5 one-time | hours to ~a week |
| Brave / Vivaldi / Arc | Installs from the Chrome Web Store, nothing to submit | same as Chrome | none | none |
| Edge | Edge Add-ons (Partner Center) | `pnpm zip:edge` | free | ~1-7 days |
| Firefox | addons.mozilla.org (AMO) | `pnpm zip:firefox` (+ sources zip) | free | hours to days |

Related docs: [store/LISTING.md](./store/LISTING.md) (copy-paste dashboard text, permission
justifications), [PRIVACY.md](./PRIVACY.md), [BUILD.md](./BUILD.md) (AMO reviewer build steps).

---

## 0. One-time setup

- [x] Repo is **public** (privacy policy URL returns 200, verified) and `main` is pushed (the privacy policy URL points at GitHub:
      `https://github.com/raghaKRavi/tabhound/blob/main/docs/PRIVACY.md`).
- [ ] Create developer accounts:
  - [x] Chrome: https://chrome.google.com/webstore/devconsole (paid $5 fee, account created)
  - [ ] Edge: https://partner.microsoft.com/dashboard/microsoftedge (free)
  - [ ] Firefox: https://addons.mozilla.org/developers/ (free, 2FA required)
- [ ] Store assets ready (see [store/assets/](./store/assets)):
  - [x] Icon 128x128 (`store-icon-128.png`, verified 128x128 PNG; 512x512 `logo-512.png` also present)
  - [x] 1-5 screenshots, **1280x800** (done: `store/assets/screenshots/screenshot-1..5.png`) (or 640x400), PNG/JPG, no transparency
  - [x] Chrome small promo tile **440x280** (done: `store/assets/screenshots/promo-tile-440x280.png`) (required); marquee 1400x560 (optional)
  - [ ] Optional: short demo video (YouTube link)
- [x] Listing text from [store/LISTING.md](./store/LISTING.md) is up to date.
- [x] **Never change the Firefox gecko ID** (`{ec888a38-1813-442c-9c55-f58391b01c69}` in
      `apps/extension/wxt.config.ts`). Changing it after the first AMO upload creates a new add-on.

---

## 1. Pre-release checks (every release)

Run from the repo root (`tabhound/`).

```bash
pnpm install --frozen-lockfile
pnpm verify          # typecheck + tests + build
```

Last run 2026-11-08: typecheck clean, 109/109 tests pass, Chrome/Edge/Firefox builds succeed with no WXT warnings, all manifests are MV3 version 0.1.0 with icons 16-128.

- [ ] Version bumped. Stores reject a version that isn't higher than the last upload:
      `pnpm bump patch` (or `minor` / `major`). This updates both `package.json` files.
- [ ] Changelog / release notes written (stores ask "what's new" on updates).
- [ ] Smoke test each build by loading it unpacked:
  - [ ] **Chrome**: `pnpm build`, then `chrome://extensions` > Developer mode > *Load unpacked* > `apps/extension/.output/chrome-mv3`
  - [ ] **Brave**: same folder, `brave://extensions`
  - [ ] **Edge**: `pnpm build:edge`, then `edge://extensions` > *Load unpacked* > `.output/edge-mv3`
  - [ ] **Firefox**: `pnpm build:firefox`, then `about:debugging#/runtime/this-firefox` > *Load Temporary Add-on* > `.output/firefox-mv3/manifest.json`
- [ ] What to test in each: search finds tabs across windows, Enter jumps to tab, select + close others
      (confirm dialog), pin/unpin, group tabs (Chromium only; button must be hidden in Firefox),
      content search Turn on / Turn off, still works after the service worker idles.
- [x] No unexpected network requests (popup DevTools > Network is empty). Static check 2026-11-08: no fetch/XHR/WebSocket calls in the bundles besides Vite's local modulepreload helper and MiniSearch's own `fetch` method. Still worth a glance in DevTools.
- [x] Lint the Firefox build: `npx web-ext lint -s apps/extension/.output/firefox-mv3`
      (0 errors; the Preact innerHTML warning is known and accepted). Checked 2026-11-08: 0 errors, 1 warning.
- [x] Manifest permissions match the justifications in [store/LISTING.md](./store/LISTING.md).
      Checked 2026-11-08: Chrome/Edge `tabs, scripting, tabGroups, favicon` + optional `<all_urls>`; Firefox `tabs, scripting` + optional `<all_urls>`; no required host permissions. If you add a permission, update LISTING.md, PRIVACY.md, and the dashboards.

---

## 2. Build the packages

```bash
pnpm zip              # Chrome (also used for Brave/Vivaldi/Arc)
pnpm zip:edge         # Edge
pnpm zip:firefox      # Firefox + AMO sources zip
```

Outputs land in `apps/extension/.output/`:

- `tabhound-<version>-chrome.zip`
- `tabhound-<version>-edge.zip`
- `tabhound-<version>-firefox.zip` and `tabhound-<version>-sources.zip`

Check each zip has `manifest.json` at its root and the expected version.

---

## 3. Chrome Web Store (also covers Brave, Vivaldi, Arc)

1. Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) > **Add new item** (first time) or open the item > **Package > Upload new package** (updates).
2. Upload `tabhound-<version>-chrome.zip`.
3. **Store listing** tab: name, short description, long description, category (Productivity), language, icon, screenshots, promo tile.
4. **Privacy** tab:
   - [ ] Single purpose statement (from LISTING.md)
   - [ ] Justification for each permission (`tabs`, `scripting`, `tabGroups`, `favicon`, optional `<all_urls>`)
   - [ ] "Remote code": **No**
   - [ ] Data usage checkboxes and certifications (answers in LISTING.md; must match PRIVACY.md)
   - [ ] Privacy policy URL
5. **Distribution** tab: visibility (Public), regions, free.
6. **Submit for review.** Choose *deferred publishing* if you want to release manually after approval.
7. After approval, note the store URL and ID.

Brave, Vivaldi and Arc users install straight from this listing. Brave shows a "Brave doesn't
verify extensions" notice, which is normal. Nothing else to submit.

---

## 4. Microsoft Edge Add-ons

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge) > **Create new extension**.
2. Upload `tabhound-<version>-edge.zip` (or reuse the Chrome zip; the Edge build is the same MV3 code).
3. **Properties**: category, privacy policy URL, website URL, support contact.
4. **Store listings**: description, screenshots (1280x800 or 640x480), small promo tile 440x280, icon.
5. **Notes for certification**: briefly explain the optional all-sites permission (content search is opt-in).
6. **Publish.**

---

## 5. Firefox AMO

1. [Developer Hub](https://addons.mozilla.org/developers/) > **Submit a New Add-on** > *On this site* (listed).
2. Upload `tabhound-<version>-firefox.zip`. The validator runs automatically; fix any errors.
3. When asked "Do you use build tools / minify code?" answer **Yes** and upload
   `tabhound-<version>-sources.zip`. Paste the steps from [BUILD.md](./BUILD.md) into
   **Notes to Reviewer**. The reviewers rebuild from it, so it must reproduce identically
   (`pnpm install --frozen-lockfile && pnpm build:firefox`).
4. Listing: name, summary, description, categories (Tabs), support URL/email, privacy policy URL, license (MIT), screenshots.
5. Data collection declaration is already in the manifest (`required: ['none']`); confirm it shows "no data collected".
6. **Submit version.** Updates follow the same flow: *Upload a New Version* on the add-on's page.

---

## 6. After release

- [ ] Install the live version from each store and re-run the smoke test.
- [ ] Add store links to `README.md`.
- [ ] Tag the release in git: `git tag v<version> && git push --tags`.
- [ ] Watch store dashboards for reviewer emails (rejections come by email; reply or fix and resubmit).
- [ ] Keep the `.zip` files for each released version (the sources zip especially).

---

## 7. Updating later

1. Make changes, `pnpm verify`.
2. `pnpm bump patch|minor|major`.
3. Rebuild zips (section 2) and upload to each dashboard (Chrome *Package*, Edge *Update*, AMO *Upload a New Version*).
4. Updates that add permissions are reviewed more strictly, and users get a re-approval prompt.
   Update LISTING.md, PRIVACY.md and dashboard justifications first.

---

## Common rejections

| Rejection | Fix |
|---|---|
| Unused permission (Chrome "Purple Potassium") | Remove it from `wxt.config.ts` or justify it clearly |
| Missing/mismatched privacy policy | Policy URL must resolve publicly and match dashboard data answers |
| Version not higher than previous | `pnpm bump patch` and rebuild |
| AMO can't reproduce build | Test [BUILD.md](./BUILD.md) in an empty folder with `--frozen-lockfile` |
| Broad host permission warning | Keep `<all_urls>` in `optional_host_permissions` only |
| Misleading metadata / keyword stuffing | Keep the description accurate to the feature set |
