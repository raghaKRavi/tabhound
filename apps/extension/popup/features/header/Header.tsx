import './Header.css';

type Props = { tabCount: number; windowCount: number };

export function Header({ tabCount, windowCount }: Props) {
  return (
    <div class="head">
      <img class="logo" src="/icon/logo.svg" width={20} height={20} alt="" />
      <span class="title">Tabhound</span>
      <span class="count">
        {tabCount} tab{tabCount === 1 ? '' : 's'} · {windowCount} window{windowCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}
