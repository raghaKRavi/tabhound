import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('offers "Turn on" while content search is off and toggles it', () => {
    const onToggleContentSearch = vi.fn();
    render(
      <SettingsPanel
        contentSearchEnabled={false}
        onToggleContentSearch={onToggleContentSearch}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Turn on'));
    expect(onToggleContentSearch).toHaveBeenCalledTimes(1);
  });

  it('offers "Turn off" while it is on, and closes', () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel contentSearchEnabled onToggleContentSearch={() => {}} onClose={onClose} />,
    );
    expect(screen.getByText('Turn off')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
