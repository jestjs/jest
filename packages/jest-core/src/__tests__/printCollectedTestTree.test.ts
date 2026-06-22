/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AggregatedResult, AssertionResult} from '@jest/test-result';
import {printCollectedResults, printCollectedTestTree} from '../runJest';

const makeResult = (
  title: string,
  ancestorTitles: Array<string> = [],
  status?: AssertionResult['status'],
): AssertionResult => ({ancestorTitles, status, title}) as AssertionResult;

const makeAggregated = (
  overrides: Partial<AggregatedResult>,
): AggregatedResult =>
  ({
    numFailedTests: 0,
    numPassedTests: 0,
    numPendingTests: 0,
    numRuntimeErrorTestSuites: 0,
    numTodoTests: 0,
    numTotalTestSuites: 0,
    numTotalTests: 0,
    testResults: [],
    ...overrides,
  }) as AggregatedResult;

const collectOutput = (fn: (stream: NodeJS.WritableStream) => void): string => {
  const chunks: Array<string> = [];
  const stream = {write: (s: string) => chunks.push(s) && true};
  fn(stream as NodeJS.WritableStream);
  return chunks.join('');
};

describe('printCollectedTestTree', () => {
  test('prints top-level tests', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree([makeResult('standalone')], stream),
    );
    expect(output).toContain('  standalone\n');
  });

  test('prints tests grouped by describe blocks', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree(
        [makeResult('test a', ['suite']), makeResult('test b', ['suite'])],
        stream,
      ),
    );
    expect(output).toContain('suite\n');
    expect(output).toContain('  test a\n');
    expect(output).toContain('  test b\n');
  });

  test('prints nested describe blocks with indentation', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree([makeResult('deep', ['outer', 'inner'])], stream),
    );
    expect(output).toContain('outer\n');
    expect(output).toContain('  inner\n');
    expect(output).toContain('    deep\n');
  });

  test('annotates skipped and todo tests but leaves runnable ones bare', () => {
    const output = collectOutput(stream =>
      printCollectedTestTree(
        [
          makeResult('runs', [], 'passed'),
          makeResult('skipped', [], 'pending'),
          makeResult('later', [], 'todo'),
        ],
        stream,
      ),
    );
    // The runnable test is printed without any status marker.
    expect(output).toContain('  runs\n');
    // Skipped/todo markers are present (color codes, if any, surround them).
    expect(output).toContain('[skipped]');
    expect(output).toContain('[todo]');
  });

  test('handles empty results', () => {
    const output = collectOutput(stream => printCollectedTestTree([], stream));
    expect(output).toBe('');
  });
});

describe('printCollectedResults', () => {
  test('prints each file tree and a summary line', () => {
    const results = makeAggregated({
      numPassedTests: 1,
      numPendingTests: 1,
      numTodoTests: 1,
      numTotalTestSuites: 1,
      numTotalTests: 3,
      testResults: [
        {
          testExecError: undefined,
          testFilePath: '/a.test.js',
          testResults: [
            makeResult('runs', [], 'passed'),
            makeResult('skipped', [], 'pending'),
            makeResult('later', [], 'todo'),
          ],
        },
      ] as AggregatedResult['testResults'],
    });

    const output = collectOutput(stream =>
      printCollectedResults(results, stream),
    );

    expect(output).toContain('/a.test.js\n');
    expect(output).toContain('[skipped]');
    expect(output).toContain('[todo]');
    expect(output).toContain('Test suites:');
    expect(output).toContain('3 total');
    expect(output).toContain('1 runnable');
    expect(output).toContain('1 skipped');
    expect(output).toContain('1 todo');
  });

  test('reports files that failed to load and counts them', () => {
    const results = makeAggregated({
      numRuntimeErrorTestSuites: 1,
      numTotalTestSuites: 1,
      testResults: [
        {
          failureMessage: 'boom while loading',
          testExecError: {message: 'boom', stack: ''},
          testFilePath: '/broken.test.js',
          testResults: [],
        },
      ] as unknown as AggregatedResult['testResults'],
    });

    const output = collectOutput(stream =>
      printCollectedResults(results, stream),
    );

    expect(output).toContain('/broken.test.js');
    expect(output).toContain('boom while loading');
    expect(output).toContain('test suite(s) failed to load');
  });
});
