/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {isJestCircusRun} from '@jest/test-utils';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

const cleanupRunnerStack = (stderr: string) =>
  wrap(
    stderr
      .split('\n')
      .filter(
        line =>
          !line.includes('packages/jest-jasmine2/build') &&
          !line.includes('packages/jest-circus/build'),
      )
      .join('\n'),
  );

test('print correct error message with nested test definitions outside describe', () => {
  const result = runJest('nested-test-definitions', ['outside']);

  expect(result.exitCode).toBe(1);

  const summary = extractSummary(result.stderr);

  expect(cleanupRunnerStack(summary.rest)).toMatchSnapshot();
});

test('print correct error message with nested test definitions inside describe', () => {
  const result = runJest('nested-test-definitions', ['within']);

  expect(result.exitCode).toBe(1);

  const summary = extractSummary(result.stderr);

  expect(cleanupRunnerStack(summary.rest)).toMatchSnapshot();
});

(isJestCircusRun() ? test : test.skip)(
  'print correct message when nesting describe inside it',
  () => {
    const result = runJest('nested-test-definitions', ['nestedDescribeInTest']);

    expect(result.exitCode).toBe(1);

    expect(result.stderr).toContain(
      'Cannot nest a describe inside a test. Describe block "inner describe" cannot run because it is nested within "test".',
    );
  },
);

(isJestCircusRun() ? test : test.skip)(
  'print correct message when nesting a hook inside it',
  () => {
    const result = runJest('nested-test-definitions', ['nestedHookInTest']);

    expect(result.exitCode).toBe(1);

    expect(result.stderr).toContain(
      'Hooks cannot be defined inside tests. Hook of type "beforeEach" is nested within "test".',
    );
  },
);
