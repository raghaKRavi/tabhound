import { describe, expect, it } from 'vitest';
import { defaultGroupName } from './group-name';

describe('defaultGroupName', () => {
  it('uses the site of the URL', () => {
    expect(defaultGroupName('https://github.com/raghaKRavi/tabhound')).toBe('github.com');
  });

  it('drops a leading www.', () => {
    expect(defaultGroupName('https://www.google.com/search?q=x')).toBe('google.com');
  });

  it('falls back to Tabhound without a usable URL', () => {
    expect(defaultGroupName(undefined)).toBe('Tabhound');
    expect(defaultGroupName('')).toBe('Tabhound');
    expect(defaultGroupName('not a url')).toBe('Tabhound');
  });

  it('falls back for pages with no hostname', () => {
    expect(defaultGroupName('about:blank')).toBe('Tabhound');
  });
});
