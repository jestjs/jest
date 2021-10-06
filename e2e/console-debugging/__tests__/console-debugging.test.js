/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const stdoutWrite = require('../stdout-spy');

process.stdout.write = jest.fn(process.stdout.write);

test('verbose mode prints console output synchronously', () => {
  console.log('test');

  // this asserts the console log exists in the output before this test exits
  expect(stdoutWrite.text).toMatchInlineSnapshot(`
    Array [
      "Determining test suites to run...",
      "RUNS  __tests__/console-debugging.test.js",
      "RUNS  __tests__/console-debugging.test.js",
      "console.log
        test

          at Object.log (__tests__/console-debugging.test.js:14:11)",
      "RUNS  __tests__/console-debugging.test.js",
    ]
  `);
});
