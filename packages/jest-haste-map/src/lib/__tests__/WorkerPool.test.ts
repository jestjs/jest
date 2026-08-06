/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Worker} from 'jest-worker';
import {WorkerPool} from '../WorkerPool';

jest.mock('jest-worker');

const MockWorker = Worker as jest.MockedClass<typeof Worker>;

describe('WorkerPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an in-process worker when forceInBand is true', () => {
    const pool = new WorkerPool({maxWorkers: 4, workerPath: '/fake/worker.js'});
    const w = pool.get(true);
    expect(typeof w.getSha1).toBe('function');
    expect(typeof w.worker).toBe('function');
    expect(MockWorker).not.toHaveBeenCalled();
  });

  it('returns an in-process worker when maxWorkers <= 1', () => {
    const pool = new WorkerPool({maxWorkers: 1, workerPath: '/fake/worker.js'});
    const w = pool.get();
    expect(typeof w.getSha1).toBe('function');
    expect(MockWorker).not.toHaveBeenCalled();
  });

  it('constructs a jest-worker Worker when maxWorkers > 1', () => {
    const pool = new WorkerPool({maxWorkers: 2, workerPath: '/fake/worker.js'});
    pool.get();
    expect(MockWorker).toHaveBeenCalledTimes(1);
    expect(MockWorker).toHaveBeenCalledWith(
      '/fake/worker.js',
      expect.objectContaining({numWorkers: 2}),
    );
  });

  it('returns the same Worker instance on repeated get() calls', () => {
    const pool = new WorkerPool({maxWorkers: 2, workerPath: '/fake/worker.js'});
    const a = pool.get();
    const b = pool.get();
    expect(a).toBe(b);
    expect(MockWorker).toHaveBeenCalledTimes(1);
  });

  it('end() calls .end() on the jest-worker instance', () => {
    const mockEnd = jest.fn();
    MockWorker.mockImplementation(() => ({end: mockEnd}) as any);

    const pool = new WorkerPool({maxWorkers: 2, workerPath: '/fake/worker.js'});
    pool.get();
    pool.end();

    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('end() is idempotent — calling twice does not double-end', () => {
    const mockEnd = jest.fn();
    MockWorker.mockImplementation(() => ({end: mockEnd}) as any);

    const pool = new WorkerPool({maxWorkers: 2, workerPath: '/fake/worker.js'});
    pool.get();
    pool.end();
    pool.end();

    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('end() on an in-process worker does nothing', () => {
    const pool = new WorkerPool({maxWorkers: 1, workerPath: '/fake/worker.js'});
    pool.get();
    expect(() => pool.end()).not.toThrow();
  });
});
