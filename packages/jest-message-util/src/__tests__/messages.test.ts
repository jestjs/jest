/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as path from 'path';
import {stripVTControlCharacters} from 'util';
import {readFileSync} from 'graceful-fs';
import slash from 'slash';
import tempy from 'tempy';
import {
  flattenErrorStack,
  formatErrorStack,
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
  getStackTraceLines,
  getTopFrame,
  hasNestedErrors,
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
const unixError = new Error(unixStackTrace.replace(/\n\s*at \s*/m, ''));
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
const assertionError = new Error(assertionStack.replace(/\n\s*at \s*/m, ''));
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
    \u001B[0m \u001B[90m 18 | \u001B[39m        \u001B[36mfalse\u001B[39m\u001B[33m,\u001B[39m
     \u001B[90m 19 | \u001B[39m        \u001B[32m'forwardRef requires a render function but received a \`memo\` '\u001B[39m
    \u001B[31m\u001B[1m>\u001B[22m\u001B[39m\u001B[90m 20 | \u001B[39m          \u001B[32m'component. Instead of forwardRef(memo(...)), use '\u001B[39m \u001B[33m+\u001B[39m
     \u001B[90m    | \u001B[39m          \u001B[31m\u001B[1m^\u001B[22m\u001B[39m
     \u001B[90m 21 | \u001B[39m          \u001B[32m'memo(forwardRef(...)).'\u001B[39m\u001B[33m,\u001B[39m
     \u001B[90m 22 | \u001B[39m      )\u001B[33m;\u001B[39m
     \u001B[90m 23 | \u001B[39m    } \u001B[36melse\u001B[39m \u001B[36mif\u001B[39m (\u001B[36mtypeof\u001B[39m render \u001B[33m!==\u001B[39m \u001B[32m'function'\u001B[39m) {\u001B[0m
`;
const babelError = new Error(babelStack.replace(/\n\s*at \s*/m, ''));
babelError.stack = babelStack;

function buildErrorWithCause(message: string, opts: {cause: unknown}): Error {
  const error = new Error(message, opts);
  if (opts.cause !== error.cause) {
    // Error with cause not supported in legacy versions of node, we just polyfill it
    Object.assign(error, opts);
  }
  return error;
}

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

const errorWithCauseNested = buildErrorWithCause('intercepted by g', {
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

const errorWithCause = buildErrorWithCause('intercepted by f', {
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

const errorWithStringCause = buildErrorWithCause('boom', {
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
  const error = new Error('Test exception', {
    cause: new Error('Cause Error'),
  });
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

it('should return the inner errors of an AggregateError', () => {
  // See https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
  const aggError = new AggregateError([new Error('Err 1'), new Error('Err 2')]);
  const message = formatExecError(
    aggError,
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

const formatAggregateErrorFailure = (
  aggError: AggregateError,
  noStackTrace: boolean,
) =>
  formatResultsErrors(
    [
      {
        ancestorTitles: [],
        duration: undefined,
        failureDetails: [aggError],
        failureMessages: [aggError.stack || ''],
        fullName: 'full name',
        invocations: undefined,
        location: null,
        numPassingAsserts: 0,
        retryReasons: undefined,
        status: 'failed',
        title: 'AggregateError test failure',
      },
    ],
    {
      rootDir: '',
      testMatch: [],
    },
    {
      noStackTrace,
    },
  );

it('should return the inner errors of an AggregateError test failure with their stacks', () => {
  const aggError = new AggregateError([
    new Error('inner reason A'),
    new Error('inner reason B'),
  ]);

  expect(formatAggregateErrorFailure(aggError, false)).toMatchSnapshot();
});

it('should return the nested inner errors of an AggregateError test failure', () => {
  const aggError = new AggregateError([
    new Error('outer reason', {cause: new Error('the cause')}),
    new AggregateError([new Error('deeply nested')]),
  ]);

  expect(formatAggregateErrorFailure(aggError, true)).toMatchSnapshot();
});

it('should not crash on AggregateError test failures holding non-errors', () => {
  // `Promise.reject(null)` ends up here, so `errors` can hold anything.
  const aggError = new AggregateError([
    null,
    undefined,
    42,
    'a string',
    {code: 'E_OOPS'},
  ]);

  expect(formatAggregateErrorFailure(aggError, true)).toMatchSnapshot();
});

it('should not add a section for an empty AggregateError test failure', () => {
  const messages = formatAggregateErrorFailure(new AggregateError([]), true);

  expect(messages).not.toContain('Errors contained in AggregateError');
  expect(messages).toMatchSnapshot();
});

it('should not leave consecutive blank lines between a message and its sections', () => {
  const aggError = new AggregateError([new Error('inner reason')]);
  // An AggregateError from `Promise.any` has no frames of its own left after
  // filtering, which used to leave the stack as a lone newline next to the
  // section separator.
  aggError.stack = 'AggregateError: All promises were rejected';

  expect(formatAggregateErrorFailure(aggError, false)).not.toMatch(/\n\n\n/);
});

it('should preserve blank lines inside the error message itself', () => {
  const error = new Error('first part\n\n\nsecond part');
  error.stack = '';

  expect(
    formatExecError(error, {rootDir: '', testMatch: []}, {noStackTrace: true}),
  ).toContain('first part\n\n\n    second part');
});

// The real stacks of these fixtures would embed absolute paths and Jest's own
// build line numbers, so they get a fixed one-frame stack instead. That keeps
// the flattened output short enough to assert on in full.
const buildErrorFixture = (message: string, cause?: unknown): Error => {
  const error = buildErrorWithCause(message, {cause});
  error.stack = `Error: ${message}\n    at ${message} (flatten.test.js:1:1)`;
  return error;
};

const buildAggregateFixture = (
  message: string,
  errors: Array<unknown>,
): AggregateError => {
  const aggError = new AggregateError(errors, message);
  aggError.stack = `AggregateError: ${message}\n    at ${message} (flatten.test.js:1:1)`;
  return aggError;
};

describe('flattenErrorStack', () => {
  it('flattens a cause chain', () => {
    const error = buildErrorFixture(
      'outer',
      buildErrorFixture('middle', buildErrorFixture('root')),
    );

    expect(flattenErrorStack(error)).toBe(
      [
        'Error: outer',
        '    at outer (flatten.test.js:1:1)',
        '',
        '[cause]: Error: middle',
        '    at middle (flatten.test.js:1:1)',
        '',
        '[cause]: Error: root',
        '    at root (flatten.test.js:1:1)',
      ].join('\n'),
    );
  });

  it('flattens a string cause', () => {
    const error = buildErrorFixture('outer', 'the string cause');

    expect(flattenErrorStack(error)).toBe(
      [
        'Error: outer',
        '    at outer (flatten.test.js:1:1)',
        '',
        '[cause]: the string cause',
      ].join('\n'),
    );
  });

  it('falls back to the message when the stack is empty', () => {
    const error = new Error('no stack here');
    error.stack = '';

    expect(flattenErrorStack(error)).toBe('no stack here');
  });

  it('prepends the message when the stack does not include it', () => {
    // Some errors (e.g. Angular injection errors) have a stack whose first
    // line is a bare 'Error' without the message.
    const aggError = new AggregateError(
      [buildErrorFixture('inner')],
      'important message',
    );
    aggError.stack = 'Error\n    at foo (flatten.test.js:1:1)';

    expect(flattenErrorStack(aggError)).toBe(
      [
        'important message',
        '    at foo (flatten.test.js:1:1)',
        '',
        '[errors]: Error: inner',
        '    at inner (flatten.test.js:1:1)',
      ].join('\n'),
    );
  });

  it('flattens the inner errors of an AggregateError', () => {
    const aggError = buildAggregateFixture('all rejected', [
      buildErrorFixture('inner A'),
      buildErrorFixture('inner B'),
    ]);

    expect(flattenErrorStack(aggError)).toBe(
      [
        'AggregateError: all rejected',
        '    at all rejected (flatten.test.js:1:1)',
        '',
        '[errors]: Error: inner A',
        '    at inner A (flatten.test.js:1:1)',
        '',
        '[errors]: Error: inner B',
        '    at inner B (flatten.test.js:1:1)',
      ].join('\n'),
    );
  });

  it('flattens a cause nested inside an AggregateError entry', () => {
    const aggError = buildAggregateFixture('all rejected', [
      buildErrorFixture('outer', buildErrorFixture('the cause')),
      buildAggregateFixture('nested', [buildErrorFixture('deeply nested')]),
    ]);

    expect(flattenErrorStack(aggError)).toBe(
      [
        'AggregateError: all rejected',
        '    at all rejected (flatten.test.js:1:1)',
        '',
        '[errors]: Error: outer',
        '    at outer (flatten.test.js:1:1)',
        '',
        '[cause]: Error: the cause',
        '    at the cause (flatten.test.js:1:1)',
        '',
        '[errors]: AggregateError: nested',
        '    at nested (flatten.test.js:1:1)',
        '',
        '[errors]: Error: deeply nested',
        '    at deeply nested (flatten.test.js:1:1)',
      ].join('\n'),
    );
  });

  it('renders non-errors held by an AggregateError', () => {
    const aggError = new AggregateError([null, 42, 'a string']);

    const flattened = flattenErrorStack(aggError);

    expect(flattened).toContain('[errors]: thrown: null');
    expect(flattened).toContain('[errors]: thrown: 42');
    expect(flattened).toContain('[errors]: a string');
  });

  it('adds no section for an empty AggregateError', () => {
    expect(flattenErrorStack(new AggregateError([]))).not.toContain('[errors]');
  });

  it('reports a self-referential cause once instead of recursing', () => {
    const error = buildErrorFixture('self');
    error.cause = error;

    // Marking the parent only after descending used to print the root twice
    // before tripping the guard.
    expect(flattenErrorStack(error)).toBe(
      [
        'Error: self',
        '    at self (flatten.test.js:1:1)',
        '',
        '[cause]: [Circular cause]',
      ].join('\n'),
    );
  });

  it('reports a self-referential AggregateError instead of recursing', () => {
    const aggError = buildAggregateFixture('self', []);
    aggError.errors.push(aggError);

    expect(flattenErrorStack(aggError)).toBe(
      [
        'AggregateError: self',
        '    at self (flatten.test.js:1:1)',
        '',
        '[errors]: [Circular errors]',
      ].join('\n'),
    );
  });

  it('does not treat the same error repeated across siblings as a cycle', () => {
    const shared = buildErrorFixture('shared');
    const aggError = buildAggregateFixture('all rejected', [shared, shared]);

    // `seen` tracks the ancestor path, not everything visited, so an acyclic
    // graph that reuses an error is not mistaken for a cycle.
    expect(flattenErrorStack(aggError)).toBe(
      [
        'AggregateError: all rejected',
        '    at all rejected (flatten.test.js:1:1)',
        '',
        '[errors]: Error: shared',
        '    at shared (flatten.test.js:1:1)',
        '',
        '[errors]: Error: shared',
        '    at shared (flatten.test.js:1:1)',
      ].join('\n'),
    );
  });
});

describe('hasNestedErrors', () => {
  it.each([
    [
      'an error cause',
      buildErrorWithCause('outer', {cause: new Error('bang')}),
    ],
    ['a string cause', buildErrorWithCause('outer', {cause: 'bang'})],
    ['a non-empty AggregateError', new AggregateError([new Error('bang')])],
  ])('is true for %s', (_label, value) => {
    expect(hasNestedErrors(value)).toBe(true);
  });

  it.each([
    ['a plain error', new Error('bang')],
    ['an empty AggregateError', new AggregateError([])],
    ['a numeric cause', buildErrorWithCause('outer', {cause: 42})],
    ['a string', 'not an error'],
    ['undefined', undefined],
    ['an error-shaped object', {message: 'bang'}],
  ])('is false for %s', (_label, value) => {
    expect(hasNestedErrors(value)).toBe(false);
  });
});

describe('formatErrorStack', () => {
  it('falls back to the message when the stack was blanked', () => {
    const error = new Error('no stack here');
    error.stack = '';

    expect(
      formatErrorStack(
        error,
        {rootDir: '', testMatch: []},
        {
          noStackTrace: true,
        },
      ),
    ).toContain('no stack here');
  });
});

describe('cyclic errors in the styled renderers', () => {
  const buildCyclicCause = () => {
    const error = new Error('self');
    error.cause = error;
    return error;
  };

  const buildCyclicAggregate = () => {
    const aggError = new AggregateError([]);
    aggError.errors.push(aggError);
    return aggError;
  };

  // Serialized errors from workers are plain objects, and structured clone
  // preserves cycles.
  const buildCyclicPlainObject = () => {
    const error: {message: string; stack: string; errors: Array<unknown>} = {
      errors: [],
      message: 'plain aggregate',
      stack: 'AggregateError: plain aggregate\n    at x (f.js:1:1)',
    };
    error.errors.push(error);
    return error;
  };

  it.each([
    ['a self-referential cause', buildCyclicCause],
    ['a self-referential AggregateError', buildCyclicAggregate],
    ['a self-referential plain object', buildCyclicPlainObject],
  ])('formatExecError survives %s', (_label, build) => {
    expect(() =>
      formatExecError(
        build(),
        {rootDir: '', testMatch: []},
        {
          noStackTrace: true,
        },
      ),
    ).not.toThrow();
  });

  it.each([
    ['a self-referential cause', buildCyclicCause],
    ['a self-referential AggregateError', buildCyclicAggregate],
  ])('formatResultsErrors survives %s', (_label, build) => {
    expect(() => formatAggregateErrorFailure(build(), true)).not.toThrow();
  });
});

describe('frame classification', () => {
  const checkoutPackagesDir = path.resolve(__dirname, '..', '..', '..');
  const testFile = `${slash(rootDir)}/__tests__/x.test.js`;
  const frameFor = (file: string) => `    at someFn (${file}:1:1)`;

  const internalFiles: Array<[string, string]> = [
    ['a published jest package', '/app/node_modules/jest-circus/build/run.js'],
    [
      'a scoped @jest package',
      '/app/node_modules/@jest/globals/build/index.js',
    ],
    [
      'a third-party jest integration',
      '/app/node_modules/babel-jest/build/index.js',
    ],
    [
      'a package of this checkout',
      path.join(checkoutPackagesDir, 'expect', 'build', 'index.js'),
    ],
    [
      'a windows-style path',
      String.raw`C:\app\node_modules\@jest\globals\build\index.js`,
    ],
  ];

  const externalFiles: Array<[string, string]> = [
    [
      'build output under a jest-ish directory',
      '/home/me/jest-helpers/src/util/build/app.js',
    ],
    [
      'a monorepo named after jest',
      '/work/jest-clone/packages/app/__tests__/x.test.js',
    ],
  ];

  const format = (...files: Array<string>) =>
    stripVTControlCharacters(
      formatStackTrace(
        ['Error: boom', ...files.map(frameFor)].join('\n'),
        {rootDir, testMatch: []},
        {noStackTrace: false},
      ),
    );

  beforeEach(() => {
    jest.mocked(readFileSync).mockImplementation(file => `source of ${file}`);
  });

  it.each(internalFiles)('drops a frame in %s', (_label, file) => {
    // the first frame of a stack is kept even when it is Jest's own, so the
    // frame under test needs one ahead of it
    expect(format(testFile, file)).not.toContain(
      slash(path.relative(rootDir, file)),
    );
  });

  it.each(externalFiles)('keeps a frame in %s', (_label, file) => {
    expect(format(testFile, file)).toContain(
      slash(path.relative(rootDir, file)),
    );
  });

  it.each(internalFiles)('renders no code frame for %s', (_label, file) => {
    expect(format(file, testFile)).toContain(`source of ${testFile}`);
  });

  it.each(externalFiles)('renders the code frame of %s', (_label, file) => {
    expect(format(file, testFile)).toContain(`source of ${file}`);
  });
});
