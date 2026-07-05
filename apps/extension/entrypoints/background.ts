export default defineBackground(() => {
  // TODO(v1): maintain live tab list, build MiniSearch index, persist to
  // chrome.storage.local, handle focus/close messages from popup.
  console.log('[tabhound] background started', { id: browser.runtime.id });
});
