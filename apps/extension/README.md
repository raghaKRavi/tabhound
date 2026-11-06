# Tabhound extension

The WXT app that builds the Tabhound browser extension. See the [root README](../../README.md)
for features and setup, and [docs/BUILD.md](../../docs/BUILD.md) for reproducible build steps.

## Layout

```
entrypoints/            WXT entry points: thin, they only wire things up
  background.ts           service worker / event page: tab index, tab actions
  content.ts              opt-in page-description reader (registered at runtime)
  popup/                  index.html + main.tsx that mount the popup app
lib/                    extension-wide code shared by background, content and popup
  messaging.ts            message types between popup, background and content
  tab-index.ts            TabDoc + MiniSearch-backed TabStore
  meta.ts                 page description / h1 extraction
popup/                  the popup UI (not an entry point, so WXT does not scan it)
  App.tsx                 composition root: calls the feature hooks, lays out the features
  App.css                 popup shell (fixed-width column)
  styles/global.css       design tokens and base styles
  shared/                 generic building blocks with no feature knowledge
    lib/                    messaging client, capability checks, URL helpers
    ui/                     Icon, CheckZone, Highlight, NoticeBar, group colours
  features/               one folder per concern: component(s) + hook + styles together
    header/                 title and tab/window counts
    search/                 search box
    tabs/                   loading and searching the open tabs (useTabs)
    tab-list/               list of rows and group headers; buildRows() is a pure function
    selection/              which tabs are ticked (useSelection)
    actions/                bulk actions: action bar, close-others confirmation, useTabActions
    groups/                 group panel, loading existing groups, colours, default names
    content-search/         opt-in "search page text" toggle and its permission handling
    keyboard/               arrow / Enter / Escape handling (usePopupKeys)
public/icon/            extension icons
test/                   Vitest setup (chrome stubs) and sample-data factories
*.test.ts(x)            unit/component tests, next to the code they cover
```

## Conventions
- A feature owns its state, markup and CSS. `App.tsx` only connects them.
- Features may import from `shared/` and `lib/`, never from each other's internals; data
  they share (for example `PopupGroup`) lives in the feature that owns it.
- Anything that talks to the background goes through `shared/lib/messaging-client.ts`.
- Browser capabilities (tab groups, favicon API) are read in `shared/lib/capabilities.ts`.
- Component CSS sits next to the component and is imported by it. List spacing is a single
  `--gap` value set in `tab-list/TabList.css`.
