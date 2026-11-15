import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('shows an "Off" switch while content search is off and toggles it', () => {
    const onToggleContentSearch = vi.fn();
    render(
      <SettingsPanel
        contentSearchEnabled={false}
        onToggleContentSearch={onToggleContentSearch}
        onClose={() => {}}
      />,
    );
    const toggle = screen.getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('Off')).toBeTruthy();
    fireEvent.click(toggle);
    expect(onToggleContentSearch).toHaveBeenCalledTimes(1);
  });

  it('shows an "On" switch while it is on, and closes', () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel contentSearchEnabled onToggleContentSearch={() => {}} onClose={onClose} />,
    );
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('On')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
