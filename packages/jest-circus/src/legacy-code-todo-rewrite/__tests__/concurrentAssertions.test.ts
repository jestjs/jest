/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {MatcherState} from '@jest/expect';
import {afterAll, afterEach, beforeEach, expect, it} from '@jest/globals';
import {getState} from '../../state';
import {
  disableTestExecutionContext,
  getTestExecutionContext,
  runInTestExecutionContext,
} from '../../testExecutionContext';
import {makeTest} from '../../utils';
import {eventHandler} from '../jestAdapterInit';

let previousGetter: MatcherState['currentConcurrentTestState'];

beforeEach(() => {
  previousGetter = expect.getState().currentConcurrentTestState;
  expect.setState({
    currentConcurrentTestState: () => getTestExecutionContext()?.matcherState,
  });
});

afterEach(() => {
  expect.setState({currentConcurrentTestState: previousGetter});
});

afterAll(disableTestExecutionContext);

const runConcurrentTest = (assertions: () => void) => {
  const test = makeTest(
    assertions,
    undefined,
    true,
    'same title',
    getState().rootDescribeBlock,
    undefined,
    new Error('test definition'),
    false,
  );
  return runInTestExecutionContext({test}, async () => {
    await eventHandler({name: 'test_started', test});
    expect.assertions(1);
    assertions();
    // Let the sibling make its assertions before collecting either result.
    await Promise.resolve();
    await eventHandler({name: 'test_done', test});
    return test;
  });
};

it('does not share assertion counts between concurrent tests', async () => {
  const [first, second] = await Promise.all([
    runConcurrentTest(() => expect(1).toBe(1)),
    runConcurrentTest(() => expect(2).toBe(2)),
  ]);
  expect(first.errors).toEqual([]);
  expect(second.errors).toEqual([]);
});

it('reports an exceeded assertion count only for the test that exceeded it', async () => {
  const [first, second] = await Promise.all([
    runConcurrentTest(() => {
      expect(1).toBe(1);
      expect(2).toBe(2);
    }),
    runConcurrentTest(() => expect(3).toBe(3)),
  ]);
  expect(first.errors).toHaveLength(1);
  expect(second.errors).toEqual([]);
});
