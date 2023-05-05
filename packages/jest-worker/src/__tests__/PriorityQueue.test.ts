/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import PriorityQueue from '../PriorityQueue';
import {
  CHILD_MESSAGE_CALL,
  ChildMessageCall,
  QueueChildMessage,
} from '../types';

it('returns the tasks in order', () => {
  const computePriority = (_method: string, task: unknown) =>
    (task as {priority: number}).priority;
  const queue = new PriorityQueue(computePriority);
  const priorities = [10, 3, 4, 8, 2, 9, 7, 1, 2, 6, 5];

  for (const priority of priorities) {
    queue.enqueue(createQueueChildMessage({priority}));
  }

  priorities.sort((a, b) => a - b);
  for (const priority of priorities) {
    expect(queue.dequeue(0)).toEqual(
      expect.objectContaining({
        request: [CHILD_MESSAGE_CALL, false, 'test', [{priority}]],
      }),
    );
  }

  expect(queue.dequeue(0)).toBeNull();
});

it('returns the task with the lowest priority value if inserted in reversed order', () => {
  const last = createQueueChildMessage({priority: 3});
  const mid = createQueueChildMessage({priority: 2});
  const first = createQueueChildMessage({priority: 1});

  const computePriority = (_method: string, task: unknown) =>
    (task as {priority: number}).priority;
  const queue = new PriorityQueue(computePriority);

  queue.enqueue(last, 1);
  queue.enqueue(first, 1);
  queue.enqueue(mid, 1);

  expect(queue.dequeue(1)).toBe(first);
  expect(queue.dequeue(1)).toBe(mid);
  expect(queue.dequeue(1)).toBe(last);
  expect(queue.dequeue(1)).toBeNull();
});

it('returns the task with the lowest priority value if inserted in correct order', () => {
  const first = createQueueChildMessage({priority: 1});
  const mid = createQueueChildMessage({priority: 2});
  const last = createQueueChildMessage({priority: 3});

  const computePriority = (_method: string, task: unknown) =>
    (task as {priority: number}).priority;
  const queue = new PriorityQueue(computePriority);

  queue.enqueue(last, 1);
  queue.enqueue(first, 1);
  queue.enqueue(mid, 1);

  expect(queue.dequeue(1)).toBe(first);
  expect(queue.dequeue(1)).toBe(mid);
  expect(queue.dequeue(1)).toBe(last);
  expect(queue.dequeue(1)).toBeNull();
});

it('uses different queues for each worker', () => {
  const task1Worker1 = createQueueChildMessage({priority: 1});
  const task2Worker1 = createQueueChildMessage({priority: 3});
  const task1Worker2 = createQueueChildMessage({priority: 1});
  const task2Worker2 = createQueueChildMessage({priority: 3});

  const computePriority = (_method: string, task: unknown) =>
    (task as {priority: number}).priority;
  const queue = new PriorityQueue(computePriority);

  queue.enqueue(task2Worker1, 1);
  queue.enqueue(task1Worker1, 1);
  queue.enqueue(task2Worker2, 2);
  queue.enqueue(task1Worker2, 2);

  expect(queue.dequeue(1)).toBe(task1Worker1);
  expect(queue.dequeue(1)).toBe(task2Worker1);
  expect(queue.dequeue(2)).toBe(task1Worker2);
  expect(queue.dequeue(2)).toBe(task2Worker2);
  expect(queue.dequeue(1)).toBeNull();
});

it('process task in the global and shared queue in order', () => {
  const computePriority = (_method: string, task: unknown) =>
    (task as {priority: number}).priority;
  const queue = new PriorityQueue(computePriority);

  const sharedTask1 = createQueueChildMessage({priority: 1});
  const sharedTask2 = createQueueChildMessage({priority: 3});
  queue.enqueue(sharedTask1);
  queue.enqueue(sharedTask2);

  const worker1Task1 = createQueueChildMessage({priority: 0});
  const worker1Task2 = createQueueChildMessage({priority: 2});
  queue.enqueue(worker1Task1, 1);
  queue.enqueue(worker1Task2, 1);

  const worker2Task1 = createQueueChildMessage({priority: 3});
  queue.enqueue(worker2Task1, 2);

  expect(queue.dequeue(1)).toBe(worker1Task1);
  expect(queue.dequeue(1)).toBe(sharedTask1);
  expect(queue.dequeue(1)).toBe(worker1Task2);

  expect(queue.dequeue(2)).toBe(worker2Task1);
  expect(queue.dequeue(2)).toBe(sharedTask2);

  expect(queue.dequeue(1)).toBeNull();
  expect(queue.dequeue(2)).toBeNull();
});

function createQueueChildMessage(...args: Array<unknown>): QueueChildMessage {
  const request: ChildMessageCall = [CHILD_MESSAGE_CALL, false, 'test', args];

  return {
    onCustomMessage: () => {},
    onEnd: () => {},
    onStart: () => {},
    request,
  };
}
