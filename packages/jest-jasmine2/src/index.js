/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

import type {Config} from 'types/Config';
import type {Environment} from 'types/Environment';
import type {TestResult} from 'types/TestResult';
import type Runtime from 'jest-runtime';

const JasmineReporter = require('./reporter');

const jasmineAsync = require('./jasmine-async');
const fs = require('graceful-fs');
const path = require('path');
const vm = require('vm');

const JASMINE_PATH = require.resolve('../vendor/jasmine-2.5.2.js');

const jasmineScript = new vm.Script(fs.readFileSync(JASMINE_PATH, 'utf8'), {
  displayErrors: true,
  filename: JASMINE_PATH,
});

function jasmine2(
  config: Config,
  environment: Environment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const reporter = new JasmineReporter(config, environment, testPath);
  environment.runScript(jasmineScript);

  const requireJasmine = environment.global.jasmineRequire;
  const jasmine = requireJasmine.core(requireJasmine);

  const env = jasmine.getEnv();
  const jasmineInterface = requireJasmine.interface(jasmine, env);
  Object.assign(environment.global, jasmineInterface);
  env.addReporter(jasmineInterface.jsApiReporter);

  jasmineAsync.install(environment.global);

  environment.global.test = environment.global.it;
  environment.global.it.only = environment.global.fit;
  environment.global.it.skip = environment.global.xit;
  environment.global.xtest = environment.global.xit;
  environment.global.describe.skip = environment.global.xdescribe;
  environment.global.describe.only = environment.global.fdescribe;

  env.beforeEach(() => {
    if (config.resetModules) {
      runtime.resetModules();
    }

    if (config.clearMocks) {
      runtime.clearAllMocks();
    }

    if (config.resetMocks) {
      runtime.resetAllMocks();
    }
  });

  env.addReporter(reporter);

  runtime.requireInternalModule(
    path.resolve(__dirname, './jest-expect.js'),
  )(config);

  const snapshotState = runtime.requireInternalModule(
    path.resolve(__dirname, './setup-jest-globals.js'),
  )({config, testPath});

  if (config.setupTestFrameworkScriptFile) {
    runtime.requireModule(config.setupTestFrameworkScriptFile);
  }

  if (config.timers === 'fake') {
    environment.fakeTimers.useFakeTimers();
  }

  if (config.testNamePattern) {
    const testNameRegex = new RegExp(config.testNamePattern);
    env.specFilter = spec => testNameRegex.test(spec.getFullName());
  }

  runtime.requireModule(testPath);
  env.execute();
  return reporter
    .getResults()
    .then(results => addSnapshotData(results, config, snapshotState));
}

const addSnapshotData = (results, config, snapshotState) => {
  results.testResults.forEach(({fullName, status}) => {
    if (status === 'pending' || status === 'failed') {
      // if test is skipped or failed, we don't want to mark
      // its snapshots as obsolete.
      snapshotState.markSnapshotsAsCheckedForTest(fullName);
    }
  });

  const updateSnapshot = config.updateSnapshot;
  const uncheckedCount = snapshotState.getUncheckedCount();
  if (updateSnapshot) {
    snapshotState.removeUncheckedKeys();
  }
  const status = snapshotState.save(updateSnapshot);

  results.snapshot.fileDeleted = status.deleted;
  results.snapshot.added = snapshotState.added;
  results.snapshot.matched = snapshotState.matched;
  results.snapshot.unmatched = snapshotState.unmatched;
  results.snapshot.updated = snapshotState.updated;
  results.snapshot.unchecked = !status.deleted ? uncheckedCount : 0;
  return results;
};

module.exports = jasmine2;
