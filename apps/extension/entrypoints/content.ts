import { extractMeta } from '@/lib/meta';
import type { BackgroundToContent, ContentToBackground } from '@/lib/messaging';

// Registered at runtime (see background.ts) only after the user opts in to
// content search and grants the optional host permission.
export default defineContentScript({
  matches: ['<all_urls>'],
  registration: 'runtime',
  runAt: 'document_idle',
  main() {
    const w = window as unknown as { __tabhoundMeta?: boolean };
    const send = () => {
      const meta = extractMeta(document);
      const msg: ContentToBackground = { type: 'meta', meta };
      chrome.runtime.sendMessage(msg).catch(() => {
        /* background may be spinning up */
      });
    };

    send();
    if (w.__tabhoundMeta) return; // already wired up in this page
    w.__tabhoundMeta = true;

    // Background asks for a fresh report after its index was rebuilt.
    chrome.runtime.onMessage.addListener((msg: BackgroundToContent) => {
      if (msg?.type === 'requestMeta') send();
      return false;
    });

    // SPA support: re-fire when <title> changes
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const obs = new MutationObserver(() => send());
      obs.observe(titleEl, { childList: true });
    }
  },
});
