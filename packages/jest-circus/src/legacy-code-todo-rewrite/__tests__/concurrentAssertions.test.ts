/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {MatcherState} from '@jest/expect';
import {afterEach, beforeEach, describe, expect, it} from '@jest/globals';
import type {Circus} from '@jest/types';
import {eventHandler} from '../jestAdapterInit';

describe('expect.assertions with concurrent test states', () => {
  let previousGetter: MatcherState['currentConcurrentTestState'];
  let stateA: MatcherState;
  let stateB: MatcherState;
  let activeState: MatcherState | undefined;

  beforeEach(() => {
    const state = expect.getState();
    previousGetter = state.currentConcurrentTestState;
    stateA = {...state, suppressedErrors: []};
    stateB = {...state, suppressedErrors: []};
    expect.setState({
      currentConcurrentTestState: () => activeState ?? previousGetter?.(),
    });
  });

  afterEach(() => {
    activeState = undefined;
    expect.setState({currentConcurrentTestState: previousGetter});
  });

  it('does not leak assertion counts across concurrent tests', async () => {
    const testA = {errors: []} as unknown as Circus.TestEntry;
    const testB = {errors: []} as unknown as Circus.TestEntry;

    activeState = stateA;
    expect.assertions(1);
    expect(1).toBe(1);

    activeState = stateB;
    expect.assertions(1);
    expect(1).toBe(1);

    activeState = stateA;
    await eventHandler({name: 'test_done', test: testA});

    activeState = stateB;
    await eventHandler({name: 'test_done', test: testB});

    activeState = undefined;
    expect(testA.errors).toEqual([]);
    expect(testB.errors).toEqual([]);
  });

  it('keeps a sibling concurrent test passing when one exceeds its budget', async () => {
    const testA = {errors: []} as unknown as Circus.TestEntry;
    const testB = {errors: []} as unknown as Circus.TestEntry;

    activeState = stateA;
    expect.assertions(1);
    expect(1).toBe(1);
    expect(2).toBe(2);

    activeState = stateB;
    expect.assertions(1);
    expect(1).toBe(1);

    activeState = stateA;
    await eventHandler({name: 'test_done', test: testA});

    activeState = stateB;
    await eventHandler({name: 'test_done', test: testB});

    activeState = undefined;
    expect(testA.errors).toHaveLength(1);
    expect(testB.errors).toEqual([]);
  });
});
