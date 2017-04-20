/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const {formatExecError} = require('../');

it('.formatExecError()', () => {
  const message = formatExecError(
    {
      testExecError: {
        message: 'Whoops!',
      },
      testFilePath: '/test/error/file/path',
    },
    {
      noStackTrace: false,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});
