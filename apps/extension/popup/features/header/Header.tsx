import './Header.css';

import { Icon } from '../../shared/ui/Icon';

type Props = { tabCount: number; windowCount: number; onSettings?: () => void };

export function Header({ tabCount, windowCount, onSettings }: Props) {
  return (
    <div class="head">
      <img class="logo" src="/icon/logo.svg" width={20} height={20} alt="" />
      <span class="title">Tabhound</span>
      <span class="count">
        {tabCount} tab{tabCount === 1 ? '' : 's'} · {windowCount} window{windowCount === 1 ? '' : 's'}
      </span>
      {onSettings && (
        <button class="gear" onClick={onSettings} aria-label="Settings" title="Settings">
          <Icon name="settings" size={15} />
        </button>
      )}
    </div>
  );
}
