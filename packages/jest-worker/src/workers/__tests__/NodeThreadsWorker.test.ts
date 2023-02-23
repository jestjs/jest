/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import {PassThrough} from 'stream';
import getStream = require('get-stream');
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_INITIALIZE,
  ChildMessageCall,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_CUSTOM,
  PARENT_MESSAGE_OK,
  WorkerOptions,
} from '../../types';

let Worker: typeof import('../NodeThreadsWorker').default;
let workerThreads: typeof import('worker_threads').Worker;
let originalExecArgv: typeof process.execArgv;

class MockedWorker extends EventEmitter {
  postMessage = jest.fn();
  terminate = jest.fn();
  stdout = new PassThrough();
  stderr = new PassThrough();
}

beforeEach(() => {
  jest.mock('worker_threads', () => {
    return {
      Worker: jest.fn(() => new MockedWorker()),
    };
  });
  originalExecArgv = process.execArgv;

  workerThreads = (require('worker_threads') as typeof import('worker_threads'))
    .Worker;

  Worker = (
    require('../NodeThreadsWorker') as typeof import('../NodeThreadsWorker')
  ).default;
});

afterEach(() => {
  jest.resetModules();
  process.execArgv = originalExecArgv;
});

it('passes fork options down to worker_threads.Worker, adding the defaults', () => {
  const thread = require.resolve('../threadChild');

  // eslint-disable-next-line no-new
  new Worker({
    forkOptions: {
      execArgv: ['--inspect', '-p'],
      execPath: 'hello',
    },
    maxRetries: 3,
    workerData: {
      foo: 'bar',
    },
    workerId: Number(process.env.JEST_WORKER_ID) - 1,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  expect(jest.mocked(workerThreads).mock.calls[0][0]).toBe(thread);
  expect(jest.mocked(workerThreads).mock.calls[0][1]).toEqual({
    eval: false,
    execArgv: ['--inspect', '-p'],
    execPath: 'hello', // Added option.
    resourceLimits: undefined,
    stderr: true,
    stdout: true,
    workerData: {
      // Added option.
      foo: 'bar',
    },
  });
});

it('initializes the thread with the given workerPath and workerId', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    setupArgs: ['foo', 'bar'],
    workerId: 2,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  // @ts-expect-error: Testing internal method
  expect(jest.mocked(worker._worker.postMessage).mock.calls[0][0]).toEqual([
    CHILD_MESSAGE_INITIALIZE,
    false,
    '/tmp/foo/bar/baz.js',
    ['foo', 'bar'],
    '3',
  ]);
});

it('stops initializing the worker after the amount of retries is exceeded', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  const request = [CHILD_MESSAGE_CALL, false, 'foo', []] as ChildMessageCall;
  const onProcessStart = jest.fn();
  const onProcessEnd = jest.fn();

  worker.send(request, onProcessStart, onProcessEnd, () => {});

  // We fail four times (initial + three retries).
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');

  expect(workerThreads).toHaveBeenCalledTimes(5);
  expect(onProcessStart).toHaveBeenCalledWith(worker);
  expect(onProcessEnd).toHaveBeenCalledTimes(1);
  expect(onProcessEnd.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(onProcessEnd.mock.calls[0][0]).toMatchObject({type: 'WorkerError'});
  expect(onProcessEnd.mock.calls[0][1]).toBeNull();
});

it('provides stdout and stderr from the threads', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const stdout = worker.getStdout();
  const stderr = worker.getStderr();

  // @ts-expect-error: Testing internal method
  worker._worker.stdout.end('Hello ', 'utf8');
  // @ts-expect-error: Testing internal method
  worker._worker.stderr.end('Jest ', 'utf8');
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');
  // @ts-expect-error: Testing internal method
  worker._worker.stdout.end('World!', 'utf8');
  // @ts-expect-error: Testing internal method
  worker._worker.stderr.end('Workers!', 'utf8');
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit', 0);

  await expect(getStream(stdout!)).resolves.toBe('Hello World!');
  await expect(getStream(stderr!)).resolves.toBe('Jest Workers!');
});

it('sends the task to the thread', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const request = [CHILD_MESSAGE_CALL, false, 'foo', []] as ChildMessageCall;

  worker.send(
    request,
    () => {},
    () => {},
    () => {},
  );

  // Skipping call "0" because it corresponds to the "initialize" one.
  // @ts-expect-error: Testing internal method
  expect(jest.mocked(worker._worker.postMessage).mock.calls[1][0]).toEqual(
    request,
  );
});

it('resends the task to the thread after a retry', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  const request = [CHILD_MESSAGE_CALL, false, 'foo', []] as ChildMessageCall;

  worker.send(
    request,
    () => {},
    () => {},
    () => {},
  );

  // Skipping call "0" because it corresponds to the "initialize" one.
  // @ts-expect-error: Testing internal method
  expect(jest.mocked(worker._worker.postMessage).mock.calls[1][0]).toEqual(
    request,
  );

  // @ts-expect-error: Testing internal method
  const previousWorker = worker._worker;
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit');

  // @ts-expect-error: Testing internal method
  expect(worker._worker).not.toBe(previousWorker);

  // Skipping call "0" because it corresponds to the "initialize" one.
  // @ts-expect-error: Testing internal method
  expect(jest.mocked(worker._worker.postMessage).mock.calls[1][0]).toEqual(
    request,
  );
});

