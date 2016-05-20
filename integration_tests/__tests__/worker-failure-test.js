/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const os = require('os');
const runJest = require('../runJest');

const cpus = os.cpus();

describe('Worker Failure', () => {
  it('recovers from an infinite loop', () => {
    if (cpus <= 1) {
      console.log(
        'Skipping the worker-failure test because there are not enough CPUs ' +
        'available in this environment.'
      );
      return;
    }

    const result = runJest.json('worker-failure', [
      '--maxWorkers=2'
    ]);

    expect(result.status).toBe(1);
    expect(result.json.numTotalTests).toBe(3);
    expect(result.json.numTotalTestSuites).toBe(4);
    expect(result.json.numRuntimeErrorTestSuites).toBe(1);
    expect(result.json.numPassedTests).toBe(3);
    expect(result.json.numFailedTests).toBe(0);
    expect(result.json.numPendingTests).toBe(0);
  });
});
