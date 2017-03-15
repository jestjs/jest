/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* eslint-disable sort-keys */
'use strict';

exports.create = function() {
  const j$ = {};

  exports.base(j$);
  j$.util = exports.util();
  j$.errors = exports.errors();
  j$.formatErrorMsg = exports.formatErrorMsg();
  j$.CallTracker = exports.CallTracker(j$);
  j$.Env = exports.Env(j$);
  j$.ExceptionFormatter = exports.ExceptionFormatter();
  j$.buildExpectationResult = exports.buildExpectationResult();
  j$.JsApiReporter = exports.JsApiReporter();
  j$.QueueRunner = exports.QueueRunner(j$);
  j$.ReportDispatcher = exports.ReportDispatcher();
  j$.Spec = exports.Spec(j$);
  j$.SpyRegistry = exports.SpyRegistry(j$);
  j$.SpyStrategy = exports.SpyStrategy(j$);
  j$.Suite = exports.Suite(j$);
  j$.Timer = exports.Timer();
  j$.TreeProcessor = exports.TreeProcessor();
  j$.version = exports.version();
  j$.Order = exports.Order();

  return j$;
};

exports.base = function(j$) {
  j$.DEFAULT_TIMEOUT_INTERVAL = 5000;

  j$.getEnv = function(options) {
    const env = (j$.currentEnv_ = j$.currentEnv_ || new j$.Env(options));
    //jasmine. singletons in here (setTimeout blah blah).
    return env;
  };

  j$.isArray_ = function(value) {
    return j$.isA_('Array', value);
  };

  j$.isFunction_ = function(value) {
    return j$.isA_('Function', value);
  };

  j$.isA_ = function(typeName, value) {
    return Object.prototype.toString.apply(value) ===
      '[object ' + typeName + ']';
  };

  j$.createSpy = function(name, originalFn) {
    const spyStrategy = new j$.SpyStrategy({
      name,
      fn: originalFn,
      getSpy() {
        return spy;
      },
    });
    const callTracker = new j$.CallTracker();
    const spy = function() {
      const callData = {
        object: this,
        args: Array.prototype.slice.apply(arguments),
      };

      callTracker.track(callData);
      const returnValue = spyStrategy.exec.apply(this, arguments);
      callData.returnValue = returnValue;

      return returnValue;
    };

    for (const prop in originalFn) {
      if (prop === 'and' || prop === 'calls') {
        throw new Error(
          "Jasmine spies would overwrite the 'and' and 'calls' properties " +
            'on the object being spied upon',
        );
      }

      spy[prop] = originalFn[prop];
    }

    spy.and = spyStrategy;
    spy.calls = callTracker;

    return spy;
  };

  j$.isSpy = function(putativeSpy) {
    if (!putativeSpy) {
      return false;
    }
    return putativeSpy.and instanceof j$.SpyStrategy &&
      putativeSpy.calls instanceof j$.CallTracker;
  };

  j$.createSpyObj = function(baseName, methodNames) {
    if (j$.isArray_(baseName) && j$.util.isUndefined(methodNames)) {
      methodNames = baseName;
      baseName = 'unknown';
    }

    if (!j$.isArray_(methodNames) || methodNames.length === 0) {
      throw new Error(
        'createSpyObj requires a non-empty array of method names to ' +
          'create spies for',
      );
    }
    const obj = {};
    for (let i = 0; i < methodNames.length; i++) {
      obj[methodNames[i]] = j$.createSpy(baseName + '.' + methodNames[i]);
    }
    return obj;
  };
};

exports.util = function() {
  const util = {};

  util.isUndefined = function(obj) {
    return obj === void 0;
  };

  util.clone = function(obj) {
    if (Object.prototype.toString.apply(obj) === '[object Array]') {
      return obj.slice();
    }

    const cloned = {};
    for (const prop in obj) {
      // @ccarlesso allows looping on objects without `Object.prototype`.
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        cloned[prop] = obj[prop];
      }
    }

    return cloned;
  };

  return util;
};

