/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {realpathSync} from 'graceful-fs';
import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../../../../e2e/Utils';
import {readConfigs} from '../';

const DIR = path.resolve(tmpdir(), 'read_configs_argv_config_test');
const originalCwd = process.cwd();

beforeEach(() => {
  cleanup(DIR);
});

afterEach(() => {
  process.chdir(originalCwd);
  cleanup(DIR);
});

test('readConfigs() does not throw when --config points elsewhere and cwd has no discoverable config', async () => {
  writeFiles(DIR, {
    'custom/custom.config.js':
      'module.exports = {rootDir: ".", testMatch: ["**/*.test.js"]};',
    'empty/.gitkeep': '',
  });

  const customDir = realpathSync(path.resolve(DIR, 'custom'));
  const emptyDir = realpathSync(path.resolve(DIR, 'empty'));
  process.chdir(emptyDir);

  const {configs, globalConfig} = await readConfigs(
    {$0: '', _: [], config: path.join(customDir, 'custom.config.js')},
    [emptyDir],
  );

  expect(configs).toHaveLength(1);
  expect(globalConfig.rootDir).toBe(customDir);
});

test('readConfigs() treats the project resolving to the --config file as the global config supplier', async () => {
  writeFiles(DIR, {
    'custom/jest.config.js': `
      module.exports = {
        projects: [
          ${JSON.stringify(path.resolve(DIR, 'custom'))},
          ${JSON.stringify(path.resolve(DIR, 'other'))},
        ],
        rootDir: '.',
      };
    `,
    'other/jest.config.js': 'module.exports = {rootDir: "."};',
  });

  const customDir = realpathSync(path.resolve(DIR, 'custom'));
  const otherDir = realpathSync(path.resolve(DIR, 'other'));
  process.chdir(realpathSync(DIR));

  const {configs} = await readConfigs(
    {$0: '', _: [], config: path.join(customDir, 'jest.config.js')},
    [realpathSync(DIR)],
  );

  expect(configs).toHaveLength(2);
  expect(configs.map(config => config.rootDir).sort()).toEqual(
    [customDir, otherDir].sort(),
  );
});
