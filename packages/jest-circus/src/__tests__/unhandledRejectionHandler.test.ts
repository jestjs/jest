/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import type Runtime from 'jest-runtime';
import {getState, resetState} from '../state';
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

test('adds owned unhandled rejections without vetoing describe retries', async () => {
  resetState();
  const state = getState();
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

  const beforeAllHook = makeHook(describeBlock, 'beforeAll');
  state.unhandledRejectionErrorByPromiseByHook.set(beforeAllHook, new Map());
  state.unhandledRejectionErrorByPromiseByHook
    .get(beforeAllHook)!
    .set(Promise.resolve(), new Error('beforeAll rejection'));
  await handler(
    {
      describeBlock,
      hook: beforeAllHook,
      name: 'hook_success',
    },
    state,
  );

  const afterAllHook = makeHook(describeBlock, 'afterAll');
  state.unhandledRejectionErrorByPromiseByHook.set(afterAllHook, new Map());
  state.unhandledRejectionErrorByPromiseByHook
    .get(afterAllHook)!
    .set(Promise.resolve(), new Error('afterAll rejection'));
  await handler(
    {
      describeBlock,
      hook: afterAllHook,
      name: 'hook_success',
    },
    state,
  );
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

  expect(state.processErrorGeneration).toBe(0);
  expect(circusTest.errors).toHaveLength(3);
  expect(state.unhandledErrors).toHaveLength(1);
  expect(runtime.leaveTestCode).toHaveBeenCalledTimes(4);
});

test('drains global unhandled rejections before the run result is created', async () => {
  resetState();
  const state = getState();
  const runtime = {
    enterTestCode: jest.fn(),
    leaveTestCode: jest.fn(),
  } as unknown as Runtime;
  const handler = unhandledRejectionHandler(runtime, false);
  const promise = Promise.resolve();
  const error = new Error('global rejection');

  state.unhandledRejectionErrorByPromise.set(promise, error);
  state.unhandledRejectionErrorByPromiseTarget.set(
    promise,
    state.unhandledRejectionErrorByPromise,
  );

  await handler({name: 'run_finish'}, state);

  expect(state.unhandledErrors).toEqual([error]);
  expect(state.unhandledRejectionErrorByPromise.size).toBe(0);
  expect(state.unhandledRejectionErrorByPromiseTarget.has(promise)).toBe(false);
});
