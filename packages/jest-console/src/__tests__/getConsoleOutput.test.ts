/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig} from '@jest/test-utils';
import {formatStackTrace} from 'jest-message-util';
import BufferedConsole from '../BufferedConsole';
import getConsoleOutput from '../getConsoleOutput';

jest.mock('jest-message-util', () => ({
  formatStackTrace: jest.fn(),
}));

describe('getConsoleOutput', () => {
  const globalConfig = makeGlobalConfig({noStackTrace: true});
  jest
    .mocked(formatStackTrace)
    .mockImplementation(() => 'throw new Error("Whoops!");');

  it.each([
    'assert',
    'count',
    'debug',
    'dir',
    'dirxml',
    'error',
    'group',
    'groupCollapsed',
    'info',
    'log',
    'time',
    'warn',
  ] as const)('takes noStackTrace and pass it on for %s', logType => {
    getConsoleOutput(
      BufferedConsole.write([], logType, 'message', 4),
      {
        rootDir: 'root',
        testMatch: [],
      },
      globalConfig,
    );
    expect(formatStackTrace).toHaveBeenCalled();
    expect(formatStackTrace).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        noCodeFrame: expect.anything(),
        noStackTrace: true,
      }),
    );
  });
});
