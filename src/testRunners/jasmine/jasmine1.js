/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const VENDOR_PATH = '../../../vendor/';
const JASMINE_PATH = require.resolve(VENDOR_PATH + '/jasmine/jasmine-1.3.0');
const JASMINE_ONLY_PATH =
  require.resolve(VENDOR_PATH + '/jasmine-only/jasmine-only.js');

const fs = require('graceful-fs');
const jasminePit = require(VENDOR_PATH + '/jasmine-pit/jasmine-pit');
const JasmineReporter = require('./JasmineReporter');
const path = require('path');

const jasmineFileContent = fs.readFileSync(JASMINE_PATH, 'utf8');
const jasmineOnlyContent = fs.readFileSync(JASMINE_ONLY_PATH, 'utf8');

function jasmine1(config, environment, moduleLoader, testPath) {
  const hasKey = (obj, keyName) => (
    obj !== null
    && obj !== undefined
    && obj[keyName] !== environment.global.jasmine.undefined
  );

  const checkMissingExpectedKeys =
    (actual, expected, property, mismatchKeys) => {
      if (!hasKey(expected, property) && hasKey(actual, property)) {
        mismatchKeys.push(
          'expected missing key \'' + property + '\', but present in ' +
          'actual.'
        );
      }
    };

  const checkMissingActualKeys =
    (actual, expected, property, mismatchKeys) => {
      if (!hasKey(actual, property) && hasKey(expected, property)) {
        mismatchKeys.push(
          'expected has key \'' + property + '\', but missing from actual.'
        );
      }
    };

  const checkMismatchedValues = function(
    a,
    b,
    property,
    mismatchKeys,
    mismatchValues
  ) {
    // The only different implementation from the original jasmine
    const areEqual = this.equals_(
      a[property],
      b[property],
      mismatchKeys,
      mismatchValues
    );
    if (!areEqual) {
      let aprop;
      let bprop;
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
  };

  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  // To account for this conflict, we set up jasmine in an environment with real
  // timers (instead of mock timers).
  environment.fakeTimers.runWithRealTimers(() => {
    environment.runSourceText(jasmineFileContent, JASMINE_PATH);
    jasminePit.install(environment.global);
    environment.runSourceText(jasmineOnlyContent);

    const _comparedObjects = new WeakMap();
    environment.global.jasmine.Env.prototype.compareObjects_ =
      function(a, b, mismatchKeys, mismatchValues) {
        if (_comparedObjects.get(a) === b && _comparedObjects.get(b) === a) {
          return true;
        }
        const areArrays =
          environment.global.jasmine.isArray_(a)
          && environment.global.jasmine.isArray_(b);

        _comparedObjects.set(a, b);
        _comparedObjects.set(b, a);

        let property;
        let index;
        if (areArrays) {
          const largerLength = Math.max(a.length, b.length);
          for (index = 0; index < largerLength; index++) {
            // check that all expected keys match actual keys
            if (index < b.length && typeof b[index] !== 'function') {
              checkMissingActualKeys(a, b, index, mismatchKeys);
            }
            // check that all actual keys match expected keys
            if (index < a.length && typeof a[index] !== 'function') {
              checkMissingExpectedKeys(a, b, index, mismatchKeys);
            }

            // check that every expected value matches each actual value
            if (typeof a[index] !== 'function' &&
                typeof b[index] !== 'function') {
              checkMismatchedValues.call(
                this,
                a,
                b,
                index,
                mismatchKeys,
                mismatchValues
              );
            }
          }
        } else {
          for (property in b) {
            // check that all actual keys match expected keys
            checkMissingActualKeys(a, b, property, mismatchKeys);

            // check that every expected value matches each actual value
            checkMismatchedValues.call(
              this,
              a,
              b,
              property,
              mismatchKeys,
              mismatchValues
            );
          }
          for (property in a) {
            // check that all of b's keys match a's
            checkMissingExpectedKeys(a, b, property, mismatchKeys);
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
      moduleLoader.requireModule(null, config.setupTestFrameworkScriptFile);
    }
  });

  const jasmine = environment.global.jasmine;

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
        const calls = this.actual.mock.calls;
        const args = Array.prototype.slice.call(arguments);
        this.env.currentSpec.expect(calls[calls.length - 1]).toEqual(args);
        return true;
      },

      toBeCalledWith: function() {
        if (this.actual.mock === undefined) {
          throw Error('toBeCalledWith() should be used on a mock function');
        }
        const calls = this.actual.mock.calls;
        const args = Array.prototype.slice.call(arguments);

        // Often toBeCalledWith is called on a mock that only has one call, so
        // we can give a better error message in this case.
        if (calls.length === 1) {
          let expect = this.env.currentSpec.expect(calls[0]);
          if (this.isNot) {
            expect = expect.not;
          }
          expect.toEqual(args);
          return !this.isNot;
        }

        return calls.some(call => this.env.equals_(call, args));
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
  jasmine.getEnv().addReporter(reporter);
  // Run the test by require()ing it
  moduleLoader.requireModule(testPath, './' + path.basename(testPath));
  jasmine.getEnv().execute();
  return reporter.getResults();
}

module.exports = jasmine1;
