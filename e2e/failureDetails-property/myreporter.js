/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

class MyCustomReporter {
  onRunComplete(contexts, results) {
    console.log(
      JSON.stringify(
        results.testResults[0].testResults.map(f => f.failureDetails),
        null,
        2,
      ),
    );
  }
}

module.exports = MyCustomReporter;
