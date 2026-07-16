/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Snapshot serializers', () => {
  it('renders snapshot', () => {
    const result = runJest('snapshot-unknown', ['-w=1']);
    const stderr = result.stderr;

    expect(stderr).toMatch('2 snapshot files obsolete');
    expect(stderr).toMatch('__tests__/__snapshots__/fails.test.js.snap');
    expect(stderr).toMatch('__tests__/__snapshots__/fails2.test.js.snap');
    expect(result.exitCode).toBe(1);
  });
});
