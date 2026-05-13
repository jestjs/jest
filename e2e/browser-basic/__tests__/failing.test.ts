/**
 * Intentionally failing tests for error output verification.
 * Used by browserErrors.test.ts outer spec.
 */
import {describe, expect, it} from '@jest/globals';

describe('intentional failures', () => {
  it('assertion failure', () => {
    expect(1 + 1).toBe(3);
  });

  it('thrown error', () => {
    throw new Error('intentional error');
  });

  it('async rejection', async () => {
    await Promise.reject(new Error('async failure'));
  });
});
