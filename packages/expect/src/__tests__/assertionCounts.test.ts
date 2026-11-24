/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import jestExpect from '../';
import type {MatcherState} from '../types';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);

describe('.assertions()', () => {
  it('does not throw', () => {
    jestExpect.assertions(2);
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
  });

  it('redeclares different assertion count', () => {
    jestExpect.assertions(3);
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
    jestExpect.assertions(2);
  });
  it('expects no assertions', () => {
    jestExpect.assertions(0);
  });
});

describe('.hasAssertions()', () => {
  it('does not throw if there is an assertion', () => {
    jestExpect.hasAssertions();
    jestExpect('a').toBe('a');
  });

  it('throws if expected is not undefined', () => {
    expect(() => {
      // @ts-expect-error
      jestExpect.hasAssertions(2);
    }).toThrowErrorMatchingSnapshot();
  });

  it('hasAssertions not leaking to global state', () => {});
});

describe('concurrent isolation', () => {
  let previousGetter: MatcherState['currentConcurrentTestState'];
  let stateA: MatcherState;
  let stateB: MatcherState;
  let activeState: MatcherState | undefined;

  beforeEach(() => {
    const state = jestExpect.getState();
    previousGetter = state.currentConcurrentTestState;
    stateA = {...state, suppressedErrors: []};
    stateB = {...state, suppressedErrors: []};
    jestExpect.setState({
      currentConcurrentTestState: () => activeState ?? previousGetter?.(),
    });
  });

  afterEach(() => {
    activeState = undefined;
    jestExpect.setState({currentConcurrentTestState: previousGetter});
    jestExpect.extractExpectedAssertionsErrors();
  });

  it('does not share assertion counts across concurrent tests', () => {
    activeState = stateA;
    jestExpect.assertions(1);
    jestExpect('a').toBe('a');

    activeState = stateB;
    jestExpect.assertions(1);
    jestExpect('b').toBe('b');

    activeState = stateA;
    const errorsA = jestExpect.extractExpectedAssertionsErrors();
    activeState = stateB;
    const errorsB = jestExpect.extractExpectedAssertionsErrors();

    activeState = undefined;
    expect(errorsA).toEqual([]);
    expect(errorsB).toEqual([]);
  });

  it('reports extra assertions only for the concurrent test that made them', () => {
    activeState = stateA;
    jestExpect.assertions(1);
    jestExpect('a').toBe('a');
    jestExpect('aa').toBe('aa');

    activeState = stateB;
    jestExpect.assertions(1);
    jestExpect('b').toBe('b');

    activeState = stateA;
    const errorsA = jestExpect.extractExpectedAssertionsErrors();
    activeState = stateB;
    const errorsB = jestExpect.extractExpectedAssertionsErrors();

    activeState = undefined;
    expect(errorsA).toHaveLength(1);
    expect(errorsA[0].actual).toBe('2');
    expect(errorsA[0].expected).toBe('1');
    expect(errorsB).toEqual([]);
  });

  it('does not share hasAssertions across concurrent tests', () => {
    activeState = stateA;
    jestExpect.hasAssertions();

    activeState = stateB;
    jestExpect.hasAssertions();
    jestExpect('b').toBe('b');

    activeState = stateA;
    const errorsA = jestExpect.extractExpectedAssertionsErrors();
    activeState = stateB;
    const errorsB = jestExpect.extractExpectedAssertionsErrors();

    activeState = undefined;
    expect(errorsA).toHaveLength(1);
    expect(errorsA[0].actual).toBe('none');
    expect(errorsA[0].expected).toBe('at least one');
    expect(errorsB).toEqual([]);
  });
});

describe('numPassingAsserts', () => {
  it('verify the default value of numPassingAsserts', () => {
    const {numPassingAsserts} = jestExpect.getState();
    expect(numPassingAsserts).toBe(0);
  });

  it('verify the resetting of numPassingAsserts after a test', () => {
    expect('a').toBe('a');
    expect('a').toBe('a');
    // reset state
    jestExpect.extractExpectedAssertionsErrors();
    const {numPassingAsserts} = jestExpect.getState();
    expect(numPassingAsserts).toBe(0);
  });

  it('verify the correctness of numPassingAsserts count for passing test', () => {
    expect('a').toBe('a');
    expect('a').toBe('a');
    const {numPassingAsserts} = jestExpect.getState();
    expect(numPassingAsserts).toBe(2);
  });

  it('verify the correctness of numPassingAsserts count for failing test', () => {
    expect('a').toBe('a');
    try {
      expect('a').toBe('b');
    } catch {}
    const {numPassingAsserts} = jestExpect.getState();
    expect(numPassingAsserts).toBe(1);
  });
});
