/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {alignedAnsiStyleSerializer} from '@jest/test-utils';
import jestExpect from '../';

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
    } catch (error) {}
    const {numPassingAsserts} = jestExpect.getState();
    expect(numPassingAsserts).toBe(1);
  });
});
