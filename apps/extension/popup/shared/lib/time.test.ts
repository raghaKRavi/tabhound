import { describe, expect, it } from 'vitest';
import { timeAgo } from './time';

const now = 1_000_000 * 1000;
const ago = (secs: number) => timeAgo(1_000_000 - secs, now);

describe('timeAgo', () => {
  it('says "just now" under a minute, and for times in the future', () => {
    expect(ago(0)).toBe('just now');
    expect(ago(59)).toBe('just now');
    expect(ago(-30)).toBe('just now');
  });

  it('counts minutes, hours and days with singular and plural units', () => {
    expect(ago(60)).toBe('1 min ago');
    expect(ago(23 * 60)).toBe('23 mins ago');
    expect(ago(60 * 60)).toBe('1 hr ago');
    expect(ago(5 * 3600)).toBe('5 hrs ago');
    expect(ago(24 * 3600)).toBe('1 day ago');
    expect(ago(3 * 24 * 3600)).toBe('3 days ago');
  });
});
