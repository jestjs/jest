/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeProjectConfig} from '@jest/test-utils';
import {
  type SpecLike,
  type SuiteLike,
  buildCollectedTestResult,
  collectSpecs,
} from '..';

const makeSpec = (description: string, fullName?: string): SpecLike => ({
  description,
  getFullName: () => fullName ?? description,
});

const makeSuite = (
  description: string,
  children: Array<SuiteLike | SpecLike>,
): SuiteLike => ({children, description});

describe('collectSpecs', () => {
  test('collects flat specs with pending status', () => {
    const root = makeSuite('', [makeSpec('test one'), makeSpec('test two')]);
    const results = collectSpecs(root, [], null);

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('test one');
    expect(results[0].status).toBe('pending');
    expect(results[1].title).toBe('test two');
  });

  test('collects nested specs with ancestor titles', () => {
    const root = makeSuite('', [
      makeSuite('outer', [
        makeSuite('inner', [makeSpec('deep', 'outer inner deep')]),
      ]),
    ]);
    const results = collectSpecs(root, [], null);

    expect(results).toHaveLength(1);
    expect(results[0].ancestorTitles).toEqual(['outer', 'inner']);
    expect(results[0].fullName).toBe('outer inner deep');
    expect(results[0].title).toBe('deep');
  });

  test('filters by testNamePattern', () => {
    const root = makeSuite('', [
      makeSpec('matching test', 'matching test'),
      makeSpec('other test', 'other test'),
    ]);
    const results = collectSpecs(root, [], /matching/i);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('matching test');
  });

  test('returns empty array for empty suite', () => {
    const root = makeSuite('', []);
    const results = collectSpecs(root, [], null);
    expect(results).toHaveLength(0);
  });

  test('preserves order across sibling suites', () => {
    const root = makeSuite('', [
      makeSuite('A', [makeSpec('first', 'A first')]),
      makeSuite('B', [makeSpec('second', 'B second')]),
    ]);
    const results = collectSpecs(root, [], null);

    expect(results.map(r => r.title)).toEqual(['first', 'second']);
  });
});

describe('buildCollectedTestResult', () => {
  test('returns TestResult with pending tests', () => {
    const suite = makeSuite('', [makeSpec('test a'), makeSpec('test b')]);
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite,
      testNamePattern: undefined,
      testPath: '/path/to/test.js',
    });

    expect(result.testResults).toHaveLength(2);
    expect(result.numPendingTests).toBe(2);
    expect(result.numPassingTests).toBe(0);
    expect(result.numFailingTests).toBe(0);
    expect(result.testFilePath).toBe('/path/to/test.js');
  });

  test('filters by testNamePattern string', () => {
    const suite = makeSuite('', [
      makeSpec('match me', 'match me'),
      makeSpec('skip me', 'skip me'),
    ]);
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite,
      testNamePattern: 'match',
      testPath: '/test.js',
    });

    expect(result.testResults).toHaveLength(1);
    expect(result.testResults[0].title).toBe('match me');
    expect(result.numPendingTests).toBe(1);
  });

  test('returns empty results for empty suite', () => {
    const suite = makeSuite('', []);
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite,
      testNamePattern: undefined,
      testPath: '/test.js',
    });

    expect(result.testResults).toHaveLength(0);
    expect(result.numPendingTests).toBe(0);
  });
});
