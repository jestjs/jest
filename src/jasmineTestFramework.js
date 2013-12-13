var fs = require('fs');
var jasminePit = require('jasmine-pit');
var JasmineReporter = require('./JasmineReporter');
var mockTimers = require('./lib/mockTimers');
var Q = require('q');

var JASMINE_PATH = require.resolve('./vendor/jasmine/jasmine-1.3.0');
var jasmineFileContent = fs.readFileSync(require.resolve(JASMINE_PATH), 'utf8');

function runTest(contextGlobal, contextRunner, testExecutor) {
  // Jasmine does stuff with timers that affect running the tests. However, we
  // also mock out all the timer APIs (to make them test-controllable).
  //
  // To account for this conflict, we temporarily re-install the non-mock timers
  // while jasmine gets itself setup and installed. After jasmine is all setup
  // (it will store refs to setTimeout, etc internally), we restore the mock
  // timers.
  var hasMockedTimeouts = false;
  if (contextGlobal._originalTimeouts) {
    hasMockedTimeouts = true;
    mockTimers.uninstallMockTimers(contextGlobal);
  }

  // Execute jasmine's main code
  contextRunner(jasmineFileContent, JASMINE_PATH);

  // Install jasmine-pit -- because it's amazing
  jasminePit.install(contextGlobal);

  // Mainline Jasmine sets __Jasmine_been_here_before__ on each object to detect
  // cycles, but that doesn't work on frozen objects so we use a WeakMap instead.
  var _comparedObjects = new WeakMap();
  contextGlobal.jasmine.Env.prototype.compareObjects_ =
    function(a, b, mismatchKeys, mismatchValues) {
      if (_comparedObjects.get(a) === b && _comparedObjects.get(b) === a) {
        return true;
      }
      var areArrays = contextGlobal.jasmine.isArray_(a) && contextGlobal.jasmine.isArray_(b);

      _comparedObjects.set(a, b);
      _comparedObjects.set(b, a);

      var hasKey = function(obj, keyName) {
        return obj != null && obj[keyName] !== contextGlobal.jasmine.undefined;
      };

      for (var property in b) {
        if (areArrays && typeof b[property] == 'function') {
          continue;
        }
        if (!hasKey(a, property) && hasKey(b, property)) {
          mismatchKeys.push(
            "expected has key '" + property + "', but missing from actual."
          );
        }
      }
      for (property in a) {
        if (areArrays && typeof a[property] == 'function') {
          continue;
        }
        if (!hasKey(b, property) && hasKey(a, property)) {
          mismatchKeys.push(
            "expected missing key '" + property + "', but present in actual."
          );
        }
      }
      for (property in b) {
        // The only different implementation from the original jasmine
        if (areArrays &&
            (typeof a[property] == 'function' ||
             typeof b[property] == 'function')) {
          continue;
        }
        if (!this.equals_(a[property], b[property], mismatchKeys, mismatchValues))
        {
          mismatchValues.push(
            "'" + property + "' was '" + (b[property] ?
              contextGlobal.jasmine.util.htmlEscape(b[property].toString()) :
              b[property]) +
            "' in expected, but was '" + (a[property] ?
              contextGlobal.jasmine.util.htmlEscape(a[property].toString()) :
              a[property]) + "' in actual."
          );
        }
      }

      if (areArrays &&
          a.length != b.length) {
        mismatchValues.push("arrays were not the same length");
      }

      _comparedObjects.delete(a);
      _comparedObjects.delete(b);
      return (mismatchKeys.length == 0 && mismatchValues.length == 0);
    };


  // TODO: This is fb-specific, and that's bad for open-sourcing
  //       Find some way to get this out of here. Putting it into the config as
  //       a 'setupTestFrameworkScript' options seems reasonable
  /*
  var toThrow = contextGlobal.jasmine.Matchers.prototype.toThrow;
  var originalValue;
  var mockCheckFn = function(arg) {
    // TODO: Wish I know what 'arg' was :/
    return arg[0];
  };
  mockCheckFn.reset = function() {
    contextGlobal.__t = originalValue;
  };

  contextGlobal.jasmine.Matchers.prototype.toThrow = function() {
    if (contextGlobal.__THROWONTYPECHECKS__) {
      return toThrow.apply(this, arguments);
    }
    // swap out the typechecker with a no-op function
    originalValue = contextGlobal.__t;
    contextGlobal.__t = mockCheckFn;
    var returnValue = toThrow.apply(this, arguments);
    mockCheckFn.reset();
    return returnValue;
  };
  */

  if (hasMockedTimeouts) {
    mockTimers.installMockTimers(contextGlobal);
  }

  var jasmine = contextGlobal.jasmine;

  // Disable typechecks while doing toThrow tests
  // TODO: (see jstest/support/jasmine.js)

  // Add matcher for mock functions
  // TODO: (see jstest/support/jasmine.js)
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
          throw Error('toBeCalled() should be used on a mock function');
        }
        var calls = this.actual.mock.calls;
        var args = Array.prototype.slice.call(arguments);
        return this.env.equals_(calls[calls.length - 1], args);
      },

      toBeCalledWith: function() {
        if (this.actual.mock === undefined) {
          throw Error('toBeCalled() should be used on a mock function');
        }
        var args = Array.prototype.slice.call(arguments);
        return this.actual.mock.calls.some(function(call) {
          return this.env.equals_(call, args);
        }.bind(this));
      }
    });
  });

  // Use WeakMap for detecting cycles (rather than __Jasmine_been_here_before__)
  // to support detecting cycles with frozen objects.
  // TODO: (see jstest/support/jasmine.js)

  var jasmineReporter = new JasmineReporter();
  jasmine.getEnv().addReporter(jasmineReporter);

  testExecutor();
  jasmine.getEnv().execute();
  return jasmineReporter.getResults();
}

exports.runTest = runTest;