exports.Spec = function(j$) {
  function Spec(attrs) {
    this.expectationFactory = attrs.expectationFactory;
    this.resultCallback = attrs.resultCallback || function() {};
    this.id = attrs.id;
    this.description = attrs.description || '';
    this.queueableFn = attrs.queueableFn;
    this.beforeAndAfterFns = attrs.beforeAndAfterFns ||
      function() {
        return {befores: [], afters: []};
      };
    this.userContext = attrs.userContext ||
      function() {
        return {};
      };
    this.onStart = attrs.onStart || function() {};
    this.getSpecName = attrs.getSpecName ||
      function() {
        return '';
      };
    this.expectationResultFactory = attrs.expectationResultFactory ||
      function() {};
    this.queueRunnerFactory = attrs.queueRunnerFactory || function() {};
    this.catchingExceptions = attrs.catchingExceptions ||
      function() {
        return true;
      };
    this.throwOnExpectationFailure = !!attrs.throwOnExpectationFailure;

    if (!this.queueableFn.fn) {
      this.pend();
    }

    this.result = {
      id: this.id,
      description: this.description,
      fullName: this.getFullName(),
      failedExpectations: [],
      passedExpectations: [],
      pendingReason: '',
    };
  }

  Spec.prototype.addExpectationResult = function(passed, data, isError) {
    const expectationResult = this.expectationResultFactory(data);
    if (passed) {
      this.result.passedExpectations.push(expectationResult);
    } else {
      this.result.failedExpectations.push(expectationResult);

      if (this.throwOnExpectationFailure && !isError) {
        throw new j$.errors.ExpectationFailed();
      }
    }
  };

  Spec.prototype.execute = function(onComplete, enabled) {
    const self = this;

    this.onStart(this);

    if (!this.isExecutable() || this.markedPending || enabled === false) {
      complete(enabled);
      return;
    }

    const fns = this.beforeAndAfterFns();
    const allFns = fns.befores.concat(this.queueableFn).concat(fns.afters);

    this.queueRunnerFactory({
      queueableFns: allFns,
      onException() {
        self.onException.apply(self, arguments);
      },
      onComplete: complete,
      userContext: this.userContext(),
    });

    function complete(enabledAgain) {
      self.result.status = self.status(enabledAgain);
      self.resultCallback(self.result);

      if (onComplete) {
        onComplete();
      }
    }
  };

  Spec.prototype.onException = function onException(e) {
    if (Spec.isPendingSpecException(e)) {
      this.pend(extractCustomPendingMessage(e));
      return;
    }

    if (e instanceof j$.errors.ExpectationFailed) {
      return;
    }

    this.addExpectationResult(
      false,
      {
        matcherName: '',
        passed: false,
        expected: '',
        actual: '',
        error: e,
      },
      true,
    );
  };

  Spec.prototype.disable = function() {
    this.disabled = true;
  };

  Spec.prototype.pend = function(message) {
    this.markedPending = true;
    if (message) {
      this.result.pendingReason = message;
    }
  };

  Spec.prototype.getResult = function() {
    this.result.status = this.status();
    return this.result;
  };

  Spec.prototype.status = function(enabled) {
    if (this.disabled || enabled === false) {
      return 'disabled';
    }

    if (this.markedPending) {
      return 'pending';
    }

    if (this.result.failedExpectations.length > 0) {
      return 'failed';
    } else {
      return 'passed';
    }
  };

  Spec.prototype.isExecutable = function() {
    return !this.disabled;
  };

  Spec.prototype.getFullName = function() {
    return this.getSpecName(this);
  };

  const extractCustomPendingMessage = function(e) {
    const fullMessage = e.toString();
    const boilerplateStart = fullMessage.indexOf(
      Spec.pendingSpecExceptionMessage,
    );
    const boilerplateEnd = boilerplateStart +
      Spec.pendingSpecExceptionMessage.length;

    return fullMessage.substr(boilerplateEnd);
  };

  Spec.pendingSpecExceptionMessage = '=> marked Pending';

  Spec.isPendingSpecException = function(e) {
    return !!(e &&
      e.toString &&
      e.toString().indexOf(Spec.pendingSpecExceptionMessage) !== -1);
  };

  return Spec;
};

/*jshint bitwise: false*/

exports.Order = function() {
  function Order(options) {
    this.sort = items => items;
  }

  return Order;
};

