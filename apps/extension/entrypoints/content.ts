import { extractMeta } from '@/lib/meta';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    // TODO(v1): report meta on demand via message from background.
    // Kept as a single isolated module so v2 can swap in full-content extraction.
    const meta = extractMeta(document);
    console.log('[tabhound] content meta', meta);
  },
});
