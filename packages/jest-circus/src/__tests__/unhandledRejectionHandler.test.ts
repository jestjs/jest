/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import type Runtime from 'jest-runtime';
import {getState, resetState} from '../state';
import type {InternalCircusState} from '../types';
import {unhandledRejectionHandler} from '../unhandledRejectionHandler';
import {makeTest} from '../utils';

const makeHook = (
  parent: Circus.DescribeBlock,
  type: Circus.HookType,
): Circus.Hook => ({
  asyncError: new Error(`${type} callsite`),
  fn: () => {},
  parent,
  seenDone: false,
  timeout: undefined,
  type,
});

test('marks unhandled test and hook rejections as non-retryable', async () => {
  resetState();
  const state = getState() as InternalCircusState;
  const describeBlock = state.rootDescribeBlock;
  const circusTest = makeTest(
    () => {},
    undefined,
    false,
    'test',
    describeBlock,
    undefined,
    new Error('test callsite'),
    false,
  );
  describeBlock.children.push(circusTest);
  describeBlock.tests.push(circusTest);

  const runtime = {
    enterTestCode: jest.fn(),
    leaveTestCode: jest.fn(),
  } as unknown as Runtime;
  const handler = unhandledRejectionHandler(runtime, false);

  state.unhandledRejectionErrorByPromise.set(
    Promise.resolve(),
    new Error('beforeAll rejection'),
  );
  await handler(
    {
      describeBlock,
      hook: makeHook(describeBlock, 'beforeAll'),
      name: 'hook_success',
    },
    state,
  );
  state.unhandledRejectionErrorByPromise.clear();

  state.unhandledRejectionErrorByPromise.set(
    Promise.resolve(),
    new Error('afterAll rejection'),
  );
  await handler(
    {
      describeBlock,
      hook: makeHook(describeBlock, 'afterAll'),
      name: 'hook_success',
    },
    state,
  );
  state.unhandledRejectionErrorByPromise.clear();

  circusTest.unhandledRejectionErrorByPromise.set(
    Promise.resolve(),
    new Error('beforeEach rejection'),
  );
  await handler(
    {
      hook: makeHook(describeBlock, 'beforeEach'),
      name: 'hook_success',
      test: circusTest,
    },
    state,
  );
  circusTest.unhandledRejectionErrorByPromise.clear();

  circusTest.unhandledRejectionErrorByPromise.set(
    Promise.resolve(),
    new Error('test rejection'),
  );
  await handler({name: 'test_fn_success', test: circusTest}, state);

  expect(state.processErrorGeneration).toBe(4);
  expect(circusTest.errors).toHaveLength(3);
  expect(state.unhandledErrors).toHaveLength(1);
  expect(runtime.leaveTestCode).toHaveBeenCalledTimes(4);
});
