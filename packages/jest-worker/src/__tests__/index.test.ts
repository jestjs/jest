/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {pathToFileURL} from 'url';
import type {JestWorkerFarm, Worker, WorkerFarmOptions} from '../';
import type FarmClass from '../Farm';
import type WorkerPoolClass from '../WorkerPool';

let WorkerFarm: typeof Worker;
let WorkerPool: typeof WorkerPoolClass;
let Farm: typeof FarmClass;

beforeEach(() => {
  jest.mock('../Farm', () => {
    const fakeClass = jest.fn(() => ({
      doWork: jest.fn(() => 42),
    }));

    return {
      __esModule: true,
      default: fakeClass,
    };
  });

  jest.mock('../WorkerPool', () => {
    const fakeWorker = jest.fn(() => ({
      createWorker: jest.fn(),
      end: jest.fn(),
      getStderr: () => '<mocked stderr>',
      getStdout: () => '<mocked stdout>',
      send: jest.fn(),
    }));

    return {
      __esModule: true,
      default: fakeWorker,
    };
  });

  jest.mock(
    '/fake-worker.js',
    () => ({
      _shouldNotExist1() {},
      methodA() {},
      methodB() {},
    }),
    {virtual: true},
  );

  jest.mock('/fake-worker-with-default-method.js', () => () => {}, {
    virtual: true,
  });

  WorkerFarm = (require('../') as typeof import('../')).Worker;
  Farm = (require('../Farm') as typeof import('../Farm')).default;
  WorkerPool = (require('../WorkerPool') as typeof import('../WorkerPool'))
    .default;
});

afterEach(() => {
  jest.resetModules();
});

it('makes a non-existing relative worker throw', () => {
  expect(() => {
    // eslint-disable-next-line no-new
    new WorkerFarm('./relative/worker-module.js');
  }).toThrow("'workerPath' must be absolute");
});

it('supports URLs', () => {
  const workerPathUrl = pathToFileURL(__filename);

  // eslint-disable-next-line no-new
  new WorkerFarm(workerPathUrl, {exposedMethods: ['foo', 'bar']});
  // eslint-disable-next-line no-new
  new WorkerFarm(workerPathUrl.href, {exposedMethods: ['foo', 'bar']});

  expect(WorkerPool).toHaveBeenCalledTimes(2);
  expect(WorkerPool).toHaveBeenNthCalledWith(1, __filename, expect.anything());
  expect(WorkerPool).toHaveBeenNthCalledWith(2, __filename, expect.anything());
});

it('exposes the right API using default working', () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  }) as JestWorkerFarm<{foo(): void; bar(): void}>;

  expect(typeof farm.foo).toBe('function');
  expect(typeof farm.bar).toBe('function');
});

it('exposes the right API using passed worker', () => {
  const WorkerPool = jest.fn(() => ({
    createWorker: jest.fn(),
    end: jest.fn(),
    getStderr: jest.fn(),
    getStdout: jest.fn(),
    getWorkers: jest.fn(),
    send: jest.fn(),
    start: jest.fn(),
  }));

  const farm = new WorkerFarm('/tmp/baz.js', {
    WorkerPool,
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  } as WorkerFarmOptions) as JestWorkerFarm<{foo(): void; bar(): void}>;

  expect(typeof farm.foo).toBe('function');
  expect(typeof farm.bar).toBe('function');
});

it('breaks if any of the forbidden methods is tried to be exposed', () => {
  expect(
    () => new WorkerFarm('/tmp/baz.js', {exposedMethods: ['getStdout']}),
  ).toThrow('Cannot define a method called getStdout');

  expect(
    () => new WorkerFarm('/tmp/baz.js', {exposedMethods: ['getStderr']}),
  ).toThrow('Cannot define a method called getStderr');

  expect(
    () => new WorkerFarm('/tmp/baz.js', {exposedMethods: ['end']}),
  ).toThrow('Cannot define a method called end');
});

it('works with minimal options', () => {
  const farm1 = new WorkerFarm('/fake-worker.js') as JestWorkerFarm<{
    methodA(): void;
    methodB(): void;
  }>;

  expect(Farm).toHaveBeenCalledTimes(1);
  expect(WorkerPool).toHaveBeenCalledTimes(1);
  expect(typeof farm1.methodA).toBe('function');
  expect(typeof farm1.methodB).toBe('function');
  expect(typeof farm1).toEqual(
    expect.not.objectContaining({
      _shouldNotExist: expect.anything,
    }),
  );

  const farm2 = new WorkerFarm(
    '/fake-worker-with-default-method.js',
  ) as JestWorkerFarm<{default(): void}>;

  expect(typeof farm2.default).toBe('function');
});

it('does not let make calls after the farm is ended', () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  }) as JestWorkerFarm<{foo(): void; bar(): void}>;

  farm.end();

  // @ts-expect-error: Testing internal method
  expect(farm._workerPool.end).toHaveBeenCalledTimes(1);
  expect(() => farm.foo()).toThrow(
    'Farm is ended, no more calls can be done to it',
  );
  expect(() => farm.bar()).toThrow(
    'Farm is ended, no more calls can be done to it',
  );
});

it('does not let end the farm after it is ended', async () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  farm.end();
  // @ts-expect-error: Testing internal method
  expect(farm._workerPool.end).toHaveBeenCalledTimes(1);
  await expect(farm.end()).rejects.toThrow(
    'Farm is ended, no more calls can be done to it',
  );
  await expect(farm.end()).rejects.toThrow(
    'Farm is ended, no more calls can be done to it',
  );
  // @ts-expect-error: Testing internal method
  expect(farm._workerPool.end).toHaveBeenCalledTimes(1);
});

it('calls doWork', async () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  }) as JestWorkerFarm<{foo(a: string, b: string): number}>;

  const promise = farm.foo('car', 'plane');

  expect(await promise).toBe(42);
});

it('calls getStderr and getStdout from worker', async () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  });

  expect(farm.getStderr()).toBe('<mocked stderr>');
  expect(farm.getStdout()).toBe('<mocked stdout>');
});
