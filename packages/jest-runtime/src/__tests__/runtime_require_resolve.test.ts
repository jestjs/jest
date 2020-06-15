/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Config} from '@jest/types';
import type Runtime from '..';
import {createOutsideJestVmPath} from '../helpers';

let createRuntime: (
  path: string,
  config?: Config.InitialOptions,
) => Promise<Runtime & {__mockRootPath: string}>;

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

  describe('with the OUTSIDE_JEST_VM_RESOLVE_OPTION', () => {
    it('forwards to the real Node require in an internal context', async () => {
      const runtime = await createRuntime(__filename);
      const module = runtime.requireInternalModule<any>(
        runtime.__mockRootPath,
        './resolve_and_require_outside.js',
      );
      expect(module.required).toBe(
        require('./test_root/create_require_module'),
      );
    });

    it('ignores the option in an external context', async () => {
      const runtime = await createRuntime(__filename);
      const module = runtime.requireModule<any>(
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
        runtime.requireModule<any>(
          runtime.__mockRootPath,
          createOutsideJestVmPath(
            require.resolve('./test_root/create_require_module.js'),
          ),
        ),
      ).toThrow(/cannot find.+create_require_module/i);
    });
  });
});
