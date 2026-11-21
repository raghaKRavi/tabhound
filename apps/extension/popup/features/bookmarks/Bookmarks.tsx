import { shortUrl } from '../../shared/lib/url';
import { CheckZone } from '../../shared/ui/CheckZone';
import { Icon } from '../../shared/ui/Icon';
import { Favicon } from '../tab-list/Favicon';
import type { BookmarkHit } from './useBookmarks';
import './Bookmarks.css';

type Props = {
  query: string;
  /** The search box's "include bookmarks" toggle. */
  enabled: boolean;
  hits: BookmarkHit[];
  /** The search for the current query hasn't finished; `hits` may be for an older query. */
  searching: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
};

/** Bookmark matches for the typed query, shown below the open tabs when the toggle is on. */
export function Bookmarks({ query, enabled, hits, searching, selected, onToggle }: Props) {
  if (!enabled || !query.trim()) return null;

  return (
    <section class="bm" aria-label="Bookmarks">
      <h2 class="bm-head">Bookmarks{searching ? '' : ` (${hits.length})`}</h2>
      {searching ? (
        <div class="inline-loading" role="status" aria-label="Searching bookmarks">
          <div class="spinner" />
        </div>
      ) : hits.length === 0 ? (
        <p class="bm-empty">No bookmarks match.</p>
      ) : (
        hits.map((hit) => {
          const isSelected = selected.has(hit.id);
          return (
            <div class={`bm-row${isSelected ? ' selected' : ''}`} key={hit.id}>
              <CheckZone
                checked={isSelected}
                label={`Select ${hit.title}`}
                onToggle={() => onToggle(hit.id)}
              />
              <div class="bm-body" onClick={() => onToggle(hit.id)}>
                <div class="bm-fav">
                  <div class="fav">
                    <Favicon url={hit.url} />
                  </div>
                  <span class="bm-badge" aria-hidden="true">
                    <Icon name="bookmark" size={8} strokeWidth={2.5} />
                  </span>
                </div>
                <div class="meta">
                  <p class="row-title">{hit.title}</p>
                  <p class="row-url">
                    {hit.folder && <span class="bm-folder">{hit.folder}</span>}
                    {shortUrl(hit.url)}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
