import { describe, expect, it } from 'vitest';
import { isInternalUrl, shortUrl } from './url';

describe('shortUrl', () => {
  it('shows host and path without the scheme or a trailing slash', () => {
    expect(shortUrl('https://github.com/raghaKRavi/tabhound/')).toBe('github.com/raghaKRavi/tabhound');
    expect(shortUrl('https://example.com/')).toBe('example.com');
  });

  it('drops the query string and hash', () => {
    expect(shortUrl('https://www.google.com/search?q=tabs#top')).toBe('www.google.com/search');
  });

  it('returns the input when it is not a URL', () => {
    expect(shortUrl('newtab')).toBe('newtab');
  });
});

describe('isInternalUrl', () => {
  it.each(['chrome://extensions', 'chrome-extension://abc/popup.html', 'edge://settings', 'about:blank', ''])(
    'is true for %j',
    (url) => expect(isInternalUrl(url)).toBe(true),
  );

  it.each(['https://example.com', 'http://localhost:3000'])('is false for %s', (url) =>
    expect(isInternalUrl(url)).toBe(false),
  );
});
