/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import WorkerPool from '../WorkerPool';
import type {ChildMessage, WorkerPoolOptions} from '../types';
import ChildProcessWorker from '../workers/ChildProcessWorker';
import NodeThreadWorker from '../workers/NodeThreadsWorker';

jest.mock('../workers/ChildProcessWorker', () => {
  const fakeClass = jest.fn(() => ({
    getStderr: jest.fn(),
    getStdout: jest.fn(),
    send: jest.fn(),
  }));

  return {
    __esModule: true,
    default: fakeClass,
  };
});

jest.mock('../workers/NodeThreadsWorker', () => {
  const fakeClass = jest.fn(() => ({
    getStderr: jest.fn(),
    getStdout: jest.fn(),
    send: jest.fn(),
  }));

  return {
    __esModule: true,
    default: fakeClass,
  };
});

describe('WorkerPool', () => {
  beforeEach(() => {
    jest.mocked(ChildProcessWorker).mockClear();
    jest.mocked(NodeThreadWorker).mockClear();
  });

  it('should create a ChildProcessWorker and send to it', () => {
    jest.mock('worker_threads', () => {
      throw new Error('Undefined');
    });
    const workerPool = new WorkerPool('/path', {
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
    } as WorkerPoolOptions);

    const request = {foo: 'bar'} as unknown as ChildMessage;
    const onStart = () => {};
    const onEnd = () => {};
    const onCustomMessage = () => {};

    workerPool.send(0, request, onStart, onEnd, onCustomMessage);

    expect(ChildProcessWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(NodeThreadWorker).not.toHaveBeenCalled();
    // @ts-expect-error: Testing internal method
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      request,
      onStart,
      onEnd,
      onCustomMessage,
    );
  });

  it('should create a NodeThreadWorker and send to it', () => {
    jest.mock('worker_threads', () => 'Defined');
    const workerPool = new WorkerPool('/path', {
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
    } as WorkerPoolOptions);

    const request = {foo: 'bar'} as unknown as ChildMessage;
    const onStart = () => {};
    const onEnd = () => {};
    const onCustomMessage = () => {};

    workerPool.send(0, request, onStart, onEnd, onCustomMessage);

    expect(NodeThreadWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(ChildProcessWorker).not.toHaveBeenCalled();
    // @ts-expect-error: Testing internal method
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      request,
      onStart,
      onEnd,
      onCustomMessage,
    );
  });

  it('should use ChildProcessWorker if passed enableWorkerThreads: false', () => {
    jest.mock('worker_threads', () => 'Defined');
    const workerPool = new WorkerPool('/path', {
      enableWorkerThreads: false,
      forkOptions: {},
      maxRetries: 1,
      numWorkers: 1,
    } as WorkerPoolOptions);

    const request = {foo: 'bar'} as unknown as ChildMessage;
    const onStart = () => {};
    const onEnd = () => {};
    const onCustomMessage = () => {};

    workerPool.send(0, request, onStart, onEnd, onCustomMessage);

    expect(ChildProcessWorker).toHaveBeenCalledWith({
      forkOptions: {},
      maxRetries: 1,
      workerId: 0,
      workerPath: '/path',
    });
    expect(NodeThreadWorker).not.toHaveBeenCalled();
    // @ts-expect-error: Testing internal method
    expect(workerPool._workers[0].send).toHaveBeenCalledWith(
      request,
      onStart,
      onEnd,
      onCustomMessage,
    );
  });
});
