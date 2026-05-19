/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type nativeModule from 'node:module';
import * as path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {JestEnvironment, Module} from '@jest/environment';
import Resolver from 'jest-resolve';
import type {ModuleRegistries} from '../ModuleRegistries';
import type {Resolution} from '../Resolution';
import {TestMainModule} from '../TestMainModule';
import type {TransformOptions} from '../TransformCache';
import type {InitialModule} from '../moduleTypes';
import {
  CoreModuleProvider,
  JEST_RESOLVE_OUTSIDE_VM_OPTION,
  RequireBuilder,
  type ResolveOptions,
} from '../cjsRequire';

const internalOptions: TransformOptions = {
  isInternalModule: true,
  supportsDynamicImport: false,
  supportsExportNamespaceFrom: false,
  supportsStaticESM: false,
  supportsTopLevelAwait: false,
};

type RequireDispatch = (from: string, moduleName: string) => unknown;

function makeResolution(
  overrides: Partial<Record<string, unknown>> = {},
): Resolution {
  return {
    getCjsMockModule: jest.fn(() => null),
    getGlobalPaths: jest.fn(() => []),
    getModulePaths: jest.fn(() => ['/modules']),
    isCoreModule: jest.fn(() => false),
    resolveCjs: jest.fn(),
    resolveCjsFromDirIfExists: jest.fn(() => null),
    resolveCjsStub: jest.fn(() => null),
    ...overrides,
  } as unknown as Resolution;
}

function makeRegistries(): ModuleRegistries {
  return {
    createRequireCacheProxy: jest.fn(() => ({})),
  } as unknown as ModuleRegistries;
}

function makeBuilder(
  overrides: Partial<ConstructorParameters<typeof RequireBuilder>[0]> = {},
): RequireBuilder {
  return new RequireBuilder({
    registries: makeRegistries(),
    requireDispatch: jest.fn(),
    requireInternal: jest.fn(),
    resolution: makeResolution(),
    testMainModule: new TestMainModule(),
    ...overrides,
  });
}

const sampleFrom: InitialModule = {
  children: [],
  exports: {},
  filename: '/a/b/from.js',
  id: '/a/b/from.js',
  isPreloading: false,
  loaded: false,
  path: '/a/b',
};

