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
  // test only works consistently without tty
  expect(process.stdout.isTTY).not.toBe(true);

  console.log('test');

  expect(stdoutWrite.text).toMatchInlineSnapshot(`
    "  console.log
        test

          at Object.<anonymous> (__tests__/console-debugging.test.js:17:11)

    "
  `);
});
