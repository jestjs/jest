/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {readConfigs} from '../';

// Regression test for https://github.com/jestjs/jest/issues/16457:
// an explicit `--config <file>` must be honored even when the cwd has no
// discoverable config of its own.
describe('readConfigs with an explicit --config file', () => {
  let tmpRoot: string;
  let emptyCwd: string;
  let configFile: string;
  let cwdSpy: jest.SpiedFunction<() => string>;

  beforeEach(() => {
    // os.tmpdir() has no package.json / jest config in any of its ancestors,
    // mirroring the issue's `mktemp -d` reproduction. Resolve symlinks
    // (e.g. /var -> /private/var on macOS, 8.3 short names on Windows) so
    // the mocked cwd matches the paths jest resolves internally.
    tmpRoot = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'jest-16457-')),
    );
    emptyCwd = path.join(tmpRoot, 'empty-cwd');
    fs.mkdirSync(emptyCwd, {recursive: true});
    configFile = path.join(tmpRoot, 'custom.config.cjs');
    fs.writeFileSync(configFile, 'module.exports = {};');
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(emptyCwd);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tmpRoot, {recursive: true, force: true});
  });

  test('does not throw "Could not find a config file"', async () => {
    const {configs, globalConfig} = await readConfigs(
      {$0: 'jest', _: [], config: configFile},
      [emptyCwd],
    );

    expect(configs).toHaveLength(1);
    expect(configs[0].rootDir).toBe(tmpRoot);
    expect(globalConfig.rootDir).toBe(tmpRoot);
  });
});
