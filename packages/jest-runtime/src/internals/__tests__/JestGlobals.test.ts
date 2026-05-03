/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createContext} from 'node:vm';
import {
  makeGlobalConfig,
  makeProjectConfig,
  testWithVmEsm,
} from '@jest/test-utils';
import type {JestEnvironment} from '@jest/environment';
import type {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {ModuleMocker} from 'jest-mock';
import {JestGlobals, type JestGlobalsOptions} from '../JestGlobals';
import type {MockState} from '../MockState';
import {evaluateSyntheticModule} from '../syntheticBuilders';
import {TestState} from '../TestState';
import type {EnvironmentGlobals} from '../types';

type Stubs = {
  mockState: jest.Mocked<MockState>;
  moduleMocker: jest.Mocked<ModuleMocker>;
  environment: JestEnvironment;
  setMock: jest.MockedFunction<JestGlobalsOptions['setMock']>;
  setModuleMock: jest.MockedFunction<JestGlobalsOptions['setModuleMock']>;
  generateMock: jest.MockedFunction<JestGlobalsOptions['generateMock']>;
  requireActual: jest.MockedFunction<JestGlobalsOptions['requireActual']>;
  requireMock: jest.MockedFunction<JestGlobalsOptions['requireMock']>;
  resetModules: jest.MockedFunction<() => void>;
  isolateModules: jest.MockedFunction<(fn: () => void) => void>;
  isolateModulesAsync: jest.MockedFunction<
    (fn: () => Promise<void>) => Promise<void>
  >;
  clearAllMocks: jest.MockedFunction<() => void>;
  resetAllMocks: jest.MockedFunction<() => void>;
  restoreAllMocks: jest.MockedFunction<() => void>;
  testState: TestState;
  logFormattedReferenceError: jest.MockedFunction<(msg: string) => void>;
};

const makeFakeTimers = () =>
  ({
    now: jest.fn(() => 0),
    useFakeTimers: jest.fn(),
    useRealTimers: jest.fn(),
  }) as unknown as ModernFakeTimers;

function makeJestGlobals(overrides: Partial<Stubs> = {}) {
  const fakeTimersModern = makeFakeTimers();
  const logFormattedReferenceError = jest.fn();
  const envGlobals: Partial<EnvironmentGlobals> = {
    describe: 'describe-marker' as never,
    expect: 'expect-marker' as never,
    test: 'test-marker' as never,
  };
  const stubs: Stubs = {
    clearAllMocks: jest.fn(),
    environment: {
      fakeTimers: undefined as unknown as LegacyFakeTimers<unknown>,
      fakeTimersModern,
      global: envGlobals,
    } as unknown as JestEnvironment,
    generateMock: jest.fn() as any,
    isolateModules: jest.fn(),
    isolateModulesAsync: jest.fn() as any,
    logFormattedReferenceError,
    mockState: {
      addOnGenerateMock: jest.fn(),
      deepUnmock: jest.fn(),
      disableAutomock: jest.fn(),
      enableAutomock: jest.fn(),
      markExplicitCjsMock: jest.fn(),
      unmockCjs: jest.fn(),
      unmockEsm: jest.fn(),
    } as unknown as jest.Mocked<MockState>,
    moduleMocker: {
      fn: jest.fn(),
      isMockFunction: jest.fn(),
      mocked: jest.fn(),
      replaceProperty: jest.fn(),
      spyOn: jest.fn(),
    } as unknown as jest.Mocked<ModuleMocker>,
    requireActual: jest.fn() as any,
    requireMock: jest.fn() as any,
    resetAllMocks: jest.fn(),
    resetModules: jest.fn(),
    restoreAllMocks: jest.fn(),
    setMock: jest.fn(),
    setModuleMock: jest.fn(),
    testState: new TestState(logFormattedReferenceError),
    ...overrides,
  };
  const jestGlobals = new JestGlobals({
    clearAllMocks: stubs.clearAllMocks,
    config: makeProjectConfig(),
    environment: stubs.environment,
    generateMock: stubs.generateMock,
    globalConfig: makeGlobalConfig(),
    isolateModules: stubs.isolateModules,
    isolateModulesAsync: stubs.isolateModulesAsync,
    logFormattedReferenceError: stubs.logFormattedReferenceError,
    mockState: stubs.mockState,
    moduleMocker: stubs.moduleMocker,
    requireActual: stubs.requireActual,
    requireMock: stubs.requireMock,
    resetAllMocks: stubs.resetAllMocks,
    resetModules: stubs.resetModules,
    restoreAllMocks: stubs.restoreAllMocks,
    setMock: stubs.setMock,
    setModuleMock: stubs.setModuleMock,
    testState: stubs.testState,
  });
  return {fakeTimersModern, jestGlobals, stubs};
}

describe('JestGlobals.jestObjectFor', () => {
  test('cache hit returns the same instance', () => {
    const {jestGlobals} = makeJestGlobals();
    const a = jestGlobals.jestObjectFor('/a.js');
    const b = jestGlobals.jestObjectFor('/a.js');
    expect(a).toBe(b);
  });

  test('different `from` returns distinct instances', () => {
    const {jestGlobals} = makeJestGlobals();
    expect(jestGlobals.jestObjectFor('/a.js')).not.toBe(
      jestGlobals.jestObjectFor('/b.js'),
    );
  });

  test('clearJestObjectCache evicts the cache', () => {
    const {jestGlobals} = makeJestGlobals();
    const before = jestGlobals.jestObjectFor('/a.js');
    jestGlobals.clearJestObjectCache();
    const after = jestGlobals.jestObjectFor('/a.js');
    expect(after).not.toBe(before);
  });
});

describe('JestGlobals.envGlobals', () => {
  test('returns env-globals from the environment when no override is set', () => {
    const {jestGlobals} = makeJestGlobals();
    const ns = jestGlobals.envGlobals();
    expect(ns.describe).toBe('describe-marker');
    expect(ns.test).toBe('test-marker');
  });

  test('returns the override (defensively copied) when set', () => {
    const {jestGlobals} = makeJestGlobals();
    const override = {
      describe: 'over-describe' as never,
    } as unknown as EnvironmentGlobals;
    jestGlobals.setEnvGlobalsOverride(override);
    const first = jestGlobals.envGlobals();
    expect(first.describe).toBe('over-describe');
    // Mutating the returned object must not affect subsequent reads - the
    // current Runtime contract is `{...this.jestGlobals}` on each access.
    (first as unknown as Record<string, unknown>).describe = 'mutated';
    const second = jestGlobals.envGlobals();
    expect(second.describe).toBe('over-describe');
  });
});

describe('JestGlobals.cjsGlobals', () => {
  test('combines env globals with the per-from jest object', () => {
    const {jestGlobals} = makeJestGlobals();
    const ns = jestGlobals.cjsGlobals('/file.js');
    expect(ns.describe).toBe('describe-marker' as never);
    expect(ns.jest).toBe(jestGlobals.jestObjectFor('/file.js'));
  });
});

describe('JestGlobals.esmGlobalsModule', () => {
  testWithVmEsm('exports env globals + jest as a SyntheticModule', async () => {
    const {jestGlobals} = makeJestGlobals();
    const m = jestGlobals.esmGlobalsModule('/file.mjs', createContext({}));
    await evaluateSyntheticModule(m);
    const ns = m.namespace as Record<string, unknown>;
    expect(ns.describe).toBe('describe-marker');
    expect(ns.jest).toBe(jestGlobals.jestObjectFor('/file.mjs'));
  });
});

describe('JestGlobals - fake-timers state', () => {
  test('useFakeTimers points fakeTimersImpl at the modern impl by default', () => {
    const {fakeTimersModern, jestGlobals} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    jestObj.useFakeTimers();
    expect(fakeTimersModern.useFakeTimers).toHaveBeenCalled();
  });

  test('jest.now() throws when testState reports betweenTests', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    stubs.testState.leaveTestCode();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    expect(() => jestObj.now()).toThrow('outside of the scope of the test');
  });

  test('jest.now() logs and sets exitCode when testState reports tornDown', () => {
    const original = process.exitCode;
    process.exitCode = 0;
    try {
      const {jestGlobals, stubs} = makeJestGlobals();
      stubs.testState.teardown();
      const jestObj = jestGlobals.jestObjectFor('/file.js');
      jestObj.now();
      expect(stubs.logFormattedReferenceError).toHaveBeenCalledWith(
        expect.stringContaining('after it has been torn down'),
      );
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = original;
    }
  });
});

