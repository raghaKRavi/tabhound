import type { TabDoc } from '@/lib/tab-index';
import { shortUrl } from '../../shared/lib/url';
import { CheckZone } from '../../shared/ui/CheckZone';
import { Highlight } from '../../shared/ui/Highlight';
import { Icon } from '../../shared/ui/Icon';
import '../../shared/ui/group-colors.css';
import { Favicon } from './Favicon';
import type { TabRowData } from './types';
import './TabRow.css';

type Props = {
  row: TabRowData;
  query: string;
  selected: boolean;
  highlighted: boolean;
  onHover: () => void;
  onToggleSelect: (tabId: number) => void;
  onOpen: (doc: TabDoc) => void;
  onClose?: (doc: TabDoc) => void;
  /** Set when the tab is open more than once: its place in the set, e.g. 2 of 4. */
  dup?: { n: number; of: number };
  /** Clicking the badge keeps this tab and selects the other copies in its set. */
  onDupClick?: (doc: TabDoc) => void;
};

export function TabRow({ row, query, selected, highlighted, onHover, onToggleSelect, onOpen, onClose, dup, onDupClick }: Props) {
  const { doc, color, nested, last } = row;
  const classes = [
    'row',
    selected && 'selected',
    highlighted && 'highlighted',
    color && `ingroup gc-${color}`,
    nested && 'nested',
    last && 'last',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      class={classes}
      title={color && !nested ? row.groupTitle || 'In a group' : undefined}
      onMouseEnter={onHover}
    >
      <CheckZone checked={selected} onToggle={() => onToggleSelect(doc.tabId)} />
      <div class="row-body" onClick={() => onOpen(doc)}>
        <div class="fav">
          <Favicon url={doc.url} favIconUrl={doc.favIconUrl} />
        </div>
        <div class="meta">
          <p class="row-title">
            <Highlight text={doc.title || shortUrl(doc.url)} query={query} />
          </p>
          <p class="row-url">
            <Highlight text={shortUrl(doc.url)} query={query} />
          </p>
        </div>
        {dup && (
          <button
            type="button"
            class="dupmark"
            title={`Copy ${dup.n} of ${dup.of}. Click to keep this one and select the other copies`}
            onClick={(e) => {
              e.stopPropagation();
              onDupClick?.(doc);
            }}
          >
            <Icon name="copy" size={11} />
            {dup.n} of {dup.of}
          </button>
        )}
        {doc.pinned && (
          <span class="pinmark" title="Pinned" aria-label="Pinned">
            <Icon name="pin" size={13} />
          </span>
        )}
        {onClose && (
          <button
            type="button"
            class="row-close"
            title="Close tab"
            aria-label={`Close ${doc.title || shortUrl(doc.url)}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose(doc);
            }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