describe('RequireBuilder', () => {
  describe('the produced require shape', () => {
    test('exposes .resolve / .paths / .cache / .main / .extensions', () => {
      const builder = makeBuilder({
        resolution: makeResolution({resolveCjs: jest.fn(() => '/resolved.js')}),
      });
      const requireFn = builder.for(sampleFrom, undefined);

      expect(typeof requireFn).toBe('function');
      expect(typeof requireFn.resolve).toBe('function');
      expect(typeof requireFn.resolve.paths).toBe('function');
      expect(requireFn.cache).toBeDefined();
      expect(requireFn.main).toBeNull();
      expect(requireFn.extensions).toEqual(Object.create(null));
    });

    test('routes non-internal calls through requireDispatch', () => {
      const requireDispatch: jest.MockedFunction<RequireDispatch> = jest.fn(
        () => 'dispatched',
      );
      const requireInternal: jest.MockedFunction<RequireDispatch> = jest.fn();
      const builder = makeBuilder({requireDispatch, requireInternal});
      const requireFn = builder.for(sampleFrom, undefined);
      expect(requireFn('lodash')).toBe('dispatched');
      expect(requireDispatch).toHaveBeenCalledWith('/a/b/from.js', 'lodash');
      expect(requireInternal).not.toHaveBeenCalled();
    });

    test('routes internal calls through requireInternal', () => {
      const requireDispatch: jest.MockedFunction<RequireDispatch> = jest.fn();
      const requireInternal: jest.MockedFunction<RequireDispatch> = jest.fn(
        () => 'internal',
      );
      const builder = makeBuilder({requireDispatch, requireInternal});
      const requireFn = builder.for(sampleFrom, internalOptions);
      expect(requireFn('chalk')).toBe('internal');
      expect(requireInternal).toHaveBeenCalledWith('/a/b/from.js', 'chalk');
      expect(requireDispatch).not.toHaveBeenCalled();
    });

    test('snapshots `main` at build time, not per call', () => {
      const testMainModule = new TestMainModule();
      const builder = makeBuilder({testMainModule});

      const requireFn = builder.for(sampleFrom, undefined);
      expect(requireFn.main).toBeNull();

      testMainModule.current = {filename: '/test.js'} as Module;
      expect(requireFn.main).toBeNull();

      const laterRequire = builder.for(sampleFrom, undefined);
      expect(laterRequire.main).toBe(testMainModule.current);
    });
  });

  describe('require.resolve', () => {
    function resolveVia(
      builder: RequireBuilder,
      moduleName: string | undefined,
      resolveOptions?: ResolveOptions,
    ) {
      return (
        builder.for(sampleFrom, undefined).resolve as unknown as (
          name: string | undefined,
          options?: ResolveOptions,
        ) => string
      )(moduleName, resolveOptions);
    }

    test('throws when moduleName is null', () => {
      expect(() => resolveVia(makeBuilder(), undefined)).toThrow(
        /must be a string/,
      );
    });

    test('looks up absolute paths via resolveCjsFromDirIfExists', () => {
      const builder = makeBuilder({
        resolution: makeResolution({
          resolveCjsFromDirIfExists: jest.fn(() => '/abs/found.js'),
        }),
      });
      expect(resolveVia(builder, '/abs/x')).toBe('/abs/found.js');
    });

    test('walks options.paths and throws ModuleNotFoundError when none match', () => {
      const builder = makeBuilder({
        resolution: makeResolution({
          resolveCjsFromDirIfExists: jest.fn(() => null),
        }),
      });
      expect(() => resolveVia(builder, 'foo', {paths: ['./a', './b']})).toThrow(
        Resolver.ModuleNotFoundError,
      );
    });

    test('resolves moduleNameMapper before walking options.paths', () => {
      const resolveCjsStub = jest.fn(
        (_from: string, _moduleName: string) => '/mapped.js',
      );
      const resolveCjsFromDirIfExists = jest.fn(() => null);
      const builder = makeBuilder({
        resolution: makeResolution({
          resolveCjsFromDirIfExists,
          resolveCjsStub,
        }),
      });

      expect(resolveVia(builder, '@foo/js', {paths: ['./a']})).toBe(
        '/mapped.js',
      );
      expect(resolveCjsStub).toHaveBeenCalledWith('/a/b/from.js', '@foo/js');
      expect(resolveCjsFromDirIfExists).not.toHaveBeenCalled();
    });

    test('falls back to mock module when resolveCjs throws', () => {
      const builder = makeBuilder({
        resolution: makeResolution({
          getCjsMockModule: jest.fn(() => '/mock.js'),
          resolveCjs: jest.fn(() => {
            throw new Error('not found');
          }),
        }),
      });
      expect(resolveVia(builder, 'foo')).toBe('/mock.js');
    });

    test('rethrows when no mock fallback', () => {
      const error = new Error('not found');
      const builder = makeBuilder({
        resolution: makeResolution({
          getCjsMockModule: jest.fn(() => null),
          resolveCjs: jest.fn(() => {
            throw error;
          }),
        }),
      });
      expect(() => resolveVia(builder, 'foo')).toThrow(error);
    });

    test('returns an outside-vm marker for internal modules with the option set', () => {
      const builder = makeBuilder({
        resolution: makeResolution({resolveCjs: jest.fn(() => '/resolved.js')}),
      });
      const requireFn = builder.for(sampleFrom, internalOptions);
      const resolved = requireFn.resolve('lodash', {
        [JEST_RESOLVE_OUTSIDE_VM_OPTION]: true,
      } as ResolveOptions);
      expect(resolved.startsWith('jest-main://')).toBe(true);
    });
  });

  describe('require.resolve.paths', () => {
    function pathsVia(builder: RequireBuilder, moduleName: string | undefined) {
      return builder
        .for(sampleFrom, undefined)
        .resolve.paths(moduleName as string);
    }

    test('throws when moduleName is null', () => {
      expect(() => pathsVia(makeBuilder(), undefined)).toThrow(
        /must be a string/,
      );
    });

    test('throws on empty moduleName', () => {
      expect(() => pathsVia(makeBuilder(), '')).toThrow(
        /must not be the empty string/,
      );
    });

    test('returns [fromDir] for relative specifiers', () => {
      // Windows yields `D:\a\b`, POSIX `/a/b` - compute the same way.
      const fromDir = path.resolve('/a/b/from.js', '..');
      expect(pathsVia(makeBuilder(), './x')).toEqual([fromDir]);
    });

    test('returns null for core modules', () => {
      const builder = makeBuilder({
        resolution: makeResolution({isCoreModule: jest.fn(() => true)}),
      });
      expect(pathsVia(builder, 'fs')).toBeNull();
    });

    test('concatenates module + global paths for bare specifiers', () => {
      const builder = makeBuilder({
        resolution: makeResolution({
          getGlobalPaths: jest.fn(() => ['/global']),
          getModulePaths: jest.fn(() => ['/modules']),
        }),
      });
      expect(pathsVia(builder, 'lodash')).toEqual(['/modules', '/global']);
    });
  });

  describe('forFilename', () => {
    test('wraps a synthetic InitialModule and delegates to `for`', () => {
      const builder = makeBuilder();
      const requireFn = builder.forFilename('/a/b/file.js');
      expect(typeof requireFn).toBe('function');
      expect(typeof requireFn.resolve).toBe('function');
    });
  });
});

