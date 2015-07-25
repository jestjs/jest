/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('graceful-fs');
var jasminePit = require('jasmine-pit');
var JasmineReporter = require('./JasmineReporter');
var envSetup = require('./environment.js');
var path = require('path');

var JASMINE_PATH = require.resolve('../../vendor/jasmine/jasmine-1.3.0');
var jasmineFileContent =
  fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');

var JASMINE_ONLY_ROOT = path.dirname(require.resolve('jasmine-only'));
var POTENTIALLY_PRECOMPILED_FILE = path.join(
  JASMINE_ONLY_ROOT,
  'app',
  'js',
  'jasmine_only.js'
);
var COFFEE_SCRIPT_FILE = path.join(
  JASMINE_ONLY_ROOT,
  'app',
  'js',
  'jasmine_only.coffee'
);

var jasmineOnlyContent =
  fs.existsSync(POTENTIALLY_PRECOMPILED_FILE)
  ? fs.readFileSync(POTENTIALLY_PRECOMPILED_FILE, 'utf8')
  : require('coffee-script').compile(
      fs.readFileSync(COFFEE_SCRIPT_FILE, 'utf8')
    );

function jasmineTestRunner(config, environment, moduleLoader, testPath) {

  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  //
  // To account for this conflict, we set up jasmine in an environment with real
  // timers (instead of mock timers).
  environment.fakeTimers.runWithRealTimers(function() {

    // Execute jasmine's main code
    environment.runSourceText(jasmineFileContent, JASMINE_PATH);

    // Install jasmine-pit -- because it's amazing
    jasminePit.install(environment.global);

    // Install jasmine-only
    environment.runSourceText(jasmineOnlyContent);

    // Installs a new compareObjects_ on jasmine.Env
    envSetup.replaceCompareObjects(environment);


    // Run the test setup script.
    envSetup.runSetupTestFrameworkScript(config, environment, moduleLoader);

  });

  var jasmine = environment.global.jasmine;

  jasmine.getEnv().beforeEach(function() {
    this.addMatchers({
      toBeCalled: function() {
        if (this.actual.mock === undefined) {
          throw Error('toBeCalled() should be used on a mock function');
        }
        return this.actual.mock.calls.length !== 0;
      },

      lastCalledWith: function() {
        if (this.actual.mock === undefined) {
          throw Error('lastCalledWith() should be used on a mock function');
        }
        var calls = this.actual.mock.calls;
        var args = Array.prototype.slice.call(arguments);
        this.env.currentSpec.expect(calls[calls.length - 1]).toEqual(args);
        return true;
      },

      toBeCalledWith: function() {
        if (this.actual.mock === undefined) {
          throw Error('toBeCalledWith() should be used on a mock function');
        }
        var calls = this.actual.mock.calls;
        var args = Array.prototype.slice.call(arguments);

        // Often toBeCalledWith is called on a mock that only has one call, so
        // we can give a better error message in this case.
        if (calls.length === 1) {
          var expect = this.env.currentSpec.expect(calls[0]);
          if (this.isNot) {
            expect = expect.not;
          }
          expect.toEqual(args);
          return !this.isNot;
        }

        return calls.some(function(call) {
          return this.env.equals_(call, args);
        }, this);
      }
    });

    if (!config.persistModuleRegistryBetweenSpecs) {
      moduleLoader.requireModule(
        __filename,
        'jest-runtime'
      ).resetModuleRegistry();
    }
  });

  var jasmineReporter = new JasmineReporter({
    noHighlight: config.noHighlight,
  });
  jasmine.getEnv().addReporter(jasmineReporter);

  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));

  jasmine.getEnv().execute();
  return jasmineReporter.getResults();
}

module.exports = jasmineTestRunner;
