import { NoticeBar } from '../../shared/ui/NoticeBar';

type Props = {
  /** How many tabs would be closed. */
  closeCount: number;
  keepCount: number;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Asks before "Close all others" closes everything except the selection. */
export function ConfirmCloseOthers({ closeCount, keepCount, onCancel, onConfirm }: Props) {
  return (
    <NoticeBar
      role="alertdialog"
      actions={
        <>
          <button onClick={onCancel}>Cancel</button>
          <button class="danger" onClick={onConfirm}>
            Close them
          </button>
        </>
      }
    >
      Close {closeCount} other tab{closeCount === 1 ? '' : 's'}? Only the {keepCount} selected will
      stay open.
    </NoticeBar>
  );
}
