/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CHILD_MESSAGE_END,
  type WorkerInterface,
  type WorkerOptions,
  type WorkerPoolOptions,
} from '../../types';
import BaseWorkerPool from '../BaseWorkerPool';

const Worker =
  jest.fn<
    (workerOptions: Omit<WorkerOptions, 'resourceLimits'>) => WorkerInterface
  >();

const mockSend = jest.fn();

class MockWorkerPool extends BaseWorkerPool {
  override createWorker(workerOptions: WorkerOptions) {
    return new Worker(workerOptions);
  }
  send(...args: Array<unknown>) {
    return mockSend(...args);
  }
}

describe('BaseWorkerPool', () => {
  beforeEach(() => {
    Worker.mockClear();
    Worker.mockImplementation(
      () =>
        ({
          forceExit: jest.fn(),
          getStderr: () =>
            ({once() {}, pipe() {}}) as unknown as NodeJS.ReadStream,
          getStdout: () =>
            ({once() {}, pipe() {}}) as unknown as NodeJS.ReadStream,
          send: jest.fn(),
          waitForExit: () => Promise.resolve(),
        }) as unknown as WorkerInterface,
    );
  });

  it('throws error when createWorker is not defined', () => {
    expect(
      () =>
        new BaseWorkerPool('/tmp/baz.js', {
          forkOptions: {execArgv: []},
          maxRetries: 6,
          numWorkers: 4,
          setupArgs: [],
        } as unknown as WorkerPoolOptions),
    ).toThrow('Missing method createWorker in WorkerPool');
  });

  it('creates and exposes n workers', () => {
    const pool = new MockWorkerPool('/tmp/baz.js', {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      numWorkers: 4,
      setupArgs: [],
    } as unknown as WorkerPoolOptions);

    expect(pool.getWorkers()).toHaveLength(4);
    expect(pool.getWorkerById(0)).toBeDefined();
    expect(pool.getWorkerById(1)).toBeDefined();
    expect(pool.getWorkerById(2)).toBeDefined();
    expect(pool.getWorkerById(3)).toBeDefined();
  });

  it('creates workers with the right options', () => {
    // eslint-disable-next-line no-new
    new MockWorkerPool('/tmp/baz.js', {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      numWorkers: 4,
      setupArgs: [{foo: 'bar'}],
    } as unknown as WorkerPoolOptions);

    expect(Worker).toHaveBeenCalledTimes(4);
    expect(Worker).toHaveBeenNthCalledWith(1, {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      setupArgs: [{foo: 'bar'}],
      workerId: 0,
      workerPath: '/tmp/baz.js',
    });
    expect(Worker).toHaveBeenNthCalledWith(2, {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      setupArgs: [{foo: 'bar'}],
      workerId: 1,
      workerPath: '/tmp/baz.js',
    });
    expect(Worker).toHaveBeenNthCalledWith(3, {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      setupArgs: [{foo: 'bar'}],
      workerId: 2,
      workerPath: '/tmp/baz.js',
    });
    expect(Worker).toHaveBeenNthCalledWith(4, {
      forkOptions: {execArgv: []},
      maxRetries: 6,
      setupArgs: [{foo: 'bar'}],
      workerId: 3,
      workerPath: '/tmp/baz.js',
    });
  });

  it('create multiple workers with unique worker ids', () => {
    // eslint-disable-next-line no-new
    new MockWorkerPool('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      forkOptions: {execArgv: []},
      maxRetries: 6,
      numWorkers: 3,
    } as unknown as WorkerPoolOptions);

    expect(Worker).toHaveBeenCalledTimes(3);
    expect(Worker.mock.calls[0][0].workerId).toBe(0);
    expect(Worker.mock.calls[1][0].workerId).toBe(1);
    expect(Worker.mock.calls[2][0].workerId).toBe(2);
  });

  it('aggregates all stdouts and stderrs from all workers', () => {
    const out: Array<NodeJS.WritableStream> = [];
    const err: Array<NodeJS.WritableStream> = [];

    Worker.mockImplementation(
      () =>
        ({
          getStderr: () =>
            ({
              once() {},
              pipe(errStream: NodeJS.WritableStream) {
                err.push(errStream);
              },
            }) as unknown as NodeJS.ReadableStream,
          getStdout: () =>
            ({
              once() {},
              pipe(outStream: NodeJS.WritableStream) {
                out.push(outStream);
              },
            }) as unknown as NodeJS.ReadableStream,
        }) as WorkerInterface,
    );

    const farm = new MockWorkerPool('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      numWorkers: 2,
    } as unknown as WorkerPoolOptions);

    expect(out).toHaveLength(2);
    expect(err).toHaveLength(2);

    const stdout = jest.fn<(a: string) => void>();
    const stderr = jest.fn<(a: string) => void>();

    farm.getStdout().on('data', stdout);
    farm.getStderr().on('data', stderr);

    out[0].write(Buffer.from('hello'));
    out[1].write(Buffer.from('bye'));
    err[1].write(Buffer.from('house'));
    err[0].write(Buffer.from('tree'));

    expect(stdout.mock.calls[0][0].toString()).toBe('hello');
    expect(stdout.mock.calls[1][0].toString()).toBe('bye');
    expect(stderr.mock.calls[0][0].toString()).toBe('house');
    expect(stderr.mock.calls[1][0].toString()).toBe('tree');
  });

  it('works when stdout and stderr are not piped to the parent', () => {
    Worker.mockImplementation(
      () =>
        ({
          getStderr: () => null,
          getStdout: () => null,
          send: () => null,
        }) as unknown as WorkerInterface,
    );

    const farm = new MockWorkerPool('/tmp/baz.js', {
      exposedMethods: ['foo', 'bar'],
      forkOptions: {
        silent: false,
        stdio: 'inherit',
      },
      numWorkers: 2,
    } as unknown as WorkerPoolOptions);

    expect(() => farm.send()).not.toThrow();
    expect(() => farm.send()).not.toThrow();
  });

  describe('end', () => {
    it('ends all workers', async () => {
      const pool = new MockWorkerPool('/tmp/baz.js', {
        forkOptions: {execArgv: []},
        maxRetries: 6,
        numWorkers: 4,
        setupArgs: [],
      } as unknown as WorkerPoolOptions);

      const workers = pool.getWorkers();
      await pool.end();

      const endMessage = [CHILD_MESSAGE_END, false];
      expect(jest.mocked(workers[0].send).mock.calls[0][0]).toEqual(endMessage);
      expect(jest.mocked(workers[1].send).mock.calls[0][0]).toEqual(endMessage);
      expect(jest.mocked(workers[2].send).mock.calls[0][0]).toEqual(endMessage);
      expect(jest.mocked(workers[3].send).mock.calls[0][0]).toEqual(endMessage);
    });

    it('resolves with forceExited=false if workers exited gracefully', async () => {
      Worker.mockImplementation(
        () =>
          ({
            forceExit: jest.fn(),
            getStderr: () => null,
            getStdout: () => null,
            send: jest.fn(),
            waitForExit: () => Promise.resolve(),
          }) as unknown as WorkerInterface,
      );

      const pool = new MockWorkerPool('/tmp/baz.js', {
        forkOptions: {execArgv: []},
        maxRetries: 6,
        numWorkers: 4,
        setupArgs: [],
      } as unknown as WorkerPoolOptions);

      expect(await pool.end()).toEqual({forceExited: false});
    });

    it('force exits workers that do not exit gracefully and resolves with forceExited=true', async () => {
      // Set it up so that the first worker does not resolve waitForExit immediately,
      // but only when forceExit() is called
      let worker0Exited: (a?: unknown) => void;
      Worker.mockImplementationOnce(
        () =>
          ({
            forceExit: () => {
              worker0Exited();
            },
            getStderr: () => null,
            getStdout: () => null,
            send: jest.fn(),
            waitForExit: () =>
              new Promise(resolve => (worker0Exited = resolve)),
          }) as unknown as WorkerInterface,
      ).mockImplementation(
        () =>
          ({
            forceExit: jest.fn(),
            getStderr: () => null,
            getStdout: () => null,
            send: jest.fn(),
            waitForExit: () => Promise.resolve(),
          }) as unknown as WorkerInterface,
      );

      const pool = new MockWorkerPool('/tmp/baz.js', {
        forkOptions: {execArgv: []},
        maxRetries: 6,
        numWorkers: 2,
        setupArgs: [],
      } as unknown as WorkerPoolOptions);

      const workers = pool.getWorkers();
      expect(await pool.end()).toEqual({forceExited: true});

      expect(workers[1].forceExit).not.toHaveBeenCalled();
    });
  });
});
