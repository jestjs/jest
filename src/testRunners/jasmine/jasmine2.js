/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const VENDOR_PATH = '../../../vendor/';
const JASMINE_PATH = require.resolve(VENDOR_PATH + '/jasmine/jasmine-2.3.4.js');

const fs = require('graceful-fs');
const jasminePit = require(VENDOR_PATH + '/jasmine-pit/jasmine-pit');
const JasmineReporter = require('./Jasmine2Reporter');
const path = require('path');

const jasmineFileContent =
  fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');

function jasmine2(config, environment, moduleLoader, testPath) {
  let env;
  let jasmine;

  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  // To account for this conflict, we set up jasmine in an environment with real
  // timers (instead of mock timers).
  environment.fakeTimers.runWithRealTimers(() => {
    environment.runSourceText(jasmineFileContent, JASMINE_PATH);

    const requireJasmine = environment.global.jasmineRequire;
    jasmine = requireJasmine.core(requireJasmine);
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
      toBeCalled: (/* util, customEqualityTesters */) => {
        return {
          compare: (actual/*, expected */) => {
            if (actual.mock === undefined) {
              throw Error('toBeCalled() should be used on a mock function');
            }
            return {
              pass: actual.mock.calls.length !== 0,
            };
          },
        };
      },

      lastCalledWith: (util/*, customEqualityTesters */) => {
        return {
          compare: function(actual) {
            if (actual.mock === undefined) {
              throw Error('lastCalledWith() should be used on a mock function');
            }
            const calls = actual.mock.calls;
            const args = Array.prototype.slice.call(arguments, 1);
            return {
              pass: util.equals(calls[calls.length - 1], args),
            };

          },
        };
      },

      toBeCalledWith: (util/*, customEqualityTesters */) => {
        return {
          compare: function(actual) {
            if (actual.mock === undefined) {
              throw Error('toBeCalledWith() should be used on a mock function');
            }
            const calls = actual.mock.calls;
            const args = Array.prototype.slice.call(arguments, 1);
            const pass = calls.some(call => util.equals(call, args));
            return {pass};
          },
        };
      },
    });

    if (!config.persistModuleRegistryBetweenSpecs) {
      moduleLoader.resetModuleRegistry();
    }
  });

  const reporter = new JasmineReporter({
    noHighlight: config.noHighlight,
    noStackTrace: config.noStackTrace,
  });
  env.addReporter(reporter);
  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));
  env.execute();
  return reporter.getResults();
}

module.exports = jasmine2;
