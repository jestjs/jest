/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
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

  it('uses configured moduleDirectories', () => createRuntime(__filename, {
    moduleDirectories,
  }).then(runtime => {
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'moduleDirModule',
    );
    expect(exports).toBeDefined();
  }));

  it('resolves packages', () => createRuntime(__filename, {
    moduleDirectories,
  }).then(runtime => {
    const exports = runtime.requireModule(runtime.__mockRootPath, 'my-module');
    expect(exports.isNodeModule).toEqual(true);
  }));

  it('finds closest module from moduleDirectories', () =>
    createRuntime(__filename, {moduleDirectories}).then(runtime => {
      const exports = runtime.requireModule(
        path.join(rootDir, 'subdir2', 'MyModule.js'),
        'moduleDirModule',
      );
      expect(exports.modulePath).toEqual(
        'subdir2/module_dir/moduleDirModule.js',
      );
    }));

  it('only checks the configured directories', () => createRuntime(__filename, {
    moduleDirectories,
  }).then(runtime => {
    expect(() => {
      runtime.requireModule(runtime.__mockRootPath, 'not-a-haste-package');
    }).toThrow(
      new Error("Cannot find module 'not-a-haste-package' from 'root.js'"),
    );
  }));
});
