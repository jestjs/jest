/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path = require('path');
import execa = require('execa');
import type {ReadJestConfigOptions, readInitialOptions} from 'jest-config';

function resolveFixture(...pathSegments: Array<string>) {
  return path.resolve(__dirname, '..', 'read-initial-options', ...pathSegments);
}

interface ProxyReadJestConfigOptions extends ReadJestConfigOptions {
  cwd?: string;
}

/**
 * These e2e tests are running via a child process, because we're running in a VM and are not allowed to `import` directly
 * It also represents a more real-world example of how to run.
 */
async function proxyReadInitialOptions(
  configFile: string | undefined,
  options: ProxyReadJestConfigOptions,
): ReturnType<typeof readInitialOptions> {
  const {stdout} = await execa(
    'node',
    [
      require.resolve('../read-initial-options/readOptions.js'),
      configFile ?? '',
      JSON.stringify(options),
    ],
    {cwd: options?.cwd},
  );
  return JSON.parse(stdout);
}

describe('readInitialOptions', () => {
  test('should read from the cwd by default', async () => {
    const configFile = resolveFixture('js-config', 'jest.config.js');
    const rootDir = resolveFixture('js-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'jest.config.js', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.js file', async () => {
    const configFile = resolveFixture('js-config', 'jest.config.js');
    const rootDir = resolveFixture('js-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'jest.config.js', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a package.json file', async () => {
    const configFile = resolveFixture('pkg-config', 'package.json');
    const rootDir = resolveFixture('pkg-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'package.json', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.ts file', async () => {
    const configFile = resolveFixture('ts-config', 'jest.config.ts');
    const rootDir = resolveFixture('ts-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'jest.config.ts', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.mjs file', async () => {
    const configFile = resolveFixture('mjs-config', 'jest.config.mjs');
    const rootDir = resolveFixture('mjs-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'jest.config.mjs', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest.config.json file', async () => {
    const configFile = resolveFixture('json-config', 'jest.config.json');
    const rootDir = resolveFixture('json-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'jest.config.json', rootDir});
    expect(configPath).toEqual(configFile);
  });
  test('should read a jest config exporting an async function', async () => {
    const configFile = resolveFixture('async-config', 'jest.config.js');
    const rootDir = resolveFixture('async-config');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });
    expect(config).toEqual({jestConfig: 'async-config', rootDir});
    expect(configPath).toEqual(configFile);
  });

  test('should be able to skip config reading, instead read from cwd', async () => {
    const expectedConfigFile = resolveFixture(
      'json-config',
      'jest.config.json',
    );
    const {config, configPath} = await proxyReadInitialOptions(
      resolveFixture('js-config', 'jest.config.js'),
      {
        cwd: resolveFixture('json-config'),
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
    const error: Error = await proxyReadInitialOptions(undefined, {cwd}).catch(
      error => error,
    );
    expect(error.message).toContain('Multiple configurations found');
    expect(error.message).toContain('multiple-config-files/jest.config.js');
    expect(error.message).toContain('multiple-config-files/jest.config.json');
  });

  test('should be able to ignore multiple config files error', async () => {
    const cwd = resolveFixture('multiple-config-files');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd,
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
