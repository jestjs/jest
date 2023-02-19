/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {readFileSync} from 'graceful-fs';
import slash = require('slash');
import tempy = require('tempy');
import {
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
  getTopFrame,
} from '..';

const rootDir = tempy.directory();

jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  readFileSync: jest.fn(),
}));

const unixStackTrace =
  '  ' +
  `at stack (../jest-jasmine2/build/jasmine-2.4.1.js:1580:17)
  at Object.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:1550:14)
  at jasmine.addResult (../jest-jasmine2/build/index.js:82:44)
  at Spec.Env.factory (../jest-jasmine2/build/jasmine-2.4.1.js:641:18)
  at Spec.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:333:34)
  at Expectation.addResult (../jest-jasmine2/build/jasmine-2.4.1.js:591:21)
  at Expectation.toBe (../jest-jasmine2/build/jasmine-2.4.1.js:1504:12)
  at Object.it (build/__tests__/messages-test.js:45:41)
  at Object.<anonymous> (../jest-jasmine2/build/jasmine-pit.js:35:32)
  at attemptAsync (../jest-jasmine2/build/jasmine-2.4.1.js:1919:24)`;
const unixError = new Error(unixStackTrace.replace(/\n\s*at [\s\s]*/m, ''));
unixError.stack = unixStackTrace;

const assertionStack =
  '  ' +
  `
    Expected value to be of type:
      "number"
    Received:
      ""
    type:
      "string"

      at Object.it (__tests__/test.js:8:14)
      at Object.asyncFn (node_modules/jest-jasmine2/build/jasmine_async.js:124:345)
      at resolve (node_modules/jest-jasmine2/build/queue_runner.js:46:12)
          at Promise (<anonymous>)
      at mapper (node_modules/jest-jasmine2/build/queue_runner.js:34:499)
      at promise.then (node_modules/jest-jasmine2/build/queue_runner.js:74:39)
          at <anonymous>
      at process._tickCallback (internal/process/next_tick.js:188:7)
      at internal/process/next_tick.js:188:7
`;
const assertionError = new Error(
  assertionStack.replace(/\n\s*at [\s\s]*/m, ''),
);
assertionError.stack = assertionStack;

const vendorStack =
  '  ' +
  `
    Expected value to be of type:
      "number"
    Received:
      ""
    type:
      "string"

      at Object.it (__tests__/vendor/cool_test.js:6:666)
      at Object.asyncFn (__tests__/vendor/sulu/node_modules/sulu-content-bundle/best_component.js:1:5)
`;

const babelStack =
  '  ' +
  `
    packages/react/src/forwardRef.js: Unexpected token, expected , (20:10)
    \u001b[0m \u001b[90m 18 | \u001b[39m        \u001b[36mfalse\u001b[39m\u001b[33m,\u001b[39m
     \u001b[90m 19 | \u001b[39m        \u001b[32m'forwardRef requires a render function but received a \`memo\` '\u001b[39m
    \u001b[31m\u001b[1m>\u001b[22m\u001b[39m\u001b[90m 20 | \u001b[39m          \u001b[32m'component. Instead of forwardRef(memo(...)), use '\u001b[39m \u001b[33m+\u001b[39m
     \u001b[90m    | \u001b[39m          \u001b[31m\u001b[1m^\u001b[22m\u001b[39m
     \u001b[90m 21 | \u001b[39m          \u001b[32m'memo(forwardRef(...)).'\u001b[39m\u001b[33m,\u001b[39m
     \u001b[90m 22 | \u001b[39m      )\u001b[33m;\u001b[39m
     \u001b[90m 23 | \u001b[39m    } \u001b[36melse\u001b[39m \u001b[36mif\u001b[39m (\u001b[36mtypeof\u001b[39m render \u001b[33m!==\u001b[39m \u001b[32m'function'\u001b[39m) {\u001b[0m
`;
const babelError = new Error(babelStack.replace(/\n\s*at [\s\s]*/m, ''));
babelError.stack = babelStack;

const errorWithCauseNestedNested = new Error('boom');
errorWithCauseNestedNested.stack = `Error: boom
    at h (cause.test.js:2:9)
    at h (cause.test.js:6:5)
    at g (cause.test.js:13:5)
    at Object.f (cause.test.js:20:5)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:293:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:226:10)
    at _callCircusTest (node_modules/jest-circus/build/run.js:248:40)
    at _runTest (node_modules/jest-circus/build/run.js:184:3)
    at _runTestsForDescribeBlock (node_modules/jest-circus/build/run.js:86:9)
    at run (node_modules/jest-circus/build/run.js:26:3)
    at runAndTransformResultsToJestFormat (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:120:21)
    at jestAdapter (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:74:19)
    at runTestInternal (node_modules/jest-runner/build/runTest.js:281:16)
    at runTest (node_modules/jest-runner/build/runTest.js:341:7)`;

