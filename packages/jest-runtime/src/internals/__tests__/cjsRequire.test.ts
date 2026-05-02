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
import type ModuleRegistries from '../ModuleRegistries';
import type Resolution from '../Resolution';
import type {InitialModule} from '../moduleTypes';
import {
  CoreModuleProvider,
  JEST_RESOLVE_OUTSIDE_VM_OPTION,
  type ResolveOptions,
  buildRequire,
  resolve,
  resolvePaths,
} from '../cjsRequire';

type RequireDispatch = (from: string, moduleName: string) => unknown;
type BuildRequireForMock = jest.MockedFunction<
  (filename: string) => NodeJS.Require
>;

function makeResolution(
  over: Partial<Record<string, unknown>> = {},
): Resolution {
  return {
    getCjsMockModule: jest.fn(() => null),
    getGlobalPaths: jest.fn(() => []),
    getModulePaths: jest.fn(() => ['/modules']),
    isCoreModule: jest.fn(() => false),
    resolveCjs: jest.fn(),
    resolveCjsFromDirIfExists: jest.fn(() => null),
    ...over,
  } as unknown as Resolution;
}

function makeRegistries(): ModuleRegistries {
  return {
    createRequireCacheProxy: jest.fn(() => ({})),
  } as unknown as ModuleRegistries;
}

describe('resolve', () => {
  test('throws when moduleName is null', () => {
    expect(() => resolve(makeResolution(), '/from.js', undefined)).toThrow(
      /must be a string/,
    );
  });

  test('looks up absolute paths via resolveCjsFromDirIfExists', () => {
    const resolution = makeResolution({
      resolveCjsFromDirIfExists: jest.fn(() => '/abs/found.js'),
    });
    expect(resolve(resolution, '/from.js', '/abs/x')).toBe('/abs/found.js');
  });

  test('walks options.paths and throws ModuleNotFoundError when none match', () => {
    const resolution = makeResolution({
      resolveCjsFromDirIfExists: jest.fn(() => null),
    });
    expect(() =>
      resolve(resolution, '/x/from.js', 'foo', {paths: ['./a', './b']}),
    ).toThrow(Resolver.ModuleNotFoundError);
  });

  test('falls back to mock module when resolveCjs throws', () => {
    const resolution = makeResolution({
      getCjsMockModule: jest.fn(() => '/mock.js'),
      resolveCjs: jest.fn(() => {
        throw new Error('not found');
      }),
    });
    expect(resolve(resolution, '/from.js', 'foo')).toBe('/mock.js');
  });

  test('rethrows when no mock fallback', () => {
    const error = new Error('not found');
    const resolution = makeResolution({
      getCjsMockModule: jest.fn(() => null),
      resolveCjs: jest.fn(() => {
        throw error;
      }),
    });
    expect(() => resolve(resolution, '/from.js', 'foo')).toThrow(error);
  });
});

describe('resolvePaths', () => {
  test('throws when moduleName is null', () => {
    expect(() => resolvePaths(makeResolution(), '/from.js', undefined)).toThrow(
      /must be a string/,
    );
  });

  test('throws on empty moduleName', () => {
    expect(() => resolvePaths(makeResolution(), '/from.js', '')).toThrow(
      /must not be the empty string/,
    );
  });

  test('returns [fromDir] for relative specifiers', () => {
    // `path.resolve('/a/b/from.js', '..')` is `/a/b` on POSIX but
    // `D:\a\b` on Windows; compute the expected value the same way
    // `resolvePaths` does so the assertion is platform-agnostic.
    const fromDir = path.resolve('/a/b/from.js', '..');
    expect(resolvePaths(makeResolution(), '/a/b/from.js', './x')).toEqual([
      fromDir,
    ]);
  });

  test('returns null for core modules', () => {
    const resolution = makeResolution({isCoreModule: jest.fn(() => true)});
    expect(resolvePaths(resolution, '/from.js', 'fs')).toBeNull();
  });

  test('concatenates module + global paths for bare specifiers', () => {
    const resolution = makeResolution({
      getGlobalPaths: jest.fn(() => ['/global']),
      getModulePaths: jest.fn(() => ['/modules']),
    });
    expect(resolvePaths(resolution, '/a/from.js', 'lodash')).toEqual([
      '/modules',
      '/global',
    ]);
  });
});

