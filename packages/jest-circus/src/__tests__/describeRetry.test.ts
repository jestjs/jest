/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jestExpect} from '@jest/expect';
import type {Circus} from '@jest/types';
import {
  addEventHandler,
  afterAll as circusAfterAll,
  beforeAll as circusBeforeAll,
  describe as circusDescribe,
  test as circusTest,
  getState,
  removeEventHandler,
  resetState,
  run,
} from '../';
import {dispatchSync} from '../state';
import type {InternalCircusState} from '../types';

const getInternalState = () => getState() as InternalCircusState;

const getDescribeBlock = (name: string): Circus.DescribeBlock => {
  const block = getInternalState().rootDescribeBlock.children.find(
    child => child.type === 'describeBlock' && child.name === name,
  );

  expect(block).toBeDefined();
  return block as Circus.DescribeBlock;
};

const runIsolated = async (
  defineTests: () => void,
): Promise<Circus.RunResult> => {
  const expectState = {...jestExpect.getState()};
  resetState();

  try {
    defineTests();
    return await run();
  } finally {
    resetState();
    jestExpect.setState(expectState);
  }
};

test('retries the complete describe lifecycle and keeps retry reasons', async () => {
  const calls: Array<string> = [];
  let attempt = 0;

  const result = await runIsolated(() => {
    circusDescribe('retrying describe', () => {
      circusBeforeAll(() => {
        attempt++;
        calls.push(`beforeAll ${attempt}`);
      });
      circusAfterAll(() => {
        calls.push(`afterAll ${attempt}`);
      });
      circusTest('flaky', () => {
        calls.push(`flaky ${attempt}`);
        if (attempt === 1) {
          throw new Error('retry me');
        }
      });
      circusTest('later', () => {
        calls.push(`later ${attempt}`);
      });
    });

    getInternalState().describeRetryOptions.set(
      getDescribeBlock('retrying describe'),
      {
        logErrorsBeforeRetry: true,
        numRetries: 1,
        waitBeforeRetry: 1,
      },
    );
  });

  expect(calls).toEqual([
    'beforeAll 1',
    'flaky 1',
    'later 1',
    'afterAll 1',
    'beforeAll 2',
    'flaky 2',
    'later 2',
    'afterAll 2',
  ]);
  expect(result.testResults).toHaveLength(2);
  expect(result.testResults[0].errors).toEqual([]);
  expect(result.testResults[0].retryReasons[0]).toContain('retry me');
  expect(result.testResults.map(testResult => testResult.invocations)).toEqual([
    2, 2,
  ]);
});

test('does not retry errors that existed before entering the describe', async () => {
  let beforeAllCalls = 0;

  const result = await runIsolated(() => {
    circusBeforeAll(() => {
      throw new Error('ancestor setup failed');
    });
    circusDescribe('inner describe', () => {
      circusBeforeAll(() => {
        beforeAllCalls++;
      });
      circusTest('test', () => {});
    });

    getInternalState().describeRetryOptions.set(
      getDescribeBlock('inner describe'),
      {numRetries: 1},
    );
  });

  expect(beforeAllCalls).toBe(1);
  expect(result.testResults[0].errors[0]).toContain('ancestor setup failed');
  expect(result.testResults[0].invocations).toBe(1);
});

test('does not retry a test failure after a process-level error', async () => {
  let attempts = 0;

  const result = await runIsolated(() => {
    circusDescribe('non-retryable describe', () => {
      circusTest('test', () => {
        attempts++;
        dispatchSync({error: new Error('process failed'), name: 'error'});
        throw new Error('test failed');
      });
    });

    getInternalState().describeRetryOptions.set(
      getDescribeBlock('non-retryable describe'),
      {numRetries: 1},
    );
  });

  expect(attempts).toBe(1);
  expect(result.testResults[0].errors[0]).toContain('process failed');
  expect(result.testResults[0].errors[1]).toContain('test failed');
  expect(result.testResults[0].invocations).toBe(1);
});

test('supports snapshot states without retry checkpoints', async () => {
  let attempts = 0;

  const result = await runIsolated(() => {
    jestExpect.setState({snapshotState: {} as never});
    circusDescribe('without snapshot checkpoints', () => {
      circusTest('flaky', () => {
        attempts++;
        expect(attempts).toBe(2);
      });
    });

    getInternalState().describeRetryOptions.set(
      getDescribeBlock('without snapshot checkpoints'),
      {numRetries: 1},
    );
  });

  expect(attempts).toBe(2);
  expect(result.testResults[0].errors).toEqual([]);
});

test('shuffles each describe once at its existing lifecycle point', async () => {
  let attempt = 0;
  const attemptOrders: Array<Array<string>> = [];
  const ordersAtDescribeStart: Array<Array<string>> = [];
  const handler: Circus.EventHandler = event => {
    if (
      event.name === 'run_describe_start' &&
      event.describeBlock.name === 'randomized'
    ) {
      ordersAtDescribeStart.push(
        event.describeBlock.children.map(child => child.name),
      );
    }
  };
  addEventHandler(handler);

  try {
    await runIsolated(() => {
      const state = getInternalState();
      state.randomize = true;
      state.seed = 3;

      circusDescribe('randomized', () => {
        circusBeforeAll(() => {
          attempt++;
          attemptOrders.push([]);
        });
        circusTest('one', () => {
          attemptOrders[attempt - 1].push('one');
        });
        circusTest('two', () => {
          attemptOrders[attempt - 1].push('two');
        });
        circusTest('flaky', () => {
          attemptOrders[attempt - 1].push('flaky');
          expect(attempt).toBe(2);
        });
      });

      getInternalState().describeRetryOptions.set(
        getDescribeBlock('randomized'),
        {numRetries: 1},
      );
    });
  } finally {
    removeEventHandler(handler);
  }

  expect(ordersAtDescribeStart[0]).toEqual(['one', 'two', 'flaky']);
  expect(attemptOrders[0]).toEqual(attemptOrders[1]);
  expect(ordersAtDescribeStart[1]).toEqual(attemptOrders[0]);
});
