/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import FifoQueue from '../FifoQueue';
import {
  CHILD_MESSAGE_CALL,
  ChildMessageCall,
  QueueChildMessage,
} from '../types';

it('returns the shared tasks in FIFO ordering', () => {
  const queue = new FifoQueue();

  const task1 = createQueueChildMessage();
  const task2 = createQueueChildMessage();
  const task3 = createQueueChildMessage();

  queue.enqueue(task1);
  queue.enqueue(task2);
  queue.enqueue(task3);

  expect(queue.dequeue(1)).toBe(task1);
  expect(queue.dequeue(2)).toBe(task2);
  expect(queue.dequeue(3)).toBe(task3);

  expect(queue.dequeue(1)).toBeNull();
  expect(queue.dequeue(2)).toBeNull();
  expect(queue.dequeue(3)).toBeNull();
});

it('returns the worker specific tasks in FIFO ordering', () => {
  const queue = new FifoQueue();

  const task1 = createQueueChildMessage();
  const task2 = createQueueChildMessage();
  const task3 = createQueueChildMessage();

  queue.enqueue(task1, 1);
  queue.enqueue(task2, 1);
  queue.enqueue(task3, 1);

  expect(queue.dequeue(1)).toBe(task1);
  expect(queue.dequeue(1)).toBe(task2);
  expect(queue.dequeue(1)).toBe(task3);

  expect(queue.dequeue(1)).toBeNull();
});

it('maintains global FIFO ordering between worker specific and shared tasks', () => {
  const queue = new FifoQueue();

  const sharedTask1 = createQueueChildMessage({name: 'sharedTask1'});
  const sharedTask2 = createQueueChildMessage({name: 'sharedTask2'});
  const sharedTask3 = createQueueChildMessage({name: 'sharedTask3'});
  const worker1Task1 = createQueueChildMessage({name: 'worker1Task1'});
  const worker1Task2 = createQueueChildMessage({name: 'worker1Task2'});
  const worker2Task2 = createQueueChildMessage({name: 'worker2Task1'});

  queue.enqueue(worker1Task1, 1);
  queue.enqueue(sharedTask1);
  queue.enqueue(sharedTask2);
  queue.enqueue(worker1Task2, 1);
  queue.enqueue(worker2Task2, 2);
  queue.enqueue(sharedTask3);

  expect(queue.dequeue(1)).toBe(worker1Task1);
  expect(queue.dequeue(2)).toBe(sharedTask1);
  sharedTask1.request[1] = true;

  expect(queue.dequeue(1)).toBe(sharedTask2);
  sharedTask2.request[1] = true;

  expect(queue.dequeue(1)).toBe(worker1Task2);
  expect(queue.dequeue(1)).toBe(sharedTask3);
  sharedTask3.request[1] = true;

  expect(queue.dequeue(2)).toBe(worker2Task2);

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
