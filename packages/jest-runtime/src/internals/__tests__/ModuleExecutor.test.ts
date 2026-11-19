/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createContext} from 'node:vm';
import type {Jest, JestEnvironment} from '@jest/environment';
import {makeProjectConfig} from '@jest/test-utils';
import type {RequireBuilder} from '../cjsRequire';
import type {JestGlobals} from '../JestGlobals';
import {
  CjsParseError,
  ModuleExecutor,
  type ModuleExecutorOptions,
} from '../ModuleExecutor';
import type {Resolution} from '../Resolution';
import {TestMainModule} from '../TestMainModule';
import type {TransformCache, TransformOptions} from '../TransformCache';

describe('CjsParseError', () => {
  test('is identified by instanceof', () => {
    const cause = new Error('boom');
    const error = new CjsParseError(cause);
    expect(error).toBeInstanceOf(CjsParseError);
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('boom');
  });

  test('plain Error is not a CjsParseError', () => {
    expect(new Error('boom')).not.toBeInstanceOf(CjsParseError);
  });
});

describe('ModuleExecutor', () => {
  function makeExecutor(
    overrides: Partial<ConstructorParameters<typeof ModuleExecutor>[0]> = {},
  ) {
    const noopRequire = (() => undefined) as unknown as NodeJS.Require;
    return new ModuleExecutor({
      config: makeProjectConfig({
        injectGlobals: true,
        sandboxInjectedGlobals: [],
      }),
      dynamicImport: jest.fn<ModuleExecutorOptions['dynamicImport']>(),
      environment: {global: {}} as JestEnvironment,
      jestGlobals: {
        jestObjectFor: () => ({}) as Jest,
      } as unknown as JestGlobals,
      requireBuilder: {for: () => noopRequire} as unknown as RequireBuilder,
      resolution: {} as unknown as Resolution,
      testMainModule: new TestMainModule(),
      testPath: '/test.js',
      transformCache: {} as unknown as TransformCache,
      ...overrides,
    });
  }

  describe('injectedModuleParameters', () => {
    test('default set + jest', () => {
      const executor = makeExecutor();
      expect(executor.injectedModuleParameters).toEqual([
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
        'jest',
      ]);
    });

    test('omits jest when injectGlobals=false', () => {
      const executor = makeExecutor({
        config: makeProjectConfig({
          injectGlobals: false,
          sandboxInjectedGlobals: [],
        }),
      });
      expect(executor.injectedModuleParameters).not.toContain('jest');
    });

    test('appends sandboxInjectedGlobals', () => {
      const executor = makeExecutor({
        config: makeProjectConfig({
          injectGlobals: true,
          sandboxInjectedGlobals: ['Math', 'Reflect'],
        }),
      });
      expect(executor.injectedModuleParameters).toEqual([
        'module',
        'exports',
        'require',
        '__dirname',
        '__filename',
        'jest',
        'Math',
        'Reflect',
      ]);
    });
  });

  describe('getCurrentlyExecutingManualMock', () => {
    test('starts null', () => {
      const executor = makeExecutor();
      expect(executor.getCurrentlyExecutingManualMock()).toBeNull();
    });
  });

  describe('exec', () => {
    test('bails early when environment.global is null (env disposed)', () => {
      const executor = makeExecutor({
        environment: {global: null} as unknown as JestEnvironment,
      });
      const localModule = {
        children: [],
        exports: {},
        filename: '/m.js',
        id: '/m.js',
        isPreloading: false,
        loaded: false,
        path: '/',
      };
      // Should not throw and should not mutate `loaded` (the caller sets it).
      expect(() =>
        executor.exec(localModule, undefined, new Map(), null, undefined),
      ).not.toThrow();
      expect(localModule.exports).toEqual({});
    });

    describe('scriptFilename compilation', () => {
      const internalTransformOptions: TransformOptions = {
        isInternalModule: true,
        supportsDynamicImport: false,
        supportsExportNamespaceFrom: false,
        supportsStaticESM: false,
        supportsTopLevelAwait: false,
      };

      const probeSource =
        'exports.stack = new Error("probe").stack; exports.__filename = __filename; exports.moduleFilename = module.filename;';

      function makeExecutingExecutor() {
        const vmContext = createContext({});
        return makeExecutor({
          environment: {
            getVmContext: () => vmContext,
            global: vmContext,
          } as unknown as JestEnvironment,
          resolution: {
            getGlobalPaths: () => [],
            getModulePaths: () => [],
            isCoreModule: (name: string) => name === 'fs',
          } as unknown as Resolution,
          transformCache: {
            transform: () => probeSource,
          } as unknown as TransformCache,
        });
      }

      function makeLocalModule(filename: string) {
        return {
          children: [],
          exports: {} as {
            __filename?: string;
            moduleFilename?: string;
            stack?: string;
          },
          filename,
          id: filename,
          isPreloading: false,
          loaded: false,
          path: '/',
        };
      }

      function extractCompiledFilename(
        stack: string | undefined,
      ): string | undefined {
        const firstFrame = stack?.split('\n')[1];
        const match = firstFrame?.match(/\((.+):\d+:\d+\)$|at (.+):\d+:\d+$/);
        return match?.[1] ?? match?.[2];
      }

      test('compiles internal modules with distinct per-runtime script filenames while preserving __filename', () => {
        const executor1 = makeExecutingExecutor();
        const executor2 = makeExecutingExecutor();
        const module1 = makeLocalModule('/internal.js');
        const module2 = makeLocalModule('/internal.js');

        expect(
          executor1.exec(
            module1,
            internalTransformOptions,
            new Map(),
            null,
            undefined,
          ),
        ).toBe('loaded');
        expect(
          executor2.exec(
            module2,
            internalTransformOptions,
            new Map(),
            null,
            undefined,
          ),
        ).toBe('loaded');

        const scriptFilename1 = extractCompiledFilename(module1.exports.stack);
        const scriptFilename2 = extractCompiledFilename(module2.exports.stack);

        expect(scriptFilename1).toMatch(
          /^\/internal\.js#jest-internal-runtime-\d+$/,
        );
        expect(scriptFilename2).toMatch(
          /^\/internal\.js#jest-internal-runtime-\d+$/,
        );
        expect(scriptFilename1).not.toBe(scriptFilename2);

        expect(module1.exports.__filename).toBe('/internal.js');
        expect(module1.exports.moduleFilename).toBe('/internal.js');
        expect(module2.exports.__filename).toBe('/internal.js');
        expect(module2.exports.moduleFilename).toBe('/internal.js');
      });

      test('leaves compiled script filename unsuffixed for non-internal and core modules', () => {
        const executor = makeExecutingExecutor();
        const regularModule = makeLocalModule('/regular.js');
        const defaultModule = makeLocalModule('/regular-default.js');
        const coreModule = makeLocalModule('fs');

        expect(
          executor.exec(
            regularModule,
            {...internalTransformOptions, isInternalModule: false},
            new Map(),
            null,
            undefined,
          ),
        ).toBe('loaded');
        expect(
          executor.exec(defaultModule, undefined, new Map(), null, undefined),
        ).toBe('loaded');
        expect(
          executor.exec(coreModule, undefined, new Map(), null, undefined),
        ).toBe('loaded');

        expect(extractCompiledFilename(regularModule.exports.stack)).toBe(
          '/regular.js',
        );
        expect(regularModule.exports.__filename).toBe('/regular.js');
        expect(extractCompiledFilename(defaultModule.exports.stack)).toBe(
          '/regular-default.js',
        );
        expect(extractCompiledFilename(coreModule.exports.stack)).toBe(
          'jest-nodejs-core-fs',
        );
      });
    });
  });
});
