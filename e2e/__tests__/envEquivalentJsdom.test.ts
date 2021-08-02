/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';


describe('Environment equivalent', () => {
  it('uses jsdom', () => {
    const result = runJest('env-test', ['--env=jsdom', 'equivalent.test.js']);
    expect(result.exitCode).toBe(0);
  });
});
