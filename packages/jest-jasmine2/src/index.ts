/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {JestEnvironment} from '@jest/environment';
import {getCallsite} from '@jest/source-map';
import type {TestResult} from '@jest/test-result';
import type {Config, Global} from '@jest/types';
import type Runtime from 'jest-runtime';
import type {SnapshotState} from 'jest-snapshot';
import {ErrorWithStack} from 'jest-util';
import installEach from './each';
import {installErrorOnPrivate} from './errorOnPrivate';
import type Spec from './jasmine/Spec';
import jasmineAsyncInstall from './jasmineAsyncInstall';
import JasmineReporter from './reporter';

export type {Jasmine} from './types';

const JASMINE = require.resolve('./jasmine/jasmineLight');

const jestEachBuildDir = path.dirname(require.resolve('jest-each'));

export default async function jasmine2(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const reporter = new JasmineReporter(globalConfig, config, testPath);
  const jasmineFactory =
    runtime.requireInternalModule<typeof import('./jasmine/jasmineLight')>(
      JASMINE,
    );
  const jasmine = jasmineFactory.create({
    process,
    testPath,
    testTimeout: globalConfig.testTimeout,
  });

  const env = jasmine.getEnv();
  const jasmineInterface = jasmineFactory._interface(jasmine, env);
  Object.assign(environment.global, jasmineInterface);
  env.addReporter(jasmineInterface.jsApiReporter);

  // TODO: Remove config option if V8 exposes some way of getting location of caller
  // in a future version
  if (config.testLocationInResults === true) {
    function wrapIt<T extends Global.ItBase>(original: T): T {
      const wrapped = (
        testName: Global.TestName,
        fn: Global.TestFn,
        timeout?: number,
      ) => {
        const sourcemaps = runtime.getSourceMaps();
        let stack = getCallsite(1, sourcemaps);
        const it = original(testName, fn, timeout);

        if (stack.getFileName()?.startsWith(jestEachBuildDir)) {
          stack = getCallsite(2, sourcemaps);
        }
        // @ts-expect-error: `it` is `void` for some reason
        it.result.__callsite = stack;

        return it;
      };
      return wrapped as any as T;
    }

    environment.global.it = wrapIt(environment.global.it);
    environment.global.xit = wrapIt(environment.global.xit);
    environment.global.fit = wrapIt(environment.global.fit);
  }

  jasmineAsyncInstall(globalConfig, environment.global);

  installEach(environment);

  const failing = () => {
    throw new ErrorWithStack(
      'Jest: `failing` tests are only supported in `jest-circus`.',
      failing,
    );
  };

  failing.each = () => {
    throw new ErrorWithStack(
      'Jest: `failing` tests are only supported in `jest-circus`.',
      failing.each,
    );
  };

  environment.global.it.failing = failing;
  environment.global.fit.failing = failing;
  environment.global.xit.failing = failing;

  environment.global.test = environment.global.it;
  environment.global.it.only = environment.global.fit;
  environment.global.it.todo = env.todo;
  environment.global.it.skip = environment.global.xit;
  environment.global.xtest = environment.global.xit;
  environment.global.describe.skip = environment.global.xdescribe;
  environment.global.describe.only = environment.global.fdescribe;

  if (config.fakeTimers.enableGlobally) {
    if (config.fakeTimers.legacyFakeTimers) {
      environment.fakeTimers!.useFakeTimers();
    } else {
      environment.fakeTimersModern!.useFakeTimers();
    }
  }

  env.beforeEach(() => {
    if (config.resetModules) {
      runtime.resetModules();
    }

    if (config.clearMocks) {
      runtime.clearAllMocks();
    }

    if (config.resetMocks) {
      runtime.resetAllMocks();

      if (
        config.fakeTimers.enableGlobally &&
        config.fakeTimers.legacyFakeTimers
      ) {
        environment.fakeTimers!.useFakeTimers();
      }
    }

    if (config.restoreMocks) {
      runtime.restoreAllMocks();
    }
  });

  env.addReporter(reporter);

  runtime
    .requireInternalModule<
      typeof import('./jestExpect')
    >(require.resolve('./jestExpect.js'))
    .default({expand: globalConfig.expand});

  if (globalConfig.errorOnDeprecated) {
    installErrorOnPrivate(environment.global);
  } else {
    Object.defineProperty(jasmine, 'DEFAULT_TIMEOUT_INTERVAL', {
      configurable: true,
      enumerable: true,
      get() {
        return this._DEFAULT_TIMEOUT_INTERVAL;
      },
      set(value) {
        this._DEFAULT_TIMEOUT_INTERVAL = value;
      },
    });
  }

  const snapshotState: SnapshotState = await runtime
    .requireInternalModule<
      typeof import('./setup_jest_globals')
    >(require.resolve('./setup_jest_globals.js'))
    .default({
      config,
      globalConfig,
      localRequire: runtime.requireModule.bind(runtime),
      testPath,
    });

  for (const path of config.setupFilesAfterEnv) {
    const esm = runtime.unstable_shouldLoadAsEsm(path);

    if (esm) {
      await runtime.unstable_importModule(path);
    } else {
      const setupFile = runtime.requireModule(path);
      if (typeof setupFile === 'function') {
        await setupFile();
      }
    }
  }

  if (globalConfig.testNamePattern) {
    const testNameRegex = new RegExp(globalConfig.testNamePattern, 'i');
    env.specFilter = (spec: Spec) => testNameRegex.test(spec.getFullName());
  }
  const esm = runtime.unstable_shouldLoadAsEsm(testPath);

  if (esm) {
    await runtime.unstable_importModule(testPath);
  } else {
    runtime.requireModule(testPath);
  }

  await env.execute();

  const results = await reporter.getResults();

  return addSnapshotData(results, snapshotState);
}

const addSnapshotData = (results: TestResult, snapshotState: SnapshotState) => {
  for (const {fullName, status} of results.testResults) {
    if (status === 'pending' || status === 'failed') {
      // if test is skipped or failed, we don't want to mark
      // its snapshots as obsolete.
      snapshotState.markSnapshotsAsCheckedForTest(fullName);
    }
  }

  const uncheckedCount = snapshotState.getUncheckedCount();
  const uncheckedKeys = snapshotState.getUncheckedKeys();

  if (uncheckedCount) {
    snapshotState.removeUncheckedKeys();
  }

  const status = snapshotState.save();
  results.snapshot.fileDeleted = status.deleted;
  results.snapshot.added = snapshotState.added;
  results.snapshot.matched = snapshotState.matched;
  results.snapshot.unmatched = snapshotState.unmatched;
  results.snapshot.updated = snapshotState.updated;
  results.snapshot.unchecked = status.deleted ? 0 : uncheckedCount;
  // Copy the array to prevent memory leaks
  results.snapshot.uncheckedKeys = [...uncheckedKeys];

  return results;
};
