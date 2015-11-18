/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('graceful-fs');
var jasminePit = require('../../vendor/jasmine-pit/jasmine-pit');
var JasmineReporter = require('./Jasmine2Reporter');
var path = require('path');

var JASMINE_PATH = require.resolve('../../vendor/jasmine/jasmine-2.3.4.js');
var JASMINE_BOOT_PATH =
  require.resolve('../../vendor/jasmine/jasmine-2.x-boot.js');
var jasmineFileContent =
  fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');
var jasmineBootFileContent =
  fs.readFileSync(require.resolve(JASMINE_BOOT_PATH), 'utf8');

function jasmineTestRunner(config, environment, moduleLoader, testPath) {
  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  //
  // To account for this conflict, we set up jasmine in an environment with real
  // timers (instead of mock timers).
  environment.fakeTimers.runWithRealTimers(function() {
    // Execute jasmine's main code
    environment.runSourceText(jasmineFileContent, JASMINE_PATH);
    environment.runSourceText(jasmineBootFileContent, JASMINE_BOOT_PATH);

    // Install jasmine-pit -- because it's amazing
    jasminePit.install(environment.global);

    // compareobjects with WeakMap override not needed for jasmine2,
    // see: https://github.com/jasmine/jasmine/issues/508
  });

  var jasmine = environment.global.jasmine;

  jasmine.getEnv().beforeEach(function() {
    jasmine.addMatchers({

      toBeCalled: function(/* util, customEqualityTesters */) {
        return {
          compare: function(actual/*, expected */) {

            if (actual.mock === undefined) {
              throw Error('toBeCalled() should be used on a mock function');
            }

            return {
              pass: actual.mock.calls.length !== 0,
            };
          },
        };
      },

      lastCalledWith: function(util/*, customEqualityTesters */) {
        return {
          compare: function(actual) {

            if (actual.mock === undefined) {
              throw Error('lastCalledWith() should be used on a mock function');
            }

            var calls = actual.mock.calls;
            var args = Array.prototype.slice.call(arguments, 1);

            return {
              pass: util.equals(calls[calls.length - 1], args),
            };

          },
        };
      },

      toBeCalledWith: function(util/*, customEqualityTesters */) {
        return {
          compare: function(actual) {
            if (actual.mock === undefined) {
              throw Error('toBeCalledWith() should be used on a mock function');
            }

            var calls = actual.mock.calls;
            var args = Array.prototype.slice.call(arguments, 1);

            var passed = calls.some(function(call) {
              return util.equals(call, args);
            }, this);

            return {
              pass: passed,
            };
          },
        };
      },
    });

    if (!config.persistModuleRegistryBetweenSpecs) {
      moduleLoader.getJestRuntime().resetModuleRegistry();
    }
  });

  var jasmineReporter = new JasmineReporter({
    noHighlight: config.noHighlight,
    noStackTrace: config.noStackTrace,
  });
  jasmine.getEnv().addReporter(jasmineReporter);

  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));

  jasmine.getEnv().execute();
  return jasmineReporter.getResults();
}

module.exports = jasmineTestRunner;
