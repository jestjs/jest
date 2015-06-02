/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var utils = require('../lib/utils');
var path = require('path');

var replaceCompareObjects = function(environment) {

    // Node must have been run with --harmony in order for WeakMap to be
    // available prior to version 0.12
    if (typeof WeakMap !== 'function') {
      throw new Error(
        'Please run node with the --harmony flag! jest requires WeakMap ' +
        'which is only available with the --harmony flag in node < v0.12'
      );
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
};

var runSetupTestFrameworkScript = function(config, environment, moduleLoader) {
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
          ),
          jest: moduleLoader.getJestRuntime(config.setupTestFrameworkScriptFile)
        }
      );
    }
  };

exports.replaceCompareObjects = replaceCompareObjects;
exports.runSetupTestFrameworkScript = runSetupTestFrameworkScript;