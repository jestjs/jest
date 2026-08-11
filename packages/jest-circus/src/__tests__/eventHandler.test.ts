/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// addEventHandler and removeEventHandler are provided in the ./index
import {addEventHandler, removeEventHandler} from '../index';
// dispatch comes from the ./state
import eventHandler from '../eventHandler';
import {dispatch, getState, resetState} from '../state';
import type {InternalCircusState} from '../types';
import {makeTest} from '../utils';

test('addEventHandler and removeEventHandler control handlers', async () => {
  const spy: any = jest.fn();

  addEventHandler(spy);
  expect(spy).not.toHaveBeenCalledWith({name: 'unknown1'}, expect.anything());
  await dispatch({name: 'unknown1' as any});
  expect(spy).toHaveBeenCalledWith({name: 'unknown1'}, expect.anything());

  removeEventHandler(spy);
  expect(spy).not.toHaveBeenCalledWith({name: 'unknown2'}, expect.anything());
  await dispatch({name: 'unknown2' as any});
  expect(spy).not.toHaveBeenCalledWith({name: 'unknown2'}, expect.anything());
});

test('clears the currently running test when a test is skipped or todo', async () => {
  resetState();
  const state = getState() as InternalCircusState;
  const circusTest = makeTest(
    () => {},
    undefined,
    false,
    'test',
    state.rootDescribeBlock,
    undefined,
    new Error(),
    false,
  );

  state.currentlyRunningTest = circusTest;
  await eventHandler({name: 'test_skip', test: circusTest}, state);
  expect(circusTest.status).toBe('skip');
  expect(state.currentlyRunningTest).toBeNull();

  state.currentlyRunningTest = circusTest;
  await eventHandler({name: 'test_todo', test: circusTest}, state);
  expect(circusTest.status).toBe('todo');
  expect(state.currentlyRunningTest).toBeNull();
});

test('distinguishes current-test and process-level errors', async () => {
  resetState();
  const state = getState() as InternalCircusState;
  const circusTest = makeTest(
    () => {},
    undefined,
    false,
    'test',
    state.rootDescribeBlock,
    undefined,
    new Error(),
    false,
  );
  const testError = new Error('test error');

  state.currentlyRunningTest = circusTest;
  await eventHandler({error: testError, name: 'error'}, state);
  expect(state.processErrorGeneration).toBe(1);
  expect(circusTest.errors).toContain(testError);

  const rejection = Promise.resolve();
  const rejectionError = new Error('rejection');
  await eventHandler(
    {error: rejectionError, name: 'error', promise: rejection},
    state,
  );
  expect(circusTest.unhandledRejectionErrorByPromise.get(rejection)).toBe(
    rejectionError,
  );

  state.currentlyRunningTest = null;
  await eventHandler(
    {error: rejectionError, name: 'error', promise: rejection},
    state,
  );
  expect(state.unhandledRejectionErrorByPromise.get(rejection)).toBe(
    rejectionError,
  );

  const processError = new Error('process error');
  await eventHandler({error: processError, name: 'error'}, state);
  expect(state.unhandledErrors).toContain(processError);
});
