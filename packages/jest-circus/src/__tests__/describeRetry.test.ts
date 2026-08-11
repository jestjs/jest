/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jestExpect} from '@jest/expect';
import type {Circus} from '@jest/types';
import {
  afterAll as circusAfterAll,
  beforeAll as circusBeforeAll,
  describe as circusDescribe,
  test as circusTest,
  getState,
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
  const expectState = jestExpect.getState();
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

test('does not retry after a process-level error is recorded', async () => {
  let attempts = 0;

  const result = await runIsolated(() => {
    circusDescribe('non-retryable describe', () => {
      circusTest('test', () => {
        attempts++;
        dispatchSync({error: new Error('process failed'), name: 'error'});
      });
    });

    getInternalState().describeRetryOptions.set(
      getDescribeBlock('non-retryable describe'),
      {numRetries: 1},
    );
  });

  expect(attempts).toBe(1);
  expect(result.testResults[0].errors[0]).toContain('process failed');
  expect(result.testResults[0].invocations).toBe(1);
});
