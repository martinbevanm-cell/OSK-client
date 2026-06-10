import { describe, expect, it } from 'vitest';
import { resolveApiBasePath, resolveApiOrigin, isAbsoluteUrl } from '../apiBase';

describe('apiBase helpers', () => {
  it('detects absolute URLs', () => {
    expect(isAbsoluteUrl('https://osk-backend-production.up.railway.app/api/v1')).toBe(
      true,
    );
    expect(isAbsoluteUrl('/api/v1')).toBe(false);
  });

  it('resolves absolute public API base to a relative path', () => {
    expect(resolveApiBasePath()).toMatch(/^\//);
  });

  it('resolves origin safely', () => {
    const origin = resolveApiOrigin();
    expect(typeof origin).toBe('string');
    expect(origin.length).toBeGreaterThan(0);
  });
});
