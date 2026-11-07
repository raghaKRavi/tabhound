# Store listing copy and dashboard answers

Targets: **Chrome Web Store** (also serves Brave, Vivaldi, Arc), **Microsoft Edge Add-ons**,
**Firefox AMO**. Safari and Opera are out of scope.

Privacy policy URL (same for all): `https://github.com/raghaKRavi/tabhound/blob/main/docs/PRIVACY.md`
(the repo must be public and `main` pushed, or host the page elsewhere and use that URL).

## Shared copy

**Name:** Tabhound

**Short description (≤132 chars, Chrome/Edge summary):**
Find any open tab across all windows by title or URL, then jump to it, group tabs, or close the rest.

**Category:** Productivity (Chrome, Edge) · Tabs (Firefox: "Tabs")

**Long description:**
> Too many tabs? Tabhound finds the one you want.
>
> Open Tabhound, type a few letters, and it searches every tab in every window by title and
> URL. Press Enter to jump straight to it.
>
> • Fuzzy, instant search across all windows
> • Select several tabs, then close everything else (browser built-ins keep only one)
> • Pin or unpin selected tabs; pinned tabs are listed first
> • Group selected tabs, or move them into a new window (where your browser supports tab groups)
> • Optional content search: also match each page's description and main heading. Off by default;
>   you turn it on in the popup and can turn it off any time
>
> Private by design: no account, no server, no analytics. Tabhound never sends your tabs or
> browsing data anywhere. Everything stays in your browser.

**Single purpose (Chrome):** Search and manage the user's open browser tabs.

## Permission justifications (Chrome / Edge dashboards)

| Permission | Justification |
|---|---|
| `tabs` | Reads the title and URL of open tabs so the user can search them, and focuses, closes, groups or moves the tabs the user selects. |
| `tabGroups` | Lets the user put the tabs they selected into a tab group. |
| `favicon` | Shows each site's icon in the results using the browser's local favicon cache (no network request). |
| `scripting` | Registers a small script after the user opts in to content search. Not used otherwise. |
| Optional host access (`<all_urls>`) | Requested only when the user clicks "Turn on" for content search. The script reads each page's meta description and first heading, kept in memory on the device. Never transmitted. |

**Remote code:** No. All code is in the package.
**Data usage disclosures (Chrome "Privacy practices"):** tick **Web history** and **Website content**
as handled, since tab URLs/titles and page descriptions are read; certify all three statements:
not sold or transferred to third parties, not used for unrelated purposes, not used for creditworthiness
or lending. State that data stays on-device and is not transmitted.

## Edge Add-ons notes
- Upload the Edge zip (`pnpm zip:edge`). Same copy and justifications as above.
- "Notes for certification": *No account or login needed. Open the popup to search tabs. To test
  content search, click "Turn on" at the bottom of the popup and accept the permission.*
- Search terms: tabs, tab search, tab manager, find tab, close tabs.

## Firefox AMO
- Upload `extension-<version>-firefox.zip` and `extension-<version>-sources.zip` (`pnpm zip:firefox`).
- **Summary (≤250 chars):** same as short description.
- **Data collection:** declared in the manifest as `none`. The policy URL above goes in the listing.
- **Notes to reviewer:** paste the "Notes for reviewers" section of `docs/BUILD.md`, and add:
  *Tab grouping is hidden in Firefox because the API is not available. The `favicon` permission is not
  declared in Firefox; icons come from each tab's own `favIconUrl`.*
- Minimum Firefox 140 (Android 142).

## Brave, Vivaldi, Arc
No separate listing: they install from the Chrome Web Store. Smoke-test the Chrome build in each
(popup opens, search works, "Turn on" shows the permission prompt) before announcing support.

## Assets still to capture (manual)
- Screenshots: 1280×800 (or 640×400), at least 1, up to 5. Suggested: (1) search results across
  windows, (2) multi-select with the action bar, (3) the "Close all others" confirmation,
  (4) content search turned on.
- Chrome small promo tile 440×280 (required), marquee 1400×560 (optional). Edge: 300×300 logo, optional promo tiles.
- Icons: the extension icons (16/32/48/96/128) are in `apps/extension/public/icon/`. For the store listings use `docs/store/assets/`: `store-icon-128.png` (padded 128 px icon for the Chrome/Edge store icon field), `logo-512.png` (Edge logo and any large placement) and `logo.svg` (vector source).
