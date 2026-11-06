import { fireEvent, render, screen, within } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { groupMap, makeGroup, makeTab } from '../../../test/factories';
import { buildRows } from './buildRows';
import { TabList } from './TabList';

function setup({ query = '', collapsed = new Set<number>(), selected = new Set<number>() } = {}) {
  const group = makeGroup({ id: 7, title: 'Reading', color: 'green', windowId: 1 });
  const grouped = [makeTab({ tabId: 1, title: 'Alpha', groupId: 7 }), makeTab({ tabId: 2, title: 'Beta', groupId: 7 })];
  const loose = makeTab({ tabId: 3, title: 'Gamma' });
  const tabs = [...grouped, loose];
  const { rows } = buildRows({ tabs, query, groupById: groupMap(group), collapsed });

  const handlers = {
    onHighlight: vi.fn(),
    onToggleTab: vi.fn(),
    onToggleGroup: vi.fn(),
    onToggleCollapse: vi.fn(),
    onOpen: vi.fn(),
  };
  render(
    <TabList
      rows={rows}
      matchCount={tabs.length}
      query={query}
      selected={selected}
      highlighted={0}
      windowLabels={new Map([[1, 1]])}
      totalWindows={1}
      {...handlers}
    />,
  );
  return { ...handlers, tabs };
}

describe('TabList', () => {
  it('shows a header with the group name and count, and every tab', () => {
    setup();
    expect(screen.getByText('Reading')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    for (const title of ['Alpha', 'Beta', 'Gamma']) expect(screen.getByText(title)).toBeTruthy();
  });

  it('shows an empty-state message with and without a query', () => {
    const { unmount } = render(
      <TabList
        rows={[]}
        matchCount={0}
        query=""
        selected={new Set()}
        highlighted={0}
        windowLabels={new Map()}
        totalWindows={1}
        onHighlight={() => {}}
        onToggleTab={() => {}}
        onToggleGroup={() => {}}
        onToggleCollapse={() => {}}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No open tabs.')).toBeTruthy();
    unmount();

    render(
      <TabList
        rows={[]}
        matchCount={0}
        query="zzz"
        selected={new Set()}
        highlighted={0}
        windowLabels={new Map()}
        totalWindows={1}
        onHighlight={() => {}}
        onToggleTab={() => {}}
        onToggleGroup={() => {}}
        onToggleCollapse={() => {}}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No tabs match your search.')).toBeTruthy();
  });

  it('opens a tab when its row is clicked', () => {
    const { onOpen, tabs } = setup();
    fireEvent.click(screen.getByText('Gamma'));
    expect(onOpen).toHaveBeenCalledWith(tabs[2]);
  });

  it('selects a single tab from its checkbox', () => {
    const { onToggleTab } = setup();
    const row = screen.getByText('Gamma').closest('.row') as HTMLElement;
    fireEvent.click(within(row).getByRole('checkbox'));
    expect(onToggleTab).toHaveBeenCalledWith(3);
  });

  it('selects the whole group from the header checkbox', () => {
    const { onToggleGroup } = setup();
    fireEvent.click(screen.getByLabelText('Select all tabs in Reading'));
    expect(onToggleGroup).toHaveBeenCalledWith([1, 2]);
  });

  it('shows the header checkbox as partly selected when only some tabs are', () => {
    setup({ selected: new Set([1]) });
    const box = screen.getByLabelText('Select all tabs in Reading') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box.checked).toBe(false);
  });

  it('shows the header checkbox as checked when every tab in the group is selected', () => {
    setup({ selected: new Set([1, 2]) });
    const box = screen.getByLabelText('Select all tabs in Reading') as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(box.indeterminate).toBe(false);
  });

  it('collapses and expands from the header', () => {
    const { onToggleCollapse } = setup();
    fireEvent.click(screen.getByText('Reading'));
    expect(onToggleCollapse).toHaveBeenCalledWith(7);
  });

  it('hides a collapsed group\'s tabs but keeps the loose ones', () => {
    setup({ collapsed: new Set([7]) });
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.getByText('Gamma')).toBeTruthy();
    const toggle = screen.getByText('Reading').closest('button')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('highlights matches in titles while searching and drops the headers', () => {
    setup({ query: 'alp' });
    expect(screen.queryByText('Reading')).toBeNull();
    expect(document.querySelector('mark')?.textContent).toBe('Alp');
  });
});
