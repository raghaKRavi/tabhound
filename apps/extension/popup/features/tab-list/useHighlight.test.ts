import { act, renderHook } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { useHighlight } from './useHighlight';

describe('useHighlight', () => {
  it('moves down and up within the list', () => {
    const { result } = renderHook(() => useHighlight(3, []));

    act(() => result.current.move(1));
    expect(result.current.highlighted).toBe(1);
    act(() => result.current.move(-1));
    expect(result.current.highlighted).toBe(0);
  });

  it('stops at both ends', () => {
    const { result } = renderHook(() => useHighlight(2, []));

    act(() => result.current.move(-1));
    expect(result.current.highlighted).toBe(0);

    act(() => result.current.move(1));
    act(() => result.current.move(1));
    act(() => result.current.move(1));
    expect(result.current.highlighted).toBe(1);
  });

  it('stays at 0 for an empty list', () => {
    const { result } = renderHook(() => useHighlight(0, []));
    act(() => result.current.move(1));
    expect(result.current.highlighted).toBe(0);
  });

  it('goes back to the first tab when the query changes', () => {
    const { result, rerender } = renderHook(({ q }) => useHighlight(5, [q]), {
      initialProps: { q: '' },
    });
    act(() => result.current.move(1));
    act(() => result.current.move(1));
    expect(result.current.highlighted).toBe(2);

    rerender({ q: 'abc' });
    expect(result.current.highlighted).toBe(0);
  });

  it('follows the mouse', () => {
    const { result } = renderHook(() => useHighlight(5, []));
    act(() => result.current.setHighlighted(3));
    expect(result.current.highlighted).toBe(3);
  });
});
