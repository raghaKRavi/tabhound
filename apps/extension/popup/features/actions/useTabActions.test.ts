import { act, renderHook } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTab } from '../../../test/factories';

const send = vi.fn();
vi.mock('../../shared/lib/messaging-client', () => ({ send: (...a: unknown[]) => send(...a) }));

const { useTabActions } = await import('./useTabActions');

beforeEach(() => {
  send.mockReset().mockResolvedValue({ type: 'ok' });
  vi.spyOn(window, 'close').mockImplementation(() => {});
});

const tabs = [makeTab({ tabId: 1, windowId: 10 }), makeTab({ tabId: 2, windowId: 20 })];

describe('useTabActions', () => {
  it('focuses a tab and closes the popup', async () => {
    const { result } = renderHook(() => useTabActions([], tabs));
    await act(() => result.current.openTab(tabs[1]!));

    expect(send).toHaveBeenCalledWith({ type: 'focus', tabId: 2, windowId: 20 });
    expect(window.close).toHaveBeenCalled();
  });

  it('opens the first selected tab', async () => {
    const { result } = renderHook(() => useTabActions([2], tabs));
    await act(() => result.current.openSelected());
    expect(send).toHaveBeenCalledWith({ type: 'focus', tabId: 2, windowId: 20 });
  });

  it('closes, keeps, and moves the selected tabs', async () => {
    const { result } = renderHook(() => useTabActions([1, 2], tabs));

    await act(() => result.current.closeSelected());
    expect(send).toHaveBeenLastCalledWith({ type: 'closeSelected', tabIds: [1, 2] });

    await act(() => result.current.closeOthers());
    expect(send).toHaveBeenLastCalledWith({ type: 'closeOthers', keepTabIds: [1, 2] });

    await act(() => result.current.moveToNewWindow());
    expect(send).toHaveBeenLastCalledWith({ type: 'moveToNewWindow', tabIds: [1, 2] });
  });

  it('groups the selected tabs into a new or an existing group', async () => {
    const { result } = renderHook(() => useTabActions([1, 2], tabs));

    await act(() => result.current.groupInto({ kind: 'new', title: 'Work', color: 'red' }));
    expect(send).toHaveBeenLastCalledWith({
      type: 'group',
      tabIds: [1, 2],
      target: { kind: 'new', title: 'Work', color: 'red' },
    });

    await act(() => result.current.groupInto({ kind: 'existing', groupId: 9 }));
    expect(send).toHaveBeenLastCalledWith({
      type: 'group',
      tabIds: [1, 2],
      target: { kind: 'existing', groupId: 9 },
    });
  });

  it('does nothing when no tab is selected', async () => {
    const { result } = renderHook(() => useTabActions([], tabs));
    await act(async () => {
      await result.current.closeSelected();
      await result.current.closeOthers();
      await result.current.moveToNewWindow();
      await result.current.groupInto({ kind: 'existing', groupId: 1 });
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps the popup open and exposes the message when an action fails', async () => {
    send.mockRejectedValue(new Error('Cannot group pinned tab'));
    const { result } = renderHook(() => useTabActions([1], tabs));
    await act(() => result.current.closeSelected());

    expect(window.close).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Cannot group pinned tab');

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
