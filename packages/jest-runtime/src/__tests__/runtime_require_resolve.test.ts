/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as os from 'os';
import * as path from 'path';
import {promises as fs} from 'graceful-fs';
import type {Config} from '@jest/types';
import type Runtime from '..';
import {createOutsideJestVmPath} from '../helpers';

let createRuntime: (
  path: string,
  config?: Config.InitialOptions,
) => Promise<Runtime & {__mockRootPath: string}>;

const getTmpDir = async () =>
  fs.mkdtemp(path.join(os.tmpdir(), 'jest-resolve-test-'));

describe('Runtime require.resolve', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('resolves a module path', async () => {
    const runtime = await createRuntime(__filename);
    const resolved = runtime.requireModule(
      runtime.__mockRootPath,
      './resolve_self.js',
    );
    expect(resolved).toEqual(require.resolve('./test_root/resolve_self.js'));
  });

  it('resolves an absolute module path', async () => {
    const absoluteFilePath = path.join(await getTmpDir(), 'test.js');
    await fs.writeFile(
      absoluteFilePath,
      'module.exports = require.resolve(__filename);',
      'utf8',
    );

    const runtime = await createRuntime(__filename);
    const resolved = runtime.requireModule(
      runtime.__mockRootPath,
      absoluteFilePath,
    );

    expect(resolved).toEqual(require.resolve(absoluteFilePath));
  });

  it('required modules can resolve absolute module paths with no paths entries passed', async () => {
    const tmpdir = await getTmpDir();
    const entrypoint = path.join(tmpdir, 'test.js');
    const target = path.join(tmpdir, 'target.js');

    // we want to test the require.resolve implementation within a
    // runtime-required module, so we need to create a module that then resolves
    // an absolute path, so we need two files: the entrypoint, and an absolute
    // target to require.
    await fs.writeFile(
      entrypoint,
      `module.exports = require.resolve(${JSON.stringify(
        target,
      )}, {paths: []});`,
      'utf8',
    );

    await fs.writeFile(target, 'module.exports = {}', 'utf8');

    const runtime = await createRuntime(__filename);
    const resolved = runtime.requireModule(runtime.__mockRootPath, entrypoint);
    expect(resolved).toEqual(require.resolve(target, {paths: []}));
  });

  it('resolves a module path with moduleNameMapper', async () => {
    const runtime = await createRuntime(__filename, {
      moduleNameMapper: {
        '^testMapped/(.*)': '<rootDir>/mapped_dir/$1',
      },
    });
    const resolved = runtime.requireModule(
      runtime.__mockRootPath,
      './resolve_mapped.js',
    );
    expect(resolved).toEqual(
      require.resolve('./test_root/mapped_dir/moduleInMapped.js'),
    );
  });

  describe('with the jest-resolve-outside-vm-option', () => {
    it('forwards to the real Node require in an internal context', async () => {
      const runtime = await createRuntime(__filename);
      const module = runtime.requireInternalModule(
        runtime.__mockRootPath,
        './resolve_and_require_outside.js',
      );
      expect(module.required).toBe(
        require('./test_root/create_require_module'),
      );
    });

    it('ignores the option in an external context', async () => {
      const runtime = await createRuntime(__filename);
      const module = runtime.requireModule(
        runtime.__mockRootPath,
        './resolve_and_require_outside.js',
      );
      expect(module.required.foo).toBe('foo');
      expect(module.required).not.toBe(
        require('./test_root/create_require_module'),
      );
    });

    // make sure we also check isInternal during require, not just during resolve
    it('does not understand a self-constructed outsideJestVmPath in an external context', async () => {
      const runtime = await createRuntime(__filename);
      expect(() =>
        runtime.requireModule(
          runtime.__mockRootPath,
          createOutsideJestVmPath(
            require.resolve('./test_root/create_require_module.js'),
          ),
        ),
      ).toThrow(/cannot find.+create_require_module/i);
    });
  });
});