describe('buildRequire', () => {
  const from: InitialModule = {
    children: [],
    exports: {},
    filename: '/a/b/from.js',
    id: '/a/b/from.js',
    isPreloading: false,
    loaded: false,
    path: '/a/b',
  };

  test('produces a require with .resolve / .paths / .cache / .main / .extensions', () => {
    const registries = makeRegistries();
    const requireFn = buildRequire(from, undefined, {
      mainModule: () => null,
      registries,
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution({resolveCjs: jest.fn(() => '/resolved.js')}),
    });

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
    const requireFn = buildRequire(from, undefined, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch,
      requireInternal,
      resolution: makeResolution(),
    });
    expect(requireFn('lodash')).toBe('dispatched');
    expect(requireDispatch).toHaveBeenCalledWith('/a/b/from.js', 'lodash');
    expect(requireInternal).not.toHaveBeenCalled();
  });

  test('routes internal calls through requireInternal', () => {
    const requireDispatch: jest.MockedFunction<RequireDispatch> = jest.fn();
    const requireInternal: jest.MockedFunction<RequireDispatch> = jest.fn(
      () => 'internal',
    );
    const requireFn = buildRequire(from, {isInternalModule: true} as any, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch,
      requireInternal,
      resolution: makeResolution(),
    });
    expect(requireFn('chalk')).toBe('internal');
    expect(requireInternal).toHaveBeenCalledWith('/a/b/from.js', 'chalk');
    expect(requireDispatch).not.toHaveBeenCalled();
  });

  test('require.resolve respects JEST_RESOLVE_OUTSIDE_VM_OPTION for internal modules', () => {
    const requireFn = buildRequire(from, {isInternalModule: true} as any, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution({
        resolveCjs: jest.fn(() => '/resolved.js'),
      }),
    });
    const resolved = requireFn.resolve('lodash', {
      [JEST_RESOLVE_OUTSIDE_VM_OPTION]: true,
    } as ResolveOptions);
    // Outside-vm marker prefix
    expect(resolved.startsWith('jest-main://')).toBe(true);
  });

  test('snapshots `main` at build time, not per call', () => {
    let mainModule: Module | null = null;
    const getMainModule = (): Module | null => mainModule;

    // First require: mainModule is null when buildRequire runs, so
    // `requireFn.main` captures null.
    const requireFn = buildRequire(from, undefined, {
      mainModule: getMainModule,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution(),
    });
    expect(requireFn.main).toBeNull();

    // Changing mainModule after build does not affect an already-built
    // require — the value was snapshotted at build time. This matches
    // Node's semantics: `require.main` is set once when `require` is
    // attached to a module.
    mainModule = {filename: '/test.js'} as Module;
    expect(requireFn.main).toBeNull();

    // A require built later sees whatever mainModule is at that point.
    const laterRequire = buildRequire(from, undefined, {
      mainModule: getMainModule,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution(),
    });
    expect(laterRequire.main).toBe(mainModule);
  });
});

function makeProvider(
  over: {
    normalizeCoreModuleSpecifier?: (name: string) => string | false;
    process?: unknown;
    buildRequireFor?: BuildRequireForMock;
  } = {},
) {
  const buildRequireFor: BuildRequireForMock =
    over.buildRequireFor ?? jest.fn(() => ({}) as NodeJS.Require);
  const provider = new CoreModuleProvider({
    buildRequireFor,
    environment: {
      global: {process: over.process ?? {pid: 1}},
    } as unknown as JestEnvironment,
    resolution: {
      normalizeCoreModuleSpecifier: jest.fn(
        over.normalizeCoreModuleSpecifier ?? (() => false),
      ),
    } as unknown as Resolution,
  });
  return {buildRequireFor, provider};
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
    // Cached on second call
    expect(provider.require('module', true)).toBe(ModuleClass);
  });

  test('mocked Module.createRequire delegates to buildRequireFor with the filename', () => {
    const fakeRequire = (() => 'r') as unknown as NodeJS.Require;
    const buildRequireFor: BuildRequireForMock = jest.fn(() => fakeRequire);
    const {provider} = makeProvider({
      buildRequireFor,
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    // Use an absolute path that's valid on both POSIX and Windows.
    const absolutePath = path.resolve('/some/abs/file.js');
    const requireFn = ModuleClass.createRequire(absolutePath);
    expect(buildRequireFor).toHaveBeenCalledWith(absolutePath);
    expect(requireFn).toBe(fakeRequire);
  });

  test('mocked Module.createRequire converts file:// URLs', () => {
    const buildRequireFor: BuildRequireForMock = jest.fn(
      () => ({}) as NodeJS.Require,
    );
    const {provider} = makeProvider({
      buildRequireFor,
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const ModuleClass = provider.require(
      'module',
      true,
    ) as typeof nativeModule.Module;
    // Build a file URL from a platform-valid absolute path so the test runs
    // on Windows (where `file:///abs/x.js` is rejected — needs a drive
    // letter).
    const absolutePath = path.resolve('/abs/x.js');
    ModuleClass.createRequire(pathToFileURL(absolutePath).href);
    expect(buildRequireFor).toHaveBeenCalledWith(absolutePath);
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
