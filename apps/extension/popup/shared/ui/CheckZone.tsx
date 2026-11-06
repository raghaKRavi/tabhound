import './CheckZone.css';

type Props = {
  checked: boolean;
  indeterminate?: boolean;
  label?: string;
  title?: string;
  onToggle: () => void;
};

/** The beige checkbox box used on tab rows and group headers. */
export function CheckZone({ checked, indeterminate, label, title, onToggle }: Props) {
  return (
    <div
      class={`checkzone${checked ? ' checked' : ''}`}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        indeterminate={indeterminate}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
      />
    </div>
  );
}
