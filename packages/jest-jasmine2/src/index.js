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
import type Runtime from '../../jest-runtime/src';

const JasmineReporter = require('./reporter');

const jasmineAsync = require('./jasmine-async');
const snapshot = require('jest-snapshot');
const fs = require('graceful-fs');
const path = require('path');
const vm = require('vm');

const CALL_PRINT_LIMIT = 3;
const LAST_CALL_PRINT_LIMIT = 1;
const JASMINE_PATH = require.resolve('../vendor/jasmine-2.4.1.js');
const JASMINE_CHECK_PATH = require.resolve('./jasmine-check');

const jasmineScript = new vm.Script(fs.readFileSync(JASMINE_PATH, 'utf8'), {
  displayErrors: true,
  filename: JASMINE_PATH,
});

function isSpyLike(test) {
  return test.calls && test.calls.all !== undefined;
}

function isMockLike(test) {
  return test.mock !== undefined;
}

function getActualCalls(reporter, calls, limit) {
  const count = calls.length - limit;
  return (
    `\nActual call${calls.length === 1 ? '' : 's'}:\n` +
    calls.slice(-limit).map(
      call => reporter.getFormatter().prettyPrint(call),
    ).reverse().join(',\n') +
    (count > 0
      ? `\nand ${count} other call${count === 1 ? '' : 's'}.` : ''
    )
  );
}

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

  const jasmineBuildExpectationResult = jasmine.buildExpectationResult;

  // https://github.com/facebook/jest/issues/429
  jasmine.buildExpectationResult = function(options) {
    if (!options.passed) {
      function shallowCopy(object) {
        if (
          typeof object !== 'object' ||
          object === null || (
            environment.global.Node &&
            object instanceof environment.global.Node &&
            object.nodeType > 0
          )
        ) {
          return object;
        }
        return jasmine.util.clone(object);
      }
      options.expected = shallowCopy(options.expected);
      options.actual = shallowCopy(options.actual);
    }

    return jasmineBuildExpectationResult.apply(jasmine, arguments);
  };

  const env = jasmine.getEnv();
  const jasmineInterface = requireJasmine.interface(jasmine, env);
  Object.assign(environment.global, jasmineInterface);
  env.addReporter(jasmineInterface.jsApiReporter);

  jasmineAsync.install(environment.global);
  environment.global.test = environment.global.it;

  if (config.setupTestFrameworkScriptFile) {
    runtime.requireModule(config.setupTestFrameworkScriptFile);
  }

  if (!jasmine || !env) {
    throw new Error('jasmine2 could not be initialized by Jest');
  }

  runtime.setMock(
    '',
    'jest-check',
    () => {
      const jasmineCheck = runtime.requireInternalModule(JASMINE_CHECK_PATH);
      return jasmineCheck(environment.global, config.testcheckOptions);
    },
    {virtual: true},
  );

  env.beforeEach(() => {
    jasmine.addMatchers({
      toMatchSnapshot: snapshot.matcher(
        testPath,
        config,
        snapshotState,
      ),
    });

    jasmine.addMatchers({
      lastCalledWith: util => ({
        compare(actual) {
          const isSpy = isSpyLike(actual);
          if (!isSpy && !isMockLike(actual)) {
            throw Error(
              'lastCalledWith() should be used on a mock function or ' +
              'a jasmine spy.',
            );
          }
          const calls = isSpy
            ? actual.calls.all().map(x => x.args)
            : actual.mock.calls;
          const expected = Array.prototype.slice.call(arguments, 1);
          const pass = util.equals(calls[calls.length - 1], expected);
          if (!pass) {
            return {
              pass,
              // $FlowFixMe - get/set properties not yet supported
              get message() {
                return (
                  `Wasn't last called with the expected values.\n` +
                  'Expected call:\n' +
                  reporter.getFormatter().prettyPrint(expected) +
                  getActualCalls(reporter, calls, LAST_CALL_PRINT_LIMIT)
                );
              },
            };
          }
          return {
            pass,
            // $FlowFixMe - get/set properties not yet supported
            get message() {
              return (
                `Shouldn't have been last called with\n` +
                reporter.getFormatter().prettyPrint(expected)
              );
            },
          };

        },
      }),

      toBeCalledWith: util => ({
        compare(actual) {
          const isSpy = isSpyLike(actual);
          if (!isMockLike(actual) && !isSpy) {
            throw Error(
              'toBeCalledWith() should be used on a mock function or ' +
              'a jasmine spy.',
            );
          }
          const calls = isSpy
            ? actual.calls.all().map(x => x.args)
            : actual.mock.calls;
          const expected = Array.prototype.slice.call(arguments, 1);
          const pass = calls.some(call => util.equals(call, expected));
          if (!pass) {
            return {
              pass,
              // $FlowFixMe - get/set properties not yet supported
              get message() {
                return (
                  'Was not called with the expected values.\n' +
                  'Expected call:\n' +
                  reporter.getFormatter().prettyPrint(expected) +
                  getActualCalls(reporter, calls, CALL_PRINT_LIMIT)
                );
              },
            };
          }
          return {
            pass,
            // $FlowFixMe - get/set properties not yet supported
            get message() {
              return (
                `Shouldn't have been called with\n` +
                reporter.getFormatter().prettyPrint(expected)
              );
            },
          };
        },
      }),
    });

    if (config.resetModules) {
      runtime.resetModules();
    }
  });

  const snapshotState = snapshot.getSnapshotState(jasmine, testPath);

  env.addReporter(reporter);

  // `jest-matchers` should be required inside test environment (vm).
  // Otherwise if they throw, the `Error` class will differ from the `Error`
  // class of the test and `error instanceof Error` will return `false`.
  runtime.requireInternalModule(
    path.resolve(__dirname, './extendJasmineExpect.js'),
  );

  if (config.timers === 'fake') {
    environment.fakeTimers.useFakeTimers();
  }

  runtime.requireModule(testPath);
  env.execute();
  return reporter.getResults().then(results => {
    const currentSnapshot = snapshotState.snapshot;
    const updateSnapshot = config.updateSnapshot;
    const uncheckedCount = currentSnapshot.getUncheckedCount();
    if (updateSnapshot) {
      currentSnapshot.removeUncheckedKeys();
    }
    const status = currentSnapshot.save(updateSnapshot);

    results.snapshot.fileDeleted = status.deleted;
    results.snapshot.added = snapshotState.added;
    results.snapshot.matched = snapshotState.matched;
    results.snapshot.unmatched = snapshotState.unmatched;
    results.snapshot.updated = snapshotState.updated;
    results.snapshot.unchecked = !status.deleted ? uncheckedCount : 0;
    return results;
  });
}

module.exports = jasmine2;
