import { shortUrl } from '../../shared/lib/url';
import { timeAgo } from '../../shared/lib/time';
import { Icon } from '../../shared/ui/Icon';
import { Favicon } from '../tab-list/Favicon';
import type { ClosedTab } from './useRecentlyClosed';
import './RecentlyClosed.css';

type Props = {
  items: ClosedTab[];
  onReopen: (tab: ClosedTab) => void;
  onDismiss: (tab: ClosedTab) => void;
};

/** Dimmed rows at the bottom of the tab list: tabs closed lately, with reopen and dismiss. */
export function RecentlyClosed({ items, onReopen, onDismiss }: Props) {
  if (items.length === 0) return null;
  return (
    <section class="closed" aria-label="Recently closed">
      <h2 class="closed-head">Recently closed</h2>
      {items.map((tab) => (
        <div class="closed-row" key={tab.sessionId}>
          <div class="fav">
            <Favicon url={tab.url} favIconUrl={tab.favIconUrl} />
          </div>
          <div class="meta">
            <p class="row-title">{tab.title}</p>
            <p class="row-url">{shortUrl(tab.url)}</p>
          </div>
          <span class="closed-ago">{timeAgo(tab.closedAt)}</span>
          <button
            type="button"
            class="closed-btn reopen"
            title="Reopen"
            aria-label={`Reopen ${tab.title}`}
            onClick={() => onReopen(tab)}
          >
            <Icon name="reopen" size={14} />
          </button>
          <button
            type="button"
            class="closed-btn"
            title="Remove from recently closed"
            aria-label={`Remove ${tab.title} from recently closed`}
            onClick={() => onDismiss(tab)}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      ))}
    </section>
  );
}
