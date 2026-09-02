/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {afterEach, beforeEach, describe, expect, it} from '@jest/globals';
import type {Circus} from '@jest/types';
import {eventHandler} from '../jestAdapterInit';

describe('expect.assertions with concurrent test names', () => {
  const previousGetter = expect.getState().currentConcurrentTestName;
  let activeTest: string | undefined;

  beforeEach(() => {
    activeTest = undefined;
    expect.setState({
      currentConcurrentTestName: () => activeTest ?? previousGetter?.(),
    });
  });

  afterEach(() => {
    activeTest = undefined;
    expect.setState({currentConcurrentTestName: previousGetter});
  });

  it('does not leak assertion counts across concurrent tests', async () => {
    const testA = {errors: []} as unknown as Circus.TestEntry;
    const testB = {errors: []} as unknown as Circus.TestEntry;

    activeTest = 'A';
    expect.assertions(1);
    expect(1).toBe(1);

    activeTest = 'B';
    expect.assertions(1);
    expect(1).toBe(1);

    activeTest = 'A';
    await eventHandler({name: 'test_done', test: testA});

    activeTest = 'B';
    await eventHandler({name: 'test_done', test: testB});

    activeTest = undefined;
    expect(testA.errors).toEqual([]);
    expect(testB.errors).toEqual([]);
  });

  it('keeps a sibling concurrent test passing when one exceeds its budget', async () => {
    const testA = {errors: []} as unknown as Circus.TestEntry;
    const testB = {errors: []} as unknown as Circus.TestEntry;

    activeTest = 'A';
    expect.assertions(1);
    expect(1).toBe(1);
    expect(2).toBe(2);

    activeTest = 'B';
    expect.assertions(1);
    expect(1).toBe(1);

    activeTest = 'A';
    await eventHandler({name: 'test_done', test: testA});

    activeTest = 'B';
    await eventHandler({name: 'test_done', test: testB});

    activeTest = undefined;
    expect(testA.errors).toHaveLength(1);
    expect(testB.errors).toEqual([]);
  });
});
