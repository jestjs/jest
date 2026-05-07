/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('node:fs');
const path = require('node:path');

class CustomRunner {
  constructor(globalConfig, context, options) {
    this._globalConfig = globalConfig;
    this._context = context;
    this._options = options;

    // Write options to a file so the test can verify them
    fs.writeFileSync(
      path.join(__dirname, 'runner-options-received.json'),
      JSON.stringify(options || null),
    );
  }

  async runTests(tests, watcher, onStart, onResult, _onFailure) {
    for (const test of tests) {
      await onStart(test);
      const result = {
        console: null,
        failureMessage: null,
        leaks: false,
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 0,
        numTodoTests: 0,
        openHandles: [],
        perfStats: {
          end: Date.now(),
          runtime: 0,
          slow: false,
          start: Date.now(),
        },
        skipped: false,
        snapshot: {
          added: 0,
          fileDeleted: false,
          matched: 0,
          unchecked: 0,
          uncheckedKeys: [],
          unmatched: 0,
          updated: 0,
        },
        testFilePath: test.path,
        testResults: [
          {
            ancestorTitles: [],
            duration: 1,
            failureDetails: [],
            failureMessages: [],
            fullName: 'runner received options',
            location: null,
            numPassingAsserts: 1,
            status: 'passed',
            title: 'runner received options',
          },
        ],
      };
      await onResult(test, result);
    }
  }
}

module.exports = CustomRunner;
