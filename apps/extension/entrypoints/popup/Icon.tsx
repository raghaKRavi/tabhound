import type { ComponentChildren } from 'preact';

type Props = {
  name: 'search' | 'x' | 'arrow-right' | 'chevron-down' | 'dots' | 'grid-add' | 'app-window' | 'world';
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const PATHS: Record<Props['name'], ComponentChildren> = {
  search: (
    <>
      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </>
  ),
  x: <path d="M18 6l-12 12M6 6l12 12" />,
  'arrow-right': (
    <>
      <path d="M5 12l14 0" />
      <path d="M13 18l6 -6" />
      <path d="M13 6l6 6" />
    </>
  ),
  'chevron-down': <path d="M6 9l6 6l6 -6" />,
  dots: (
    <>
      <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </>
  ),
  'grid-add': (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
      <path d="M4 14h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
      <path d="M4 4h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-4a2 2 0 0 1 2 -2z" />
      <path d="M14 17h6M17 14v6" />
    </>
  ),
  'app-window': (
    <>
      <path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" />
      <path d="M6 8h.01M9 8h.01" />
    </>
  ),
  world: (
    <>
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
    </>
  ),
};

export function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 2 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      style={{ flexShrink: 0 }}
    >
      {PATHS[name]}
    </svg>
  );
}
