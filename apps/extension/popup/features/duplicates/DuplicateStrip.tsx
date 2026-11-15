import { Icon } from '../../shared/ui/Icon';
import './DuplicateStrip.css';

type Props = {
  /** Tabs that would be closed (every set minus the one it keeps). */
  extraCount: number;
  setCount: number;
  /** All of those tabs are already selected. */
  allSelected: boolean;
  onSelect: () => void;
  onClear: () => void;
};

/** Notices duplicate tabs and ticks the extra copies in one click. */
export function DuplicateStrip({ extraCount, setCount, allSelected, onSelect, onClear }: Props) {
  if (extraCount === 0) return null;
  return (
    <div class="dupstrip">
      <Icon name="copy" size={14} />
      <span>
        {extraCount} duplicate tab{extraCount === 1 ? '' : 's'}
        {setCount > 1 ? ` in ${setCount} sets` : ''}
      </span>
      <button onClick={allSelected ? onClear : onSelect}>
        {allSelected ? 'Clear selection' : 'Select duplicates'}
      </button>
    </div>
  );
}
