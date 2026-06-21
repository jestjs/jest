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
    disabled,
    fullName,
    id,
    markedPending,
    markedTodo,
  }: {
    disabled?: boolean;
    fullName?: string;
    id?: string;
    markedPending?: boolean;
    markedTodo?: boolean;
  } = {},
): SpecLike => ({
  description,
  disabled,
  getFullName: () => fullName ?? description,
  id,
  markedPending,
  markedTodo,
});

const makeSuite = (
  description: string,
  children: Array<SuiteLike | SpecLike>,
  {id, markedPending = false}: {id?: string; markedPending?: boolean} = {},
): SuiteLike => ({children, description, id, markedPending});

const collect = (
  suite: SuiteLike,
  {
    focusedRunnableIds = [],
    testNamePatternRE = null,
  }: {
    focusedRunnableIds?: Array<string>;
    testNamePatternRE?: RegExp | null;
  } = {},
) =>
  collectSpecs(suite, {
    ancestors: [],
    focusedRunnableIds,
    parentEnabled: focusedRunnableIds.length === 0,
    parentPending: false,
    testNamePatternRE,
  });

describe('collectSpecs', () => {
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
    expect(results[0].wouldRun).toBe(true);
  });

  test('marks specs under a pending suite as pending', () => {
    const root = makeSuite('', [
      makeSuite('skipped suite', [makeSpec('child')], {markedPending: true}),
    ]);
    expect(collect(root)[0].status).toBe('pending');
  });

  test('reports testNamePattern-deselected specs as pending', () => {
    const root = makeSuite('', [
      makeSpec('matching test', {fullName: 'matching test'}),
      makeSpec('other test', {fullName: 'other test'}),
    ]);
    const results = collect(root, {testNamePatternRE: /matching/i});

    expect(results.map(r => ({status: r.status, title: r.title}))).toEqual([
      {status: 'passed', title: 'matching test'},
      {status: 'pending', title: 'other test'},
    ]);
  });

  test('collects nested specs with ancestor titles in order', () => {
    const root = makeSuite('', [
      makeSuite('outer', [
        makeSuite('inner', [makeSpec('deep', {fullName: 'outer inner deep'})]),
      ]),
    ]);
    const [result] = collect(root);

    expect(result.ancestorTitles).toEqual(['outer', 'inner']);
    expect(result.fullName).toBe('outer inner deep');
    expect(result.title).toBe('deep');
  });

  test('preserves source order across sibling suites', () => {
    const root = makeSuite('', [
      makeSuite('A', [makeSpec('first', {fullName: 'A first'})]),
      makeSuite('B', [makeSpec('second', {fullName: 'B second'})]),
    ]);

    expect(collect(root).map(r => r.title)).toEqual(['first', 'second']);
  });

  test('reports specs not selected by focus as pending', () => {
    // `fit('focused')` and a plain `it('unfocused')`: only the focused spec and
    // a focused suite's descendants would run; everything else is pending. A
    // todo deselected by focus is also pending, mirroring `Spec.status`.
    const root = makeSuite('', [
      makeSpec('focused spec', {id: 'spec-1'}),
      makeSpec('unfocused spec', {id: 'spec-2'}),
      makeSpec('unfocused todo', {id: 'spec-3', markedTodo: true}),
      makeSuite('focused suite', [makeSpec('inside focus', {id: 'spec-4'})], {
        id: 'suite-1',
      }),
    ]);
    const results = collect(root, {focusedRunnableIds: ['spec-1', 'suite-1']});

    expect(results.map(r => ({status: r.status, title: r.title}))).toEqual([
      {status: 'passed', title: 'focused spec'},
      {status: 'pending', title: 'unfocused spec'},
      {status: 'pending', title: 'unfocused todo'},
      {status: 'passed', title: 'inside focus'},
    ]);
  });

  test('reports explicitly disabled specs as pending', () => {
    const root = makeSuite('', [
      makeSpec('runnable'),
      makeSpec('disabled', {disabled: true}),
    ]);

    expect(
      collect(root).map(r => ({status: r.status, title: r.title})),
    ).toEqual([
      {status: 'passed', title: 'runnable'},
      {status: 'pending', title: 'disabled'},
    ]);
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

  test('returns empty results for empty suite', () => {
    const result = buildCollectedTestResult({
      config: makeProjectConfig(),
      suite: makeSuite('', []),
      testNamePattern: undefined,
      testPath: '/test.js',
    });

    expect(result.testResults).toHaveLength(0);
    expect(result.numPendingTests).toBe(0);
  });
});
