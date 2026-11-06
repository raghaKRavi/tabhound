import { useCallback, useEffect, useState } from 'preact/hooks';
import { send } from '../../shared/lib/messaging-client';

const ALL_SITES = { origins: ['<all_urls>'] };

/**
 * Opt-in content search: on while the user has granted access to all sites.
 * Turning it on asks the browser for that permission; off removes it.
 */
export function useContentSearch() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    chrome.permissions
      .contains(ALL_SITES)
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, []);

  // permissions.request must run directly from the click (user gesture).
  const toggle = useCallback(async () => {
    if (enabled) {
      await send({ type: 'disableContent' });
      await chrome.permissions.remove(ALL_SITES);
      setEnabled(false);
      return;
    }
    const granted = await chrome.permissions.request(ALL_SITES);
    if (!granted) return;
    setEnabled(true);
    await send({ type: 'enableContent' });
  }, [enabled]);

  return { enabled, toggle };
}