exports.Env = function(j$) {
  function Env(options) {
    options = options || {};

    const self = this;

    let totalSpecsDefined = 0;

    let catchExceptions = true;

    const realSetTimeout = global.setTimeout;
    const realClearTimeout = global.clearTimeout;

    const runnableResources = {};

    let currentSpec = null;
    const currentlyExecutingSuites = [];
    let currentDeclarationSuite = null;
    let throwOnExpectationFailure = false;
    let random = false;
    let seed = null;

    const currentSuite = function() {
      return currentlyExecutingSuites[currentlyExecutingSuites.length - 1];
    };

    const currentRunnable = function() {
      return currentSpec || currentSuite();
    };

    const reporter = new j$.ReportDispatcher([
      'jasmineStarted',
      'jasmineDone',
      'suiteStarted',
      'suiteDone',
      'specStarted',
      'specDone',
    ]);

    this.specFilter = function() {
      return true;
    };

    let nextSpecId = 0;
    const getNextSpecId = function() {
      return 'spec' + nextSpecId++;
    };

    let nextSuiteId = 0;
    const getNextSuiteId = function() {
      return 'suite' + nextSuiteId++;
    };

    const expectationFactory = function(actual, spec) {
      return j$.Expectation.Factory({
        actual,
        addExpectationResult,
      });

      function addExpectationResult(passed, result) {
        return spec.addExpectationResult(passed, result);
      }
    };

    const defaultResourcesForRunnable = function(id, parentRunnableId) {
      const resources = {spies: []};

      runnableResources[id] = resources;
    };

    const clearResourcesForRunnable = function(id) {
      spyRegistry.clearSpies();
      delete runnableResources[id];
    };

    const beforeAndAfterFns = function(suite) {
      return function() {
        let afters = [];
        let befores = [];

        while (suite) {
          befores = befores.concat(suite.beforeFns);
          afters = afters.concat(suite.afterFns);

          suite = suite.parentSuite;
        }

        return {
          befores: befores.reverse(),
          afters,
        };
      };
    };

    const getSpecName = function(spec, suite) {
      const fullName = [spec.description];
      const suiteFullName = suite.getFullName();

      if (suiteFullName !== '') {
        fullName.unshift(suiteFullName);
      }

      return fullName.join(' ');
    };

    const buildExpectationResult = j$.buildExpectationResult;
    const exceptionFormatter = new j$.ExceptionFormatter();
    const expectationResultFactory = function(attrs) {
      attrs.messageFormatter = exceptionFormatter.message;
      attrs.stackFormatter = exceptionFormatter.stack;

      return buildExpectationResult(attrs);
    };

    this.catchExceptions = function(value) {
      catchExceptions = !!value;
      return catchExceptions;
    };

    this.catchingExceptions = function() {
      return catchExceptions;
    };

    const maximumSpecCallbackDepth = 20;
    let currentSpecCallbackDepth = 0;

    function clearStack(fn) {
      currentSpecCallbackDepth++;
      if (currentSpecCallbackDepth >= maximumSpecCallbackDepth) {
        currentSpecCallbackDepth = 0;
        realSetTimeout(fn, 0);
      } else {
        fn();
      }
    }

    const catchException = function(e) {
      return j$.Spec.isPendingSpecException(e) || catchExceptions;
    };

    this.throwOnExpectationFailure = function(value) {
      throwOnExpectationFailure = !!value;
    };

    this.throwingExpectationFailures = function() {
      return throwOnExpectationFailure;
    };

    this.randomizeTests = function(value) {
      random = !!value;
    };

    this.randomTests = function() {
      return random;
    };

    this.seed = function(value) {
      if (value) {
        seed = value;
      }
      return seed;
    };

    const queueRunnerFactory = function(options) {
      options.catchException = catchException;
      options.clearStack = options.clearStack || clearStack;
      options.timeout = {
        setTimeout: realSetTimeout,
        clearTimeout: realClearTimeout,
      };
      options.fail = self.fail;

      new j$.QueueRunner(options).execute();
    };

    const topSuite = new j$.Suite({
      env: this,
      id: getNextSuiteId(),
      description: 'test',
      expectationFactory,
      expectationResultFactory,
    });
    defaultResourcesForRunnable(topSuite.id);
    currentDeclarationSuite = topSuite;

    this.topSuite = function() {
      return topSuite;
    };

    this.execute = function(runnablesToRun) {
      if (!runnablesToRun) {
        if (focusedRunnables.length) {
          runnablesToRun = focusedRunnables;
        } else {
          runnablesToRun = [topSuite.id];
        }
      }

      const order = new j$.Order({
        random,
        seed,
      });

      const processor = new j$.TreeProcessor({
        tree: topSuite,
        runnableIds: runnablesToRun,
        queueRunnerFactory,
        nodeStart(suite) {
          currentlyExecutingSuites.push(suite);
          defaultResourcesForRunnable(suite.id, suite.parentSuite.id);
          reporter.suiteStarted(suite.result);
        },
        nodeComplete(suite, result) {
          if (!suite.disabled) {
            clearResourcesForRunnable(suite.id);
          }
          currentlyExecutingSuites.pop();
          reporter.suiteDone(result);
        },
        orderChildren(node) {
          return order.sort(node.children);
        },
      });

      if (!processor.processTree().valid) {
        throw new Error(
          'Invalid order: would cause a beforeAll or afterAll to be ' +
            'run multiple times',
        );
      }

      reporter.jasmineStarted({
        totalSpecsDefined,
      });

      currentlyExecutingSuites.push(topSuite);

      processor.execute(() => {
        clearResourcesForRunnable(topSuite.id);
        currentlyExecutingSuites.pop();

        reporter.jasmineDone({
          order,
          failedExpectations: topSuite.result.failedExpectations,
        });
      });
    };

    this.addReporter = function(reporterToAdd) {
      reporter.addReporter(reporterToAdd);
    };

    this.provideFallbackReporter = function(reporterToAdd) {
      reporter.provideFallbackReporter(reporterToAdd);
    };

    this.clearReporters = function() {
      reporter.clearReporters();
    };

    const spyRegistry = new j$.SpyRegistry({
      currentSpies() {
        if (!currentRunnable()) {
          throw new Error(
            'Spies must be created in a before function or a spec',
          );
        }
        return runnableResources[currentRunnable().id].spies;
      },
    });

    this.allowRespy = function(allow) {
      spyRegistry.allowRespy(allow);
    };

    this.spyOn = function() {
      return spyRegistry.spyOn.apply(spyRegistry, arguments);
    };

    const suiteFactory = function(description) {
      const suite = new j$.Suite({
        env: self,
        id: getNextSuiteId(),
        description,
        parentSuite: currentDeclarationSuite,
        expectationFactory,
        expectationResultFactory,
        throwOnExpectationFailure,
      });

      return suite;
    };

    this.describe = function(description, specDefinitions) {
      const suite = suiteFactory(description);
      if (specDefinitions.length > 0) {
        throw new Error('describe does not expect any arguments');
      }
      if (currentDeclarationSuite.markedPending) {
        suite.pend();
      }
      addSpecsToSuite(suite, specDefinitions);
      return suite;
    };

    this.xdescribe = function(description, specDefinitions) {
      const suite = suiteFactory(description);
      suite.pend();
      addSpecsToSuite(suite, specDefinitions);
      return suite;
    };

    const focusedRunnables = [];

    this.fdescribe = function(description, specDefinitions) {
      const suite = suiteFactory(description);
      suite.isFocused = true;

      focusedRunnables.push(suite.id);
      unfocusAncestor();
      addSpecsToSuite(suite, specDefinitions);

      return suite;
    };

    function addSpecsToSuite(suite, specDefinitions) {
      const parentSuite = currentDeclarationSuite;
      parentSuite.addChild(suite);
      currentDeclarationSuite = suite;

      let declarationError = null;
      try {
        specDefinitions.call(suite);
      } catch (e) {
        declarationError = e;
      }

      if (declarationError) {
        self.it('encountered a declaration exception', () => {
          throw declarationError;
        });
      }

      currentDeclarationSuite = parentSuite;
    }

    function findFocusedAncestor(suite) {
      while (suite) {
        if (suite.isFocused) {
          return suite.id;
        }
        suite = suite.parentSuite;
      }

      return null;
    }

    function unfocusAncestor() {
      const focusedAncestor = findFocusedAncestor(currentDeclarationSuite);
      if (focusedAncestor) {
        for (let i = 0; i < focusedRunnables.length; i++) {
          if (focusedRunnables[i] === focusedAncestor) {
            focusedRunnables.splice(i, 1);
            break;
          }
        }
      }
    }

    const specFactory = function(description, fn, suite, timeout) {
      totalSpecsDefined++;
      const spec = new j$.Spec({
        id: getNextSpecId(),
        beforeAndAfterFns: beforeAndAfterFns(suite),
        expectationFactory,
        resultCallback: specResultCallback,
        getSpecName(spec) {
          return getSpecName(spec, suite);
        },
        onStart: specStarted,
        description,
        expectationResultFactory,
        queueRunnerFactory,
        userContext() {
          return suite.clonedSharedUserContext();
        },
        queueableFn: {
          fn,
          timeout() {
            return timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
          },
        },
        throwOnExpectationFailure,
      });

      if (!self.specFilter(spec)) {
        spec.disable();
      }

      return spec;

      function specResultCallback(result) {
        clearResourcesForRunnable(spec.id);
        currentSpec = null;
        reporter.specDone(result);
      }

      function specStarted(spec) {
        currentSpec = spec;
        defaultResourcesForRunnable(spec.id, suite.id);
        reporter.specStarted(spec.result);
      }
    };

    this.it = function(description, fn, timeout) {
      const spec = specFactory(
        description,
        fn,
        currentDeclarationSuite,
        timeout,
      );
      if (currentDeclarationSuite.markedPending) {
        spec.pend();
      }
      currentDeclarationSuite.addChild(spec);
      return spec;
    };

    this.xit = function() {
      const spec = this.it.apply(this, arguments);
      spec.pend('Temporarily disabled with xit');
      return spec;
    };

    this.fit = function(description, fn, timeout) {
      const spec = specFactory(
        description,
        fn,
        currentDeclarationSuite,
        timeout,
      );
      currentDeclarationSuite.addChild(spec);
      focusedRunnables.push(spec.id);
      unfocusAncestor();
      return spec;
    };

    this.beforeEach = function(beforeEachFunction, timeout) {
      currentDeclarationSuite.beforeEach({
        fn: beforeEachFunction,
        timeout() {
          return timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
        },
      });
    };

    this.beforeAll = function(beforeAllFunction, timeout) {
      currentDeclarationSuite.beforeAll({
        fn: beforeAllFunction,
        timeout() {
          return timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
        },
      });
    };

    this.afterEach = function(afterEachFunction, timeout) {
      currentDeclarationSuite.afterEach({
        fn: afterEachFunction,
        timeout() {
          return timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
        },
      });
    };

    this.afterAll = function(afterAllFunction, timeout) {
      currentDeclarationSuite.afterAll({
        fn: afterAllFunction,
        timeout() {
          return timeout || j$.DEFAULT_TIMEOUT_INTERVAL;
        },
      });
    };

    this.pending = function(message) {
      let fullMessage = j$.Spec.pendingSpecExceptionMessage;
      if (message) {
        fullMessage += message;
      }
      throw fullMessage;
    };

    this.fail = function(error) {
      let message = 'Failed';
      if (error) {
        message += ': ';
        message += error.message || error;
      }

      currentRunnable().addExpectationResult(false, {
        matcherName: '',
        passed: false,
        expected: '',
        actual: '',
        message,
        error: error && error.message ? error : null,
      });
    };
  }

  return Env;
};

