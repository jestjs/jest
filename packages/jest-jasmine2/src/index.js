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
import type {ModuleLoader} from 'types/ModuleLoader';
import type {TestResult} from 'types/TestResult';

const fs = require('graceful-fs');
const jasminePit = require('./jasmine-pit');
const snapshot = require('jest-snapshot');
const JasmineReporter = require('./reporter');

const CALL_PRINT_LIMIT = 3;
const LAST_CALL_PRINT_LIMIT = 1;
const JASMINE_PATH = require.resolve('../vendor/jasmine-2.4.1.js');
const jasmineFileContent =
  fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');

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
      call => reporter.getFormatter().prettyPrint(call)
    ).reverse().join(',\n') +
    (count > 0
      ? `\nand ${count} other call${count === 1 ? '' : 's'}.` : ''
    )
  );
}

function jasmine2(
  config: Config,
  environment: Environment,
  moduleLoader: ModuleLoader,
  testPath: string
): Promise<TestResult> {
  let env;
  let jasmine;

  const reporter = new JasmineReporter(config, environment);
  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  // To account for this conflict, we set up jasmine in an environment with real
  // timers (instead of mock timers).
  environment.fakeTimers.runWithRealTimers(() => {
    environment.runSourceText(jasmineFileContent, JASMINE_PATH);

    const requireJasmine = environment.global.jasmineRequire;
    jasmine = requireJasmine.core(requireJasmine);

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

    env = jasmine.getEnv();
    env.snapshotState = snapshot.getSnapshotState(jasmine, testPath);

    const jasmineInterface = requireJasmine.interface(jasmine, env);
    Object.assign(environment.global, jasmineInterface);
    env.addReporter(jasmineInterface.jsApiReporter);

    jasminePit.install(environment.global);

    // Jasmine-check must be installed from within the vm context because
    // testcheck is compiled Clojurescript and is very delicate.
    environment.global.jasmine.testcheckOptions = config.testcheckOptions;
    moduleLoader.requireModule(require.resolve('./jasmine-check-install'));
    delete environment.global.jasmine.testcheckOptions;

    if (config.setupTestFrameworkScriptFile) {
      moduleLoader.requireModule(config.setupTestFrameworkScriptFile);
    }
  });

  if (!jasmine || !env) {
    throw new Error('jasmine2 could not be initialized by Jest');
  }

  const hasIterator = object => !!(object != null && object[Symbol.iterator]);
  const iterableEquality = (a, b) => {
    if (
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      Array.isArray(a) ||
      Array.isArray(b) ||
      !hasIterator(a) ||
      !hasIterator(b)
    ) {
      return undefined;
    }
    if (a.constructor !== b.constructor) {
      return false;
    }
    const bIterator = b[Symbol.iterator]();

    for (const aValue of a) {
      const nextB = bIterator.next();
      if (
        nextB.done ||
        !jasmine.matchersUtil.equals(
          aValue,
          nextB.value,
          [iterableEquality]
        )
      ) {
        return false;
      }
    }
    if (!bIterator.next().done) {
      return false;
    }
    return true;
  };

  env.beforeEach(() => {
    jasmine.addCustomEqualityTester(iterableEquality);
    jasmine.addMatchers(
      snapshot.getMatchers(
        testPath,
        config,
        jasmine,
        env.snapshotState
      )
    );

    jasmine.addMatchers({
      toBeCalled: () => ({
        compare: (actual, expected) => {
          if (expected) {
            throw Error(
              'toBeCalled() does not accept parameters, use ' +
              'toBeCalledWith instead.'
            );
          }
          const isSpy = isSpyLike(actual);
          if (!isSpy && !isMockLike(actual)) {
            throw Error(
              'toBeCalled() should be used on a mock function or ' +
              'a jasmine spy.'
            );
          }
          const calls = isSpy
            ? actual.calls.all().map(x => x.args)
            : actual.mock.calls;
          const pass = calls.length !== 0;
          const message = (
            pass ?
            'Expected not to be called' :
            'Expected to be called at least once'
          );
          return {
            pass,
            message,
          };
        },
      }),

      lastCalledWith: util => ({
        compare(actual) {
          const isSpy = isSpyLike(actual);
          if (!isSpy && !isMockLike(actual)) {
            throw Error(
              'lastCalledWith() should be used on a mock function or ' +
              'a jasmine spy.'
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
              'a jasmine spy.'
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

    if (!config.persistModuleRegistryBetweenSpecs) {
      moduleLoader.resetModuleRegistry();
    }
  });

  env.addReporter(reporter);
  moduleLoader.requireModule(testPath);
  env.execute();
  return reporter.getResults().then(results => {
    const currentSnapshot = env.snapshotState.snapshot;
    const updateSnapshot = config.updateSnapshot;
    const hasUncheckedKeys = currentSnapshot.hasUncheckedKeys();
    if (updateSnapshot) {
      currentSnapshot.removeUncheckedKeys();
    }
    const status = currentSnapshot.save(updateSnapshot);

    results.hasUncheckedKeys = !status.deleted && hasUncheckedKeys;
    results.snapshotFileDeleted = status.deleted;
    results.snapshotsAdded = env.snapshotState.added;
    results.snapshotsMatched = env.snapshotState.matched;
    results.snapshotsUnmatched = env.snapshotState.unmatched;
    results.snapshotsUpdated = env.snapshotState.updated;
    return results;
  });
}

module.exports = jasmine2;
