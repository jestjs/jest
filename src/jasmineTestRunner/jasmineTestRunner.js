/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var fs = require('fs');
var jasminePit = require('jasmine-pit');
var JasmineReporter = require('./JasmineReporter');
var path = require('path');
var utils = require('../lib/utils');

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

    // Node must have been run with --harmony in order for WeakMap to be
    // available
    if (!process.execArgv.some(function(arg) { return arg === '--harmony'; })) {
      throw new Error('Please run node with the --harmony flag!');
    }

    // Mainline Jasmine sets __Jasmine_been_here_before__ on each object to
    // detect cycles, but that doesn't work on frozen objects so we use a
    // WeakMap instead.
    var _comparedObjects = new WeakMap();
    environment.global.jasmine.Env.prototype.compareObjects_ =
      function(a, b, mismatchKeys, mismatchValues) {
        if (_comparedObjects.get(a) === b && _comparedObjects.get(b) === a) {
          return true;
        }
        var areArrays =
          environment.global.jasmine.isArray_(a)
          && environment.global.jasmine.isArray_(b);

        _comparedObjects.set(a, b);
        _comparedObjects.set(b, a);

        var hasKey = function(obj, keyName) {
          return (
            obj !== null
            && obj !== undefined
            && obj[keyName] !== environment.global.jasmine.undefined
          );
        };

        for (var property in b) {
          if (areArrays && typeof b[property] === 'function') {
            continue;
          }
          if (!hasKey(a, property) && hasKey(b, property)) {
            mismatchKeys.push(
              'expected has key \'' + property + '\', but missing from actual.'
            );
          }
        }
        for (property in a) {
          if (areArrays && typeof a[property] === 'function') {
            continue;
          }
          if (!hasKey(b, property) && hasKey(a, property)) {
            mismatchKeys.push(
              'expected missing key \'' + property + '\', but present in ' +
              'actual.'
            );
          }
        }
        for (property in b) {
          // The only different implementation from the original jasmine
          if (areArrays &&
              (typeof a[property] === 'function' ||
               typeof b[property] === 'function')) {
            continue;
          }
          var areEqual = this.equals_(
            a[property],
            b[property],
            mismatchKeys,
            mismatchValues
          );
          if (!areEqual) {
            var aprop;
            var bprop;
            if (!a[property]) {
              aprop = a[property];
            } else if (a[property].toString) {
              aprop = environment.global.jasmine.util.htmlEscape(
                a[property].toString()
              );
            } else {
              aprop = Object.prototype.toString.call(a[property]);
            }

            if (!b[property]) {
              bprop = b[property];
            } else if (b[property].toString) {
              bprop = environment.global.jasmine.util.htmlEscape(
                b[property].toString()
              );
            } else {
              bprop = Object.prototype.toString.call(b[property]);
            }

            mismatchValues.push(
              '\'' + property + '\' was \'' + bprop +
              '\' in expected, but was \'' + aprop +
              '\' in actual.'
            );
          }
        }

        if (areArrays && a.length !== b.length) {
          mismatchValues.push('arrays were not the same length');
        }

        _comparedObjects.delete(a);
        _comparedObjects.delete(b);
        return (mismatchKeys.length === 0 && mismatchValues.length === 0);
      };

    if (config.setupTestFrameworkScriptFile) {
      var setupScriptContent = utils.readAndPreprocessFileContent(
        config.setupTestFrameworkScriptFile,
        config
      );

      utils.runContentWithLocalBindings(
        environment.runSourceText.bind(environment),
        setupScriptContent,
        config.setupTestFrameworkScriptFile,
        {
          __dirname: path.dirname(config.setupTestFrameworkScriptFile),
          __filename: config.setupTestFrameworkScriptFile,
          require: moduleLoader.constructBoundRequire(
            config.setupTestFrameworkScriptFile
          )
        }
      );
    }
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
        return this.env.equals_(calls[calls.length - 1], args);
      },

      toBeCalledWith: function() {
        if (this.actual.mock === undefined) {
          throw Error('toBeCalledWith() should be used on a mock function');
        }
        var args = Array.prototype.slice.call(arguments);
        return this.actual.mock.calls.some(function(call) {
          return this.env.equals_(call, args);
        }.bind(this));
      }
    });

    if (!config.persistModuleRegistryBetweenSpecs) {
      moduleLoader.requireModule(
        __filename,
        'jest-runtime'
      ).resetModuleRegistry();
    }
  });

  var jasmineReporter = new JasmineReporter();
  jasmine.getEnv().addReporter(jasmineReporter);

  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));

  jasmine.getEnv().execute();
  return jasmineReporter.getResults();
}

module.exports = jasmineTestRunner;
