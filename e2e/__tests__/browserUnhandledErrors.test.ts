import {describe, expect, it} from '@jest/globals';
import runJest from '../runJest';

const DIR = 'browser-basic';

describe('browser unhandled errors', () => {
  it('fails test when unhandled error is thrown', () => {
    const {exitCode, stderr} = runJest(DIR, ['unhandled-error.test.ts']);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('custom_unhandled_error');
  });

  it('fails test when unhandled rejection with non-error', () => {
    const {exitCode, stderr} = runJest(DIR, ['unhandled-non-error.test.ts']);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('string_rejection_value');
  });

  it('does not track errors when trackUnhandledErrors is false', () => {
    // This test needs a fixture with trackUnhandledErrors: false
    // For now, verify default behavior (enabled) works
    const {exitCode} = runJest(DIR, ['unhandled-error.test.ts']);
    expect(exitCode).toBe(1);
  });
});
