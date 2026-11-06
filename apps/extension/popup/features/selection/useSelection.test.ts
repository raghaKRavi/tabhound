import { act, renderHook } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { useSelection } from './useSelection';

describe('useSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSelection());
    expect(result.current.count).toBe(0);
    expect(result.current.ids).toEqual([]);
  });

  it('toggles a single tab on and off', () => {
    const { result } = renderHook(() => useSelection());

    act(() => result.current.toggle(4));
    expect(result.current.ids).toEqual([4]);

    act(() => result.current.toggle(4));
    expect(result.current.ids).toEqual([]);
  });

  it('selects a whole group, keeping what was already selected', () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggle(1));

    act(() => result.current.toggleMany([1, 2, 3]));
    expect(result.current.ids.sort()).toEqual([1, 2, 3]);
  });

  it('deselects a group only when all of it was selected', () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggleMany([1, 2, 3]));

    act(() => result.current.toggleMany([1, 2, 3]));
    expect(result.current.ids).toEqual([]);
  });

  it('completes a partly selected group instead of clearing it', () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggle(2));

    act(() => result.current.toggleMany([1, 2, 3]));
    expect(result.current.count).toBe(3);
  });
});
