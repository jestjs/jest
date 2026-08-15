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
import {
  finishDescribeRetryAttempt,
  runInTestExecutionContext,
  startDescribeRetryAttempt,
} from '../testExecutionContext';
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

test('uses the async owner for process errors and handled rejections', async () => {
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
  const testError = new Error('test error');

  await runInTestExecutionContext({test: circusTest}, () =>
    eventHandler({error: testError, name: 'error'}, state),
  );
  expect(state.processErrorGeneration).toBe(1);
  expect(circusTest.errors).toContain(testError);

  const rejection = Promise.resolve();
  const rejectionError = new Error('rejection');
  await runInTestExecutionContext({test: circusTest}, () =>
    eventHandler(
      {error: rejectionError, name: 'error', promise: rejection},
      state,
    ),
  );
  expect(circusTest.unhandledRejectionErrorByPromise.get(rejection)).toBe(
    rejectionError,
  );

  await eventHandler({name: 'error_handled', promise: rejection}, state);
  expect(circusTest.unhandledRejectionErrorByPromise.has(rejection)).toBe(
    false,
  );

  const processError = new Error('process error');
  await eventHandler({error: processError, name: 'error'}, state);
  expect(state.unhandledErrors).toContain(processError);
});

test('only vetoes unowned rejections during a describe attempt', async () => {
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
  startDescribeRetryAttempt();

  try {
    const ownedRejection = Promise.resolve();
    await runInTestExecutionContext({test: circusTest}, () =>
      eventHandler(
        {
          error: new Error('owned rejection'),
          name: 'error',
          promise: ownedRejection,
        },
        state,
      ),
    );
    expect(state.processErrorGeneration).toBe(0);
    expect(
      circusTest.unhandledRejectionErrorByPromise.has(ownedRejection),
    ).toBe(true);

    const outsideRejection = Promise.resolve();
    await eventHandler(
      {
        error: new Error('outside rejection'),
        name: 'error',
        promise: outsideRejection,
      },
      state,
    );
    expect(state.processErrorGeneration).toBe(1);
    expect(state.unhandledRejectionErrorByPromise.has(outsideRejection)).toBe(
      true,
    );
  } finally {
    finishDescribeRetryAttempt();
  }
});
