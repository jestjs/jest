/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'node:os';
import * as path from 'node:path';
import {chmodSync} from 'graceful-fs';
import {cleanup, writeFiles} from '../../../../e2e/Utils';
import {
  JEST_CONFIG_EXT_ORDER,
  JEST_CONFIG_SEARCH_PLACES,
  PACKAGE_JSON,
} from '../constants';
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
    test(`file path with "${extension}"`, async () => {
      const relativeConfigPath = `a/b/c/my_config${extension}`;
      const absoluteConfigPath = path.resolve(DIR, relativeConfigPath);

      writeFiles(DIR, {[relativeConfigPath]: ''});

      await expect(resolveConfigPath(absoluteConfigPath, DIR)).resolves.toBe(
        absoluteConfigPath,
      );
      await expect(resolveConfigPath('/does_not_exist', DIR)).rejects.toThrow(
        NO_ROOT_DIR_ERROR_PATTERN,
      );
      await expect(resolveConfigPath(relativeConfigPath, DIR)).resolves.toBe(
        absoluteConfigPath,
      );
      await expect(resolveConfigPath('does_not_exist', DIR)).rejects.toThrow(
        NO_ROOT_DIR_ERROR_PATTERN,
      );
    });

    test(`directory path with "${extension}"`, async () => {
      const relativePackageJsonPath = 'a/b/c/package.json';
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );
      const relativeJestConfigPath = `a/b/c/jest.config${extension}`;
      const absoluteJestConfigPath = path.resolve(DIR, relativeJestConfigPath);

      writeFiles(DIR, {[`a/b/c/some_random_file${extension}`]: ''});

      await expect(
        resolveConfigPath(path.dirname(absoluteJestConfigPath), DIR),
      ).rejects.toThrow(ERROR_PATTERN);
      await expect(
        resolveConfigPath(path.dirname(relativeJestConfigPath), DIR),
      ).rejects.toThrow(ERROR_PATTERN);

      writeFiles(DIR, {[relativePackageJsonPath]: ''});

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).resolves.toBe(absolutePackageJsonPath);
      await expect(
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).resolves.toBe(absolutePackageJsonPath);

      writeFiles(DIR, {[relativeJestConfigPath]: ''});

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).resolves.toBe(absoluteJestConfigPath);
      await expect(
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).resolves.toBe(absoluteJestConfigPath);

      writeFiles(DIR, {[relativePackageJsonPath]: JSON.stringify({jest: {}})});

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).rejects.toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);
      await expect(
        resolveConfigPath(path.dirname(relativePackageJsonPath), DIR),
      ).rejects.toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);
      await expect(
        resolveConfigPath(
          path.join(path.dirname(relativePackageJsonPath), 'j/x/b/m/'),
          DIR,
        ),
      ).rejects.toThrow(NO_ROOT_DIR_ERROR_PATTERN);
    });

    test('file path from "jest" key', async () => {
      const anyFileName = `anyJestConfigfile${extension}`;
      const relativePackageJsonPath = 'a/b/c/package.json';
      const relativeAnyFilePath = `a/b/c/conf/${anyFileName}`;
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );
      const absoluteAnyFilePath = path.resolve(DIR, relativeAnyFilePath);

      writeFiles(DIR, {
        [relativeAnyFilePath]: '',
        [relativePackageJsonPath]: `{ "jest": "conf/${anyFileName}" }`,
      });

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).resolves.toBe(absoluteAnyFilePath);
      await expect(
        resolveConfigPath(absolutePackageJsonPath, DIR),
      ).resolves.toBe(absoluteAnyFilePath);
    });

    test('object config from "jest" key', async () => {
      const relativePackageJsonPath = 'a/b/c/package.json';
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );

      writeFiles(DIR, {
        [relativePackageJsonPath]: '{ "jest": {"verbose": true} }',
      });

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).resolves.toBe(absolutePackageJsonPath);
    });

    test('invalid file path from "jest" key', async () => {
      const relativePackageJsonPath = 'a/b/c/package.json';
      const absolutePackageJsonPath = path.resolve(
        DIR,
        relativePackageJsonPath,
      );

      writeFiles(DIR, {
        [relativePackageJsonPath]:
          '{ "jest": "conf/nonExistentConfigfile.json" }',
      });

      await expect(
        resolveConfigPath(path.dirname(absolutePackageJsonPath), DIR),
      ).rejects.toThrow(
        /Jest expects the string configuration to point to a file, but .* not\./,
      );
    });
  },
);

test.each(JEST_CONFIG_SEARCH_PLACES.filter(place => place !== PACKAGE_JSON))(
  'discovers %s',
  async searchPlace => {
    const relativeConfigPath = path.join('a', 'b', 'c', searchPlace);
    const absoluteConfigPath = path.resolve(DIR, relativeConfigPath);
    writeFiles(DIR, {[relativeConfigPath]: 'config'});

    await expect(
      resolveConfigPath(path.resolve(DIR, 'a/b/c'), DIR),
    ).resolves.toBe(absoluteConfigPath);
  },
);

