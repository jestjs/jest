/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Snapshot serializers', () => {
  it('renders snapshot', () => {
    const result = runJest('snapshot-unknown', ['-w=1']);
    const stdout = result.stdout;

    expect(stdout).toMatch('2 snapshot files obsolete');
    expect(stdout).toMatch('__tests__/__snapshots__/fails.test.js.snap');
    expect(stdout).toMatch('__tests__/__snapshots__/fails2.test.js.snap');
    expect(result.exitCode).toBe(1);
  });
});
