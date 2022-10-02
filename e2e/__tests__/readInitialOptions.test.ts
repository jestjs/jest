/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path = require('path');
import {readInitialOptions} from 'jest-config';

function resolveFixture(...pathSegments: Array<string>) {
  return path.resolve(__dirname, '..', 'read-initial-options', ...pathSegments);
}

describe(readInitialOptions, () => {
  test('should read from the cwd by default', async () => {
    const configFile = resolveFixture('js-config', 'jest.config.js');
    const rootDir = resolveFixture('js-config');
    jest.spyOn(process, 'cwd').mockReturnValue(rootDir);
    const {config, configPath} = await readInitialOptions();
    expect(config).toEqual({jestConfig: 'jest.config.js', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.js file', async () => {
    const configFile = resolveFixture('js-config', 'jest.config.js');
    const rootDir = resolveFixture('js-config');
    const {config, configPath} = await readInitialOptions(configFile);
    expect(config).toEqual({jestConfig: 'jest.config.js', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a package.json file', async () => {
    const configFile = resolveFixture('pkg-config', 'package.json');
    const rootDir = resolveFixture('pkg-config');
    const {config, configPath} = await readInitialOptions(configFile);
    expect(config).toEqual({jestConfig: 'package.json', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.ts file', async () => {
    const configFile = resolveFixture('ts-config', 'jest.config.ts');
    const rootDir = resolveFixture('ts-config');
    const {config, configPath} = await readInitialOptions(configFile);
    expect(config).toEqual({jestConfig: 'jest.config.ts', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.json file', async () => {
    const configFile = resolveFixture('json-config', 'jest.config.json');
    const rootDir = resolveFixture('json-config');
    const {config, configPath} = await readInitialOptions(configFile);
    expect(config).toEqual({jestConfig: 'jest.config.json', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest config exporting an async function', async () => {
    const configFile = resolveFixture('async-config', 'jest.config.js');
    const rootDir = resolveFixture('async-config');
    const {config, configPath} = await readInitialOptions(configFile);
    expect(config).toEqual({jestConfig: 'async-config', rootDir});
    expect(configPath).toEqual(configFile);
  });

  test('should be able to skip config reading, instead read from cwd', async () => {
    const expectedConfigFile = resolveFixture(
      'json-config',
      'jest.config.json',
    );
    jest.spyOn(process, 'cwd').mockReturnValue(resolveFixture('json-config'));
    const {config, configPath} = await readInitialOptions(
      resolveFixture('js-config', 'jest.config.js'),
      {
        readFromCwd: true,
      },
    );
    expect(config).toEqual({
      jestConfig: 'jest.config.json',
      rootDir: path.dirname(expectedConfigFile),
    });
    expect(configPath).toEqual(expectedConfigFile);
  });

  test('should give an error when there are multiple config files', async () => {
    const cwd = resolveFixture('multiple-config-files');
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    const error: Error = await readInitialOptions().catch(error => error);
    expect(error.message).toContain('Multiple configurations found');
    expect(error.message).toContain('multiple-config-files/jest.config.js');
    expect(error.message).toContain('multiple-config-files/jest.config.json');
  });

  test('should be able to ignore multiple config files error', async () => {
    const cwd = resolveFixture('multiple-config-files');
    jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    const {config, configPath} = await readInitialOptions(undefined, {
      skipMultipleConfigError: true,
    });
    expect(config).toEqual({
      jestConfig: 'jest.config.js',
      rootDir: resolveFixture('multiple-config-files'),
    });
    expect(configPath).toEqual(
      resolveFixture('multiple-config-files', 'jest.config.js'),
    );
  });
});