exports.JsApiReporter = function() {
  const noopTimer = {
    start() {},
    elapsed() {
      return 0;
    },
  };

  function JsApiReporter(options) {
    const timer = options.timer || noopTimer;
    let status = 'loaded';

    this.started = false;
    this.finished = false;
    this.runDetails = {};

    this.jasmineStarted = function() {
      this.started = true;
      status = 'started';
      timer.start();
    };

    let executionTime;

    this.jasmineDone = function(runDetails) {
      this.finished = true;
      this.runDetails = runDetails;
      executionTime = timer.elapsed();
      status = 'done';
    };

    this.status = function() {
      return status;
    };

    const suites = [];
    const suites_hash = {};

    this.suiteStarted = function(result) {
      suites_hash[result.id] = result;
    };

    this.suiteDone = function(result) {
      storeSuite(result);
    };

    this.suiteResults = function(index, length) {
      return suites.slice(index, index + length);
    };

    function storeSuite(result) {
      suites.push(result);
      suites_hash[result.id] = result;
    }

    this.suites = function() {
      return suites_hash;
    };

    const specs = [];

    this.specDone = function(result) {
      specs.push(result);
    };

    this.specResults = function(index, length) {
      return specs.slice(index, index + length);
    };

    this.specs = function() {
      return specs;
    };

    this.executionTime = function() {
      return executionTime;
    };
  }

  return JsApiReporter;
};

