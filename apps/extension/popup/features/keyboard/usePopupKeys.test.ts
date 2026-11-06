import { renderHook } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTab } from '../../../test/factories';
import { usePopupKeys } from './usePopupKeys';

const tabs = [makeTab({ tabId: 1 }), makeTab({ tabId: 2 })];

function setup(over: Partial<Parameters<typeof usePopupKeys>[0]> = {}) {
  const args = {
    visibleTabs: tabs,
    highlighted: 1,
    query: '',
    overlayOpen: false,
    moveHighlight: vi.fn(),
    openTab: vi.fn(),
    clearQuery: vi.fn(),
    closeOverlay: vi.fn(),
    ...over,
  };
  const { result } = renderHook(() => usePopupKeys(args));
  const press = (key: string, target: Partial<EventTarget> = document.body) => {
    const e = new KeyboardEvent('keydown', { key, cancelable: true });
    Object.defineProperty(e, 'target', { value: target });
    result.current(e);
    return e;
  };
  return { args, press };
}

beforeEach(() => {
  vi.spyOn(window, 'close').mockImplementation(() => {});
});

describe('usePopupKeys', () => {
  it('moves the highlight with the arrow keys and keeps the cursor in the search box', () => {
    const { args, press } = setup();

    expect(press('ArrowDown').defaultPrevented).toBe(true);
    expect(args.moveHighlight).toHaveBeenLastCalledWith(1);

    press('ArrowUp');
    expect(args.moveHighlight).toHaveBeenLastCalledWith(-1);
  });

  it('opens the highlighted tab on Enter', () => {
    const { args, press } = setup({ highlighted: 1 });
    press('Enter');
    expect(args.openTab).toHaveBeenCalledWith(tabs[1]);
  });

  it('leaves Enter to a focused button', () => {
    const { args, press } = setup();
    const button = document.createElement('button');
    press('Enter', button);
    expect(args.openTab).not.toHaveBeenCalled();
  });

  it('does nothing on Enter when there is nothing to open', () => {
    const { args, press } = setup({ visibleTabs: [], highlighted: 0 });
    press('Enter');
    expect(args.openTab).not.toHaveBeenCalled();
  });

  describe('Escape backs out one level at a time', () => {
    it('closes an open panel first', () => {
      const { args, press } = setup({ overlayOpen: true, query: 'abc' });
      press('Escape');
      expect(args.closeOverlay).toHaveBeenCalledTimes(1);
      expect(args.clearQuery).not.toHaveBeenCalled();
      expect(window.close).not.toHaveBeenCalled();
    });

    it('then clears the search', () => {
      const { args, press } = setup({ query: 'abc' });
      press('Escape');
      expect(args.clearQuery).toHaveBeenCalledTimes(1);
      expect(window.close).not.toHaveBeenCalled();
    });

    it('then closes the popup', () => {
      const { press } = setup();
      press('Escape');
      expect(window.close).toHaveBeenCalledTimes(1);
    });
  });
});
