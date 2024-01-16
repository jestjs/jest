/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../../../../e2e/Utils';
import {JEST_CONFIG_EXT_ORDER} from '../constants';
import resolveConfigPath from '../resolveConfigPath';

const DIR = path.resolve(tmpdir(), 'resolve_config_path_test');
const ERROR_PATTERN = /Could not find a config file based on provided values/;
const NO_ROOT_DIR_ERROR_PATTERN = /Can't find a root directory/;
const MULTIPLE_CONFIGS_ERROR_PATTERN = /Multiple configurations found/;

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

describe.each([...JEST_CONFIG_EXT_ORDER])(
  'Resolve config path %s',
  extension => {
    test(`file path with "${extension}"`, () => {
      const relativeConfigPath = `a/b/c/my_config${extension}`;
      const absoluteConfigPath = path.resolve(DIR, relativeConfigPath);

      writeFiles(DIR, {[relativeConfigPath]: ''});

      // absolute
      expect(resolveConfigPath(absoluteConfigPath, DIR)).toBe(
        absoluteConfigPath,
      );
      expect(() => resolveConfigPath('/does_not_exist', DIR)).toThrow(
        NO_ROOT_DIR_ERROR_PATTERN,
      );

      // relative
      expect(resolveConfigPath(relativeConfigPath, DIR)).toBe(
        absoluteConfigPath,
      );
      expect(() => resolveConfigPath('does_not_exist', DIR)).toThrow(
        NO_ROOT_DIR_ERROR_PATTERN,
      );
    });

    test(`directory path with "${extension}"`, () => {
      const relativePackageJsonPath = 'a/b/c/package.json';
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );
      const relativeJestConfigPath = `a/b/c/jest.config${extension}`;
      const absoluteJestConfigPath = path.resolve(DIR, relativeJestConfigPath);

      // no configs yet. should throw
      writeFiles(DIR, {[`a/b/c/some_random_file${extension}`]: ''});

      expect(() =>
        // absolute
        resolveConfigPath(path.dirname(absoluteJestConfigPath), DIR),
      ).toThrow(ERROR_PATTERN);

      expect(() =>
        // relative
        resolveConfigPath(path.dirname(relativeJestConfigPath), DIR),
      ).toThrow(ERROR_PATTERN);

      writeFiles(DIR, {[relativePackageJsonPath]: ''});

      // absolute
      expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).toBe(absolutePackageJsonPath);

      // relative
      expect(
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).toBe(absolutePackageJsonPath);

      // jest.config.js takes precedence
      writeFiles(DIR, {[relativeJestConfigPath]: ''});

      // absolute
      expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).toBe(absoluteJestConfigPath);

      // relative
      expect(
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).toBe(absoluteJestConfigPath);

      // jest.config.js and package.json with 'jest' cannot be used together
      writeFiles(DIR, {[relativePackageJsonPath]: JSON.stringify({jest: {}})});

      // absolute
      expect(() =>
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);

      // relative
      expect(() =>
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);

      expect(() => {
        resolveConfigPath(
          path.join(path.dirname(relativePackageJsonPath), 'j/x/b/m/'),
          DIR,
        );
      }).toThrow(NO_ROOT_DIR_ERROR_PATTERN);
    });

    test('file path from "jest" key', () => {
      const anyFileName = `anyJestConfigfile${extension}`;
      const relativePackageJsonPath = 'a/b/c/package.json';
      const relativeAnyFilePath = `a/b/c/conf/${anyFileName}`;
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );
      const absoluteAnyFilePath = path.resolve(DIR, relativeAnyFilePath);

      writeFiles(DIR, {
        'a/b/c/package.json': `{ "jest": "conf/${anyFileName}" }`,
      });
      writeFiles(DIR, {[relativeAnyFilePath]: ''});

      const result = resolveConfigPath(
        path.dirname(absolutePackageJsonPath),
        DIR,
      );

      expect(result).toBe(absoluteAnyFilePath);
    });

    test('not a file path from "jest" key', () => {
      const anyFileName = `anyJestConfigfile${extension}`;
      const relativePackageJsonPath = 'a/b/c/package.json';
      const relativeAnyFilePath = `a/b/c/conf/${anyFileName}`;
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );

      writeFiles(DIR, {
        'a/b/c/package.json': '{ "jest": {"verbose": true} }',
      });
      writeFiles(DIR, {[relativeAnyFilePath]: ''});

      const result = resolveConfigPath(
        path.dirname(absolutePackageJsonPath),
        DIR,
      );

      expect(result).toBe(absolutePackageJsonPath);
    });

    test('not a valid file when "jest" key is a path', () => {
      const anyFileName = `anyJestConfigfile${extension}`;
      const relativePackageJsonPath = 'a/b/c/package.json';
      const relativeAnyFilePath = `a/b/c/conf/${anyFileName}`;
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );

      writeFiles(DIR, {
        'a/b/c/package.json': '{ "jest": "conf/nonExistentConfigfile.json" }',
      });
      writeFiles(DIR, {[relativeAnyFilePath]: ''});

      expect(() =>
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).toThrow(
        /Jest expects the string configuration to point to a file, but .* not\./,
      );
    });
  },
);

const pickPairsWithSameOrder = <T>(array: ReadonlyArray<T>) =>
  array.flatMap((value1, idx, arr) =>
    arr.slice(idx + 1).map(value2 => [value1, value2]),
  );

test('pickPairsWithSameOrder', () => {
  expect(pickPairsWithSameOrder([1, 2, 3])).toStrictEqual([
    [1, 2],
    [1, 3],
    [2, 3],
  ]);
});

describe.each(pickPairsWithSameOrder(JEST_CONFIG_EXT_ORDER))(
  'Using multiple configs shows error',
  (extension1, extension2) => {
    test(`Using jest.config${extension1} and jest.config${extension2} shows error`, () => {
      const relativeJestConfigPaths = [
        `a/b/c/jest.config${extension1}`,
        `a/b/c/jest.config${extension2}`,
      ];

      writeFiles(DIR, {
        [relativeJestConfigPaths[0]]: '',
        [relativeJestConfigPaths[1]]: '',
      });

      expect(() =>
        resolveConfigPath(path.dirname(relativeJestConfigPaths[0]), DIR),
      ).toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);
    });
  },
);