exports.CallTracker = function(j$) {
  function CallTracker() {
    let calls = [];
    const opts = {};

    function argCloner(context) {
      const clonedArgs = [];
      const argsAsArray = Array.from(context.args);
      for (let i = 0; i < argsAsArray.length; i++) {
        if (
          Object.prototype.toString.apply(argsAsArray[i]).match(/^\[object/)
        ) {
          clonedArgs.push(j$.util.clone(argsAsArray[i]));
        } else {
          clonedArgs.push(argsAsArray[i]);
        }
      }
      context.args = clonedArgs;
    }

    this.track = function(context) {
      if (opts.cloneArgs) {
        argCloner(context);
      }
      calls.push(context);
    };

    this.any = function() {
      return !!calls.length;
    };

    this.count = function() {
      return calls.length;
    };

    this.argsFor = function(index) {
      const call = calls[index];
      return call ? call.args : [];
    };

    this.all = function() {
      return calls;
    };

    this.allArgs = function() {
      const callArgs = [];
      for (let i = 0; i < calls.length; i++) {
        callArgs.push(calls[i].args);
      }

      return callArgs;
    };

    this.first = function() {
      return calls[0];
    };

    this.mostRecent = function() {
      return calls[calls.length - 1];
    };

    this.reset = function() {
      calls = [];
    };

    this.saveArgumentsByValue = function() {
      opts.cloneArgs = true;
    };
  }

  return CallTracker;
};

exports.ExceptionFormatter = function() {
  function ExceptionFormatter() {
    this.message = function(error) {
      let message = '';

      if (error.name && error.message) {
        message += error.name + ': ' + error.message;
      } else {
        message += error.toString() + ' thrown';
      }

      if (error.fileName || error.sourceURL) {
        message += ' in ' + (error.fileName || error.sourceURL);
      }

      if (error.line || error.lineNumber) {
        message += ' (line ' + (error.line || error.lineNumber) + ')';
      }

      return message;
    };

    this.stack = function(error) {
      return error ? error.stack : null;
    };
  }

  return ExceptionFormatter;
};

exports.buildExpectationResult = function() {
  function buildExpectationResult(options) {
    const messageFormatter = options.messageFormatter || function() {};
    const stackFormatter = options.stackFormatter || function() {};

    const result = {
      matcherName: options.matcherName,
      message: message(),
      stack: stack(),
      passed: options.passed,
      // CUSTOM JEST CHANGE: we pass error message to the result.
      error: options.error,
    };

    if (!result.passed) {
      result.expected = options.expected;
      result.actual = options.actual;
    }

    return result;

    function message() {
      if (options.passed) {
        return 'Passed.';
      } else if (options.message) {
        return options.message;
      } else if (options.error) {
        return messageFormatter(options.error);
      }
      return '';
    }

    function stack() {
      if (options.passed) {
        return '';
      }

      let error = options.error;
      if (!error) {
        try {
          throw new Error(message());
        } catch (e) {
          error = e;
        }
      }
      return stackFormatter(error);
    }
  }

  return buildExpectationResult;
};

exports.QueueRunner = function(j$) {
  function once(fn) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        fn();
      }
      return null;
    };
  }

  function QueueRunner(attrs) {
    this.queueableFns = attrs.queueableFns || [];
    this.onComplete = attrs.onComplete || function() {};
    this.clearStack = attrs.clearStack ||
      function(fn) {
        fn();
      };
    this.onException = attrs.onException || function() {};
    this.catchException = attrs.catchException ||
      function() {
        return true;
      };
    this.userContext = attrs.userContext || {};
    this.timeout = attrs.timeout || {
      setTimeout,
      clearTimeout,
    };
    this.fail = attrs.fail || function() {};
  }

  QueueRunner.prototype.execute = function() {
    this.run(this.queueableFns, 0);
  };

  QueueRunner.prototype.run = function(queueableFns, recursiveIndex) {
    const length = queueableFns.length;
    const self = this;
    let iterativeIndex;

    for (
      iterativeIndex = recursiveIndex;
      iterativeIndex < length;
      iterativeIndex++
    ) {
      const queueableFn = queueableFns[iterativeIndex];
      if (queueableFn.fn.length > 0) {
        attemptAsync(queueableFn);
        return;
      } else {
        attemptSync(queueableFn);
      }
    }

    const runnerDone = iterativeIndex >= length;

    if (runnerDone) {
      this.clearStack(this.onComplete);
    }

    function attemptSync(queueableFn) {
      try {
        queueableFn.fn.call(self.userContext);
      } catch (e) {
        handleException(e, queueableFn);
      }
    }

    function attemptAsync(queueableFn) {
      const clearTimeout = function() {
        Function.prototype.apply.apply(self.timeout.clearTimeout, [
          global,
          [timeoutId],
        ]);
      };
      const next = once(() => {
        clearTimeout(timeoutId);
        self.run(queueableFns, iterativeIndex + 1);
      });
      let timeoutId;

      next.fail = function() {
        self.fail.apply(null, arguments);
        next();
      };

      if (queueableFn.timeout) {
        timeoutId = Function.prototype.apply.apply(self.timeout.setTimeout, [
          global,
          [
            function() {
              const error = new Error(
                'Timeout - Async callback was not invoked within ' +
                  'timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.',
              );
              onException(error);
              next();
            },
            queueableFn.timeout(),
          ],
        ]);
      }

      try {
        queueableFn.fn.call(self.userContext, next);
      } catch (e) {
        handleException(e, queueableFn);
        next();
      }
    }

    function onException(e) {
      self.onException(e);
    }

    function handleException(e, queueableFn) {
      onException(e);
      if (!self.catchException(e)) {
        throw e;
      }
    }
  };

  return QueueRunner;
};