const errorWithCauseNested = new Error('intercepted by g', {
  cause: errorWithCauseNestedNested,
});
errorWithCauseNested.stack = `Error: intercepted by g
    at g (cause.test.js:8:11)
    at g (cause.test.js:13:5)
    at Object.f (cause.test.js:20:5)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:293:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:226:10)
    at _callCircusTest (node_modules/jest-circus/build/run.js:248:40)
    at _runTest (node_modules/jest-circus/build/run.js:184:3)
    at _runTestsForDescribeBlock (node_modules/jest-circus/build/run.js:86:9)
    at run (node_modules/jest-circus/build/run.js:26:3)
    at runAndTransformResultsToJestFormat (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:120:21)
    at jestAdapter (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:74:19)
    at runTestInternal (node_modules/jest-runner/build/runTest.js:281:16)
    at runTest (node_modules/jest-runner/build/runTest.js:341:7)`;

const errorWithCause = new Error('intercepted by f', {
  cause: errorWithCauseNested,
});
errorWithCause.stack = `Error: intercepted by f
    at f (cause.test.js:15:11)
    at Object.f (cause.test.js:20:5)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:293:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:226:10)
    at _callCircusTest (node_modules/jest-circus/build/run.js:248:40)
    at _runTest (node_modules/jest-circus/build/run.js:184:3)
    at _runTestsForDescribeBlock (node_modules/jest-circus/build/run.js:86:9)
    at run (node_modules/jest-circus/build/run.js:26:3)
    at runAndTransformResultsToJestFormat (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:120:21)
    at jestAdapter (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:74:19)
    at runTestInternal (node_modules/jest-runner/build/runTest.js:281:16)
    at runTest (node_modules/jest-runner/build/runTest.js:341:7)`;

const errorWithStringCause = new Error('boom', {
  cause: 'string cause',
});
errorWithStringCause.stack = `Error: boom
    at f (cause.test.js:15:11)
    at Object.f (cause.test.js:20:5)
    at Promise.then.completed (node_modules/jest-circus/build/utils.js:293:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (node_modules/jest-circus/build/utils.js:226:10)
    at _callCircusTest (node_modules/jest-circus/build/run.js:248:40)
    at _runTest (node_modules/jest-circus/build/run.js:184:3)
    at _runTestsForDescribeBlock (node_modules/jest-circus/build/run.js:86:9)
    at run (node_modules/jest-circus/build/run.js:26:3)
    at runAndTransformResultsToJestFormat (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:120:21)
    at jestAdapter (node_modules/jest-circus/build/legacy-code-todo-rewrite/jestAdapter.js:74:19)
    at runTestInternal (node_modules/jest-runner/build/runTest.js:281:16)
    at runTest (node_modules/jest-runner/build/runTest.js:341:7)`;

beforeEach(() => {
  jest.clearAllMocks();
});

