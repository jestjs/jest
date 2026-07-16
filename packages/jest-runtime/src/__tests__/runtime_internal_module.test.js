/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
    it('loads modules and applies transforms', async () => {
      const runtime = await createRuntime(__filename, {
        transform: {'\\.js$': './test_preprocessor'},
      });
      const modulePath = path.resolve(
        path.dirname(runtime.__mockRootPath),
        'internal-root.js',
      );
      expect(() => {
        runtime.requireModule(modulePath);
      }).toThrow(new Error('preprocessor must not run.'));
    });
    it('loads internal modules without applying transforms', async () => {
      const runtime = await createRuntime(__filename, {
        transform: {'\\.js$': './test_preprocessor'},
      });
      const modulePath = path.resolve(
        path.dirname(runtime.__mockRootPath),
        'internal-root.js',
      );
      const exports = runtime.requireInternalModule(modulePath);
      expect(exports()).toBe('internal-module-data');
    });

    it('loads JSON modules and applies transforms', async () => {
      const runtime = await createRuntime(__filename, {
        transform: {'\\.json$': './test_json_preprocessor'},
      });
      const modulePath = path.resolve(
        path.dirname(runtime.__mockRootPath),
        'internal-root.json',
      );
      const exports = runtime.requireModule(modulePath);
      expect(exports).toEqual({foo: 'foo'});
    });
    it('loads internal JSON modules without applying transforms', async () => {
      const runtime = await createRuntime(__filename, {
        transform: {'\\.json$': './test_json_preprocessor'},
      });
      const modulePath = path.resolve(
        path.dirname(runtime.__mockRootPath),
        'internal-root.json',
      );
      const exports = runtime.requireInternalModule(modulePath);
      expect(exports).toEqual({foo: 'bar'});
    });

    const OPTIMIZED_MODULE_EXAMPLE = 'chalk';
    it('loads modules normally even if on the optimization list', () =>
      createRuntime(__filename).then(runtime => {
        const modulePath = path.resolve(
          path.dirname(runtime.__mockRootPath),
          'require-by-name.js',
        );
        const requireByName = runtime.requireModule(modulePath);
        expect(requireByName(OPTIMIZED_MODULE_EXAMPLE)).not.toBe(
          require(OPTIMIZED_MODULE_EXAMPLE),
        );
      }));
    it('loads internal modules from outside if on the optimization list', () =>
      createRuntime(__filename).then(runtime => {
        const modulePath = path.resolve(
          path.dirname(runtime.__mockRootPath),
          'require-by-name.js',
        );
        const requireByName = runtime.requireInternalModule(modulePath);
        expect(requireByName(OPTIMIZED_MODULE_EXAMPLE)).toBe(
          require(OPTIMIZED_MODULE_EXAMPLE),
        );
      }));
  });
});
