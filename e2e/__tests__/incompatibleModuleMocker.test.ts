/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Incompatible moduleMocker', () => {
  it('reports a descriptive error when the environment provides an incompatible moduleMocker', () => {
    const {stderr, exitCode} = runJest('incompatible-module-mocker');
    expect(exitCode).toBe(1);
    expect(stderr).toMatch(
      "The test environment's `moduleMocker` is not compatible with this version of Jest.",
    );
    expect(stderr).toMatch('`clearMocksOnScope` is required but not available.');
    expect(stderr).toMatch(
      'Please ensure your test environment (e.g., `jest-environment-jsdom`) uses a compatible version of `jest-mock` (>=30.4.0).',
    );
    // Should NOT show the opaque internal error
    expect(stderr).not.toMatch(
      'clearMocksOnScope is not a function',
    );
  });
});