describe('JestGlobals - override-seam bridges', () => {
  test('jest.requireActual delegates to the bridge with the captured `from`', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    stubs.requireActual.mockReturnValue('actual-result' as never);
    expect(jestObj.requireActual('lodash')).toBe('actual-result');
    expect(stubs.requireActual).toHaveBeenCalledWith('/file.js', 'lodash');
  });

  test('jest.requireMock delegates to the bridge with the captured `from`', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    stubs.requireMock.mockReturnValue('mock-result' as never);
    expect(jestObj.requireMock('lodash')).toBe('mock-result');
    expect(stubs.requireMock).toHaveBeenCalledWith('/file.js', 'lodash');
  });

  test('jest.resetModules / clearAllMocks / resetAllMocks / restoreAllMocks delegate to bridges', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    jestObj.resetModules();
    jestObj.clearAllMocks();
    jestObj.resetAllMocks();
    jestObj.restoreAllMocks();
    expect(stubs.resetModules).toHaveBeenCalled();
    expect(stubs.clearAllMocks).toHaveBeenCalled();
    expect(stubs.resetAllMocks).toHaveBeenCalled();
    expect(stubs.restoreAllMocks).toHaveBeenCalled();
  });

  test('jest.isolateModules delegates to the bridge', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    const fn = () => {};
    jestObj.isolateModules(fn);
    expect(stubs.isolateModules).toHaveBeenCalledWith(fn);
  });

  test('jest.createMockFromModule delegates to generateMock with the captured `from`', () => {
    const {jestGlobals, stubs} = makeJestGlobals();
    const jestObj = jestGlobals.jestObjectFor('/file.js');
    stubs.generateMock.mockReturnValue('generated' as never);
    expect(jestObj.createMockFromModule('lodash')).toBe('generated');
    expect(stubs.generateMock).toHaveBeenCalledWith('/file.js', 'lodash');
  });
});
