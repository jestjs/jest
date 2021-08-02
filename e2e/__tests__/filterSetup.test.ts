/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Dynamic test filtering', () => {

  it('will call setup on filter before filtering', () => {
    const result = runJest('filter', ['--filter=<rootDir>/my-setup-filter.js']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('1 total');
  });

});
