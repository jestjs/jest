/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest, {RunJestResult} from '../runJest';

const getLog = (result: RunJestResult) => result.stdout.split('\n')[1].trim();

describe('Environment override', () => {
  it('uses jsdom when specified', () => {
    const result = runJest('env-test', ['--env=jsdom', 'env.test.js']);
    expect(result.exitCode).toBe(0);
    expect(getLog(result)).toBe('WINDOW');
  });

});

