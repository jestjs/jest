/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import * as fsPromises from 'fs/promises';
import * as fs from 'graceful-fs';
import {requireOrImportModule} from 'jest-util';
import readConfigFileAndSetRootDir from '../readConfigFileAndSetRootDir';
import {onNodeVersions} from '@jest/test-utils';

jest
  .mock('fs/promises', () => ({
    readFile: jest.fn(async () => 'config'),
  }))
  .mock('graceful-fs')
  .mock('jest-util');

describe('readConfigFileAndSetRootDir', () => {
  describe('TypeScript ESM file', () => {
    test('reads .mts config and sets `rootDir`', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({notify: true});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.mts'),
      );

      expect(config).toEqual({notify: true, rootDir});
    });

    test('throws a clear error when native import fails, without falling back to ts-node', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockRejectedValueOnce(new Error('Unknown file extension ".mts"'));

      const configPath = path.join(
        path.resolve('some', 'path', 'to'),
        'jest.config.mts',
      );
      await expect(readConfigFileAndSetRootDir(configPath)).rejects.toThrow(
        /jest\.config\.mts requires native TypeScript support/,
      );
      // loadTSConfigFile reads the file for docblock parsing - it must not be called
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    test('throws a clear error when native import fails with a SyntaxError', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockRejectedValueOnce(new SyntaxError('Unexpected token'));

      const configPath = path.join(
        path.resolve('some', 'path', 'to'),
        'jest.config.mts',
      );
      await expect(readConfigFileAndSetRootDir(configPath)).rejects.toThrow(
        /jest\.config\.mts requires native TypeScript support/,
      );
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('JavaScript file', () => {
    test('reads config and sets `rootDir`', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({notify: true});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.js'),
      );

      expect(config).toEqual({notify: true, rootDir});
    });

    test('handles exported function', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockResolvedValueOnce(() => ({bail: 1}));

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.js'),
      );

      expect(config).toEqual({bail: 1, rootDir});
    });

    test('handles exported async function', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockResolvedValueOnce(async () => ({testTimeout: 10_000}));

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.js'),
      );

      expect(config).toEqual({rootDir, testTimeout: 10_000});
    });

    test('loads an arbitrary extensionless config as JavaScript', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({notify: true});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest-config'),
      );

      expect(config).toEqual({notify: true, rootDir});
    });

    test('loads a mixed-case extension accepted by the CLI', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({notify: true});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.JS'),
      );

      expect(config).toEqual({notify: true, rootDir});
    });

    test('loads an explicit package.js as a JavaScript config', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({notify: true});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'package.js'),
      );

      expect(config).toEqual({notify: true, rootDir});
    });

    test('handles an empty config file', async () => {
      jest.mocked(fsPromises.readFile).mockResolvedValueOnce('');
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({});

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.cjs'),
      );

      expect(config).toEqual({rootDir});
      expect(requireOrImportModule).toHaveBeenCalledWith(
        path.join(rootDir, 'jest.config.cjs'),
      );
    });

    test.each(['jest.config.mjs', 'jest.config.mts'])(
      'loads an empty %s file with the existing module loader',
      async filename => {
        jest.mocked(fsPromises.readFile).mockResolvedValueOnce('');
        jest.mocked(requireOrImportModule).mockResolvedValueOnce({});

        const rootDir = path.resolve('some', 'path', 'to');
        await expect(
          readConfigFileAndSetRootDir(path.join(rootDir, filename)),
        ).resolves.toEqual({rootDir});
        expect(requireOrImportModule).toHaveBeenCalledWith(
          path.join(rootDir, filename),
        );
      },
    );

    test('rejects a scalar configuration', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce('verbose');

      await expect(
        readConfigFileAndSetRootDir(
          path.join(path.resolve('some', 'path', 'to'), 'jest.config.js'),
        ),
      ).rejects.toThrow('Configuration must be an object');
    });
  });

  describe('JSON file', () => {
    test('reads config and sets `rootDir`', async () => {
      jest.mocked(fs.readFileSync).mockReturnValueOnce('{ "verbose": true }');

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.json'),
      );

      expect(config).toEqual({rootDir, verbose: true});
    });

    test('supports comments in JSON', async () => {
      jest
        .mocked(fs.readFileSync)
        .mockReturnValueOnce('{ // test comment\n "bail": true }');

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.json'),
      );

      expect(config).toEqual({bail: true, rootDir});
    });
  });

  describe('YAML and extensionless rc files', () => {
    test.each([
      'jest.config.yaml',
      'jest.config.yml',
      '.jestrc',
      '.JESTRC',
      '.config/jestrc',
    ])('reads %s and sets `rootDir`', async filename => {
      jest
        .mocked(fsPromises.readFile)
        .mockResolvedValueOnce('verbose: true\nrootDir: ./project');

      const configDirectory = path.resolve('some', 'path', 'to');
      const configPath = path.join(configDirectory, filename);
      const config = await readConfigFileAndSetRootDir(configPath);

      expect(config).toEqual({
        rootDir: path.join(path.dirname(configPath), 'project'),
        verbose: true,
      });
    });

    test('reports malformed YAML', async () => {
      jest
        .mocked(fsPromises.readFile)
        .mockResolvedValueOnce('rootDir: [unterminated');

      await expect(
        readConfigFileAndSetRootDir(
          path.join(path.resolve('some', 'path'), 'jest.config.yaml'),
        ),
      ).rejects.toThrow('unexpected end of the stream');
    });

    test('rejects a scalar YAML configuration', async () => {
      jest.mocked(fsPromises.readFile).mockResolvedValueOnce('verbose');

      await expect(
        readConfigFileAndSetRootDir(
          path.join(path.resolve('some', 'path'), 'jest.config.yaml'),
        ),
      ).rejects.toThrow('Configuration must be an object');
    });

    test('loads an explicit package.yaml as a YAML config', async () => {
      jest.mocked(fsPromises.readFile).mockResolvedValueOnce('verbose: true');

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'package.yaml'),
      );

      expect(config).toEqual({rootDir, verbose: true});
    });

    test.each(['jest.config.yaml', '.jestrc'])(
      'handles an empty %s file',
      async filename => {
        jest.mocked(fsPromises.readFile).mockResolvedValueOnce('');

        const rootDir = path.resolve('some', 'path', 'to');
        const config = await readConfigFileAndSetRootDir(
          path.join(rootDir, filename),
        );

        expect(config).toEqual({rootDir});
      },
    );

    test.each(['jest.config.yaml', '.jestrc'])(
      'handles a comment-only %s file',
      async filename => {
        jest
          .mocked(fsPromises.readFile)
          .mockResolvedValueOnce('# no configuration');

        const rootDir = path.resolve('some', 'path', 'to');
        const config = await readConfigFileAndSetRootDir(
          path.join(rootDir, filename),
        );

        expect(config).toEqual({rootDir});
      },
    );
  });

  describe('package.json file', () => {
    test('reads config from "jest" key and sets `rootDir`', async () => {
      jest
        .mocked(fs.readFileSync)
        .mockReturnValueOnce('{ "jest": { "coverage": true } }');

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'package.json'),
      );

      expect(config).toEqual({coverage: true, rootDir});
    });

    test('sets rootDir if "jest" is absent', async () => {
      jest.mocked(fs.readFileSync).mockReturnValueOnce('{ "name": "test" }');

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'package.json'),
      );

      expect(config).toEqual({rootDir});
    });
  });

  describe('sets `rootDir`', () => {
    test('handles frozen config object', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockResolvedValueOnce(Object.freeze({preset: 'some-preset'}));

      const rootDir = path.resolve('some', 'path', 'to');
      const config = await readConfigFileAndSetRootDir(
        path.join(rootDir, 'jest.config.js'),
      );

      expect(config).toEqual({preset: 'some-preset', rootDir});
    });

    test('keeps the path if it is absolute', async () => {
      const rootDir = path.resolve('some', 'path', 'to');
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({
        rootDir,
        testEnvironment: 'node',
      });

      const config = await readConfigFileAndSetRootDir(
        path.join(path.resolve('other', 'path', 'to'), 'jest.config.js'),
      );

      expect(config).toEqual({rootDir, testEnvironment: 'node'});
    });

    test('resolves the path relative to dirname of the config file', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce({
        restoreMocks: true,
        rootDir: path.join('path', 'to'),
      });

      const config = await readConfigFileAndSetRootDir(
        path.join(path.resolve('some'), 'jest.config.js'),
      );

      expect(config).toEqual({
        restoreMocks: true,
        rootDir: path.resolve('some', 'path', 'to'),
      });
    });

    test('resolves relative path when the read config object if frozen', async () => {
      jest.mocked(requireOrImportModule).mockResolvedValueOnce(
        Object.freeze({
          resetModules: true,
          rootDir: path.join('path', 'to'),
        }),
      );

      const config = await readConfigFileAndSetRootDir(
        path.join(path.resolve('some'), 'jest.config.js'),
      );

      expect(config).toEqual({
        resetModules: true,
        rootDir: path.resolve('some', 'path', 'to'),
      });
    });
  });
});

onNodeVersions('^24', () => {
  describe('TypeScript file', () => {
    test('reaches into 2nd loadout by TS loader if specified in docblock', async () => {
      jest
        .mocked(requireOrImportModule)
        .mockRejectedValueOnce(new Error('Module not found'));
      jest.mocked(fs.readFileSync).mockReturnValue(`
        /** @jest-config-loader tsx */
        export { testTimeout: 1_000 }
      `);
      const rootDir = path.resolve('some', 'path', 'to');
      await expect(
        readConfigFileAndSetRootDir(path.join(rootDir, 'jest.config.ts')),
      ).rejects.toThrow(
        /Module not found\n.*'tsx' is not a valid TypeScript configuration loader./,
      );
    });
  });
});
