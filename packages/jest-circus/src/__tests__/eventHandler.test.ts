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
  const state = getState();
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
