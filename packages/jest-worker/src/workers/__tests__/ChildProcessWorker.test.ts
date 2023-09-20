/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import {PassThrough} from 'stream';
import getStream = require('get-stream');
import * as supportsColor from 'supports-color';
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  ChildMessage,
  ChildMessageCall,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_CUSTOM,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
  WorkerOptions,
} from '../../types';

jest.useFakeTimers();

jest.mock('child_process');

let Worker: typeof import('../ChildProcessWorker').default;
let childProcess: typeof import('child_process');
let forkInterface: ReturnType<typeof childProcess.fork>;
let originalExecArgv: typeof process.execArgv;

const totalmem = jest.spyOn(require('os') as typeof import('os'), 'totalmem');

class MockedForkInterface extends EventEmitter {
  connected = true;
  kill = jest.fn();
  send = jest.fn();
  stderr = new PassThrough();
  stdout = new PassThrough();
}

beforeEach(() => {
  originalExecArgv = process.execArgv;

  childProcess = require('child_process') as typeof import('child_process');
  jest.mocked(childProcess.fork).mockImplementation(() => {
    forkInterface = new MockedForkInterface() as unknown as ReturnType<
      typeof childProcess.fork
    >;

    return forkInterface;
  });

  totalmem.mockReset();

  Worker = (
    require('../ChildProcessWorker') as typeof import('../ChildProcessWorker')
  ).default;
});

afterEach(() => {
  jest.resetModules();
  process.execArgv = originalExecArgv;
});

it('passes fork options down to child_process.fork, adding the defaults', () => {
  const child = require.resolve('../processChild');

  process.execArgv = ['--inspect', '-p'];

  // eslint-disable-next-line no-new
  new Worker({
    forkOptions: {
      cwd: '/tmp',
      execPath: 'hello',
    },
    maxRetries: 3,
    workerId: Number(process.env.JEST_WORKER_ID) - 1,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  expect(jest.mocked(childProcess.fork).mock.calls[0][0]).toBe(child);
  expect(jest.mocked(childProcess.fork).mock.calls[0][2]).toEqual({
    cwd: '/tmp', // Overridden default option.
    env: {...process.env, FORCE_COLOR: supportsColor.stdout ? '1' : undefined}, // Default option.
    execArgv: ['-p'], // Filtered option.
    execPath: 'hello', // Added option.
    serialization: 'advanced', // Default option.
    silent: true, // Default option.
  });
});

it('passes workerId to the child process and assign it to 1-indexed env.JEST_WORKER_ID', () => {
  // eslint-disable-next-line no-new
  new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerId: 2,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(jest.mocked(childProcess.fork).mock.calls[0][2]).toMatchObject({
    env: {JEST_WORKER_ID: '3'},
  });
});

it('initializes the child process with the given workerPath', () => {
  // eslint-disable-next-line no-new
  new Worker({
    forkOptions: {},
    maxRetries: 3,
    setupArgs: ['foo', 'bar'],
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  expect(jest.mocked(forkInterface.send).mock.calls[0][0]).toEqual([
    CHILD_MESSAGE_INITIALIZE,
    false,
    '/tmp/foo/bar/baz.js',
    ['foo', 'bar'],
  ]);
});

it('stops initializing the worker after the amount of retries is exceeded', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  const request: ChildMessageCall = [CHILD_MESSAGE_CALL, false, 'foo', []];
  const onProcessStart = jest.fn();
  const onProcessEnd = jest.fn();

  worker.send(request, onProcessStart, onProcessEnd, () => {});

  // We fail four times (initial + three retries).
  forkInterface.emit('exit', 1);
  forkInterface.emit('exit', 1);
  forkInterface.emit('exit', 1);
  forkInterface.emit('exit', 1);

  expect(childProcess.fork).toHaveBeenCalledTimes(5);
  expect(onProcessStart).toHaveBeenCalledWith(worker);
  expect(onProcessEnd).toHaveBeenCalledTimes(1);
  expect(onProcessEnd.mock.calls[0][0]).toBeInstanceOf(Error);
  expect(onProcessEnd.mock.calls[0][0]).toMatchObject({
    type: 'WorkerError',
  });
  expect(onProcessEnd.mock.calls[0][1]).toBeNull();
});

it('provides stdout and stderr from the child processes', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  const stdout = worker.getStdout()!;
  const stderr = worker.getStderr()!;

  (forkInterface.stdout as PassThrough).end('Hello ', 'utf8');
  (forkInterface.stderr as PassThrough).end('Jest ', 'utf8');
  forkInterface.emit('exit', 1);
  (forkInterface.stdout as PassThrough).end('World!', 'utf8');
  (forkInterface.stderr as PassThrough).end('Workers!', 'utf8');
  forkInterface.emit('exit', 0);

  await expect(getStream(stdout)).resolves.toBe('Hello World!');
  await expect(getStream(stderr)).resolves.toBe('Jest Workers!');
});

it('sends the task to the child process', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    setupArgs: [],
    workerPath: '/tmp/foo',
  } as unknown as WorkerOptions);

  const request: ChildMessage = [CHILD_MESSAGE_CALL, false, 'foo', []];

  worker.send(
    request,
    () => {},
    () => {},
    () => {},
  );

  // Skipping call "0" because it corresponds to the "initialize" one.
  expect(jest.mocked(forkInterface.send).mock.calls[1][0]).toEqual(request);
});

