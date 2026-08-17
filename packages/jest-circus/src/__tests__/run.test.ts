/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {afterEach, beforeEach, expect, test} from '@jest/globals';
import {jestExpect} from '@jest/expect';
import type {Circus, Global} from '@jest/types';
import {
  afterAll as circusAfterAll,
  afterEach as circusAfterEach,
  beforeAll as circusBeforeAll,
  beforeEach as circusBeforeEach,
  describe as circusDescribe,
  test as circusTest,
} from '../index';
import run from '../run';
import {getState, resetState} from '../state';
import {RETRY_TIMES} from '../types';

let originalRetryTimes: unknown;

beforeEach(() => {
  resetState();
  originalRetryTimes = (globalThis as Global.Global)[RETRY_TIMES];
  (globalThis as Global.Global)[RETRY_TIMES] = '1';
});

afterEach(() => {
  if (originalRetryTimes === undefined) {
    Reflect.deleteProperty(globalThis, RETRY_TIMES);
  } else {
    (globalThis as Global.Global)[RETRY_TIMES] = originalRetryTimes;
  }
});

test('expect state exposes the same test entry across retries', async () => {
  const observedNames: Array<string | undefined> = [];
  const observedIdentities: Array<object | undefined> = [];
  let attempts = 0;

  circusTest('retried test', () => {
    attempts++;
    const expectState = jestExpect.getState();
    observedNames.push(expectState.currentConcurrentTestName?.());
    observedIdentities.push(expectState.currentTestIdentity?.());
    if (attempts === 1) {
      throw new Error('retry');
    }
  });

  const testEntry = getState().rootDescribeBlock
    .children[0] as Circus.TestEntry;
  const result = await run();

  expect(result.testResults).toHaveLength(1);
  expect(result.testResults[0].status).toBe('done');
  expect(attempts).toBe(2);
  expect(observedNames).toEqual(['retried test', 'retried test']);
  expect(observedIdentities).toEqual([testEntry, testEntry]);
  expect(jestExpect.getState().currentConcurrentTestName?.()).toBeUndefined();
  expect(jestExpect.getState().currentTestIdentity?.()).toBeUndefined();
});

test('expect state exposes test and describe identities to hooks', async () => {
  const observed: Array<[string, object | undefined]> = [];
  const recordIdentity = (name: string) => {
    observed.push([name, jestExpect.getState().currentTestIdentity?.()]);
  };

  circusDescribe('suite', () => {
    circusBeforeAll(() => {
      recordIdentity('beforeAll');
    });
    circusBeforeEach(() => {
      recordIdentity('beforeEach');
    });
    circusTest('test', () => {
      recordIdentity('test');
    });
    circusAfterEach(() => {
      recordIdentity('afterEach');
    });
    circusAfterAll(() => {
      recordIdentity('afterAll');
    });
  });

  const describeBlock = getState().rootDescribeBlock
    .children[0] as Circus.DescribeBlock;
  const testEntry = describeBlock.children.find(
    child => child.type === 'test',
  ) as Circus.TestEntry;

  await run();

  expect(observed).toEqual([
    ['beforeAll', describeBlock],
    ['beforeEach', testEntry],
    ['test', testEntry],
    ['afterEach', testEntry],
    ['afterAll', describeBlock],
  ]);
  expect(jestExpect.getState().currentTestIdentity?.()).toBeUndefined();
});
