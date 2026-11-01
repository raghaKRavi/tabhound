import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifestVersion: 3,
  manifest: ({ browser }) => {
    const firefox = browser === 'firefox';
    return {
      name: 'Tabhound',
      description:
        'Find any open tab across all windows by title or URL, then jump to it, group tabs, or close the rest.',
      author: 'Ragha Ravi',
      homepage_url: 'https://github.com/raghaKRavi/tabhound',
      permissions: [
        'tabs',
        'scripting',
        // Chromium-only APIs (Chrome, Edge, Brave, Vivaldi, Arc); the popup
        // feature-detects them, so the UI adapts where they're absent.
        ...(firefox ? [] : ['tabGroups', 'favicon']),
      ],
      // Content search is opt-in: requested at runtime from the popup.
      optional_host_permissions: ['<all_urls>'],
      action: {
        default_title: 'Tabhound',
      },
      ...(firefox && {
        browser_specific_settings: {
          gecko: {
            // Permanent once published on AMO; do not change after the first upload.
            id: '{ec888a38-1813-442c-9c55-f58391b01c69}',
            // 140 is the first release that understands data_collection_permissions.
            strict_min_version: '140.0',
            data_collection_permissions: {
              // Everything stays on-device; nothing is transmitted.
              required: ['none'],
            },
          },
          // Firefox for Android only understands data_collection_permissions from 142.
          gecko_android: { strict_min_version: '142.0' },
        },
      }),
    };
  },
  zip: {
    // AMO reviewers must rebuild from source: ship the whole workspace (lockfile, base tsconfig, docs).
    sourcesRoot: '../..',
    excludeSources: ['design/**', 'idea.md', 'docs/release-blockers/**', '**/*.zip'],
  },
  hooks: {
    // WXT auto-adds the runtime content script's matches as required host
    // permissions; ours must stay optional (granted by the user in the popup).
    'build:manifestGenerated': (_wxt, manifest) => {
      delete manifest.host_permissions;
      if (!manifest.content_scripts?.length) delete manifest.content_scripts;
    },
  },
  vite: () => ({
    plugins: [preact()],
  }),
});
