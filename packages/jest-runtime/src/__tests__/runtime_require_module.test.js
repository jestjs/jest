/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

import {builtinModules, createRequire} from 'module';
import * as path from 'path';
import {pathToFileURL} from 'url';
import slash from 'slash';

let createRuntime;

describe('Runtime requireModule', () => {
  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  it('finds haste modules', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );
    expect(exports.isRealModule).toBe(true);
  });

  it('provides `module` to modules', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );
    expect(Object.keys(exports.module)).toEqual([
      'children',
      'exports',
      'filename',
      'id',
      'isPreloading',
      'loaded',
      'path',
      'parent',
      'paths',
      'main',
    ]);
  });

  it('provides `module.parent` to modules', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RequireRegularModule',
    );
    expect(Object.keys(exports.parent)).toEqual([
      'children',
      'exports',
      'filename',
      'id',
      'isPreloading',
      'loaded',
      'path',
      'parent',
      'paths',
      'main',
    ]);
  });

  it('`module.parent` should be undefined for entrypoints', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );
    expect(exports.parent).toBeNull();
  });

  it('resolve module.parent.require correctly', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'inner_parent_module',
    );
    expect(exports.outputString).toBe('This should happen');
  });

  it('resolve module.parent.filename correctly', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'inner_parent_module',
    );

    expect(slash(exports.parentFileName.replace(__dirname, ''))).toBe(
      '/test_root/inner_parent_module.js',
    );
  });

  it('provides `module.loaded` to modules', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );

    // `exports.loaded` is set while the module is loaded, so should be `false`
    expect(exports.loaded).toBe(false);
    // After the module is loaded we can query `module.loaded` again, at which point it should be `true`
    expect(exports.isLoaded()).toBe(true);
  });

  it('provides `module.filename` to modules', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );
    expect(
      exports.filename.endsWith(`test_root${path.sep}RegularModule.js`),
    ).toBe(true);
  });

  it('provides `module.paths` to modules', async () => {
    const altModuleDir = 'bower_components';
    const moduleDirectories = ['node_modules', altModuleDir];

    const runtime = await createRuntime(__filename, {moduleDirectories});
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'RegularModule',
    );
    expect(exports.paths.length).toBeGreaterThan(0);
    const root = path.parse(process.cwd()).root;
    const globalPath = path.join(root, 'node_modules');
    const rootIndex = exports.paths.indexOf(globalPath);
    for (const [index, path] of exports.paths.entries()) {
      if (index <= rootIndex) {
        expect(moduleDirectories.some(dir => path.endsWith(dir))).toBe(true);
      }
    }
  });

  it('provides `require.main` to modules', async () => {
    const runtime = await createRuntime(__filename);
    runtime._mainModule = module;
    for (const modulePath of [
      './test_root/modules_with_main/export_main.js',
      './test_root/modules_with_main/re_export_main.js',
    ]) {
      const mainModule = runtime.requireModule(__filename, modulePath);
      expect(mainModule).toBe(module);
    }
  });

  it('throws on non-existent haste modules', async () => {
    const runtime = await createRuntime(__filename);
    expect(() => {
      runtime.requireModule(runtime.__mockRootPath, 'DoesntExist');
    }).toThrow(new Error("Cannot find module 'DoesntExist' from 'root.js'"));
  });

  it('finds relative-path modules without file extension', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      './RegularModule',
    );
    expect(exports.isRealModule).toBe(true);
  });

  it('finds relative-path modules with file extension', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      './RegularModule.js',
    );
    expect(exports.isRealModule).toBe(true);
  });

  it('throws on non-existent relative-path modules', async () => {
    const runtime = await createRuntime(__filename);
    expect(() => {
      runtime.requireModule(runtime.__mockRootPath, './DoesntExist');
    }).toThrow(new Error("Cannot find module './DoesntExist' from 'root.js'"));
  });

  it('finds node core built-in modules', async () => {
    const runtime = await createRuntime(__filename);
    expect(() => {
      runtime.requireModule(runtime.__mockRootPath, 'fs');
    }).not.toThrow();
  });

  it('finds node core built-in modules with node:prefix', async () => {
    const runtime = await createRuntime(__filename);

    expect(runtime.requireModule(runtime.__mockRootPath, 'fs')).toBe(
      runtime.requireModule(runtime.__mockRootPath, 'node:fs'),
    );
    expect(runtime.requireModule(runtime.__mockRootPath, 'module')).toBe(
      runtime.requireModule(runtime.__mockRootPath, 'node:module'),
    );
  });

  it('finds and loads JSON files without file extension', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(runtime.__mockRootPath, './JSONFile');
    expect(exports.isJSONModule).toBe(true);
  });

  it('finds and loads JSON files with file extension', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      './JSONFile.json',
    );
    expect(exports.isJSONModule).toBe(true);
  });

  it('requires a JSON file twice successfully', async () => {
    const runtime = await createRuntime(__filename);
    const exports1 = runtime.requireModule(
      runtime.__mockRootPath,
      './JSONFile.json',
    );
    const exports2 = runtime.requireModule(
      runtime.__mockRootPath,
      './JSONFile.json',
    );
    expect(exports1.isJSONModule).toBe(true);
    expect(exports2.isJSONModule).toBe(true);
    expect(exports1).toBe(exports2);
  });

  it("provides manual mock when real module doesn't exist", async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'ExclusivelyManualMock',
    );
    expect(exports.isExclusivelyManualMockModule).toBe(true);
  });

  it("doesn't override real modules with manual mocks when explicitly unmocked", async () => {
    const runtime = await createRuntime(__filename, {
      automock: true,
    });
    const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
    root.jest.resetModules();
    root.jest.unmock('ManuallyMocked');
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      'ManuallyMocked',
    );
    expect(exports.isManualMockModule).toBe(false);
  });

  it('resolves haste packages properly', async () => {
    const runtime = await createRuntime(__filename);
    const hastePackage = runtime.requireModule(
      runtime.__mockRootPath,
      'haste-package/core/module',
    );
    expect(hastePackage.isHastePackage).toBe(true);
  });

  it('resolves platform extensions based on the default platform', async () => {
    await Promise.all([
      createRuntime(__filename).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'Platform',
        );

        expect(exports.platform).toBe('default');
      }),
      createRuntime(__filename, {
        haste: {
          defaultPlatform: 'ios',
          platforms: ['ios', 'android'],
        },
      }).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'Platform',
        );

        expect(exports.platform).toBe('ios');
      }),
      createRuntime(__filename, {
        haste: {
          platforms: ['ios', 'android'],
        },
      }).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'Platform',
        );

        expect(exports.platform).toBe('default');
      }),
      createRuntime(__filename, {
        haste: {
          defaultPlatform: 'android',
          platforms: ['ios', 'android'],
        },
      }).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'Platform',
        );

        expect(exports.platform).toBe('android');
      }),
      createRuntime(__filename, {
        haste: {
          defaultPlatform: 'windows',
          platforms: ['ios', 'android', 'native', 'windows'],
        },
      }).then(runtime => {
        const exports = runtime.requireModule(
          runtime.__mockRootPath,
          'Platform',
        );

        // We prefer `native` over the default module if the default one
        // cannot be found.
        expect(exports.platform).toBe('native');
      }),
    ]);
  });

  it('finds modules encoded in UTF-8 *with BOM*', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      './utf8_with_bom.js',
    );
    expect(exports).toBe('isModuleEncodedInUTF8WithBOM');
  });

  it('finds and loads JSON files encoded in UTF-8 *with BOM*', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(
      runtime.__mockRootPath,
      './utf8_with_bom.json',
    );
    expect(exports.isJSONModuleEncodedInUTF8WithBOM).toBe(true);
  });

  it('should export a constructable Module class', async () => {
    const runtime = await createRuntime(__filename);
    const Module = runtime.requireModule(runtime.__mockRootPath, 'module');

    expect(() => new Module()).not.toThrow();
  });

  it('caches Module correctly', async () => {
    const runtime = await createRuntime(__filename);
    const Module1 = runtime.requireModule(runtime.__mockRootPath, 'module');
    const Module2 = runtime.requireModule(runtime.__mockRootPath, 'module');

    expect(Module1).toBe(Module2);
  });

  it('does not cache modules that throw during evaluation', async () => {
    const runtime = await createRuntime(__filename);
    expect(() =>
      runtime.requireModule(runtime.__mockRootPath, 'throwing'),
    ).toThrow('throwing');
    expect(() =>
      runtime.requireModule(runtime.__mockRootPath, 'throwing'),
    ).toThrow('throwing');
  });

  it('overrides module.createRequire', async () => {
    const runtime = await createRuntime(__filename);
    const exports = runtime.requireModule(runtime.__mockRootPath, 'module');

    expect(exports.createRequire).not.toBe(createRequire);

    // createRequire with string
    {
      const customRequire = exports.createRequire(runtime.__mockRootPath);
      expect(customRequire('./create_require_module').foo).toBe('foo');
    }

    // createRequire with URL object
    {
      const customRequire = exports.createRequire(
        pathToFileURL(runtime.__mockRootPath),
      );
      expect(customRequire('./create_require_module').foo).toBe('foo');
    }

    // createRequire with file URL string
    {
      const customRequire = exports.createRequire(
        pathToFileURL(runtime.__mockRootPath).toString(),
      );
      expect(customRequire('./create_require_module').foo).toBe('foo');
    }

    // createRequire with absolute module path
    {
      const customRequire = exports.createRequire(runtime.__mockRootPath);
      expect(customRequire('./create_require_module').foo).toBe('foo');
    }

    expect(exports.syncBuiltinESMExports).not.toThrow();
    expect(exports.builtinModules).toEqual(builtinModules);
  });
});
