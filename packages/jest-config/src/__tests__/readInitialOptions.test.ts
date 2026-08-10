/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {Config} from '@jest/types';
import {readInitialOptions} from '../';

describe(readInitialOptions, () => {
  test('should be able to use serialized jest config', async () => {
    const inputConfig = {jestConfig: 'serialized'};
    const {config, configPath} = await readInitialOptions(
      JSON.stringify(inputConfig),
    );
    expect(config).toEqual({...inputConfig, rootDir: process.cwd()});
    expect(configPath).toBeNull();
  });

  test('should allow deserialized options', async () => {
    const inputConfig = {jestConfig: 'deserialized'};
    const {config, configPath} = await readInitialOptions(undefined, {
      packageRootOrConfig: inputConfig as Config.InitialOptions,
      parentConfigDirname: process.cwd(),
    });
    expect(config).toEqual({...inputConfig, rootDir: process.cwd()});
    expect(configPath).toBeNull();
  });
  // Note: actual file reading is tested in e2e test
});
