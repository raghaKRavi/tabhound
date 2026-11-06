import { Icon } from '../../shared/ui/Icon';
import './Header.css';

type Props = { tabCount: number; windowCount: number };

export function Header({ tabCount, windowCount }: Props) {
  return (
    <div class="head">
      <span class="icon">
        <Icon name="search" size={18} />
      </span>
      <span class="title">Tabhound</span>
      <span class="count">
        {tabCount} tab{tabCount === 1 ? '' : 's'} · {windowCount} window{windowCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}
