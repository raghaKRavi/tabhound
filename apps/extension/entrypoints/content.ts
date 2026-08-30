import { extractMeta } from '@/lib/meta';
import type { ContentToBackground } from '@/lib/messaging';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    const send = () => {
      const meta = extractMeta(document);
      const msg: ContentToBackground = { type: 'meta', meta };
      chrome.runtime.sendMessage(msg).catch(() => {
        /* background may be spinning up */
      });
    };

    send();

    // SPA support: re-fire when <title> changes
    const titleEl = document.querySelector('title');
    if (titleEl) {
      const obs = new MutationObserver(() => send());
      obs.observe(titleEl, { childList: true });
    }
  },
});
