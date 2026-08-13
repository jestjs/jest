/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('omits console.error frames matching stackTraceIgnorePatterns', () => {
  const {stderr, exitCode} = runJest('stack-trace-ignore-patterns', [
    `--config=${JSON.stringify({
      stackTraceIgnorePatterns: ['helpers/noisyLib\\.js'],
      testEnvironment: 'node',
      verbose: false,
    })}`,
    '--no-cache',
  ]);
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toBe(`PASS __tests__/consoleError.test.js
  ● Console

    console.error
      error from noisy lib

      10 |
      11 | module.exports = function callNoisyLib() {
    > 12 |   emitLibError();
         |   ^
      13 | };
      14 |

      at emitLibError (helpers/middle.js:12:3)
      at Object.callNoisyLib (__tests__/consoleError.test.js:12:3)`);
});

test('keeps helper frames when stackTraceIgnorePatterns is unset', () => {
  const {stderr, exitCode} = runJest('stack-trace-ignore-patterns', [
    `--config=${JSON.stringify({
      testEnvironment: 'node',
      verbose: false,
    })}`,
    '--no-cache',
  ]);
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toBe(`PASS __tests__/consoleError.test.js
  ● Console

    console.error
      error from noisy lib

       8 |
       9 | module.exports = function emitLibError() {
    > 10 |   console.error('error from noisy lib');
         |           ^
      11 | };
      12 |

      at error (helpers/noisyLib.js:10:11)
      at emitLibError (helpers/middle.js:12:3)
      at Object.callNoisyLib (__tests__/consoleError.test.js:12:3)`);
});
