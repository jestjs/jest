/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let Farm;
let WorkerFarm;
let WorkerPool;

beforeEach(() => {
  jest.mock('../Farm', () => {
    const fakeFarm = jest.fn(() => ({
      doWork: jest.fn().mockResolvedValue(42),
    }));

    return {
      __esModule: true,
      default: fakeFarm,
    };
  });

  jest.mock('../WorkerPool', () => {
    const fakeWorker = jest.fn(() => ({
      createWorker: jest.fn(),
      end: jest.fn(),
      getStderr: () => jest.fn(a => a),
      getStdout: () => jest.fn(a => a),
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

  Farm = require('../Farm').default;
  WorkerFarm = require('../WorkerFarm').default;
  WorkerPool = require('../WorkerPool').default;
});

afterEach(() => {
  jest.resetModules();
});

it('exposes the right API using default WorkerPool', () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  expect(typeof farm.foo).toBe('function');
  expect(typeof farm.bar).toBe('function');
});

it('exposes the right API using passed WorkerPool', () => {
  const WorkerPool = jest.fn(() => ({
    createWorker: jest.fn(),
    end: jest.fn(),
    getStderr: () => jest.fn(a => a),
    getStdout: () => jest.fn(a => a),
    send: jest.fn(),
  }));

  const farm = new WorkerFarm('/tmp/baz.js', {
    WorkerPool,
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  expect(typeof farm.foo).toBe('function');
  expect(typeof farm.bar).toBe('function');
});

it('works with minimal options', () => {
  const farm1 = new WorkerFarm('/fake-worker.js', {
    exposedMethods: ['methodA', 'methodB'],
  });

  expect(Farm).toHaveBeenCalledTimes(1);
  expect(WorkerPool).toHaveBeenCalledTimes(1);
  expect(typeof farm1.methodA).toBe('function');
  expect(typeof farm1.methodB).toBe('function');
  expect(typeof farm1._shouldNotExist).not.toBe('function');

  const farm2 = new WorkerFarm('/fake-worker-with-default-method.js', {
    exposedMethods: ['default'],
  });

  expect(typeof farm2.default).toBe('function');
});

it('does not let make calls after the farm is ended', () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  farm.end();

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
  expect(farm._workerPool.end).toHaveBeenCalledTimes(1);
  await expect(farm.end()).rejects.toThrow(
    'Farm is ended, no more calls can be done to it',
  );
  await expect(farm.end()).rejects.toThrow(
    'Farm is ended, no more calls can be done to it',
  );
  expect(farm._workerPool.end).toHaveBeenCalledTimes(1);
});

it('calls doWork', async () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  });

  const promise = farm.foo('car', 'plane');

  expect(await promise).toEqual(42);
});

it('calls getStderr and getStdout from worker', async () => {
  const farm = new WorkerFarm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  });

  expect(farm.getStderr()('err')).toEqual('err');
  expect(farm.getStdout()('out')).toEqual('out');
});
