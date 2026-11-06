import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { makeGroup } from '../../../test/factories';
import { GroupPanel } from './GroupPanel';

function setup(over: Partial<Parameters<typeof GroupPanel>[0]> = {}) {
  const props = {
    selectedCount: 2,
    firstUrl: 'https://www.github.com/x',
    groups: [],
    windowLabels: new Map([[1, 1]]),
    onCreate: vi.fn(),
    onAddTo: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  };
  render(<GroupPanel {...props} />);
  return props;
}

describe('GroupPanel', () => {
  it('shows how many tabs will be grouped', () => {
    setup({ selectedCount: 1 });
    expect(screen.getByText('Group 1 tab')).toBeTruthy();
  });

  it('focuses the name field and suggests the first tab\'s site as the name', () => {
    setup();
    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.placeholder).toBe('github.com');
  });

  it('creates a group with the typed name and the default colour', () => {
    const { onCreate } = setup();
    const input = screen.getAllByRole('textbox')[0]!;
    fireEvent.input(input, { target: { value: '  Research  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCreate).toHaveBeenCalledWith('Research', 'blue');
  });

  it('falls back to the default name when the name is left blank', () => {
    const { onCreate } = setup();
    fireEvent.click(screen.getByText('Create group'));
    expect(onCreate).toHaveBeenCalledWith('github.com', 'blue');
  });

  it('uses the colour that was picked', () => {
    const { onCreate } = setup();
    fireEvent.click(screen.getByRole('radio', { name: 'purple' }));
    fireEvent.click(screen.getByText('Create group'));

    expect(onCreate).toHaveBeenCalledWith('github.com', 'purple');
  });

  it('lists existing groups with their window and adds to the one clicked', () => {
    const { onAddTo } = setup({
      groups: [makeGroup({ id: 5, title: 'Reading', windowId: 1 }), makeGroup({ id: 6, title: '', windowId: 2 })],
      windowLabels: new Map([
        [1, 1],
        [2, 2],
      ]),
    });
    expect(screen.getByText('Window 2')).toBeTruthy();
    expect(screen.getByText('Unnamed group')).toBeTruthy();

    fireEvent.click(screen.getByText('Reading'));
    expect(onAddTo).toHaveBeenCalledWith(5);
  });

  it('offers no existing-group section when there are none', () => {
    setup();
    expect(screen.queryByText('Or add to an existing group')).toBeNull();
  });

  describe('with more than three groups', () => {
    const groups = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((title, i) => makeGroup({ id: i + 1, title }));

    it('adds a filter box', () => {
      setup({ groups });
      expect(screen.getByPlaceholderText('Filter groups…')).toBeTruthy();
    });

    it('filters by name, case-insensitively', () => {
      setup({ groups });
      fireEvent.input(screen.getByPlaceholderText('Filter groups…'), { target: { value: 'ALP' } });

      expect(screen.getByText('Alpha')).toBeTruthy();
      expect(screen.queryByText('Beta')).toBeNull();
    });

    it('says so when nothing matches', () => {
      setup({ groups });
      fireEvent.input(screen.getByPlaceholderText('Filter groups…'), { target: { value: 'zzz' } });
      expect(screen.getByText('No groups match.')).toBeTruthy();
    });

    it('adds to the only match on Enter, but not while several match', () => {
      const { onAddTo } = setup({ groups });
      const filter = screen.getByPlaceholderText('Filter groups…');

      fireEvent.input(filter, { target: { value: 'a' } }); // Alpha, Beta, Gamma, Delta all contain "a"
      fireEvent.keyDown(filter, { key: 'Enter' });
      expect(onAddTo).not.toHaveBeenCalled();

      fireEvent.input(filter, { target: { value: 'delt' } });
      fireEvent.keyDown(filter, { key: 'Enter' });
      expect(onAddTo).toHaveBeenCalledWith(4);
    });
  });

  it('does not show a filter box for three groups or fewer', () => {
    const groups = [1, 2, 3].map((id) => makeGroup({ id, title: `G${id}` }));
    setup({ groups });
    expect(screen.queryByPlaceholderText('Filter groups…')).toBeNull();
  });

  it('cancels from the button and from Escape, without leaking keys to the list behind', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(outer).not.toHaveBeenCalled();
    document.body.removeEventListener('keydown', outer);
  });
});
