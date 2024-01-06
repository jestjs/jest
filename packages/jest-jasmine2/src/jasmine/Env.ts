/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This file is a heavily modified fork of Jasmine. Original license:
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

import {AssertionError} from 'assert';
import type {Circus} from '@jest/types';
import {ErrorWithStack, convertDescriptorToString, isPromise} from 'jest-util';
import assertionErrorMessage from '../assertionErrorMessage';
import isError from '../isError';
import queueRunner, {
  type Options as QueueRunnerOptions,
  type QueueableFn,
} from '../queueRunner';
import treeProcessor, {type TreeNode} from '../treeProcessor';
import type {
  AssertionErrorWithStack,
  Jasmine,
  Reporter,
  SpecDefinitionsFn,
  Spy,
} from '../types';
import type {default as Spec, SpecResult} from './Spec';
import type Suite from './Suite';

export default function jasmineEnv(j$: Jasmine) {
  return class Env {
    specFilter: (spec: Spec) => boolean;
    catchExceptions: (value: unknown) => boolean;
    throwOnExpectationFailure: (value: unknown) => void;
    catchingExceptions: () => boolean;
    topSuite: () => Suite;
    fail: (error: Error | AssertionErrorWithStack) => void;
    pending: (message: string) => void;
    afterAll: (afterAllFunction: QueueableFn['fn'], timeout?: number) => void;
    fit: (
      description: Circus.TestNameLike,
      fn: QueueableFn['fn'],
      timeout?: number,
    ) => Spec;
    throwingExpectationFailures: () => boolean;
    randomizeTests: (value: unknown) => void;
    randomTests: () => boolean;
    seed: (value: unknown) => unknown;
    execute: (
      runnablesToRun?: Array<string>,
      suiteTree?: Suite,
    ) => Promise<void>;
    fdescribe: (
      description: Circus.TestNameLike,
      specDefinitions: SpecDefinitionsFn,
    ) => Suite;
    spyOn: (
      obj: Record<string, Spy>,
      methodName: string,
      accessType?: keyof PropertyDescriptor,
    ) => Spy;
    beforeEach: (
      beforeEachFunction: QueueableFn['fn'],
      timeout?: number,
    ) => void;
    afterEach: (afterEachFunction: QueueableFn['fn'], timeout?: number) => void;
    clearReporters: () => void;
    addReporter: (reporterToAdd: Reporter) => void;
    it: (
      description: Circus.TestNameLike,
      fn: QueueableFn['fn'],
      timeout?: number,
    ) => Spec;
    xdescribe: (
      description: Circus.TestNameLike,
      specDefinitions: SpecDefinitionsFn,
    ) => Suite;
    xit: (
      description: Circus.TestNameLike,
      fn: QueueableFn['fn'],
      timeout?: number,
    ) => Spec;
    beforeAll: (beforeAllFunction: QueueableFn['fn'], timeout?: number) => void;
    todo: () => Spec;
    provideFallbackReporter: (reporterToAdd: Reporter) => void;
    allowRespy: (allow: boolean) => void;
    describe: (
      description: Circus.TestNameLike,
      specDefinitions: SpecDefinitionsFn,
    ) => Suite;

    constructor() {
      let totalSpecsDefined = 0;

      let catchExceptions = true;

      const realSetTimeout = globalThis.setTimeout;
      const realClearTimeout = globalThis.clearTimeout;

      const runnableResources: Record<string, {spies: Array<Spy>}> = {};
      const currentlyExecutingSuites: Array<Suite> = [];
      let currentSpec: Spec | null = null;
      let throwOnExpectationFailure = false;
      let random = false;
      let seed: unknown | null = null;
      let nextSpecId = 0;
      let nextSuiteId = 0;

      const getNextSpecId = function () {
        return `spec${nextSpecId++}`;
      };

      const getNextSuiteId = function () {
        return `suite${nextSuiteId++}`;
      };

      const topSuite = new j$.Suite({
        id: getNextSuiteId(),
        description: '',
        getTestPath() {
          return j$.testPath;
        },
      });
      let currentDeclarationSuite = topSuite;

      const currentSuite = function () {
        return currentlyExecutingSuites.at(-1)!;
      };

      const currentRunnable = function () {
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

      this.specFilter = function () {
        return true;
      };

      const defaultResourcesForRunnable = function (
        id: string,
        _parentRunnableId?: string,
      ) {
        const resources = {spies: []};

        runnableResources[id] = resources;
      };

      const clearResourcesForRunnable = function (id: string) {
        spyRegistry.clearSpies();
        delete runnableResources[id];
      };

      const beforeAndAfterFns = function (suite: Suite) {
        return function () {
          let afters: Array<QueueableFn> = [];
          let befores: Array<QueueableFn> = [];

          while (suite) {
            befores = befores.concat(suite.beforeFns);
            afters = afters.concat(suite.afterFns);

            suite = suite.parentSuite!;
          }

          return {
            befores: befores.reverse(),
            afters,
          };
        };
      };

      const getSpecName = function (spec: Spec, suite: Suite) {
        const fullName = [spec.description];
        const suiteFullName = suite.getFullName();

        if (suiteFullName !== '') {
          fullName.unshift(suiteFullName);
        }

        return fullName.join(' ');
      };

      this.catchExceptions = function (value) {
        catchExceptions = !!value;
        return catchExceptions;
      };

      this.catchingExceptions = function () {
        return catchExceptions;
      };

      this.throwOnExpectationFailure = function (value) {
        throwOnExpectationFailure = !!value;
      };

      this.throwingExpectationFailures = function () {
        return throwOnExpectationFailure;
      };

      this.randomizeTests = function (value) {
        random = !!value;
      };

      this.randomTests = function () {
        return random;
      };

      this.seed = function (value) {
        if (value) {
          seed = value;
        }
        return seed;
      };

      const queueRunnerFactory = (options: QueueRunnerOptions) => {
        options.clearTimeout = realClearTimeout;
        options.fail = this.fail;
        options.setTimeout = realSetTimeout;
        return queueRunner(options);
      };

      this.topSuite = function () {
        return topSuite;
      };

      const uncaught: NodeJS.UncaughtExceptionListener &
        NodeJS.UnhandledRejectionListener = (err: any) => {
        if (currentSpec) {
          currentSpec.onException(err);
          currentSpec.cancel();
        } else {
          console.error('Unhandled error');
          console.error(err.stack);
        }
      };

      let oldListenersException: Array<NodeJS.UncaughtExceptionListener>;
      let oldListenersRejection: Array<NodeJS.UnhandledRejectionListener>;
      const executionSetup = function () {
        // Need to ensure we are the only ones handling these exceptions.
        oldListenersException = [...process.listeners('uncaughtException')];
        oldListenersRejection = [...process.listeners('unhandledRejection')];

        j$.process.removeAllListeners('uncaughtException');
        j$.process.removeAllListeners('unhandledRejection');

        j$.process.on('uncaughtException', uncaught);
        j$.process.on('unhandledRejection', uncaught);
      };

      const executionTeardown = function () {
        j$.process.removeListener('uncaughtException', uncaught);
        j$.process.removeListener('unhandledRejection', uncaught);

        // restore previous exception handlers
        for (const listener of oldListenersException) {
          j$.process.on('uncaughtException', listener);
        }

        for (const listener of oldListenersRejection) {
          j$.process.on('unhandledRejection', listener);
        }
      };

      this.execute = async function (runnablesToRun, suiteTree = topSuite) {
        if (!runnablesToRun) {
          if (focusedRunnables.length > 0) {
            runnablesToRun = focusedRunnables;
          } else {
            runnablesToRun = [suiteTree.id];
          }
        }

        if (currentlyExecutingSuites.length === 0) {
          executionSetup();
        }

        const lastDeclarationSuite = currentDeclarationSuite;

        await treeProcessor({
          nodeComplete(suite) {
            if (!suite.disabled) {
              clearResourcesForRunnable(suite.id);
            }
            currentlyExecutingSuites.pop();
            if (suite === topSuite) {
              reporter.jasmineDone({
                failedExpectations: topSuite.result.failedExpectations,
              });
            } else {
              reporter.suiteDone(suite.getResult());
            }
          },
          nodeStart(suite) {
            currentlyExecutingSuites.push(suite as Suite);
            defaultResourcesForRunnable(
              suite.id,
              suite.parentSuite && suite.parentSuite.id,
            );
            if (suite === topSuite) {
              reporter.jasmineStarted({totalSpecsDefined});
            } else {
              reporter.suiteStarted(suite.result);
            }
          },
          queueRunnerFactory,
          runnableIds: runnablesToRun,
          tree: suiteTree as TreeNode,
        });

        currentDeclarationSuite = lastDeclarationSuite;

        if (currentlyExecutingSuites.length === 0) {
          executionTeardown();
        }
      };

      this.addReporter = function (reporterToAdd) {
        reporter.addReporter(reporterToAdd);
      };

      this.provideFallbackReporter = function (reporterToAdd) {
        reporter.provideFallbackReporter(reporterToAdd);
      };

      this.clearReporters = function () {
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

      this.allowRespy = function (allow) {
        spyRegistry.allowRespy(allow);
      };

      this.spyOn = function (...args) {
        return spyRegistry.spyOn.apply(spyRegistry, args);
      };

      const suiteFactory = function (description: Circus.TestNameLike) {
        const suite = new j$.Suite({
          id: getNextSuiteId(),
          description,
          parentSuite: currentDeclarationSuite,
          throwOnExpectationFailure,
          getTestPath() {
            return j$.testPath;
          },
        });

        return suite;
      };

      this.describe = function (
        description: Circus.TestNameLike,
        specDefinitions,
      ) {
        const suite = suiteFactory(description);
        if (specDefinitions === undefined) {
          throw new Error(
            'Missing second argument. It must be a callback function.',
          );
        }
        if (typeof specDefinitions !== 'function') {
          throw new TypeError(
            `Invalid second argument, ${specDefinitions}. It must be a callback function.`,
          );
        }
        if (specDefinitions.length > 0) {
          throw new Error('describe does not expect any arguments');
        }
        if (currentDeclarationSuite.markedPending) {
          suite.pend();
        }
        if (currentDeclarationSuite.markedTodo) {
          // @ts-expect-error TODO Possible error: Suite does not have todo method
          suite.todo();
        }
        addSpecsToSuite(suite, specDefinitions);
        return suite;
      };

      this.xdescribe = function (description, specDefinitions) {
        const suite = suiteFactory(description);
        suite.pend();
        addSpecsToSuite(suite, specDefinitions);
        return suite;
      };

      const focusedRunnables: Array<string> = [];

      this.fdescribe = function (description, specDefinitions) {
        const suite = suiteFactory(description);
        suite.isFocused = true;

        focusedRunnables.push(suite.id);
        unfocusAncestor();
        addSpecsToSuite(suite, specDefinitions);

        return suite;
      };

      const addSpecsToSuite = (
        suite: Suite,
        specDefinitions: SpecDefinitionsFn,
      ) => {
        const parentSuite = currentDeclarationSuite;
        parentSuite.addChild(suite);
        currentDeclarationSuite = suite;

        let declarationError: undefined | Error = undefined;
        let describeReturnValue: unknown | Error;
        try {
          describeReturnValue = specDefinitions.call(suite);
        } catch (error: any) {
          declarationError = error;
        }

        if (isPromise(describeReturnValue)) {
          declarationError = new Error(
            'Returning a Promise from "describe" is not supported. Tests must be defined synchronously.',
          );
        } else if (describeReturnValue !== undefined) {
          declarationError = new Error(
            'A "describe" callback must not return a value.',
          );
        }

        if (declarationError) {
          this.it('encountered a declaration exception', () => {
            throw declarationError;
          });
        }

        currentDeclarationSuite = parentSuite;
      };

      function findFocusedAncestor(suite: Suite) {
        while (suite) {
          if (suite.isFocused) {
            return suite.id;
          }
          suite = suite.parentSuite!;
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

      const specFactory = (
        description: Circus.TestNameLike,
        fn: QueueableFn['fn'],
        suite: Suite,
        timeout?: number,
      ): Spec => {
        totalSpecsDefined++;
        const spec = new j$.Spec({
          id: getNextSpecId(),
          beforeAndAfterFns: beforeAndAfterFns(suite),
          resultCallback: specResultCallback,
          getSpecName(spec: Spec) {
            return getSpecName(spec, suite);
          },
          getTestPath() {
            return j$.testPath;
          },
          onStart: specStarted,
          description,
          queueRunnerFactory,
          userContext() {
            return suite.clonedSharedUserContext();
          },
          queueableFn: {
            fn,
            timeout() {
              return timeout || j$._DEFAULT_TIMEOUT_INTERVAL;
            },
          },
          throwOnExpectationFailure,
        });

        if (!this.specFilter(spec)) {
          spec.disable();
        }

        return spec;

        function specResultCallback(result: SpecResult) {
          clearResourcesForRunnable(spec.id);
          currentSpec = null;
          reporter.specDone(result);
        }

        function specStarted(spec: Spec) {
          currentSpec = spec;
          defaultResourcesForRunnable(spec.id, suite.id);
          reporter.specStarted(spec.result);
        }
      };

      this.it = function (description, fn, timeout) {
        description = convertDescriptorToString(description);
        if (fn === undefined) {
          throw new Error(
            'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.',
          );
        }
        if (typeof fn !== 'function') {
          throw new TypeError(
            `Invalid second argument, ${fn}. It must be a callback function.`,
          );
        }
        const spec = specFactory(
          description,
          fn,
          currentDeclarationSuite,
          timeout,
        );
        if (currentDeclarationSuite.markedPending) {
          spec.pend();
        }

        // When a test is defined inside another, jasmine will not run it.
        // This check throws an error to warn the user about the edge-case.
        if (currentSpec !== null) {
          throw new Error(
            `Tests cannot be nested. Test "${spec.description}" cannot run because it is nested within "${currentSpec.description}".`,
          );
        }
        currentDeclarationSuite.addChild(spec);
        return spec;
      };

      this.xit = function (...args) {
        const spec = this.it.apply(this, args);
        spec.pend('Temporarily disabled with xit');
        return spec;
      };

      this.todo = function () {
        const description = arguments[0];
        if (arguments.length !== 1 || typeof description !== 'string') {
          throw new ErrorWithStack(
            'Todo must be called with only a description.',
            this.todo,
          );
        }

        const spec = specFactory(
          description,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
          currentDeclarationSuite,
        );
        if (currentDeclarationSuite.markedPending) {
          spec.pend();
        } else {
          spec.todo();
        }
        currentDeclarationSuite.addChild(spec);
        return spec;
      };

      this.fit = function (description, fn, timeout) {
        const spec = specFactory(
          description,
          fn,
          currentDeclarationSuite,
          timeout,
        );
        currentDeclarationSuite.addChild(spec);
        if (currentDeclarationSuite.markedPending) {
          spec.pend();
        } else {
          focusedRunnables.push(spec.id);
        }
        unfocusAncestor();
        return spec;
      };

      this.beforeEach = function (beforeEachFunction, timeout) {
        currentDeclarationSuite.beforeEach({
          fn: beforeEachFunction,
          timeout() {
            return timeout || j$._DEFAULT_TIMEOUT_INTERVAL;
          },
        });
      };

      this.beforeAll = function (beforeAllFunction, timeout) {
        currentDeclarationSuite.beforeAll({
          fn: beforeAllFunction,
          timeout() {
            return timeout || j$._DEFAULT_TIMEOUT_INTERVAL;
          },
        });
      };

      this.afterEach = function (afterEachFunction, timeout) {
        currentDeclarationSuite.afterEach({
          fn: afterEachFunction,
          timeout() {
            return timeout || j$._DEFAULT_TIMEOUT_INTERVAL;
          },
        });
      };

      this.afterAll = function (afterAllFunction, timeout) {
        currentDeclarationSuite.afterAll({
          fn: afterAllFunction,
          timeout() {
            return timeout || j$._DEFAULT_TIMEOUT_INTERVAL;
          },
        });
      };

      this.pending = function (message) {
        let fullMessage = j$.Spec.pendingSpecExceptionMessage;
        if (message) {
          fullMessage += message;
        }
        throw fullMessage;
      };

      this.fail = function (error) {
        let checkIsError;
        let message;

        if (
          error instanceof AssertionError ||
          (error && error.name === AssertionError.name)
        ) {
          checkIsError = false;
          // @ts-expect-error TODO Possible error: j$.Spec does not have expand property
          message = assertionErrorMessage(error, {expand: j$.Spec.expand});
        } else {
          const check = isError(error);

          checkIsError = check.isError;
          message = check.message || undefined;
        }
        const errorAsErrorObject = checkIsError ? error : new Error(message);
        const runnable = currentRunnable();

        if (!runnable) {
          errorAsErrorObject.message = `Caught error after test environment was torn down\n\n${errorAsErrorObject.message}`;

          throw errorAsErrorObject;
        }

        runnable.addExpectationResult(false, {
          matcherName: '',
          passed: false,
          expected: '',
          actual: '',
          message,
          error: errorAsErrorObject,
        });
      };
    }
  };
}
