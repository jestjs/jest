/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

// This test ensures that if a custom environment's teardown throws, Jest reports the real error, not an internal error.
describe('Environment Teardown Error', () => {
  it('reports the error thrown from teardown() in a custom environment', () => {
    const {stderr, exitCode} = runJest('environment-teardown-error');
    expect(exitCode).toBe(1);
    expect(stderr).toMatch('teardown error from custom environment');
    // Should NOT contain the internal error that was seen in the regression
    expect(stderr).not.toMatch(
      'The "object" argument must be of type object. Received null',
    );
  });
});
