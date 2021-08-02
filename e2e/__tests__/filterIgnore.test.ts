/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Dynamic test filtering', () => {

  it('ignores the filter if requested to do so', () => {
    const result = runJest('filter', [
      '--filter=<rootDir>/my-secondary-filter.js',
      '--skipFilter',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('2 total');
  });

});
