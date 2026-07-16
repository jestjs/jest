/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {SyntheticModule, Context as VMContext} from 'node:vm';
import type {Jest, JestEnvironment} from '@jest/environment';
import type {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {expect} from '@jest/globals';
import type {Config} from '@jest/types';
import type {ModuleMocker} from 'jest-mock';
import type {MockState} from './MockState';
import type {TestState} from './TestState';
import {syntheticFromExports} from './syntheticBuilders';
import type {EnvironmentGlobals, JestGlobalsWithJest} from './types';

const testTimeoutSymbol = Symbol.for('TEST_TIMEOUT_SYMBOL');
const retryTimesSymbol = Symbol.for('RETRY_TIMES');
const waitBeforeRetrySymbol = Symbol.for('WAIT_BEFORE_RETRY');
const retryImmediatelySymbol = Symbol.for('RETRY_IMMEDIATELY');
const logErrorsBeforeRetrySymbol = Symbol.for('LOG_ERRORS_BEFORE_RETRY');

export interface JestGlobalsOptions {
  config: Config.ProjectConfig;
  globalConfig: Config.GlobalConfig;
  environment: JestEnvironment;
  mockState: MockState;
  moduleMocker: ModuleMocker;
  setMock: (
    from: string,
    moduleName: string,
    mockFactory: () => unknown,
    options?: {virtual?: boolean},
  ) => void;
  setModuleMock: (
    from: string,
    moduleName: string,
    mockFactory: () => Promise<unknown> | unknown,
    options?: {virtual?: boolean},
  ) => void;
  generateMock: <T = unknown>(from: string, moduleName: string) => T;
  requireActual: <T = unknown>(from: string, moduleName: string) => T;
  requireMock: <T = unknown>(from: string, moduleName: string) => T;
  resetModules: () => void;
  isolateModules: (fn: () => void) => void;
  isolateModulesAsync: (fn: () => Promise<void>) => Promise<void>;
  clearAllMocks: () => void;
  resetAllMocks: () => void;
  restoreAllMocks: () => void;
  testState: TestState;
  logFormattedReferenceError: (msg: string) => void;
}

export class JestGlobals {
  private readonly config: Config.ProjectConfig;
  private readonly globalConfig: Config.GlobalConfig;
  private readonly environment: JestEnvironment;
  private readonly mockState: MockState;
  private readonly moduleMocker: ModuleMocker;
  private readonly setMockBridge: JestGlobalsOptions['setMock'];
  private readonly setModuleMockBridge: JestGlobalsOptions['setModuleMock'];
  private readonly generateMock: JestGlobalsOptions['generateMock'];
  private readonly requireActualBridge: JestGlobalsOptions['requireActual'];
  private readonly requireMockBridge: JestGlobalsOptions['requireMock'];
  private readonly resetModulesBridge: () => void;
  private readonly isolateModulesBridge: (fn: () => void) => void;
  private readonly isolateModulesAsyncBridge: (
    fn: () => Promise<void>,
  ) => Promise<void>;
  private readonly clearAllMocksBridge: () => void;
  private readonly resetAllMocksBridge: () => void;
  private readonly restoreAllMocksBridge: () => void;
  private readonly testState: TestState;
  private readonly logFormattedReferenceError: (msg: string) => void;

  private readonly cache = new Map<string, Jest>();
  private fakeTimersImpl: LegacyFakeTimers<unknown> | ModernFakeTimers | null;
  private envGlobalsOverride?: EnvironmentGlobals;
  private cachedEnvGlobals?: EnvironmentGlobals;

  constructor(options: JestGlobalsOptions) {
    this.config = options.config;
    this.globalConfig = options.globalConfig;
    this.environment = options.environment;
    this.mockState = options.mockState;
    this.moduleMocker = options.moduleMocker;
    this.setMockBridge = options.setMock;
    this.setModuleMockBridge = options.setModuleMock;
    this.generateMock = options.generateMock;
    this.requireActualBridge = options.requireActual;
    this.requireMockBridge = options.requireMock;
    this.resetModulesBridge = options.resetModules;
    this.isolateModulesBridge = options.isolateModules;
    this.isolateModulesAsyncBridge = options.isolateModulesAsync;
    this.clearAllMocksBridge = options.clearAllMocks;
    this.resetAllMocksBridge = options.resetAllMocks;
    this.restoreAllMocksBridge = options.restoreAllMocks;
    this.testState = options.testState;
    this.logFormattedReferenceError = options.logFormattedReferenceError;
    this.fakeTimersImpl = this.config.fakeTimers.legacyFakeTimers
      ? this.environment.fakeTimers
      : this.environment.fakeTimersModern;
  }

  jestObjectFor(from: string): Jest {
    const cached = this.cache.get(from);
    if (cached) return cached;
    const fresh = this.buildJestObject(from);
    this.cache.set(from, fresh);
    return fresh;
  }

  envGlobals(): EnvironmentGlobals {
    if (this.envGlobalsOverride) {
      return {...this.envGlobalsOverride};
    }
    let cached = this.cachedEnvGlobals;
    if (cached === undefined) {
      cached = {
        afterAll: this.environment.global.afterAll,
        afterEach: this.environment.global.afterEach,
        beforeAll: this.environment.global.beforeAll,
        beforeEach: this.environment.global.beforeEach,
        describe: this.environment.global.describe,
        expect: this.environment.global.expect as typeof expect,
        fdescribe: this.environment.global.fdescribe,
        fit: this.environment.global.fit,
        it: this.environment.global.it,
        test: this.environment.global.test,
        xdescribe: this.environment.global.xdescribe,
        xit: this.environment.global.xit,
        xtest: this.environment.global.xtest,
      };
      this.cachedEnvGlobals = cached;
    }
    return {...cached};
  }

  cjsGlobals(from: string): JestGlobalsWithJest {
    return {...this.envGlobals(), jest: this.jestObjectFor(from)};
  }

  esmGlobalsModule(from: string, context: VMContext): SyntheticModule {
    return syntheticFromExports(
      '@jest/globals',
      context,
      this.cjsGlobals(from) as unknown as Record<string, unknown>,
    );
  }

  setEnvGlobalsOverride(globals: EnvironmentGlobals): void {
    this.envGlobalsOverride = globals;
  }

  clearJestObjectCache(): void {
    this.cache.clear();
  }

  private buildJestObject(from: string): Jest {
    const disableAutomock = () => {
      this.mockState.disableAutomock();
      return jestObject;
    };
    const enableAutomock = () => {
      this.mockState.enableAutomock();
      return jestObject;
    };
    const unmock = (moduleName: string) => {
      this.mockState.unmockCjs(from, moduleName);
      return jestObject;
    };
    const unmockModule = (moduleName: string) => {
      this.mockState.unmockEsm(from, moduleName);
      return jestObject;
    };
    const deepUnmock = (moduleName: string) => {
      this.mockState.deepUnmock(from, moduleName);
      return jestObject;
    };
    const mock: Jest['mock'] = (moduleName, mockFactory, options) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory, options);
      }
      this.mockState.markExplicitCjsMock(from, moduleName);
      return jestObject;
    };
    const onGenerateMock: Jest['onGenerateMock'] = <T>(
      cb: (moduleName: string, moduleMock: T) => T,
    ) => {
      this.mockState.addOnGenerateMock(cb);
      return jestObject;
    };
    const setMockFactory = (
      moduleName: string,
      mockFactory: () => unknown,
      options?: {virtual?: boolean},
    ) => {
      this.setMockBridge(from, moduleName, mockFactory, options);
      return jestObject;
    };
    const mockModule: Jest['unstable_mockModule'] = (
      moduleName,
      mockFactory,
      options,
    ) => {
      if (typeof mockFactory !== 'function') {
        throw new TypeError(
          '`unstable_mockModule` must be passed a mock factory',
        );
      }

      this.setModuleMockBridge(from, moduleName, mockFactory, options);
      return jestObject;
    };
    const clearAllMocks = () => {
      this.clearAllMocksBridge();
      return jestObject;
    };
    const resetAllMocks = () => {
      this.resetAllMocksBridge();
      return jestObject;
    };
    const restoreAllMocks = () => {
      this.restoreAllMocksBridge();
      return jestObject;
    };
    const _getFakeTimers = () => {
      if (
        this.testState.isTornDown() ||
        !(this.environment.fakeTimers || this.environment.fakeTimersModern)
      ) {
        this.logFormattedReferenceError(
          'You are trying to access a property or method of the Jest environment after it has been torn down.',
        );
        process.exitCode = 1;
      }
      this.testState.throwIfBetweenTests(
        'You are trying to access a property or method of the Jest environment outside of the scope of the test code.',
      );

      return this.fakeTimersImpl!;
    };
    const useFakeTimers: Jest['useFakeTimers'] = fakeTimersConfig => {
      fakeTimersConfig = {
        ...this.config.fakeTimers,
        ...fakeTimersConfig,
      } as Config.FakeTimersConfig;
      if (fakeTimersConfig?.legacyFakeTimers) {
        this.fakeTimersImpl = this.environment.fakeTimers;
      } else {
        this.fakeTimersImpl = this.environment.fakeTimersModern;
      }
      this.fakeTimersImpl!.useFakeTimers(fakeTimersConfig);
      return jestObject;
    };
    const useRealTimers = () => {
      _getFakeTimers().useRealTimers();
      return jestObject;
    };
    const resetModules = () => {
      this.resetModulesBridge();
      return jestObject;
    };
    const isolateModules = (fn: () => void) => {
      this.isolateModulesBridge(fn);
      return jestObject;
    };
    const isolateModulesAsync = this.isolateModulesAsyncBridge;
    const fn = this.moduleMocker.fn.bind(this.moduleMocker);
    const spyOn = this.moduleMocker.spyOn.bind(this.moduleMocker);
    const mocked = this.moduleMocker.mocked.bind(this.moduleMocker);
    const replaceProperty = this.moduleMocker.replaceProperty.bind(
      this.moduleMocker,
    );

    const setTimeout: Jest['setTimeout'] = timeout => {
      this.environment.global[testTimeoutSymbol] = timeout;
      return jestObject;
    };

    const retryTimes: Jest['retryTimes'] = (numTestRetries, options) => {
      this.environment.global[retryTimesSymbol] = numTestRetries;
      this.environment.global[logErrorsBeforeRetrySymbol] =
        options?.logErrorsBeforeRetry;
      this.environment.global[waitBeforeRetrySymbol] = options?.waitBeforeRetry;
      this.environment.global[retryImmediatelySymbol] =
        options?.retryImmediately;

      return jestObject;
    };

    const jestObject: Jest = {
      advanceTimersByTime: msToRun =>
        _getFakeTimers().advanceTimersByTime(msToRun),
      advanceTimersByTimeAsync: async msToRun => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          await fakeTimers.advanceTimersByTimeAsync(msToRun);
        } else {
          throw new TypeError(
            '`jest.advanceTimersByTimeAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      advanceTimersToNextFrame: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          return fakeTimers.advanceTimersToNextFrame();
        }
        throw new TypeError(
          '`jest.advanceTimersToNextFrame()` is not available when using legacy fake timers.',
        );
      },
      advanceTimersToNextTimer: steps =>
        _getFakeTimers().advanceTimersToNextTimer(steps),
      advanceTimersToNextTimerAsync: async steps => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          await fakeTimers.advanceTimersToNextTimerAsync(steps);
        } else {
          throw new TypeError(
            '`jest.advanceTimersToNextTimerAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      autoMockOff: disableAutomock,
      autoMockOn: enableAutomock,
      clearAllMocks,
      clearAllTimers: () => _getFakeTimers().clearAllTimers(),
      createMockFromModule: moduleName => this.generateMock(from, moduleName),
      deepUnmock,
      disableAutomock,
      doMock: mock,
      dontMock: unmock,
      enableAutomock,
      fn,
      getRealSystemTime: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          return fakeTimers.getRealSystemTime();
        } else {
          throw new TypeError(
            '`jest.getRealSystemTime()` is not available when using legacy fake timers.',
          );
        }
      },
      getSeed: () => this.globalConfig.seed,
      getTimerCount: () => _getFakeTimers().getTimerCount(),
      isEnvironmentTornDown: () => this.testState.isTornDown(),
      isMockFunction: this.moduleMocker.isMockFunction,
      isolateModules,
      isolateModulesAsync,
      mock,
      mocked,
      now: () => _getFakeTimers().now(),
      onGenerateMock,
      replaceProperty,
      requireActual: moduleName => this.requireActualBridge(from, moduleName),
      requireMock: moduleName => this.requireMockBridge(from, moduleName),
      resetAllMocks,
      resetModules,
      restoreAllMocks,
      retryTimes,
      runAllImmediates: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimers) {
          fakeTimers.runAllImmediates();
        } else {
          throw new TypeError(
            '`jest.runAllImmediates()` is only available when using legacy fake timers.',
          );
        }
      },
      runAllTicks: () => _getFakeTimers().runAllTicks(),
      runAllTimers: () => _getFakeTimers().runAllTimers(),
      runAllTimersAsync: async () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          await fakeTimers.runAllTimersAsync();
        } else {
          throw new TypeError(
            '`jest.runAllTimersAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      runOnlyPendingTimers: () => _getFakeTimers().runOnlyPendingTimers(),
      runOnlyPendingTimersAsync: async () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          await fakeTimers.runOnlyPendingTimersAsync();
        } else {
          throw new TypeError(
            '`jest.runOnlyPendingTimersAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      setMock: (moduleName, mock) => setMockFactory(moduleName, () => mock),
      setSystemTime: now => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this.environment.fakeTimersModern) {
          fakeTimers.setSystemTime(now);
        } else {
          throw new TypeError(
            '`jest.setSystemTime()` is not available when using legacy fake timers.',
          );
        }
      },
      setTimeout,
      setTimerTickMode: (
        mode:
          | {mode: 'manual' | 'nextAsync'}
          | {mode: 'interval'; delta?: number},
      ) => {
        const fakeTimers = _getFakeTimers();
        if (fakeTimers === this.environment.fakeTimersModern) {
          fakeTimers.setTimerTickMode(mode);
        } else {
          throw new TypeError(
            '`jest.setTimerTickMode()` is not available when using legacy fake timers.',
          );
        }
        return jestObject;
      },
      spyOn,
      unmock,
      unstable_mockModule: mockModule,
      unstable_unmockModule: unmockModule,
      useFakeTimers,
      useRealTimers,
    };
    return jestObject;
  }
}
