/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const {formatResultsErrors, formatExecError} = require('../');

const unixStackTrace =
  `  ` +
  `at stack (../jest-jasmine2/build/jasmine-2.4.1.js:1580:17)
  at Object.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:1550:14)
  at jasmine.addResult (../jest-jasmine2/build/index.js:82:44)
  at Spec.Env.factory (../jest-jasmine2/build/jasmine-2.4.1.js:641:18)
  at Spec.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:333:34)
  at Expectation.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:591:21)
  at Expectation.toBe (../jest-jasmine2/build/jasmine-2.4.1.js:1504:12)
  at Object.it (build/__tests__/messages-test.js:45:41)
  at Object.<anonymous> (../jest-jasmine2/build/jasmine-pit.js:35:32)
  at attemptAsync (../jest-jasmine2/build/jasmine-2.4.1.js:1919:24)`;

it('should exclude jasmine from stack trace for Unix paths.', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        failureMessages: [unixStackTrace],
        title: 'Unix test',
      },
    ],
    {
      rootDir: '',
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('.formatExecError()', () => {
  const message = formatExecError(
    {
      testExecError: {
        message: 'Whoops!',
      },
      testFilePath: '/test/error/file/path',
    },
    {
      rootDir: '',
    },
    {
      noStackTrace: false,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});
