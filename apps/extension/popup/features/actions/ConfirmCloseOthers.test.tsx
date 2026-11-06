import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmCloseOthers } from './ConfirmCloseOthers';

describe('ConfirmCloseOthers', () => {
  it('says how many tabs will close and how many stay', () => {
    render(<ConfirmCloseOthers closeCount={12} keepCount={3} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('alertdialog').textContent).toContain('Close 12 other tabs? Only the 3 selected will stay open.');
  });

  it('uses the singular for one tab', () => {
    render(<ConfirmCloseOthers closeCount={1} keepCount={1} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('alertdialog').textContent).toContain('Close 1 other tab?');
  });

  it('only closes after confirming', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmCloseOthers closeCount={2} keepCount={1} onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Close them'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
