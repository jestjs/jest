/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type nativeModule from 'node:module';
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
    getModulePaths: jest.fn(() => ['/m']),
    isCoreModule: jest.fn(() => false),
    resolveCjs: jest.fn(),
    resolveCjsFromDirIfExists: jest.fn(() => null),
    ...over,
  } as unknown as Resolution;
}

function makeRegistries(): ModuleRegistries {
  return {
    createRequireCacheProxy: jest.fn(() => ({}) as never),
  } as unknown as ModuleRegistries;
}

describe('resolve', () => {
  test('throws when moduleName is null', () => {
    expect(() => resolve(makeResolution(), '/from.js', undefined)).toThrow(
      /must be a string/,
    );
  });

  test('looks up absolute paths via resolveCjsFromDirIfExists', () => {
    const r = makeResolution({
      resolveCjsFromDirIfExists: jest.fn(() => '/abs/found.js'),
    });
    expect(resolve(r, '/from.js', '/abs/x')).toBe('/abs/found.js');
  });

  test('walks options.paths and throws ModuleNotFoundError when none match', () => {
    const r = makeResolution({
      resolveCjsFromDirIfExists: jest.fn(() => null),
    });
    expect(() =>
      resolve(r, '/x/from.js', 'foo', {paths: ['./a', './b']}),
    ).toThrow(Resolver.ModuleNotFoundError);
  });

  test('falls back to mock module when resolveCjs throws', () => {
    const r = makeResolution({
      getCjsMockModule: jest.fn(() => '/mock.js'),
      resolveCjs: jest.fn(() => {
        throw new Error('not found');
      }),
    });
    expect(resolve(r, '/from.js', 'foo')).toBe('/mock.js');
  });

  test('rethrows when no mock fallback', () => {
    const err = new Error('not found');
    const r = makeResolution({
      getCjsMockModule: jest.fn(() => null),
      resolveCjs: jest.fn(() => {
        throw err;
      }),
    });
    expect(() => resolve(r, '/from.js', 'foo')).toThrow(err);
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
    expect(resolvePaths(makeResolution(), '/a/b/from.js', './x')).toEqual([
      '/a/b',
    ]);
  });

  test('returns null for core modules', () => {
    const r = makeResolution({isCoreModule: jest.fn(() => true)});
    expect(resolvePaths(r, '/from.js', 'fs')).toBeNull();
  });

  test('concatenates module + global paths for bare specifiers', () => {
    const r = makeResolution({
      getGlobalPaths: jest.fn(() => ['/g']),
      getModulePaths: jest.fn(() => ['/m']),
    });
    expect(resolvePaths(r, '/a/from.js', 'lodash')).toEqual(['/m', '/g']);
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
    const r = makeRegistries();
    const req = buildRequire(from, undefined, {
      mainModule: () => null,
      registries: r,
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution({resolveCjs: jest.fn(() => '/resolved.js')}),
    });

    expect(typeof req).toBe('function');
    expect(typeof req.resolve).toBe('function');
    expect(typeof req.resolve.paths).toBe('function');
    expect(req.cache).toBeDefined();
    expect(req.main).toBeNull();
    expect(req.extensions).toEqual(Object.create(null));
  });

  test('routes non-internal calls through requireDispatch', () => {
    const requireDispatch: jest.MockedFunction<RequireDispatch> = jest.fn(
      () => 'dispatched',
    );
    const requireInternal: jest.MockedFunction<RequireDispatch> = jest.fn();
    const req = buildRequire(from, undefined, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch,
      requireInternal,
      resolution: makeResolution(),
    });
    expect(req('lodash')).toBe('dispatched');
    expect(requireDispatch).toHaveBeenCalledWith('/a/b/from.js', 'lodash');
    expect(requireInternal).not.toHaveBeenCalled();
  });

  test('routes internal calls through requireInternal', () => {
    const requireDispatch: jest.MockedFunction<RequireDispatch> = jest.fn();
    const requireInternal: jest.MockedFunction<RequireDispatch> = jest.fn(
      () => 'internal',
    );
    const req = buildRequire(from, {isInternalModule: true} as never, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch,
      requireInternal,
      resolution: makeResolution(),
    });
    expect(req('chalk')).toBe('internal');
    expect(requireInternal).toHaveBeenCalledWith('/a/b/from.js', 'chalk');
    expect(requireDispatch).not.toHaveBeenCalled();
  });

  test('require.resolve respects JEST_RESOLVE_OUTSIDE_VM_OPTION for internal modules', () => {
    const req = buildRequire(from, {isInternalModule: true} as never, {
      mainModule: () => null,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution({
        resolveCjs: jest.fn(() => '/resolved.js'),
      }),
    });
    const resolved = req.resolve('lodash', {
      [JEST_RESOLVE_OUTSIDE_VM_OPTION]: true,
    } as ResolveOptions);
    // Outside-vm marker prefix
    expect(resolved.startsWith('jest-main://')).toBe(true);
  });

  test('reads `main` lazily through the mainModule callback', () => {
    let main: Module | null = null;
    const getMain = (): Module | null => main;

    // First require: main is null at build time, so `req.main` captures null.
    const req = buildRequire(from, undefined, {
      mainModule: getMain,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution(),
    });
    expect(req.main).toBeNull();

    // Setting main after build does not retroactively change a pre-built require
    // (matches existing behavior — `require.main` is captured at module load
    // via Object.defineProperty).
    main = {filename: '/test.js'} as never;
    expect(req.main).toBeNull();

    // But a require built later does see the current value.
    const req2 = buildRequire(from, undefined, {
      mainModule: getMain,
      registries: makeRegistries(),
      requireDispatch: jest.fn(),
      requireInternal: jest.fn(),
      resolution: makeResolution(),
    });
    expect(req2.main).toBe(main);
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
    over.buildRequireFor ?? jest.fn(() => ({}) as never as NodeJS.Require);
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
    const Mod = provider.require('module', true) as typeof nativeModule.Module;
    expect(typeof Mod.createRequire).toBe('function');
    // Cached on second call
    expect(provider.require('module', true)).toBe(Mod);
  });

  test('mocked Module.createRequire delegates to buildRequireFor with the filename', () => {
    const fakeRequire = (() => 'r') as unknown as NodeJS.Require;
    const buildRequireFor: BuildRequireForMock = jest.fn(() => fakeRequire);
    const {provider} = makeProvider({
      buildRequireFor,
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const Mod = provider.require('module', true) as typeof nativeModule.Module;
    const req = Mod.createRequire('/some/abs/file.js');
    expect(buildRequireFor).toHaveBeenCalledWith('/some/abs/file.js');
    expect(req).toBe(fakeRequire);
  });

  test('mocked Module.createRequire converts file:// URLs', () => {
    const buildRequireFor: BuildRequireForMock = jest.fn(
      () => ({}) as never as NodeJS.Require,
    );
    const {provider} = makeProvider({
      buildRequireFor,
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const Mod = provider.require('module', true) as typeof nativeModule.Module;
    Mod.createRequire('file:///abs/x.js');
    const arg = buildRequireFor.mock.calls[0][0];
    expect(typeof arg).toBe('string');
    expect(arg.startsWith('/')).toBe(true);
  });

  test('mocked Module.createRequire rejects relative filenames', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'module',
    });
    const Mod = provider.require('module', true) as typeof nativeModule.Module;
    expect(() => Mod.createRequire('relative.js')).toThrow(TypeError);
  });

  test('falls through to require() for plain core modules', () => {
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: () => 'path',
    });
    const pathMod = provider.require(
      'path',
      true,
    ) as typeof import('node:path');
    expect(typeof pathMod.join).toBe('function');
  });

  test('skips normalization when supportPrefix=false', () => {
    const normalize = jest.fn();
    const {provider} = makeProvider({
      normalizeCoreModuleSpecifier: normalize as never,
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