it('calls the onProcessStart method synchronously if the queue is empty', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const onProcessStart = jest.fn();
  const onProcessEnd = jest.fn();

  worker.send(
    [CHILD_MESSAGE_CALL, false, 'foo', []],
    onProcessStart,
    onProcessEnd,
    () => {},
  );

  // Only onProcessStart has been called
  expect(onProcessStart).toHaveBeenCalledTimes(1);
  expect(onProcessEnd).not.toHaveBeenCalled();

  // then first call replies...
  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [PARENT_MESSAGE_OK]);

  expect(onProcessEnd).toHaveBeenCalledTimes(1);
});

it('can send multiple messages to parent', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const onProcessStart = jest.fn();
  const onProcessEnd = jest.fn();
  const onCustomMessage = jest.fn();

  worker.send(
    [CHILD_MESSAGE_CALL, false, 'foo', []],
    onProcessStart,
    onProcessEnd,
    onCustomMessage,
  );

  // Only onProcessStart has been called
  expect(onProcessStart).toHaveBeenCalledTimes(1);
  expect(onProcessEnd).not.toHaveBeenCalled();
  expect(onCustomMessage).not.toHaveBeenCalled();

  // then first call replies...
  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [
    PARENT_MESSAGE_CUSTOM,
    {message: 'foo bar', otherKey: 1},
  ]);

  expect(onProcessEnd).not.toHaveBeenCalled();
  expect(onCustomMessage).toHaveBeenCalledTimes(1);
  expect(onCustomMessage).toHaveBeenCalledWith({
    message: 'foo bar',
    otherKey: 1,
  });
});

it('creates error instances for known errors', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const callback1 = jest.fn();
  const callback2 = jest.fn();
  const callback3 = jest.fn();

  // Testing a generic ECMAScript error.
  worker.send(
    [CHILD_MESSAGE_CALL, false, 'method', []],
    () => {},
    callback1,
    () => {},
  );

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [
    PARENT_MESSAGE_CLIENT_ERROR,
    'TypeError',
    'bar',
    'TypeError: bar',
    {},
  ]);

  expect(callback1.mock.calls[0][0]).toBeInstanceOf(TypeError);
  expect(callback1.mock.calls[0][0]).toMatchObject({
    message: 'bar',
    stack: 'TypeError: bar',
    type: 'TypeError',
  });

  // Testing a custom error.
  worker.send(
    [CHILD_MESSAGE_CALL, false, 'method', []],
    () => {},
    callback2,
    () => {},
  );

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [
    PARENT_MESSAGE_CLIENT_ERROR,
    'RandomCustomError',
    'bar',
    'RandomCustomError: bar',
    {qux: 'extra property'},
  ]);

  expect(callback2.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(callback2.mock.calls[0][0]).toMatchObject({
    message: 'bar',
    qux: 'extra property',
    stack: 'RandomCustomError: bar',
    type: 'RandomCustomError',
  });

  // Testing a non-object throw.
  worker.send(
    [CHILD_MESSAGE_CALL, false, 'method', []],
    () => {},
    callback3,
    () => {},
  );

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [
    PARENT_MESSAGE_CLIENT_ERROR,
    'Number',
    null,
    null,
    412,
  ]);

  expect(callback3.mock.calls[0][0]).toBe(412);
});

it('does not throw when the thread returns a strange message', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.send(
    [CHILD_MESSAGE_CALL, false, 'method', []],
    () => {},
    () => {},
    () => {},
  );

  // Type 27 does not exist.
  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', [27]);

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', 'test');

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', {foo: 'bar'});

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', 0);

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', null);

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', Symbol('test'));

  // @ts-expect-error: Testing internal method
  worker._worker.emit('message', true);
});

it('does not restart the thread if it cleanly exited', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(workerThreads).toHaveBeenCalledTimes(1);
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit', 0);
  expect(workerThreads).toHaveBeenCalledTimes(1);
});

it('resolves waitForExit() after the thread cleanly exited', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(workerThreads).toHaveBeenCalledTimes(1);
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit', 0);
  await worker.waitForExit(); // should not timeout
});

it('restarts the thread when the thread dies', () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(workerThreads).toHaveBeenCalledTimes(1);
  // @ts-expect-error: Testing internal method
  worker._worker.emit('exit', 1);
  expect(workerThreads).toHaveBeenCalledTimes(2);
});

it('terminates the thread when forceExit() is called', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.forceExit();
  // @ts-expect-error: Testing internal method
  expect(worker._worker.terminate).toHaveBeenCalled();
});
