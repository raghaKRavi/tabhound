import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Tabhound',
    description: 'Search and manage your open tabs.',
    permissions: ['tabs', 'storage', 'scripting', 'tabGroups', 'favicon'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'TabHound',
    },
  },
  vite: () => ({
    plugins: [preact()],
  }),
});
