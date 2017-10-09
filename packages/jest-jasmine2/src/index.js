/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Environment} from 'types/Environment';
import type {GlobalConfig, ProjectConfig} from 'types/Config';
import type {SnapshotState} from 'jest-snapshot';
import type {TestResult} from 'types/TestResult';
// eslint-disable-next-line import/no-extraneous-dependencies
import type Runtime from 'jest-runtime';

import path from 'path';
import fs from 'fs';
import JasmineReporter from './reporter';
import {install as jasmineAsyncInstall} from './jasmine_async';

const JASMINE = require.resolve('./jasmine/jasmine_light.js');

async function jasmine2(
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  environment: Environment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const reporter = new JasmineReporter(
    globalConfig,
    config,
    environment,
    testPath,
  );
  const jasmineFactory = runtime.requireInternalModule(JASMINE);
  const jasmine = jasmineFactory.create({
    testPath,
  });

  const env = jasmine.getEnv();
  const jasmineInterface = jasmineFactory.interface(jasmine, env);
  Object.assign(environment.global, jasmineInterface);
  env.addReporter(jasmineInterface.jsApiReporter);

  jasmineAsyncInstall(environment.global);

  environment.global.test = environment.global.it;
  environment.global.it.only = environment.global.fit;
  environment.global.it.skip = environment.global.xit;
  environment.global.xtest = environment.global.xit;
  environment.global.describe.skip = environment.global.xdescribe;
  environment.global.describe.only = environment.global.fdescribe;

  if (config.timers === 'fake') {
    environment.fakeTimers.useFakeTimers();
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

      if (config.timers === 'fake') {
        environment.fakeTimers.useFakeTimers();
      }
    }
  });

  env.addReporter(reporter);

  runtime
    .requireInternalModule(path.resolve(__dirname, './jest_expect.js'))
    .default({
      expand: globalConfig.expand,
    });

  const snapshotState: SnapshotState = runtime
    .requireInternalModule(path.resolve(__dirname, './setup_jest_globals.js'))
    .default({
      config,
      globalConfig,
      localRequire: runtime.requireModule.bind(runtime),
      testPath,
    });

  if (config.setupTestFrameworkScriptFile) {
    runtime.requireModule(config.setupTestFrameworkScriptFile);
  }

  runtime
    .requireModule(require.resolve('source-map-support'), 'source-map-support')
    .install({
      handleUncaughtExceptions: false,
      retrieveSourceMap: source => {
        if (runtime._sourceMapRegistry[source]) {
          try {
            return {
              map: JSON.parse(
                fs.readFileSync(runtime._sourceMapRegistry[source]),
              ),
              url: source,
            };
          } catch (e) {}
        }
        return null;
      },
    });

  if (globalConfig.testNamePattern) {
    const testNameRegex = new RegExp(globalConfig.testNamePattern, 'i');
    env.specFilter = spec => testNameRegex.test(spec.getFullName());
  }

  runtime.requireModule(testPath);
  await env.execute();
  return reporter
    .getResults()
    .then(results => addSnapshotData(results, snapshotState));
}

const addSnapshotData = (results, snapshotState) => {
  results.testResults.forEach(({fullName, status}) => {
    if (status === 'pending' || status === 'failed') {
      // if test is skipped or failed, we don't want to mark
      // its snapshots as obsolete.
      snapshotState.markSnapshotsAsCheckedForTest(fullName);
    }
  });

  const uncheckedCount = snapshotState.getUncheckedCount();
  if (uncheckedCount) {
    snapshotState.removeUncheckedKeys();
  }

  const status = snapshotState.save();
  results.snapshot.fileDeleted = status.deleted;
  results.snapshot.added = snapshotState.added;
  results.snapshot.matched = snapshotState.matched;
  results.snapshot.unmatched = snapshotState.unmatched;
  results.snapshot.updated = snapshotState.updated;
  results.snapshot.unchecked = !status.deleted ? uncheckedCount : 0;
  return results;
};

module.exports = jasmine2;
