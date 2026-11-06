import type { ComponentChildren } from 'preact';
import './NoticeBar.css';

type Props = {
  role?: 'alert' | 'alertdialog';
  children: ComponentChildren;
  /** Buttons shown to the right of the message. */
  actions: ComponentChildren;
};

/** A one-line warning strip with buttons; used for errors and confirmations. */
export function NoticeBar({ role = 'alert', children, actions }: Props) {
  return (
    <div class="notice" role={role}>
      <span>{children}</span>
      {actions}
    </div>
  );
}
