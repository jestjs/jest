/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import * as jestUtil from 'jest-util';
import {runCore} from '../runCore';
import runJest from '../runJest';
import watch from '../watch';

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
jest.mock('../watch', () => jest.fn());
jest.mock('jest-util', () => {
  const original = jest.requireActual<typeof jestUtil>('jest-util');

  return {
    ...original,
    createDirectory: jest.fn(),
  };
});

describe(runCore, () => {
  beforeEach(() => {
    jest.spyOn(jestUtil, 'createDirectory').mockReturnValue();
  });

  it('should run once and provide the result', async () => {
    const actualResult = await runCore(makeGlobalConfig(), [
      makeProjectConfig(),
    ]);
    expect(jest.mocked(runJest)).toHaveBeenCalled();
    expect(actualResult).toEqual({result: {results: {success: true}}});
  });

  it('should provide stderr as output stream when useStderr is true', async () => {
    await runCore(makeGlobalConfig({useStderr: true}), [makeProjectConfig()]);
    expect(jest.mocked(runJest)).toHaveBeenCalledWith(
      expect.objectContaining({outputStream: process.stderr}),
    );
  });

  it('should not watch when watch is false', async () => {
    await runCore(makeGlobalConfig({watch: false}), [makeProjectConfig()]);
    expect(jest.mocked(watch)).not.toHaveBeenCalled();
  });
});
