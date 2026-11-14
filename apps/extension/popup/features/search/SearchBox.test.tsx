import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { SearchBox } from './SearchBox';

function setup() {
  const onChange = vi.fn();
  render(<SearchBox query="" onChange={onChange} matchCount={12} />);
  return { onChange, input: screen.getByPlaceholderText('Search open tabs…') as HTMLInputElement };
}

describe('SearchBox', () => {
  it('treats whitespace-only input as empty', () => {
    const { onChange, input } = setup();
    fireEvent.input(input, { target: { value: '   ' } });
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input.value).toBe('');
  });

  it('drops leading spaces but keeps spaces between words', () => {
    const { onChange, input } = setup();
    fireEvent.input(input, { target: { value: '  tab hound' } });
    expect(onChange).toHaveBeenLastCalledWith('tab hound');
  });
});
