/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let Farm;
let Worker;
let mockWorkers;

function workerReply(i, error, result) {
  return mockWorkers[i].send.mock.calls[0][1].call(
    mockWorkers[i],
    error,
    result,
  );
}

beforeEach(() => {
  mockWorkers = [];

  // The worker mock returns a worker with custom methods, plus it stores them
  // in a global list, so that they can be accessed later. This list is reset in
  // every test.
  jest.mock('../worker', () => {
    const fakeClass = jest.fn(() => {
      const fakeWorker = {
        getStderr: () => ({once() {}, pipe() {}}),
        getStdout: () => ({once() {}, pipe() {}}),
        send: jest.fn(),
      };

      mockWorkers.push(fakeWorker);

      return fakeWorker;
    });

    return {
      __esModule: true,
      default: fakeClass,
    };
  });

  jest.mock(
    '/fake-worker.js',
    () => {
      return {
        _shouldNotExist1() {},
        methodA() {},
        methodB() {},
      };
    },
    {virtual: true},
  );

  jest.mock(
    '/fake-worker-with-default-method.js',
    () => {
      return () => {};
    },
    {virtual: true},
  );

  Worker = require('../worker').default;
  Farm = require('../index').default;
});

afterEach(() => {
  jest.resetModules();
});

it('exposes the right API', () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  expect(typeof farm.foo).toBe('function');
  expect(typeof farm.bar).toBe('function');
});

it('breaks if any of the forbidden methods is tried to be exposed', () => {
  expect(
    () => new Farm('/tmp/baz.js', {exposedMethods: ['getStdout']}),
  ).toThrow();

  expect(
    () => new Farm('/tmp/baz.js', {exposedMethods: ['getStderr']}),
  ).toThrow();

  expect(() => new Farm('/tmp/baz.js', {exposedMethods: ['end']})).toThrow();
});

it('works with minimal options', () => {
  // eslint-disable-next-line no-new
  const farm1 = new Farm('/fake-worker.js');

  expect(Worker).toHaveBeenCalledTimes(require('os').cpus().length - 1);
  expect(typeof farm1.methodA).toBe('function');
  expect(typeof farm1.methodB).toBe('function');
  expect(typeof farm1._shouldNotExist).not.toBe('function');

  // eslint-disable-next-line no-new
  const farm2 = new Farm('/fake-worker-with-default-method.js');

  expect(typeof farm2.default).toBe('function');
});

it('tries instantiating workers with the right options', () => {
  // eslint-disable-next-line no-new
  new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    forkOptions: {execArgv: []},
    maxRetries: 6,
    numWorkers: 4,
  });

  expect(Worker).toHaveBeenCalledTimes(4);
  expect(Worker.mock.calls[0][0]).toEqual({
    forkOptions: {execArgv: []},
    maxRetries: 6,
    workerPath: '/tmp/baz.js',
  });
});

it('makes a non-existing relative worker throw', () => {
  expect(
    () =>
      new Farm('./baz.js', {
        exposedMethods: [],
        numWorkers: 1,
      }),
  ).toThrow();
});

it('aggregates all stdouts and stderrs from all workers', () => {
  const out = [];
  const err = [];

  Worker.mockImplementation(() => {
    return {
      getStderr: () => ({
        once() {},
        pipe(errStream) {
          err.push(errStream);
        },
      }),
      getStdout: () => ({
        once() {},
        pipe(outStream) {
          out.push(outStream);
        },
      }),
    };
  });

  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 2,
  });

  expect(out.length).toBe(2);
  expect(err.length).toBe(2);

  const stdout = jest.fn();
  const stderr = jest.fn();

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

it('does not let make calls after the farm is ended', () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  farm.end();

  expect(() => farm.foo()).toThrow();
  expect(() => farm.bar()).toThrow();
});

it('does not let end the farm after it is ended', () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 4,
  });

  farm.end();

  expect(() => farm.end()).toThrow();
});