it('resends the task to the child process after a retry', () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo/bar/baz.js',
  } as WorkerOptions);

  const request: ChildMessage = [CHILD_MESSAGE_CALL, false, 'foo', []];

  worker.send(
    request,
    () => {},
    () => {},
    () => {},
  );

  // Skipping call "0" because it corresponds to the "initialize" one.
  expect(jest.mocked(forkInterface.send).mock.calls[1][0]).toEqual(request);

  const previousForkInterface = forkInterface;
  forkInterface.emit('exit', 1);

  expect(forkInterface).not.toBe(previousForkInterface);

  // Skipping call "0" because it corresponds to the "initialize" one.
  expect(jest.mocked(forkInterface.send).mock.calls[1][0]).toEqual(request);
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
  forkInterface.emit('message', [PARENT_MESSAGE_OK]);

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
  forkInterface.emit('message', [
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

  forkInterface.emit('message', [
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

  forkInterface.emit('message', [
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

  forkInterface.emit('message', [
    PARENT_MESSAGE_CLIENT_ERROR,
    'Number',
    null,
    null,
    412,
  ]);

  expect(callback3.mock.calls[0][0]).toBe(412);
});

it('does not throw when the child process returns a strange message', () => {
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
  forkInterface.emit('message', [27]);

  forkInterface.emit('message', 'test');
  forkInterface.emit('message', {foo: 'bar'});
  forkInterface.emit('message', 0);
  forkInterface.emit('message', null);
  forkInterface.emit('message', Symbol('test'));
  forkInterface.emit('message', true);
});

it('does not restart the child if it cleanly exited', () => {
  // eslint-disable-next-line no-new
  new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(childProcess.fork).toHaveBeenCalledTimes(1);
  forkInterface.emit('exit', 0);
  expect(childProcess.fork).toHaveBeenCalledTimes(1);
});

it('resolves waitForExit() after the child process cleanly exited', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(childProcess.fork).toHaveBeenCalledTimes(1);
  forkInterface.emit('exit', 0);
  await worker.waitForExit(); // should not timeout
});

it('restarts the child when the child process dies', () => {
  // eslint-disable-next-line no-new
  new Worker({
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(childProcess.fork).toHaveBeenCalledTimes(1);
  forkInterface.emit('exit', 1);
  expect(childProcess.fork).toHaveBeenCalledTimes(2);
});

it('when out of memory occurs the worker is killed and exits', async () => {
  const worker = new Worker({
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  expect(childProcess.fork).toHaveBeenCalledTimes(1);

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

  // Splitting the emit into 2 to check concat is happening.
  forkInterface.stderr!.emit(
    'data',
    `<--- Last few GCs --->

  [20048:0x7fa356200000]      349 ms: Mark-sweep (reduce) 49.2 (80.6) -> 49.0 (51.6) MB, 6.8 / 0.0 ms  (+ 59.5 ms in 35 steps since start of marking, biggest step 2.3 ms, walltime since start of marking 68 ms) (average mu = 0.679, current mu = 0.679) finali[20048:0x7fa356200000]      418 ms: Mark-sweep 50.0 (51.6) -> 49.9 (55.6) MB, 67.8 / 0.0 ms  (average mu = 0.512, current mu = 0.004) allocation failure scavenge might not succeed


  <--- JS stacktrace --->

  FATAL ERROR: Reached heap limit Allocation failed - JavaScript he`,
  );

  forkInterface.stderr!.emit(
    'data',
    `ap out of memory
   1: 0x10da153a5 node::Abort() (.cold.1) [/Users/paul/.nvm/versions/node/v16.10.0/bin/node]
   2: 0x10c6f09b9 node::Abort() [/Users/paul/.nvm/versions/node/v16.10.0/bin/node]`,
  );
  forkInterface.stderr!.emit('end');

  forkInterface.emit('exit', null, 'SIGABRT');

  // We don't want it to try and restart.
  expect(childProcess.fork).toHaveBeenCalledTimes(1);
  expect(onProcessEnd).toHaveBeenCalledTimes(1);
  expect(onProcessEnd).toHaveBeenCalledWith(
    new Error('Jest worker ran out of memory and crashed'),
    null,
  );

  // It should not hang
  await worker.waitForExit();
});

it('sends SIGTERM when forceExit() is called', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.forceExit();
  expect(jest.mocked(forkInterface.kill).mock.calls).toEqual([['SIGTERM']]);
});

it('sends SIGKILL some time after SIGTERM', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.forceExit();
  jest.runAllTimers();
  expect(jest.mocked(forkInterface.kill).mock.calls).toEqual([
    ['SIGTERM'],
    ['SIGKILL'],
  ]);
});

it('does not send SIGKILL if SIGTERM exited the process', async () => {
  const worker = new Worker({
    forkOptions: {},
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.forceExit();
  forkInterface.emit('exit', 143 /* SIGTERM exit code */);
  await Promise.resolve();

  jest.runAllTimers();
  expect(jest.mocked(forkInterface.kill).mock.calls).toEqual([['SIGTERM']]);
});

it('should check for memory limits and not restart if under percentage limit', async () => {
  const memoryConfig = {
    limit: 0.2,
    processHeap: 2500,
    totalMem: 16000,
  };

  const worker = new Worker({
    forkOptions: {},
    idleMemoryLimit: memoryConfig.limit,
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
  forkInterface.emit('message', [PARENT_MESSAGE_OK]);

  expect(onProcessEnd).toHaveBeenCalledTimes(1);

  // This is the initialization call.
  expect(jest.mocked(forkInterface.send).mock.calls[0][0]).toEqual([
    CHILD_MESSAGE_INITIALIZE,
    false,
    '/tmp/foo',
    undefined,
  ]);

  // This is the child message
  expect(jest.mocked(forkInterface.send).mock.calls[1][0]).toEqual([
    CHILD_MESSAGE_CALL,
    false,
    'foo',
    [],
  ]);

  // This is the subsequent call to get memory usage
  expect(jest.mocked(forkInterface.send).mock.calls[2][0]).toEqual([
    CHILD_MESSAGE_MEM_USAGE,
  ]);

  totalmem.mockReturnValue(memoryConfig.totalMem);

  forkInterface.emit('message', [
    PARENT_MESSAGE_MEM_USAGE,
    memoryConfig.processHeap,
  ]);

  expect(totalmem).toHaveBeenCalledTimes(1);
  expect(forkInterface.kill).not.toHaveBeenCalled();
});

it('should check for memory limits and not restart if under absolute limit', async () => {
  const memoryConfig = {
    limit: 2600,
    processHeap: 2500,
    totalMem: 16000,
  };

  const worker = new Worker({
    forkOptions: {},
    idleMemoryLimit: memoryConfig.limit,
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.checkMemoryUsage();

  totalmem.mockReturnValue(memoryConfig.totalMem);

  forkInterface.emit('message', [
    PARENT_MESSAGE_MEM_USAGE,
    memoryConfig.processHeap,
  ]);

  expect(totalmem).not.toHaveBeenCalled();
  expect(forkInterface.kill).not.toHaveBeenCalled();
});

it('should check for memory limits and restart if above percentage limit', async () => {
  const memoryConfig = {
    limit: 0.01,
    processHeap: 2500,
    totalMem: 16000,
  };

  const worker = new Worker({
    forkOptions: {},
    idleMemoryLimit: memoryConfig.limit,
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.checkMemoryUsage();

  totalmem.mockReturnValue(memoryConfig.totalMem);

  forkInterface.emit('message', [
    PARENT_MESSAGE_MEM_USAGE,
    memoryConfig.processHeap,
  ]);

  expect(totalmem).toHaveBeenCalledTimes(1);
  expect(forkInterface.kill).toHaveBeenCalledTimes(1);
});

it('should check for memory limits and restart if above absolute limit', async () => {
  const memoryConfig = {
    limit: 2000,
    processHeap: 2500,
    totalMem: 16000,
  };

  const worker = new Worker({
    forkOptions: {},
    idleMemoryLimit: memoryConfig.limit,
    maxRetries: 3,
    workerPath: '/tmp/foo',
  } as WorkerOptions);

  worker.checkMemoryUsage();

  totalmem.mockReturnValue(memoryConfig.totalMem);

  forkInterface.emit('message', [
    PARENT_MESSAGE_MEM_USAGE,
    memoryConfig.processHeap,
  ]);

  expect(totalmem).not.toHaveBeenCalled();
  expect(forkInterface.kill).toHaveBeenCalledTimes(1);
});
