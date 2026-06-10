import { describe, expect, it } from 'vitest';
import {
  resolveApiBasePathForServer,
  resolveApiBasePathForClient,
  resolveApiOrigin,
  isAbsoluteUrl,
} from '../apiBase';

describe('apiBase helpers', () => {
  it('detects absolute URLs', () => {
    expect(isAbsoluteUrl('https://osk-backend-production.up.railway.app/api/v1')).toBe(
      true,
    );
    expect(isAbsoluteUrl('/api/v1')).toBe(false);
  });

  it('resolves server-side API base to a relative path', () => {
    expect(resolveApiBasePathForServer()).toMatch(/^\//);
  });

  it('resolves client-side API base (preserves configured URL)', () => {
    const clientPath = resolveApiBasePathForClient();
    expect(typeof clientPath).toBe('string');
    expect(clientPath.length).toBeGreaterThan(0);
  });

  it('resolves origin safely', () => {
    const origin = resolveApiOrigin();
    expect(typeof origin).toBe('string');
    expect(origin.length).toBeGreaterThan(0);
  });
});
