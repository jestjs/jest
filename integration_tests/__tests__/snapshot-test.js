/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';
const fs = require('fs');
const path = require('path');
const runJest = require('../runJest');

describe('Snapshot', () => {
  it('works as expected', () => {
    const result = runJest.json('snapshot', []);
    const json = result.json;

    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(2);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
    expect(result.status).toBe(0);

    const content = fs.readFileSync(
      path.resolve(
        __dirname,
        '../snapshot/__tests__/__snapshots__/snapshot.js.snap'
      )
    );

    const output = JSON.parse(content);
    expect(
      output['snapshot is not influenced by previous counter 0']
    ).not.toBe(undefined);

  });
});
