import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'Tabhound',
    description: 'Search and manage your open tabs.',
    // `favicon` (the /_favicon/ endpoint) exists only in Chromium browsers.
    permissions: [
      'tabs',
      'scripting',
      'tabGroups',
      ...(browser === 'firefox' ? [] : ['favicon']),
    ],
    // Content search is opt-in: requested at runtime from the popup.
    optional_host_permissions: ['<all_urls>'],
    action: {
      default_title: 'TabHound',
    },
  }),
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
