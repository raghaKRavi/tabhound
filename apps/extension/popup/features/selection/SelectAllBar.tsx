import './SelectAllBar.css';

type Props = {
  /** Tabs currently listed (all open tabs, or the search matches). */
  total: number;
  selectedCount: number;
  onSelectAll: () => void;
  onClear: () => void;
};

/** One-click "Select all" / "Unselect all" for the tabs currently listed. */
export function SelectAllBar({ total, selectedCount, onSelectAll, onClear }: Props) {
  if (total === 0) return null;
  const everySelected = selectedCount >= total;
  return (
    <div class="selectall">
      <button type="button" onClick={everySelected ? onClear : onSelectAll}>
        {everySelected ? 'Unselect all' : `Select all (${total})`}
      </button>
    </div>
  );
}
