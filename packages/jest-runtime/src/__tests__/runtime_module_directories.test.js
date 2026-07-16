/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const path = require('path');

const moduleDirectories = ['module_dir'];

let createRuntime;
let rootDir;

describe('Runtime', () => {
  beforeEach(() => {
    rootDir = path.resolve(path.dirname(__filename), 'test_root');
    createRuntime = require('createRuntime');
  });

  it('uses configured moduleDirectories', async () => {
    const runtime = await createRuntime(__filename, {
      moduleDirectories,
    });
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'module_dir_module',
    );
    expect(exports).toBeDefined();
  });

  it('resolves packages', async () => {
    const runtime = await createRuntime(__filename, {
      moduleDirectories,
    });
    const exports = runtime.requireModule(runtime.__mockRootPath, 'my-module');
    expect(exports.isNodeModule).toBe(true);
  });

  it('finds closest module from moduleDirectories', async () => {
    const runtime = await createRuntime(__filename, {moduleDirectories});
    const exports = runtime.requireModule(
      path.join(rootDir, 'subdir2', 'my_module.js'),
      'module_dir_module',
    );
    expect(exports.modulePath).toBe('subdir2/module_dir/module_dir_module.js');
  });

  it('only checks the configured directories', async () => {
    const runtime = await createRuntime(__filename, {
      moduleDirectories,
    });
    expect(() => {
      runtime.requireModule(runtime.__mockRootPath, 'not-a-haste-package');
    }).toThrow(
      new Error("Cannot find module 'not-a-haste-package' from 'root.js'"),
    );
  });
});
