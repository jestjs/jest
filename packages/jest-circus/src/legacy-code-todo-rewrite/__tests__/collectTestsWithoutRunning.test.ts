/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {makeProjectConfig} from '@jest/test-utils';
import type {Circus} from '@jest/types';
import {getState as getRunnerState, resetState} from '../../state';
import {makeDescribe, makeTest} from '../../utils';
import {collectTestsWithoutRunning} from '../jestAdapterInit';

jest.mock('../../state', () => {
  const actual =
    jest.requireActual<typeof import('../../state')>('../../state');
  return {...actual, dispatch: jest.fn<typeof actual.dispatch>()};
});

beforeEach(() => {
  resetState();
});

const addTest = (
  name: string,
  parent: Circus.DescribeBlock,
  mode: Circus.TestMode = undefined,
  failing = false,
) => {
  const test = makeTest(
    () => {},
    mode,
    false,
    name,
    parent,
    undefined,
    new Error(),
    failing,
  );
  parent.children.push(test);
};

const collect = (testPath = '/test.js') =>
  collectTestsWithoutRunning({config: makeProjectConfig(), testPath});

describe('collectTestsWithoutRunning', () => {
  it('collects runnable tests as passed', async () => {
    const root = getRunnerState().rootDescribeBlock;
    addTest('test one', root);
    addTest('test two', root);

    const result = await collect();

    expect(result.testResults.map(r => r.title)).toEqual([
      'test one',
      'test two',
    ]);
    expect(result.testResults[0].status).toBe('passed');
    expect(result.testResults[0].wouldRun).toBe(true);
    expect(result.numPassingTests).toBe(2);
    expect(result.numPendingTests).toBe(0);
  });

  it('resolves status per test mode to match a real run', async () => {
    const root = getRunnerState().rootDescribeBlock;
    addTest('runnable', root);
    addTest('skipped', root, 'skip');
    addTest('todo', root, 'todo');

    const result = await collect();

    expect(
      result.testResults.map(r => ({status: r.status, title: r.title})),
    ).toEqual([
      {status: 'passed', title: 'runnable'},
      {status: 'pending', title: 'skipped'},
      {status: 'todo', title: 'todo'},
    ]);
    expect(result.numPassingTests).toBe(1);
    expect(result.numPendingTests).toBe(1);
    expect(result.numTodoTests).toBe(1);
  });

  it('marks tests under a skipped describe as pending', async () => {
    const root = getRunnerState().rootDescribeBlock;
    const skipped = makeDescribe('skipped suite', root, 'skip');
    root.children.push(skipped);
    addTest('child', skipped);

    const result = await collect();

    expect(result.testResults[0].status).toBe('pending');
    expect(result.numPendingTests).toBe(1);
  });

  it('marks unfocused tests as pending when the file has focused tests', async () => {
    const state = getRunnerState();
    state.hasFocusedTests = true;
    addTest('focused', state.rootDescribeBlock, 'only');
    addTest('unfocused', state.rootDescribeBlock);
    addTest('todo survives focus', state.rootDescribeBlock, 'todo');

    const result = await collect();

    expect(
      result.testResults.map(r => ({status: r.status, title: r.title})),
    ).toEqual([
      {status: 'passed', title: 'focused'},
      {status: 'pending', title: 'unfocused'},
      {status: 'todo', title: 'todo survives focus'},
    ]);
  });

  it('preserves the failing flag for xfail tests', async () => {
    const root = getRunnerState().rootDescribeBlock;
    addTest('xfail', root, undefined, true);

    const result = await collect();

    expect(result.testResults[0].failing).toBe(true);
    expect(result.testResults[0].status).toBe('passed');
  });

  it('collects nested tests with correct ancestor titles', async () => {
    const root = getRunnerState().rootDescribeBlock;
    const outer = makeDescribe('outer', root);
    root.children.push(outer);
    const inner = makeDescribe('inner', outer);
    outer.children.push(inner);
    addTest('deep test', inner);

    const result = await collect();

    expect(result.testResults[0].ancestorTitles).toEqual(['outer', 'inner']);
    expect(result.testResults[0].fullName).toBe('outer inner deep test');
  });

  it('preserves source order across describe blocks', async () => {
    const root = getRunnerState().rootDescribeBlock;
    const a = makeDescribe('A', root);
    root.children.push(a);
    addTest('first', a);
    const b = makeDescribe('B', root);
    root.children.push(b);
    addTest('second', b);

    const result = await collect();

    expect(result.testResults.map(r => r.title)).toEqual(['first', 'second']);
  });

  it('returns empty results when no tests exist', async () => {
    const result = await collect();
    expect(result.testResults).toHaveLength(0);
  });

  it('reports testNamePattern-deselected tests as pending, like a real run', async () => {
    const state = getRunnerState();
    state.testNamePattern = /one/;
    addTest('test one', state.rootDescribeBlock);
    addTest('test two', state.rootDescribeBlock);

    const result = await collect();

    expect(
      result.testResults.map(r => ({status: r.status, title: r.title})),
    ).toEqual([
      {status: 'passed', title: 'test one'},
      {status: 'pending', title: 'test two'},
    ]);
    expect(result.numPassingTests).toBe(1);
    expect(result.numPendingTests).toBe(1);
  });
});
