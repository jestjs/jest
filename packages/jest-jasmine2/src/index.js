/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('graceful-fs');
const jasminePit = require('jest-util/lib/jasmine-pit');
const JasmineReporter = require('./reporter');
const path = require('path');

const JASMINE_PATH = require.resolve('../vendor/jasmine-2.3.4.js');
const jasmineFileContent =
  fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');

function isSpyLike(test) {
  return test.calls && test.calls.all !== undefined;
}
function isMockLike(test) {
  return test.mock !== undefined;
}

function jasmine2(config, environment, moduleLoader, testPath) {
  let env;
  let jasmine;
  const reporter = new JasmineReporter({
    noHighlight: config.noHighlight,
    noStackTrace: config.noStackTrace,
  });
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
        function shallowCopy(obj) {
          return typeof obj !== 'object' || obj === null
            ? obj : jasmine.util.clone(obj);
        }

        options.expected = shallowCopy(options.expected);
        options.actual = shallowCopy(options.actual);
      }

      return jasmineBuildExpectationResult.apply(jasmine, arguments);
    };

    env = jasmine.getEnv();
    const jasmineInterface = requireJasmine.interface(jasmine, env);
    Object.assign(environment.global, jasmineInterface);
    env.addReporter(jasmineInterface.jsApiReporter);

    jasminePit.install(environment.global);

    if (config.setupTestFrameworkScriptFile) {
      moduleLoader.requireModule(null, config.setupTestFrameworkScriptFile);
    }
  });
  env.beforeEach(() => {
    jasmine.addMatchers({
      toBeCalled: () => ({
        compare: (actual, expected) => {
          if (expected) {
            throw Error(
              'toBeCalled() does not accept parameters, use ' +
              'toBeCalledWith instead'
            );
          }
          const isSpy = isSpyLike(actual);
          if (!isSpy && !isMockLike(actual)) {
            throw Error(
              'toBeCalled() should be used on a mock function or ' +
              'a jasmine spy'
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
              'a jasmine spy'
            );
          }
          const calls = isSpy
            ? actual.calls.all().map(x => x.args)
            : actual.mock.calls;
          const expected = Array.prototype.slice.call(arguments, 1);
          const actualValues = calls[calls.length - 1];
          const pass = util.equals(actualValues, expected);
          if (!pass) {
            return {
              pass,
              get message() {
                return (
                  `Wasn't called with the expected values.\n` +
                  'Expected:\n' +
                  reporter.getFormatter().prettyPrint(expected) +
                  '\nActual:\n' +
                  reporter.getFormatter().prettyPrint(actualValues)
                );
              },
            };
          }
          return {
            pass,
            get message() {
              return (
                `Shouldn't have been called with\n` +
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
              'a jasmine spy'
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
              get message() {
                return (
                  'Was never called with the expected values.\n' +
                  'Expected:\n' +
                  reporter.getFormatter().prettyPrint(expected)
                );
              },
            };
          }
          return {
            pass,
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
  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));
  env.execute();
  return reporter.getResults();
}

module.exports = jasmine2;
