import { cleanup } from '@testing-library/preact';
import { afterEach, vi } from 'vitest';

// Minimal stand-in for the extension APIs the popup reads at import time.
// Individual tests can override pieces with vi.spyOn / vi.stubGlobal.
vi.stubGlobal('chrome', {
  runtime: {
    getManifest: () => ({ permissions: ['tabs', 'tabGroups', 'favicon'] }),
    getURL: (path: string) => `chrome-extension://test${path}`,
    sendMessage: vi.fn(),
    lastError: undefined,
  },
  tabs: { group: vi.fn() },
  tabGroups: { update: vi.fn(), query: vi.fn().mockResolvedValue([]) },
  permissions: {
    contains: vi.fn().mockResolvedValue(false),
    request: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
  },
});

afterEach(() => cleanup());
