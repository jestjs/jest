/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import type {Worker as ThreadWorker} from 'worker_threads';
import type {JestWorkerFarm, Worker} from '../';
import {CHILD_MESSAGE_CALL, PARENT_MESSAGE_OK} from '../types';

let WorkerFarm: typeof Worker;
let mockForkedProcesses: Array<ThreadWorker>;

function replySuccess(i: number, result: unknown) {
  mockForkedProcesses[i].emit('message', [PARENT_MESSAGE_OK, result]);
}

function assertCallsToChild(
  childNum: number,
  ...calls: Array<[unknown, ...[unknown]]>
) {
  expect(mockForkedProcesses[childNum].postMessage).toHaveBeenCalledTimes(
    calls.length + 1,
  );

  for (const [numCall, [methodName, ...args]] of calls.entries()) {
    expect(
      jest.mocked(mockForkedProcesses[childNum].postMessage).mock.calls[
        numCall + 1
      ][0],
    ).toEqual([CHILD_MESSAGE_CALL, true, methodName, args]);
  }
}

describe('Jest Worker Process Integration', () => {
  beforeEach(() => {
    mockForkedProcesses = [];

    class MockForkedProcess extends EventEmitter {
      postMessage = jest.fn();
    }

    jest.mock('worker_threads', () => {
      const fakeClass = jest.fn(() => {
        const forkedProcess =
          new MockForkedProcess() as unknown as ThreadWorker;

        mockForkedProcesses.push(forkedProcess);

        return forkedProcess;
      });

      return {
        Worker: fakeClass,
        __esModule: true,
      };
    });

    WorkerFarm = (require('../') as typeof import('../')).Worker;
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('calls a single method from the worker', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
    }) as JestWorkerFarm<{foo(): void}>;

    const promise = farm.foo();

    replySuccess(0, 42);

    expect(await promise).toBe(42);
  });

  it('distributes sequential calls across child processes', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
    }) as JestWorkerFarm<{foo(a: unknown): void}>;

    // The first call will go to the first child process.
    const promise0 = farm.foo('param-0');
    assertCallsToChild(0, ['foo', 'param-0']);
    replySuccess(0, 'worker-0');
    expect(await promise0).toBe('worker-0');

    // The second call will go to the second child process.
    const promise1 = farm.foo(1);
    assertCallsToChild(1, ['foo', 1]);
    replySuccess(1, 'worker-1');
    expect(await promise1).toBe('worker-1');
  });

  it('schedules the task on the first available child processes if the scheduling policy is in-order', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      enableWorkerThreads: true,
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
      workerSchedulingPolicy: 'in-order',
    }) as JestWorkerFarm<{foo(a: unknown): void}>;

    // The first call will go to the first child process.
    const promise0 = farm.foo('param-0');
    assertCallsToChild(0, ['foo', 'param-0']);

    // The second call will go to the second child process.
    const promise1 = farm.foo(1);

    // The first task on worker 0 completes.
    replySuccess(0, 'worker-0');
    expect(await promise0).toBe('worker-0');

    // The second task on worker 1 completes.
    assertCallsToChild(1, ['foo', 1]);
    replySuccess(1, 'worker-1');
    expect(await promise1).toBe('worker-1');

    // The third call will go to the first child process.
    const promise2 = farm.foo('param-2');
    assertCallsToChild(0, ['foo', 'param-0'], ['foo', 'param-2']);
    replySuccess(0, 'worker-0');
    expect(await promise2).toBe('worker-0');
  });

  it('schedules the task on the first available child processes', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      enableWorkerThreads: true,
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
    }) as JestWorkerFarm<{foo(a: unknown): void}>;

    // The first call will go to the first child process.
    const promise0 = farm.foo('param-0');
    assertCallsToChild(0, ['foo', 'param-0']);
    replySuccess(0, 'worker-0');
    expect(await promise0).toBe('worker-0');

    // The second call will go to the second child process.
    const promise1 = farm.foo(1);
    assertCallsToChild(1, ['foo', 1]);
    replySuccess(1, 'worker-1');
    expect(await promise1).toBe('worker-1');
  });

  it('distributes concurrent calls across child processes', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
    }) as JestWorkerFarm<{foo(a: unknown): void}>;

    // Do 3 calls to the farm in parallel.
    const promise0 = farm.foo('param-0');
    const promise1 = farm.foo('param-1');
    const promise2 = farm.foo('param-2');

    // Check that the method calls are sent to each separate child process.
    assertCallsToChild(0, ['foo', 'param-0']);
    assertCallsToChild(1, ['foo', 'param-1']);
    assertCallsToChild(2, ['foo', 'param-2']);

    // Send different responses from each child.
    replySuccess(0, 'worker-0');
    replySuccess(1, 'worker-1');
    replySuccess(2, 'worker-2');

    // Check
    expect(await promise0).toBe('worker-0');
    expect(await promise1).toBe('worker-1');
    expect(await promise2).toBe('worker-2');
  });

  it('sticks parallel calls to children', async () => {
    const farm = new WorkerFarm('/tmp/baz.js', {
      computeWorkerKey: () => '1234567890abcdef',
      exposedMethods: ['foo', 'bar'],
      numWorkers: 4,
    }) as JestWorkerFarm<{foo(a: unknown): void}>;

    // Do 3 calls to the farm in parallel.
    const promise0 = farm.foo('param-0');
    const promise1 = farm.foo('param-1');
    const promise2 = farm.foo('param-2');

    // Send different responses for each call (from the same child).
    replySuccess(0, 'worker-0');
    replySuccess(0, 'worker-1');
    replySuccess(0, 'worker-2');

    // Check that all the calls have been received by the same child.
    assertCallsToChild(
      0,
      ['foo', 'param-0'],
      ['foo', 'param-1'],
      ['foo', 'param-2'],
    );

    // Check that responses are correct.
    expect(await promise0).toBe('worker-0');
    expect(await promise1).toBe('worker-1');
    expect(await promise2).toBe('worker-2');
  });
});