it('should exclude jasmine from stack trace for Unix paths.', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [unixError],
        failureMessages: [unixStackTrace],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Unix test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('.formatExecError()', () => {
  const message = formatExecError(
    {
      message: 'Whoops!',
      stack: '',
    },
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});

it('formatStackTrace should strip node internals', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [assertionError],
        failureMessages: [assertionStack],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Unix test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('should not exclude vendor from stack trace', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [],
        failureMessages: [vendorStack],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Vendor test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('retains message in babel code frame error', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [babelError],
        failureMessages: [babelStack],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Babel test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('formatStackTrace should properly handle deeply nested causes', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [errorWithCause],
        failureMessages: [errorWithCause.stack || ''],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Error with cause test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('formatStackTrace should properly handle string causes', () => {
  const messages = formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [errorWithStringCause],
        failureMessages: [errorWithStringCause.stack || ''],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'Error with string cause test',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

  expect(messages).toMatchSnapshot();
});

it('codeframe', () => {
  jest
    .mocked(readFileSync)
    .mockImplementationOnce(() => 'throw new Error("Whoops!");');

  const message = formatExecError(
    {
      message: 'Whoops!',
      stack: `
    at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
    at Module._compile (internal/modules/cjs/loader.js:1158:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
    at Module.load (internal/modules/cjs/loader.js:1002:32)
    at Function.Module._load (internal/modules/cjs/loader.js:901:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
`,
    },
    {
      rootDir,
      testMatch: [],
    },
    {
      noCodeFrame: false,
      noStackTrace: false,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});

it('no codeframe', () => {
  jest
    .mocked(readFileSync)
    .mockImplementationOnce(() => 'throw new Error("Whoops!");');

  const message = formatExecError(
    {
      message: 'Whoops!',
      stack: `
    at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
    at Module._compile (internal/modules/cjs/loader.js:1158:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
    at Module.load (internal/modules/cjs/loader.js:1002:32)
    at Function.Module._load (internal/modules/cjs/loader.js:901:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
`,
    },
    {
      rootDir,
      testMatch: [],
    },
    {
      noCodeFrame: true,
      noStackTrace: false,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});

it('no stack', () => {
  jest
    .mocked(readFileSync)
    .mockImplementationOnce(() => 'throw new Error("Whoops!");');

  const message = formatExecError(
    {
      message: 'Whoops!',
      stack: `
    at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
    at Module._compile (internal/modules/cjs/loader.js:1158:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
    at Module.load (internal/modules/cjs/loader.js:1002:32)
    at Function.Module._load (internal/modules/cjs/loader.js:901:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
`,
    },
    {
      rootDir,
      testMatch: [],
    },
    {
      // if no stack, no codeframe is implied
      noCodeFrame: true,
      noStackTrace: true,
    },
    'path_test',
  );

  expect(message).toMatchSnapshot();
});

describe('formatStackTrace', () => {
  it('prints code frame and stacktrace', () => {
    jest
      .mocked(readFileSync)
      .mockImplementationOnce(() => 'throw new Error("Whoops!");');
    const message = formatStackTrace(
      `
      at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
      at Module._compile (internal/modules/cjs/loader.js:1158:30)
      at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
      at Module.load (internal/modules/cjs/loader.js:1002:32)
      at Function.Module._load (internal/modules/cjs/loader.js:901:14)
      at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
  `,
      {
        rootDir,
        testMatch: [],
      },
      {
        noCodeFrame: false,
        noStackTrace: false,
      },
      'path_test',
    );

    expect(message).toMatchSnapshot();
  });

  it('does not print code frame when noCodeFrame = true', () => {
    jest
      .mocked(readFileSync)
      .mockImplementationOnce(() => 'throw new Error("Whoops!");');
    const message = formatStackTrace(
      `
      at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
      at Module._compile (internal/modules/cjs/loader.js:1158:30)
      at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
      at Module.load (internal/modules/cjs/loader.js:1002:32)
      at Function.Module._load (internal/modules/cjs/loader.js:901:14)
      at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
  `,
      {
        rootDir,
        testMatch: [],
      },
      {
        noCodeFrame: true,
        noStackTrace: false,
      },
      'path_test',
    );

    expect(message).toMatchSnapshot();
  });

  it('does not print codeframe when noStackTrace = true', () => {
    jest
      .mocked(readFileSync)
      .mockImplementationOnce(() => 'throw new Error("Whoops!");');
    const message = formatStackTrace(
      `
      at Object.<anonymous> (${slash(rootDir)}/file.js:1:7)
      at Module._compile (internal/modules/cjs/loader.js:1158:30)
      at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)
      at Module.load (internal/modules/cjs/loader.js:1002:32)
      at Function.Module._load (internal/modules/cjs/loader.js:901:14)
      at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:74:12)
  `,
      {
        rootDir,
        testMatch: [],
      },
      {
        noStackTrace: true,
      },
      'path_test',
    );

    expect(message).toMatchSnapshot();
  });
});

it('getTopFrame should return a path for mjs files', () => {
  let stack: Array<string>;
  let expectedFile: string;
  if (process.platform === 'win32') {
    stack = ['  at stack (file:///C:/Users/user/project/inline.mjs:1:1)'];
    expectedFile = 'C:/Users/user/project/inline.mjs';
  } else {
    stack = ['  at stack (file:///Users/user/project/inline.mjs:1:1)'];
    expectedFile = '/Users/user/project/inline.mjs';
  }
  const frame = getTopFrame(stack);

  expect(frame!.file).toBe(expectedFile);
});

it('should return the error cause if there is one', () => {
  const error = new Error('Test exception');
  // TODO pass `cause` to the `Error` constructor when lowest supported Node version is 16.9.0 and above
  // See https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V16.md#error-cause
  error.cause = new Error('Cause Error');
  const message = formatExecError(
    error,
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );
  expect(message).toMatchSnapshot();
});
