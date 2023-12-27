/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig, makeProjectConfig} from '@jest/test-utils';
import type {Config} from '@jest/types';
import * as jestConfig from 'jest-config';
import * as jestUtil from 'jest-util';
import {Jest, createJest} from '../jest';
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
jest.mock('jest-config', () => ({
  readConfigs: jest.fn(async () => {
    const {makeProjectConfig, makeGlobalConfig} = await import(
      '@jest/test-utils'
    );
    return {
      configs: [makeProjectConfig()],
      globalConfig: makeGlobalConfig(),
    };
  }),
}));

describe(Jest, () => {
  let globalConfig: Config.GlobalConfig;
  beforeEach(() => {
    globalConfig = makeGlobalConfig();
    jest.spyOn(jestUtil, 'createDirectory').mockReturnValue();
    jest.spyOn(jestConfig, 'readConfigs').mockReturnValue(
      Promise.resolve({
        configs: [makeProjectConfig()],
        globalConfig,
        hasDeprecationWarnings: false,
      }),
    );
  });

  describe(Jest.createJest, () => {
    it('should provide default values when no args are passed', async () => {
      await Jest.createJest();
      expect(jestConfig.readConfigs).toHaveBeenCalledWith(
        expect.objectContaining({
          $0: 'programmatic',
          _: [],
        }),
        ['.'],
      );
    });
  });

  describe(Jest.prototype.run, () => {
    it('should run once and provide the result', async () => {
      const jestInstance = await createJest();
      const actualResults = await jestInstance.run();
      expect(jest.mocked(runJest)).toHaveBeenCalled();
      expect(actualResults).toEqual({results: {results: {success: true}}});
    });

    it('should provide stderr as output stream when useStderr is true', async () => {
      globalConfig.useStderr = true;
      const jestInstance = await createJest();

      await jestInstance.run();

      expect(jest.mocked(runJest)).toHaveBeenCalledWith(
        expect.objectContaining({outputStream: process.stderr}),
      );
    });

    it('should not watch when watch is false', async () => {
      globalConfig.watch = false;
      const jestInstance = await createJest();
      await jestInstance.run();
      expect(jest.mocked(watch)).not.toHaveBeenCalled();
    });
  });
});
