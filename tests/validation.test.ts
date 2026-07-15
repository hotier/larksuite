import { describe, it, expect } from 'vitest';
import { parseSecretToken, parseWebhookBody, validateApiBody } from '@/lib/validation';

describe('parseSecretToken', () => {
  it('trims whitespace from a valid token', () => {
    expect(parseSecretToken('  abc123  ')).toBe('abc123');
  });

  it('returns empty string for undefined', () => {
    expect(parseSecretToken(undefined)).toBe('');
  });

  it('returns empty string for a too-long token', () => {
    expect(parseSecretToken('x'.repeat(600))).toBe('');
  });

  it('returns empty string for a non-string', () => {
    expect(parseSecretToken(123)).toBe('');
  });
});

describe('parseWebhookBody', () => {
  it('returns {} for non-objects', () => {
    expect(parseWebhookBody(null)).toEqual({});
    expect(parseWebhookBody('str')).toEqual({});
    expect(parseWebhookBody([1, 2])).toEqual({});
  });

  it('returns the object for a valid object', () => {
    expect(parseWebhookBody({ a: 1, b: 'x' })).toEqual({ a: 1, b: 'x' });
  });

  it('strips prototype-pollution keys', () => {
    const out = parseWebhookBody({
      __proto__: { polluted: true },
      ok: 1,
    }) as Record<string, unknown>;
    expect(out.ok).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(out, '__proto__')).toBe(false);
  });
});

describe('validateApiBody', () => {
  it('returns an error when action is missing', () => {
    expect(validateApiBody({})).toMatch(/action/);
  });

  it('returns an error for an unknown action', () => {
    expect(validateApiBody({ action: 'hack' })).toMatch(/不支持的操作类型/);
  });

  it('passes for a no-payload action', () => {
    expect(validateApiBody({ action: 'authStatus' })).toBeNull();
  });

  it('returns an error when a required string field is empty', () => {
    expect(validateApiBody({ action: 'createApp', appName: '' })).toMatch(/缺少参数: appName/);
  });

  it('returns an error when a required field is missing', () => {
    expect(validateApiBody({ action: 'read' })).toMatch(/缺少参数: appToken/);
  });

  it('passes when all required fields are present', () => {
    expect(
      validateApiBody({
        action: 'create',
        appToken: 't',
        tableId: 'tbl',
        fields: { name: 'x' },
      }),
    ).toBeNull();
  });

  it('rejects missing fields on create', () => {
    expect(validateApiBody({ action: 'create', appToken: 't' })).toMatch(/缺少参数/);
  });
});
