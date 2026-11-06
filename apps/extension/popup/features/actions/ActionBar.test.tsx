import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { ActionBar } from './ActionBar';

function setup(selectedCount = 2) {
  const props = {
    selectedCount,
    onOpen: vi.fn(),
    onCloseSelected: vi.fn(),
    onGroup: vi.fn(),
    onMoveToNewWindow: vi.fn(),
    onCloseOthers: vi.fn(),
  };
  render(<ActionBar {...props} />);
  return props;
}

const openMenu = () => fireEvent.click(screen.getByText('Actions'));

describe('ActionBar', () => {
  it('shows how many tabs are selected', () => {
    setup(3);
    expect(screen.getByText('3 selected')).toBeTruthy();
  });

  it('offers Open only for a single selected tab', () => {
    setup(1);
    expect(screen.getByText('Open')).toBeTruthy();
  });

  it('does not offer Open for several tabs', () => {
    setup(2);
    expect(screen.queryByText('Open')).toBeNull();
  });

  it('closes the selected tabs', () => {
    const { onCloseSelected } = setup();
    fireEvent.click(screen.getByText('Close selected'));
    expect(onCloseSelected).toHaveBeenCalledTimes(1);
  });

  it('keeps the menu closed until Actions is clicked', () => {
    setup();
    expect(screen.queryByText('Move to new window')).toBeNull();
    openMenu();
    expect(screen.getByText('Move to new window')).toBeTruthy();
  });

  it.each([
    ['Group tabs', 'onGroup'],
    ['Move to new window', 'onMoveToNewWindow'],
    ['Close all others', 'onCloseOthers'],
  ] as const)('runs "%s" and closes the menu', (label, handler) => {
    const props = setup();
    openMenu();
    fireEvent.click(screen.getByText(label));

    expect(props[handler]).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(label)).toBeNull();
  });

  it('hides "Group tabs" where the browser has no tab groups', async () => {
    vi.resetModules();
    const original = chrome.tabGroups;
    // @ts-expect-error simulating a browser without the API
    chrome.tabGroups = undefined;
    const { ActionBar: Fresh } = await import('./ActionBar');
    render(
      <Fresh
        selectedCount={2}
        onOpen={() => {}}
        onCloseSelected={() => {}}
        onGroup={() => {}}
        onMoveToNewWindow={() => {}}
        onCloseOthers={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Actions'));

    expect(screen.queryByText('Group tabs')).toBeNull();
    expect(screen.getByText('Move to new window')).toBeTruthy();
    chrome.tabGroups = original;
  });
});