test('stops at the nearest package.json without a jest key', async () => {
  writeFiles(DIR, {
    'a/b/c/file.js': '',
    'a/b/package.json': '{"name":"boundary"}',
    'a/jest.config.js': 'module.exports = {};',
  });

  await expect(
    resolveConfigPath(path.resolve(DIR, 'a/b/c'), DIR),
  ).resolves.toBe(path.resolve(DIR, 'a/b/package.json'));
});

test('does not treat package.yaml as a project boundary', async () => {
  writeFiles(DIR, {
    'a/b/c/file.js': '',
    'a/b/package.yaml': 'name: not-a-boundary',
    'a/jest.config.js': 'module.exports = {};',
  });

  await expect(
    resolveConfigPath(path.resolve(DIR, 'a/b/c'), DIR),
  ).resolves.toBe(path.resolve(DIR, 'a/jest.config.js'));
});

const testIfPermissionsAreEnforced =
  process.platform !== 'win32' && process.getuid?.() !== 0 ? test : test.skip;

testIfPermissionsAreEnforced(
  'does not inherit a parent config when a child config is unreadable',
  async () => {
    const childConfig = path.resolve(DIR, 'a/b/jest.config.js');
    writeFiles(DIR, {
      'a/b/jest.config.js': 'module.exports = {};',
      'a/jest.config.js': 'module.exports = {};',
    });
    chmodSync(childConfig, 0o000);

    try {
      await expect(
        resolveConfigPath(path.resolve(DIR, 'a/b'), DIR),
      ).resolves.toBe(childConfig);
    } finally {
      chmodSync(childConfig, 0o644);
    }
  },
);

testIfPermissionsAreEnforced(
  'prefers an unreadable config over a package.json boundary',
  async () => {
    const configPath = path.resolve(DIR, 'a/b/jest.config.js');
    writeFiles(DIR, {
      'a/b/jest.config.js': 'module.exports = {};',
      'a/b/package.json': '{"name":"boundary"}',
    });
    chmodSync(configPath, 0o000);

    try {
      await expect(
        resolveConfigPath(path.resolve(DIR, 'a/b'), DIR),
      ).resolves.toBe(configPath);
    } finally {
      chmodSync(configPath, 0o644);
    }
  },
);

testIfPermissionsAreEnforced(
  'prefers an unreadable config over a package.json string config',
  async () => {
    const configPath = path.resolve(DIR, 'a/b/jest.config.js');
    writeFiles(DIR, {
      'a/b/jest.config.js': 'module.exports = {};',
      'a/b/package-config.js': 'module.exports = {};',
      'a/b/package.json': JSON.stringify({jest: './package-config.js'}),
    });
    chmodSync(configPath, 0o000);

    try {
      await expect(
        resolveConfigPath(path.resolve(DIR, 'a/b'), DIR, true),
      ).resolves.toBe(configPath);
    } finally {
      chmodSync(configPath, 0o644);
    }
  },
);

test('treats an empty package.json jest string as an empty config', async () => {
  writeFiles(DIR, {
    'a/b/package.json': JSON.stringify({jest: ''}),
  });

  await expect(resolveConfigPath(path.resolve(DIR, 'a/b'), DIR)).resolves.toBe(
    path.resolve(DIR, 'a/b/package.json'),
  );
});

test('ignores cosmiconfig meta-configuration', async () => {
  writeFiles(DIR, {
    'a/b/jest.config.js': 'module.exports = {};',
    'a/b/package.json': JSON.stringify({
      cosmiconfig: {mergeSearchPlaces: false, searchPlaces: ['other.json']},
    }),
  });

  const originalCwd = process.cwd();
  process.chdir(path.resolve(DIR, 'a/b'));
  try {
    await expect(
      resolveConfigPath(path.resolve(DIR, 'a/b'), DIR),
    ).resolves.toBe(path.resolve(DIR, 'a/b/jest.config.js'));
  } finally {
    process.chdir(originalCwd);
  }
});

test('does not interpret $import in package.json configuration', async () => {
  writeFiles(DIR, {
    'package.json': JSON.stringify({jest: {$import: './missing.json'}}),
  });

  await expect(resolveConfigPath(DIR, DIR)).resolves.toBe(
    path.resolve(DIR, 'package.json'),
  );
});

test('uses search-place order when duplicate errors are skipped', async () => {
  writeFiles(DIR, {
    'a/b/c/.jestrc': 'verbose: true',
    'a/b/c/jest.config.js': 'module.exports = {};',
  });

  await expect(
    resolveConfigPath(path.resolve(DIR, 'a/b/c'), DIR, true),
  ).resolves.toBe(path.resolve(DIR, 'a/b/c/jest.config.js'));
});

test('reports multiple config formats in one directory', async () => {
  writeFiles(DIR, {
    'a/b/c/.config/jestrc.yaml': 'verbose: true',
    'a/b/c/jest.config.yml': 'verbose: false',
  });

  await expect(
    resolveConfigPath(path.resolve(DIR, 'a/b/c'), DIR),
  ).rejects.toThrow(MULTIPLE_CONFIGS_ERROR_PATTERN);
});