it('calls "computeWorkerKey" for each of the calls', () => {
  const computeWorkerKey = jest.fn();
  const farm = new Farm('/tmp/baz.js', {
    computeWorkerKey,
    exposedMethods: ['foo', 'bar'],
    numWorkers: 3,
  });

  farm.foo('car', 'plane');

  expect(computeWorkerKey.mock.calls[0]).toEqual(['foo', 'car', 'plane']);
});

it('returns the result if the call worked', async () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  });

  const promise = farm.foo('car', 'plane');

  workerReply(0, null, 34);
  expect(await promise).toEqual(34);
});

it('throws if the call failed', async () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 1,
  });

  const promise = farm.foo('car', 'plane');
  let error = null;

  workerReply(0, new TypeError('Massively broken'));

  try {
    await promise;
  } catch (err) {
    error = err;
  }

  expect(error).not.toBe(null);
  expect(error).toBeInstanceOf(TypeError);
});

it('sends non-sticked tasks to all workers', () => {
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 3,
  });

  farm.foo('car', 'plane');

  expect(mockWorkers[0].send).toHaveBeenCalledTimes(1);
  expect(mockWorkers[1].send).toHaveBeenCalledTimes(1);
  expect(mockWorkers[2].send).toHaveBeenCalledTimes(1);
});

it('sends first-time sticked tasks to all workers', () => {
  const farm = new Farm('/tmp/baz.js', {
    computeWorkerKey: () => '1234567890abcdef',
    exposedMethods: ['foo', 'bar'],
    numWorkers: 3,
  });

  farm.foo('car', 'plane');

  expect(mockWorkers[0].send).toHaveBeenCalledTimes(1);
  expect(mockWorkers[1].send).toHaveBeenCalledTimes(1);
  expect(mockWorkers[2].send).toHaveBeenCalledTimes(1);
});

it('checks that once a sticked task finishes, next time is sent to that worker', async () => {
  const farm = new Farm('/tmp/baz.js', {
    computeWorkerKey: () => '1234567890abcdef',
    exposedMethods: ['foo', 'bar'],
    numWorkers: 3,
  });

  // Worker 1 successfully replies with "17" as a result.
  const promise = farm.foo('car', 'plane');
  workerReply(1, null, 17);
  await promise;

  // Note that the stickiness is not created by the method name or the arguments
  // it is solely controlled by the provided "computeWorkerKey" method, which in the
  // test example always returns the same key, so all calls should be redirected
  // to worker 1 (which is the one that resolved the first call).
  farm.bar();

  // The first time, a call with a "1234567890abcdef" hash had never been done
  // earlier ("foo" call), so it got queued to all workers. Later, since the one
  // that resolved the call was the one in position 1, all subsequent calls are
  // only redirected to that worker.
  expect(mockWorkers[0].send).toHaveBeenCalledTimes(1); // Only "foo".
  expect(mockWorkers[1].send).toHaveBeenCalledTimes(2); // "foo" + "bar".
  expect(mockWorkers[2].send).toHaveBeenCalledTimes(1); // Only "foo".
});

it('checks that once a non-sticked task finishes, next time is sent to all workers', async () => {
  // Note there is no "computeWorkerKey".
  const farm = new Farm('/tmp/baz.js', {
    exposedMethods: ['foo', 'bar'],
    numWorkers: 3,
  });

  // Worker 1 successfully replies with "17" as a result.
  const promise = farm.foo('car', 'plane');
  workerReply(1, null, 17);
  await promise;

  farm.bar();

  // Since "computeWorkerKey" does not return anything, new jobs are sent again to
  // all existing workers.
  expect(mockWorkers[0].send).toHaveBeenCalledTimes(2);
  expect(mockWorkers[1].send).toHaveBeenCalledTimes(2);
  expect(mockWorkers[2].send).toHaveBeenCalledTimes(2);
});