exports.ReportDispatcher = function() {
  function ReportDispatcher(methods) {
    const dispatchedMethods = methods || [];

    for (let i = 0; i < dispatchedMethods.length; i++) {
      const method = dispatchedMethods[i];
      this[method] = (function(m) {
        return function() {
          dispatch(m, arguments);
        };
      })(method);
    }

    let reporters = [];
    let fallbackReporter = null;

    this.addReporter = function(reporter) {
      reporters.push(reporter);
    };

    this.provideFallbackReporter = function(reporter) {
      fallbackReporter = reporter;
    };

    this.clearReporters = function() {
      reporters = [];
    };

    return this;

    function dispatch(method, args) {
      if (reporters.length === 0 && fallbackReporter !== null) {
        reporters.push(fallbackReporter);
      }
      for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i];
        if (reporter[method]) {
          reporter[method].apply(reporter, args);
        }
      }
    }
  }

  return ReportDispatcher;
};

exports.SpyRegistry = function(j$) {
  const getErrorMsg = j$.formatErrorMsg(
    '<spyOn>',
    'spyOn(<object>, <methodName>)',
  );

  function SpyRegistry(options) {
    options = options || {};
    const currentSpies = options.currentSpies ||
      function() {
        return [];
      };

    this.allowRespy = function(allow) {
      this.respy = allow;
    };

    this.spyOn = function(obj, methodName) {
      if (j$.util.isUndefined(obj)) {
        throw new Error(
          getErrorMsg(
            'could not find an object to spy upon for ' + methodName + '()',
          ),
        );
      }

      if (j$.util.isUndefined(methodName)) {
        throw new Error(getErrorMsg('No method name supplied'));
      }

      if (j$.util.isUndefined(obj[methodName])) {
        throw new Error(getErrorMsg(methodName + '() method does not exist'));
      }

      if (obj[methodName] && j$.isSpy(obj[methodName])) {
        if (this.respy) {
          return obj[methodName];
        } else {
          throw new Error(
            getErrorMsg(methodName + ' has already been spied upon'),
          );
        }
      }

      let descriptor;
      try {
        descriptor = Object.getOwnPropertyDescriptor(obj, methodName);
      } catch (e) {
        // IE 8 doesn't support `definePropery` on non-DOM nodes
      }

      if (descriptor && !(descriptor.writable || descriptor.set)) {
        throw new Error(
          getErrorMsg(
            methodName + ' is not declared writable or has no setter',
          ),
        );
      }

      const originalMethod = obj[methodName];
      const spiedMethod = j$.createSpy(methodName, originalMethod);
      let restoreStrategy;

      if (Object.prototype.hasOwnProperty.call(obj, methodName)) {
        restoreStrategy = function() {
          obj[methodName] = originalMethod;
        };
      } else {
        restoreStrategy = function() {
          if (!delete obj[methodName]) {
            obj[methodName] = originalMethod;
          }
        };
      }

      currentSpies().push({
        restoreObjectToOriginalState: restoreStrategy,
      });

      obj[methodName] = spiedMethod;

      return spiedMethod;
    };

    this.clearSpies = function() {
      const spies = currentSpies();
      for (let i = spies.length - 1; i >= 0; i--) {
        const spyEntry = spies[i];
        spyEntry.restoreObjectToOriginalState();
      }
    };
  }

  return SpyRegistry;
};

exports.SpyStrategy = function(j$) {
  function SpyStrategy(options) {
    options = options || {};

    const identity = options.name || 'unknown';
    const originalFn = options.fn || function() {};
    const getSpy = options.getSpy || function() {};
    let plan = function() {};

    this.identity = function() {
      return identity;
    };

    this.exec = function() {
      return plan.apply(this, arguments);
    };

    this.callThrough = function() {
      plan = originalFn;
      return getSpy();
    };

    this.returnValue = function(value) {
      plan = function() {
        return value;
      };
      return getSpy();
    };

    this.returnValues = function() {
      const values = Array.prototype.slice.call(arguments);
      plan = function() {
        return values.shift();
      };
      return getSpy();
    };

    this.throwError = function(something) {
      const error = something instanceof Error
        ? something
        : new Error(something);
      plan = function() {
        throw error;
      };
      return getSpy();
    };

    this.callFake = function(fn) {
      if (!j$.isFunction_(fn)) {
        throw new Error(
          'Argument passed to callFake should be a function, got ' + fn,
        );
      }
      plan = fn;
      return getSpy();
    };

    this.stub = function(fn) {
      plan = function() {};
      return getSpy();
    };
  }

  return SpyStrategy;
};

