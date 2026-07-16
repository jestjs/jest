/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {beforeEach, it} from '@jest/globals';
import type {Circus} from '@jest/types';
import {eventHandler} from '../jestAdapterInit';

beforeEach(() => expect.hasAssertions());

it("pushes a hasAssertion() error if there's no assertions/errors", () => {
  const event: Circus.Event = {
    name: 'test_done',
    test: {errors: []} as unknown as Circus.TestEntry,
  };
  const beforeLength = event.test.errors.length;

  eventHandler(event);

  expect(event.test.errors).toHaveLength(beforeLength + 1);
  expect(event.test.errors).toEqual([
    expect.getState().isExpectingAssertionsError,
  ]);
});

it("omits hasAssertion() errors if there's already an error", () => {
  const errors = [new Error('ruh roh'), new Error('not good')];
  const event: Circus.Event = {
    name: 'test_done',
    test: {errors} as unknown as Circus.TestEntry,
  };
  const beforeLength = event.test.errors.length;

  eventHandler(event);

  expect(event.test.errors).toHaveLength(beforeLength);
  expect(event.test.errors).not.toContain(
    expect.getState().isExpectingAssertionsError,
  );

  // Ensure test state is not accidentally leaked by e.g. not calling extractExpectedAssertionsErrors() at all.
  expect(expect.getState().isExpectingAssertions).toBe(false);
});
