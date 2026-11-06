import type { TabDoc } from '@/lib/tab-index';
import { shortUrl } from '../../shared/lib/url';
import { CheckZone } from '../../shared/ui/CheckZone';
import { Highlight } from '../../shared/ui/Highlight';
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
};

export function TabRow({ row, query, selected, highlighted, onHover, onToggleSelect, onOpen }: Props) {
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
      </div>
    </div>
  );
}