exports.Suite = function(j$) {
  function Suite(attrs) {
    this.env = attrs.env;
    this.id = attrs.id;
    this.parentSuite = attrs.parentSuite;
    this.description = attrs.description;
    this.expectationFactory = attrs.expectationFactory;
    this.expectationResultFactory = attrs.expectationResultFactory;
    this.throwOnExpectationFailure = !!attrs.throwOnExpectationFailure;

    this.beforeFns = [];
    this.afterFns = [];
    this.beforeAllFns = [];
    this.afterAllFns = [];
    this.disabled = false;

    this.children = [];

    this.result = {
      id: this.id,
      description: this.description,
      fullName: this.getFullName(),
      failedExpectations: [],
    };
  }

  Suite.prototype.getFullName = function() {
    const fullName = [];
    for (
      let parentSuite = this;
      parentSuite;
      parentSuite = parentSuite.parentSuite
    ) {
      if (parentSuite.parentSuite) {
        fullName.unshift(parentSuite.description);
      }
    }
    return fullName.join(' ');
  };

  Suite.prototype.disable = function() {
    this.disabled = true;
  };

  Suite.prototype.pend = function(message) {
    this.markedPending = true;
  };

  Suite.prototype.beforeEach = function(fn) {
    this.beforeFns.unshift(fn);
  };

  Suite.prototype.beforeAll = function(fn) {
    this.beforeAllFns.push(fn);
  };

  Suite.prototype.afterEach = function(fn) {
    this.afterFns.unshift(fn);
  };

  Suite.prototype.afterAll = function(fn) {
    this.afterAllFns.push(fn);
  };

  Suite.prototype.addChild = function(child) {
    this.children.push(child);
  };

  Suite.prototype.status = function() {
    if (this.disabled) {
      return 'disabled';
    }

    if (this.markedPending) {
      return 'pending';
    }

    if (this.result.failedExpectations.length > 0) {
      return 'failed';
    } else {
      return 'finished';
    }
  };

  Suite.prototype.isExecutable = function() {
    return !this.disabled;
  };

  Suite.prototype.canBeReentered = function() {
    return this.beforeAllFns.length === 0 && this.afterAllFns.length === 0;
  };

  Suite.prototype.getResult = function() {
    this.result.status = this.status();
    return this.result;
  };

  Suite.prototype.sharedUserContext = function() {
    if (!this.sharedContext) {
      this.sharedContext = {};
    }

    return this.sharedContext;
  };

  Suite.prototype.clonedSharedUserContext = function() {
    return this.sharedUserContext();
  };

  Suite.prototype.onException = function() {
    if (arguments[0] instanceof j$.errors.ExpectationFailed) {
      return;
    }

    if (isAfterAll(this.children)) {
      const data = {
        matcherName: '',
        passed: false,
        expected: '',
        actual: '',
        error: arguments[0],
      };
      this.result.failedExpectations.push(this.expectationResultFactory(data));
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.onException.apply(child, arguments);
      }
    }
  };

  Suite.prototype.addExpectationResult = function() {
    if (isAfterAll(this.children) && isFailure(arguments)) {
      const data = arguments[1];
      this.result.failedExpectations.push(this.expectationResultFactory(data));
      if (this.throwOnExpectationFailure) {
        throw new j$.errors.ExpectationFailed();
      }
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        try {
          child.addExpectationResult.apply(child, arguments);
        } catch (e) {
          // keep going
        }
      }
    }
  };

  function isAfterAll(children) {
    return children && children[0].result.status;
  }

  function isFailure(args) {
    return !args[0];
  }

  return Suite;
};

exports.Timer = function() {
  const defaultNow = (function(Date) {
    return function() {
      return new Date().getTime();
    };
  })(Date);

  function Timer(options) {
    options = options || {};

    const now = options.now || defaultNow;
    let startTime;

    this.start = function() {
      startTime = now();
    };

    this.elapsed = function() {
      return now() - startTime;
    };
  }

  return Timer;
};