function makeProvider(
  overrides: {
    normalizeCoreModuleSpecifier?: (name: string) => string | false;
    process?: unknown;
    requireBuilder?: RequireBuilder;
  } = {},
) {
  const requireBuilder = overrides.requireBuilder ?? makeBuilder();
  const provider = new CoreModuleProvider({
    environment: {
      global: {process: overrides.process ?? {pid: 1}},
    } as unknown as JestEnvironment,
    requireBuilder,
    resolution: {
      normalizeCoreModuleSpecifier: jest.fn(
        overrides.normalizeCoreModuleSpecifier ?? (() => false),
      ),
    } as unknown as Resolution,
  });
  return {provider, requireBuilder};
}

describe('CoreModuleProvider', () => {
  test('returns environment.global.process for "process"', () => {
    const fakeProcess = {pid: 42};
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'process',
      process: fakeProcess,
    });
    expect(provider.require('node:process', true)).toBe(fakeProcess);
  });

  test('returns the mocked Module class for "module"', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    expect(typeof ModuleClass.createRequire).toBe('function');
    expect(provider.require('module', true)).toBe(ModuleClass);
  });

  test('mocked Module.createRequire delegates to requireBuilder.forFilename with the filename', () => {
    const fakeRequire = (() => 'r') as unknown as NodeJS.Require;
    const requireBuilder = makeBuilder();
    const forFilename: jest.SpiedFunction<typeof requireBuilder.forFilename> =
      jest.spyOn(requireBuilder, 'forFilename').mockReturnValue(fakeRequire);
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
      requireBuilder,
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    const absolutePath = path.resolve('/some/abs/file.js');
    const requireFn = ModuleClass.createRequire(absolutePath);
    expect(forFilename).toHaveBeenCalledWith(absolutePath);
    expect(requireFn).toBe(fakeRequire);
  });

  test('mocked Module.createRequire converts file:// URLs', () => {
    const requireBuilder = makeBuilder();
    const forFilename: jest.SpiedFunction<typeof requireBuilder.forFilename> =
      jest
        .spyOn(requireBuilder, 'forFilename')
        .mockReturnValue({} as NodeJS.Require);
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
      requireBuilder,
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    // Windows rejects `file:///abs/x.js` - needs a drive letter.
    const absolutePath = path.resolve('/abs/x.js');
    ModuleClass.createRequire(pathToFileURL(absolutePath).href);
    expect(forFilename).toHaveBeenCalledWith(absolutePath);
  });

  test('mocked Module.createRequire rejects relative filenames', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    expect(() => ModuleClass.createRequire('relative.js')).toThrow(TypeError);
  });

  test('falls through to require() for plain core modules', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'path',
    });
    const pathModule = provider.require(
      'path',
      true,
    ) as typeof import('node:path');
    expect(typeof pathModule.join).toBe('function');
  });

  test('skips normalization when supportPrefix=false', () => {
    const normalize = jest.fn<(name: string) => string | false>();
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: normalize,
    });
    provider.require('path', false);
    expect(normalize).not.toHaveBeenCalled();
  });

  test('reset() drops the cached Module class', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const first = provider.require('module', true);
    provider.reset();
    const second = provider.require('module', true);
    expect(second).not.toBe(first);
  });
});
