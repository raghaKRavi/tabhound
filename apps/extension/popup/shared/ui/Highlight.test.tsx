import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { Highlight } from './Highlight';

const marks = (container: Element) => [...container.querySelectorAll('mark')].map((m) => m.textContent);

describe('Highlight', () => {
  it('marks every occurrence, ignoring case', () => {
    const { container } = render(<Highlight text="Blog about blogs" query="BLOG" />);
    expect(marks(container)).toEqual(['Blog', 'blog']);
    expect(container.textContent).toBe('Blog about blogs');
  });

  it('renders plain text when the query is empty or blank', () => {
    const { container } = render(<Highlight text="Nothing here" query="  " />);
    expect(marks(container)).toEqual([]);
    expect(container.textContent).toBe('Nothing here');
  });

  it('renders plain text when nothing matches', () => {
    const { container } = render(<Highlight text="Hello" query="xyz" />);
    expect(marks(container)).toEqual([]);
    expect(container.textContent).toBe('Hello');
  });

  it('treats regex characters in the query literally', () => {
    const { container } = render(<Highlight text="a.b (c)" query=".b (" />);
    expect(marks(container)).toEqual(['.b (']);
  });
});
