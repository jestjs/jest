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

const addTest = (name: string, parent: Circus.DescribeBlock) => {
  const test = makeTest(
    () => {},
    undefined,
    false,
    name,
    parent,
    undefined,
    new Error(),
    false,
  );
  parent.children.push(test);
};

const collect = (testPath = '/test.js') =>
  collectTestsWithoutRunning({config: makeProjectConfig(), testPath});

describe('collectTestsWithoutRunning', () => {
  it('collects flat tests with pending status', async () => {
    const root = getRunnerState().rootDescribeBlock;
    addTest('test one', root);
    addTest('test two', root);

    const result = await collect();

    expect(result.testResults.map(r => r.title)).toEqual([
      'test one',
      'test two',
    ]);
    expect(result.testResults[0].status).toBe('pending');
    expect(result.numPendingTests).toBe(2);
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

  it('filters tests by testNamePattern from runner state', async () => {
    const state = getRunnerState();
    state.testNamePattern = /one/;
    addTest('test one', state.rootDescribeBlock);
    addTest('test two', state.rootDescribeBlock);

    const result = await collect();

    expect(result.testResults.map(r => r.title)).toEqual(['test one']);
  });
});