exports.TreeProcessor = function() {
  function TreeProcessor(attrs) {
    const tree = attrs.tree;
    const runnableIds = attrs.runnableIds;
    const queueRunnerFactory = attrs.queueRunnerFactory;
    const nodeStart = attrs.nodeStart || function() {};
    const nodeComplete = attrs.nodeComplete || function() {};
    const orderChildren = attrs.orderChildren ||
      function(node) {
        return node.children;
      };
    const defaultMin = Infinity;
    const defaultMax = 1 - Infinity;
    let processed = false;
    let stats = {valid: true};

    this.processTree = function() {
      processNode(tree, false);
      processed = true;
      return stats;
    };

    this.execute = function(done) {
      if (!processed) {
        this.processTree();
      }

      if (!stats.valid) {
        throw new Error('invalid order');
      }

      const childFns = wrapChildren(tree, 0);

      queueRunnerFactory({
        queueableFns: childFns,
        userContext: tree.sharedUserContext(),
        onException() {
          tree.onException.apply(tree, arguments);
        },
        onComplete: done,
      });
    };

    function runnableIndex(id) {
      for (let i = 0; i < runnableIds.length; i++) {
        if (runnableIds[i] === id) {
          return i;
        }
      }
      return void 0;
    }

    function processNode(node, parentEnabled) {
      const executableIndex = runnableIndex(node.id);

      if (executableIndex !== undefined) {
        parentEnabled = true;
      }

      parentEnabled = parentEnabled && node.isExecutable();

      if (!node.children) {
        stats[node.id] = {
          executable: parentEnabled && node.isExecutable(),
          segments: [
            {
              index: 0,
              owner: node,
              nodes: [node],
              min: startingMin(executableIndex),
              max: startingMax(executableIndex),
            },
          ],
        };
      } else {
        let hasExecutableChild = false;

        const orderedChildren = orderChildren(node);

        for (let i = 0; i < orderedChildren.length; i++) {
          const child = orderedChildren[i];

          processNode(child, parentEnabled);

          if (!stats.valid) {
            return;
          }

          const childStats = stats[child.id];

          hasExecutableChild = hasExecutableChild || childStats.executable;
        }

        stats[node.id] = {
          executable: hasExecutableChild,
        };

        segmentChildren(node, orderedChildren, stats[node.id], executableIndex);

        if (!node.canBeReentered() && stats[node.id].segments.length > 1) {
          stats = {valid: false};
        }
      }
    }

    function startingMin(executableIndex) {
      return executableIndex === undefined ? defaultMin : executableIndex;
    }

    function startingMax(executableIndex) {
      return executableIndex === undefined ? defaultMax : executableIndex;
    }

    function segmentChildren(
      node,
      orderedChildren,
      nodeStats,
      executableIndex,
    ) {
      let currentSegment = {
        index: 0,
        owner: node,
        nodes: [],
        min: startingMin(executableIndex),
        max: startingMax(executableIndex),
      };
      const result = [currentSegment];
      const orderedChildSegments = orderChildSegments(orderedChildren);
      let lastMax = defaultMax;

      function isSegmentBoundary(minIndex) {
        return lastMax !== defaultMax &&
          minIndex !== defaultMin &&
          lastMax < minIndex - 1;
      }

      for (let i = 0; i < orderedChildSegments.length; i++) {
        const childSegment = orderedChildSegments[i];
        const maxIndex = childSegment.max;
        const minIndex = childSegment.min;

        if (isSegmentBoundary(minIndex)) {
          currentSegment = {
            index: result.length,
            owner: node,
            nodes: [],
            min: defaultMin,
            max: defaultMax,
          };
          result.push(currentSegment);
        }

        currentSegment.nodes.push(childSegment);
        currentSegment.min = Math.min(currentSegment.min, minIndex);
        currentSegment.max = Math.max(currentSegment.max, maxIndex);
        lastMax = maxIndex;
      }

      nodeStats.segments = result;
    }

    function orderChildSegments(children) {
      const specifiedOrder = [];
      const unspecifiedOrder = [];

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const segments = stats[child.id].segments;

        for (let j = 0; j < segments.length; j++) {
          const seg = segments[j];

          if (seg.min === defaultMin) {
            unspecifiedOrder.push(seg);
          } else {
            specifiedOrder.push(seg);
          }
        }
      }

      specifiedOrder.sort((a, b) => {
        return a.min - b.min;
      });

      return specifiedOrder.concat(unspecifiedOrder);
    }

    function executeNode(node, segmentNumber) {
      if (node.children) {
        return {
          fn(done) {
            nodeStart(node);

            queueRunnerFactory({
              onComplete() {
                nodeComplete(node, node.getResult());
                done();
              },
              queueableFns: wrapChildren(node, segmentNumber),
              userContext: node.sharedUserContext(),
              onException() {
                node.onException.apply(node, arguments);
              },
            });
          },
        };
      } else {
        return {
          fn(done) {
            node.execute(done, stats[node.id].executable);
          },
        };
      }
    }

    function wrapChildren(node, segmentNumber) {
      const result = [];
      const segmentChildren = stats[node.id].segments[segmentNumber].nodes;

      for (let i = 0; i < segmentChildren.length; i++) {
        result.push(
          executeNode(segmentChildren[i].owner, segmentChildren[i].index),
        );
      }

      if (!stats[node.id].executable) {
        return result;
      }

      return node.beforeAllFns.concat(result).concat(node.afterAllFns);
    }
  }

  return TreeProcessor;
};

exports.errors = function() {
  function ExpectationFailed() {}

  ExpectationFailed.prototype = new Error();
  ExpectationFailed.prototype.constructor = ExpectationFailed;

  return {
    ExpectationFailed,
  };
};
exports.formatErrorMsg = function() {
  function generateErrorMsg(domain, usage) {
    const usageDefinition = usage ? '\nUsage: ' + usage : '';

    return function errorMsg(msg) {
      return domain + ' : ' + msg + usageDefinition;
    };
  }

  return generateErrorMsg;
};

exports.interface = function(jasmine, env) {
  const jasmineInterface = {
    describe(description, specDefinitions) {
      return env.describe(description, specDefinitions);
    },

    xdescribe(description, specDefinitions) {
      return env.xdescribe(description, specDefinitions);
    },

    fdescribe(description, specDefinitions) {
      return env.fdescribe(description, specDefinitions);
    },

    it() {
      return env.it.apply(env, arguments);
    },

    xit() {
      return env.xit.apply(env, arguments);
    },

    fit() {
      return env.fit.apply(env, arguments);
    },

    beforeEach() {
      return env.beforeEach.apply(env, arguments);
    },

    afterEach() {
      return env.afterEach.apply(env, arguments);
    },

    beforeAll() {
      return env.beforeAll.apply(env, arguments);
    },

    afterAll() {
      return env.afterAll.apply(env, arguments);
    },

    pending() {
      return env.pending.apply(env, arguments);
    },

    fail() {
      return env.fail.apply(env, arguments);
    },

    spyOn(obj, methodName) {
      return env.spyOn(obj, methodName);
    },

    jsApiReporter: new jasmine.JsApiReporter({
      timer: new jasmine.Timer(),
    }),

    jasmine,
  };

  return jasmineInterface;
};

exports.version = function() {
  return '2.5.2-custom';
};
