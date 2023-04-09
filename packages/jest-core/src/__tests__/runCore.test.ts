/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import {resolve} from 'path';
import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import {runCore} from '../';
import runJest from '../runJest';

jest.mock('jest-runtime', () => ({
  createHasteMap: () => ({
    build: jest.fn(),
  }),
}));
jest.mock('../lib/createContext', () => jest.fn());
jest.mock('../runJest', () =>
  jest.fn(({onComplete}) => {
    onComplete({results: {success: true}});
  }),
);

describe(runCore, () => {
  it('should run once and provide the result', async () => {
    const actualResult = await runCore(makeGlobalConfig(), [
      makeProjectConfig({
        cacheDirectory: resolve(tmpdir(), 'jest_runCore_test'),
      }),
    ]);
    expect(jest.mocked(runJest)).toHaveBeenCalled();
    expect(actualResult).toEqual({results: {success: true}});
  });
});
