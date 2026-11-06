// Capability checks, not browser sniffing: the manifest only declares
// `favicon` / `tabGroups` where the browser supports them.
export const canUseFaviconApi = (chrome.runtime.getManifest().permissions ?? []).includes('favicon');

export const canGroupTabs =
  typeof chrome.tabs?.group === 'function' && typeof chrome.tabGroups?.update === 'function';
