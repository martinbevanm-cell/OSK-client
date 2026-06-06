import { describe, expect, it } from 'vitest';
import { resolveMediaUrl } from '../mediaUrl';

/**
 * Default API_BASE used by the resolver. vitest doesn't set the env var,
 * so the helper falls back to http://localhost:5000/api/v1 — origin is
 * http://localhost:5000.
 */
const ORIGIN = 'http://localhost:5000';

describe('resolveMediaUrl', () => {
  it('returns absolute URLs untouched', () => {
    expect(resolveMediaUrl('https://cdn.osk.com/x.jpg')).toBe(
      'https://cdn.osk.com/x.jpg',
    );
    expect(resolveMediaUrl('data:image/png;base64,xxx')).toBe(
      'data:image/png;base64,xxx',
    );
    expect(resolveMediaUrl('blob:https://x/abc')).toBe('blob:https://x/abc');
  });

  it('returns protocol-relative URLs untouched', () => {
    expect(resolveMediaUrl('//cdn.osk.com/x.jpg')).toBe('//cdn.osk.com/x.jpg');
  });

  it('prefixes paths starting with / with the API origin', () => {
    expect(resolveMediaUrl('/uploads/abc.jpg')).toBe(
      `${ORIGIN}/uploads/abc.jpg`,
    );
  });

  it('prepends a slash to bare relative paths', () => {
    expect(resolveMediaUrl('uploads/abc.jpg')).toBe(
      `${ORIGIN}/uploads/abc.jpg`,
    );
  });

  it('passes empty strings through (don\'t inject an origin onto nothing)', () => {
    expect(resolveMediaUrl('')).toBe('');
  });
});
