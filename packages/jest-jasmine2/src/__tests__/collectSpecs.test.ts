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

const makeSpec = (
  description: string,
  {
    fullName,
    markedPending,
    markedTodo,
  }: {fullName?: string; markedPending?: boolean; markedTodo?: boolean} = {},
): SpecLike => ({
  description,
  getFullName: () => fullName ?? description,
  markedPending,
  markedTodo,
});

const makeSuite = (
  description: string,
  children: Array<SuiteLike | SpecLike>,
  markedPending = false,
): SuiteLike => ({children, description, markedPending});

const collect = (suite: SuiteLike, testNamePatternRE: RegExp | null = null) =>
  collectSpecs(suite, {ancestors: [], parentPending: false, testNamePatternRE});

describe('collectSpecs', () => {
  test('collects flat runnable specs as passed', () => {
    const root = makeSuite('', [makeSpec('test one'), makeSpec('test two')]);
    const results = collect(root);

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('test one');
    expect(results[0].status).toBe('passed');
    expect(results[1].title).toBe('test two');
  });

  test('resolves status per spec mode', () => {
    const root = makeSuite('', [
      makeSpec('runnable'),
      makeSpec('skipped', {markedPending: true}),
      makeSpec('todo', {markedTodo: true}),
    ]);
    const results = collect(root);

    expect(results.map(r => ({status: r.status, title: r.title}))).toEqual([
      {status: 'passed', title: 'runnable'},
      {status: 'pending', title: 'skipped'},
      {status: 'todo', title: 'todo'},
    ]);
  });

  test('marks specs under a pending suite as pending', () => {
    const root = makeSuite('', [
      makeSuite('skipped suite', [makeSpec('child')], true),
    ]);
    const results = collect(root);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('pending');
  });

  test('collects nested specs with ancestor titles', () => {
    const root = makeSuite('', [
      makeSuite('outer', [
        makeSuite('inner', [makeSpec('deep', {fullName: 'outer inner deep'})]),
      ]),
    ]);
    const results = collect(root);

    expect(results).toHaveLength(1);
    expect(results[0].ancestorTitles).toEqual(['outer', 'inner']);
    expect(results[0].fullName).toBe('outer inner deep');
    expect(results[0].title).toBe('deep');
  });

  test('filters by testNamePattern', () => {
    const root = makeSuite('', [
      makeSpec('matching test', {fullName: 'matching test'}),
      makeSpec('other test', {fullName: 'other test'}),
    ]);
    const results = collect(root, /matching/i);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('matching test');
  });

  test('returns empty array for empty suite', () => {
    const root = makeSuite('', []);
    const results = collect(root);
    expect(results).toHaveLength(0);
  });

  test('preserves order across sibling suites', () => {
    const root = makeSuite('', [
      makeSuite('A', [makeSpec('first', {fullName: 'A first'})]),
      makeSuite('B', [makeSpec('second', {fullName: 'B second'})]),
    ]);
    const results = collect(root);

    expect(results.map(r => r.title)).toEqual(['first', 'second']);
  });
});

describe('buildCollectedTestResult', () => {
  test('tallies counts by status', () => {
    const suite = makeSuite('', [
      makeSpec('test a'),
      makeSpec('test b'),
      makeSpec('skipped', {markedPending: true}),
      makeSpec('todo', {markedTodo: true}),
    ]);
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite,
      testNamePattern: undefined,
      testPath: '/path/to/test.js',
    });

    expect(result.testResults).toHaveLength(4);
    expect(result.numPassingTests).toBe(2);
    expect(result.numPendingTests).toBe(1);
    expect(result.numTodoTests).toBe(1);
    expect(result.numFailingTests).toBe(0);
    expect(result.testFilePath).toBe('/path/to/test.js');
  });

  test('filters by testNamePattern string', () => {
    const suite = makeSuite('', [
      makeSpec('match me', {fullName: 'match me'}),
      makeSpec('skip me', {fullName: 'skip me'}),
    ]);
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite,
      testNamePattern: 'match',
      testPath: '/test.js',
    });

    expect(result.testResults).toHaveLength(1);
    expect(result.testResults[0].title).toBe('match me');
    expect(result.numPassingTests).toBe(1);
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
