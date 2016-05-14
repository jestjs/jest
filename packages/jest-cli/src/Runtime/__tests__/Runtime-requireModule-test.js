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

jest.disableAutomock();
jest.mock(
  'jest-environment-jsdom',
  () => require('../../../__mocks__/jest-environment-jsdom')
);

const path = require('path');

let createRuntime;

describe('Runtime', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('requireModule', () => {
    pit('finds @providesModule modules', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    pit('provides `module.parent` to modules', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.parent).toEqual({
          id: 'mockParent',
          exports: {},
        });
      })
    );

    pit('provides `module.filename` to modules', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.filename.endsWith(
          'test_root' + path.sep + 'RegularModule.js'
        )).toBe(true);
      })
    );

    pit('provides `module.paths` to modules', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'RegularModule'
        );
        expect(exports.paths.length).toBeGreaterThan(0);
        exports.paths.forEach(path => {
          expect(path.endsWith('node_modules')).toBe(true);
        });
      })
    );

    pit('throws on non-existent @providesModule modules', () =>
      createRuntime(__filename).then(runtime => {
        expect(() => {
          runtime.requireModule(runtime.__mockRootPath, 'DoesntExist');
        }).toThrow(
          new Error('Cannot find module \'DoesntExist\' from \'root.js\'')
        );
      })
    );

    pit('finds relative-path modules without file extension', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          './RegularModule'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    pit('finds relative-path modules with file extension', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          './RegularModule.js'
        );
        expect(exports.isRealModule).toBe(true);
      })
    );

    pit('throws on non-existent relative-path modules', () =>
      createRuntime(__filename).then(runtime => {
        expect(() => {
          runtime.requireModule(runtime.__mockRootPath, './DoesntExist');
        }).toThrow(
          new Error('Cannot find module \'./DoesntExist\' from \'root.js\'')
        );
      })
    );

    pit('finds node core built-in modules', () =>
      createRuntime(__filename).then(runtime => {
        expect(() => {
          runtime.requireModule(runtime.__mockRootPath, 'fs');
        }).not.toThrow();
      })
    );

    pit('finds and loads JSON files without file extension', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          './JSONFile'
        );
        expect(exports.isJSONModule).toBe(true);
      })
    );

    pit('finds and loads JSON files with file extension', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          './JSONFile.json'
        );
        expect(exports.isJSONModule).toBe(true);
      })
    );

    pit('requires a JSON file twice successfully', () =>
      createRuntime(__filename).then(runtime => {
        const exports1 = runtime.requireModule(
          runtime.__mockRootPath,
          './JSONFile.json'
        );
        const exports2 = runtime.requireModule(
          runtime.__mockRootPath,
          './JSONFile.json'
        );
        expect(exports1.isJSONModule).toBe(true);
        expect(exports2.isJSONModule).toBe(true);
        expect(exports1).toBe(exports2);
      })
    );

    pit('provides manual mock when real module doesnt exist', () =>
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'ExclusivelyManualMock'
        );
        expect(exports.isExclusivelyManualMockModule).toBe(true);
      })
    );

    pit(`doesn't override real modules with manual mocks when explicitly marked with .unmock()`, () =>
      createRuntime(__filename).then(runtime => {
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        root.jest.resetModuleRegistry();
        root.jest.unmock('ManuallyMocked');
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'ManuallyMocked'
        );
        expect(exports.isManualMockModule).toBe(false);
      })
    );

    pit('resolves haste packages properly', () =>
      createRuntime(__filename).then(runtime => {
        const hastePackage = runtime.requireModule(
          runtime.__mockRootPath,
          'haste-package/core/module'
        );
        expect(hastePackage.isHastePackage).toBe(true);
      })
    );

    pit('resolves node modules properly when crawling node_modules', () =>
      // While we are crawling a node module, we shouldn't put package.json
      // files of node modules to resolve to `package.json` but rather resolve
      // to whatever the package.json's `main` field says.
      createRuntime(__filename, {
        haste: {
          providesModuleNodeModules: ['not-a-haste-package'],
        },
      }).then(runtime => {
        const hastePackage = runtime.requireModule(
          runtime.__mockRootPath,
          'not-a-haste-package'
        );
        expect(hastePackage.isNodeModule).toBe(true);
      })
    );
  });
});
