/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import path from 'path';
import execa from 'execa';
import {onNodeVersions} from '@jest/test-utils';
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

  test.each([
    ['js-config', 'jest.config.js', 'jest.config.js'],
    ['pkg-config', 'package.json', 'package.json'],
    ['pkg-string-config', 'jest.config.js', 'package-string-config'],
    ['ts-node-config', 'jest.config.ts', 'jest.config.ts'],
    ['ts-esbuild-register-config', 'jest.config.ts', 'jest.config.ts'],
    ['mjs-config', 'jest.config.mjs', 'jest.config.mjs'],
    ['json-config', 'jest.config.json', 'jest.config.json'],
    ['yaml-config', 'jest.config.yaml', 'jest.config.yaml'],
    ['rc-config', '.jestrc', '.jestrc'],
    ['rc-js-config', '.jestrc.js', '.jestrc.js'],
    ['rc-ts-config', '.jestrc.ts', '.jestrc.ts'],
    ['nested-rc-config', '.config/jestrc.yml', '.config/jestrc.yml'],
    ['async-config', 'jest.config.js', 'async-config'],
  ])(
    'should read %s/%s file',
    async (directory: string, filename: string, configString: string) => {
      const configFile = resolveFixture(directory, filename);
      const rootDir = resolveFixture(directory);
      const {config, configPath} = await proxyReadInitialOptions(undefined, {
        cwd: rootDir,
      });
      expect(config).toEqual({
        jestConfig: configString,
        rootDir: path.dirname(configFile),
      });
      expect(configPath).toEqual(configFile);
    },
  );

  test('stops searching at package.json without a jest key', async () => {
    const cwd = resolveFixture('package-boundary', 'project', 'src');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd,
    });

    expect(config).toEqual({
      rootDir: resolveFixture('package-boundary', 'project'),
    });
    expect(configPath).toEqual(
      resolveFixture('package-boundary', 'project', 'package.json'),
    );
  });

  test.each([
    ['yaml-config', 'jest.config.yaml', 'jest.config.yaml'],
    ['rc-config', '.jestrc', '.jestrc'],
  ])(
    'should read explicit %s/%s file',
    async (directory: string, filename: string, configString: string) => {
      const configFile = resolveFixture(directory, filename);
      const {config, configPath} = await proxyReadInitialOptions(configFile, {
        cwd: resolveFixture('js-config'),
      });

      expect(config).toEqual({
        jestConfig: configString,
        rootDir: path.dirname(configFile),
      });
      expect(configPath).toEqual(configFile);
    },
  );

  test('loads the referenced package.json string configuration', async () => {
    const rootDir = resolveFixture('pkg-string-config');
    const configFile = resolveFixture('pkg-string-config', 'jest.config.js');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd: rootDir,
    });

    expect(config).toEqual({jestConfig: 'package-string-config', rootDir});
    expect(configPath).toEqual(configFile);
  });

  onNodeVersions('^22.18 || >=23.6', () => {
    test('should read mts-config/jest.config.mts file', async () => {
      const configFile = resolveFixture('mts-config', 'jest.config.mts');
      const rootDir = resolveFixture('mts-config');
      const {config, configPath} = await proxyReadInitialOptions(undefined, {
        cwd: rootDir,
      });
      expect(config).toEqual({jestConfig: 'jest.config.mts', rootDir});
      expect(configPath).toEqual(configFile);
    });
  });

  onNodeVersions('<22.18', () => {
    test('should fail to read mts-config/jest.config.mts with a clear error', async () => {
      const rootDir = resolveFixture('mts-config');
      await expect(
        proxyReadInitialOptions(undefined, {cwd: rootDir}),
      ).rejects.toThrow(/jest\.config\.mts requires native TypeScript support/);
    });
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

  onNodeVersions('<22.6', () => {
    test('should give an error when using unsupported loader', async () => {
      const cwd = resolveFixture('ts-loader-config');
      const error: Error = await proxyReadInitialOptions(undefined, {
        cwd,
      }).catch(error => error);
      expect(error.message).toContain(
        "Jest: 'ts-loader' is not a valid TypeScript configuration loader.",
      );
    });
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

  test('should give an error for cross-family config files', async () => {
    const cwd = resolveFixture('cross-family-multiple-config-files');
    const error: Error = await proxyReadInitialOptions(undefined, {cwd}).catch(
      error => error,
    );
    expect(error.message).toContain('Multiple configurations found');
    expect(error.message).toContain(
      'cross-family-multiple-config-files/jest.config.yaml',
    );
    expect(error.message).toContain(
      'cross-family-multiple-config-files/.jestrc',
    );
  });

  test('prefers an rc config to an empty same-directory package.json', async () => {
    const cwd = resolveFixture('rc-package-boundary');
    const {config, configPath} = await proxyReadInitialOptions(undefined, {
      cwd,
    });

    expect(config).toEqual({
      jestConfig: '.jestrc',
      rootDir: cwd,
    });
    expect(configPath).toEqual(
      resolveFixture('rc-package-boundary', '.jestrc'),
    );
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
