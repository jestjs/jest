/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createWorkerFarm} from '../';
import WorkerFarm from '../WorkerFarm';

jest.mock('../WorkerFarm');

beforeEach(() => {
  jest.mock(
    '/fake-worker.js',
    () => ({
      _shouldNotExist() {},
      methodA() {},
      methodB() {},
      property: true,
      setup() {},
      teardown() {},
    }),
    {virtual: true},
  );

  jest.mock('/fake-worker-with-default-method.js', () => () => {}, {
    virtual: true,
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createWorkerFarm', () => {
  test('exposes named methods correctly', async () => {
    await createWorkerFarm('/fake-worker.js');

    expect(WorkerFarm).toHaveBeenCalledWith('/fake-worker.js', {
      exposedMethods: ['methodA', 'methodB'],
    });
  });

  test('exposes default method correctly', async () => {
    await createWorkerFarm('/fake-worker-with-default-method.js');

    expect(WorkerFarm).toHaveBeenCalledWith(
      '/fake-worker-with-default-method.js',
      {
        exposedMethods: ['default'],
      },
    );
  });

  test('allows exposing methods explicitly', async () => {
    await createWorkerFarm('/fake-worker.js', {exposedMethods: ['methodA']});

    expect(WorkerFarm).toHaveBeenCalledWith('/fake-worker.js', {
      exposedMethods: ['methodA'],
    });
  });

  test('throws if a reserved method name is tried to be exposed', async () => {
    await expect(
      createWorkerFarm('/fake-worker.js', {exposedMethods: ['end']}),
    ).rejects.toThrow("Cannot expose 'end()', the method name is reserved");

    await expect(
      createWorkerFarm('/fake-worker.js', {exposedMethods: ['getStdout']}),
    ).rejects.toThrow(
      "Cannot expose 'getStdout()', the method name is reserved",
    );

    await expect(
      createWorkerFarm('/fake-worker.js', {exposedMethods: ['getStderr']}),
    ).rejects.toThrow(
      "Cannot expose 'getStderr()', the method name is reserved",
    );

    await expect(
      createWorkerFarm('/fake-worker.js', {exposedMethods: ['setup']}),
    ).rejects.toThrow("Cannot expose 'setup()', the method name is reserved");

    await expect(
      createWorkerFarm('/fake-worker.js', {exposedMethods: ['teardown']}),
    ).rejects.toThrow(
      "Cannot expose 'teardown()', the method name is reserved",
    );
  });

  test('throws if worker module path is relative', async () => {
    await expect(createWorkerFarm('./relative/worker.js')).rejects.toThrow(
      "Worker module path must be absolute, got './relative/worker.js'",
    );
  });
});
