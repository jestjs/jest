/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig} from '../../../../TestUtils';
import {formatTestPath} from '../utils';
import getResultHeader from '../get_result_header';
const terminalLink = require('terminal-link');

jest.mock('terminal-link', () => jest.fn());

const testResult = {
  testFilePath: '/foo',
};

const globalConfig = makeGlobalConfig();

test('should call `terminal-link` correctly', () => {
  terminalLink.mockClear();

  getResultHeader(testResult, globalConfig);
  const call = terminalLink.mock.calls[0];

  expect(terminalLink).toHaveBeenCalled();
  expect(call[0]).toBe(formatTestPath(globalConfig, testResult.testFilePath));
  expect(call[1]).toBe(`file://${testResult.testFilePath}`);
});
