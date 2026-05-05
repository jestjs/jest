/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Jest, JestEnvironment} from '@jest/environment';
import {makeProjectConfig} from '@jest/test-utils';
import type {RequireBuilder} from '../cjsRequire';
import type {JestGlobals} from '../JestGlobals';
import {
  CJS_PARSE_ERROR,
  ModuleExecutor,
  type ModuleExecutorOptions,
  isCjsParseError,
} from '../ModuleExecutor';
import type {Resolution} from '../Resolution';
import {TestMainModule} from '../TestMainModule';
import type {TransformCache} from '../TransformCache';

describe('isCjsParseError', () => {
  test('matches errors tagged with CJS_PARSE_ERROR', () => {
    const error = new Error('boom') as Error & Record<symbol, unknown>;
    error[CJS_PARSE_ERROR] = true;
    expect(isCjsParseError(error)).toBe(true);
  });

  test('rejects untagged errors and non-Error values', () => {
    expect(isCjsParseError(new Error('boom'))).toBe(false);
    expect(isCjsParseError('boom')).toBe(false);
    expect(isCjsParseError(null)).toBe(false);
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

  describe('constructInjectedModuleParameters', () => {
    test('default set + jest', () => {
      const executor = makeExecutor();
      expect(executor.constructInjectedModuleParameters()).toEqual([
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
      expect(executor.constructInjectedModuleParameters()).not.toContain(
        'jest',
      );
    });

    test('appends sandboxInjectedGlobals', () => {
      const executor = makeExecutor({
        config: makeProjectConfig({
          injectGlobals: true,
          sandboxInjectedGlobals: ['Math', 'Reflect'],
        }),
      });
      expect(executor.constructInjectedModuleParameters()).toEqual([
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
  });
});
