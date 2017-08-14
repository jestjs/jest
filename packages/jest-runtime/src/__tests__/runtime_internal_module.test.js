/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const path = require('path');

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    jest.resetModules();

    createRuntime = require('createRuntime');
  });

  describe('internalModule', () => {
    it('loads modules and applies transforms', () =>
      createRuntime(__filename, {
        transform: {'^.+\\.js$': './test_preprocessor'},
      }).then(runtime => {
        const modulePath = path.resolve(
          path.dirname(runtime.__mockRootPath),
          'internal-root.js',
        );
        expect(() => {
          runtime.requireModule(modulePath);
        }).toThrow(new Error('preprocessor must not run.'));
      }));

    it('loads internal modules without applying transforms', () =>
      createRuntime(__filename, {
        transform: {'^.+\\.js$': './test_preprocessor'},
      }).then(runtime => {
        const modulePath = path.resolve(
          path.dirname(runtime.__mockRootPath),
          'internal-root.js',
        );
        const exports = runtime.requireInternalModule(modulePath);
        expect(exports()).toBe('internal-module-data');
      }));
  });
});
