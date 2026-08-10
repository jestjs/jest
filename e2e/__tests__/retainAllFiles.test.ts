/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('Retain All Files Integration', () => {
  test('valid test within node_modules', () => {
    const {exitCode, stdout} = runJest('retain-all-files');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('I am running from within node_modules');
  });
});
