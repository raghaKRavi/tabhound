import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { CheckZone } from './CheckZone';

describe('CheckZone', () => {
  it('toggles once when the box around the checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(<CheckZone checked={false} label="pick" onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('checkbox').parentElement!);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles once when the checkbox itself is clicked', () => {
    const onToggle = vi.fn();
    render(<CheckZone checked={false} label="pick" onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not let the click reach the row behind it', () => {
    const rowClick = vi.fn();
    render(
      <div onClick={rowClick}>
        <CheckZone checked={false} label="pick" onToggle={() => {}} />
      </div>,
    );

    fireEvent.click(screen.getByRole('checkbox').parentElement!);
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('reflects checked and indeterminate state', () => {
    const { rerender } = render(<CheckZone checked={false} indeterminate label="g" onToggle={() => {}} />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box.parentElement!.classList.contains('checked')).toBe(false);

    rerender(<CheckZone checked label="g" onToggle={() => {}} />);
    expect(box.checked).toBe(true);
    expect(box.parentElement!.classList.contains('checked')).toBe(true);
  });
});
