import { useMemo, useState } from 'preact/hooks';
import { canUseFaviconApi } from '../../shared/lib/capabilities';
import { isInternalUrl } from '../../shared/lib/url';
import { Icon } from '../../shared/ui/Icon';

function browserFaviconUrl(url: string, size = 32): string {
  const u = new URL(chrome.runtime.getURL('/_favicon/'));
  try {
    u.searchParams.set('pageUrl', new URL(url).origin);
  } catch {
    u.searchParams.set('pageUrl', url);
  }
  u.searchParams.set('size', String(size));
  return u.toString();
}

/** Site icon: the browser's local favicon cache, then the tab's own icon, then a globe. */
export function Favicon({ url, favIconUrl }: { url: string; favIconUrl?: string }) {
  const sources = useMemo(() => {
    if (isInternalUrl(url)) return [];
    const list: string[] = [];
    if (canUseFaviconApi) list.push(browserFaviconUrl(url));
    if (favIconUrl) list.push(favIconUrl);
    return list;
  }, [url, favIconUrl]);

  const [failed, setFailed] = useState(0);
  const src = sources[failed];
  if (!src) return <Icon name="world" size={13} />;
  return (
    <img src={src} alt="" referrerpolicy="no-referrer" onError={() => setFailed((n) => n + 1)} />
  );
}
