/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'node:events';
import isWatchmanInstalled from '../../lib/isWatchmanInstalled';
import {ParcelWatcher} from '../ParcelWatcher';
import {WatcherDriver, shouldUseWatchman} from '../index';

jest.mock('../../lib/isWatchmanInstalled');
jest.mock('../ParcelWatcher');
jest.mock('../WatchmanWatcher');

const mockIsWatchmanInstalled = isWatchmanInstalled as jest.MockedFunction<
  typeof isWatchmanInstalled
>;
const MockParcelWatcher = ParcelWatcher as jest.MockedClass<
  typeof ParcelWatcher
>;

type WatcherInstance = {close(): Promise<void>};

function makeReadyWatcher(): EventEmitter & WatcherInstance {
  const emitter = new EventEmitter();
  const watcher = Object.assign(emitter, {
    close: jest.fn(async () => {}),
  });
  setTimeout(() => emitter.emit('ready'), 0);
  return watcher;
}

const driverOpts = {
  cacheFilePath: '/tmp/haste-map-cache',
  extensions: ['js'],
  ignorePattern: undefined,
  roots: ['/root/a'],
  useWatchman: false,
};

describe('shouldUseWatchman', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when useWatchmanOption is false', async () => {
    expect(await shouldUseWatchman(false)).toBe(false);
    expect(mockIsWatchmanInstalled).not.toHaveBeenCalled();
  });

  it('returns true when useWatchmanOption is true and watchman is installed', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(true);
    expect(await shouldUseWatchman(true)).toBe(true);
  });

  it('returns false when useWatchmanOption is true but watchman is not installed', async () => {
    // Isolate so the module-level isWatchmanInstalledPromise cache is fresh.
    let fn!: typeof shouldUseWatchman;
    jest.isolateModules(() => {
      mockIsWatchmanInstalled.mockResolvedValue(false);
      fn = require('../index').shouldUseWatchman as typeof shouldUseWatchman;
    });
    expect(await fn(true)).toBe(false);
  });
});

describe('WatcherDriver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses ParcelWatcher when useWatchman=false', async () => {
    MockParcelWatcher.mockImplementation(
      () => makeReadyWatcher() as unknown as jest.MockedObject<ParcelWatcher>,
    );

    const driver = new WatcherDriver({...driverOpts, useWatchman: false});
    await driver.start(jest.fn());

    expect(MockParcelWatcher).toHaveBeenCalledTimes(1);
  });

  it('emits change events to the onChange callback', async () => {
    const watcher = makeReadyWatcher();
    MockParcelWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<ParcelWatcher>,
    );

    const driver = new WatcherDriver({...driverOpts, useWatchman: false});
    const onChange = jest.fn();
    await driver.start(onChange);

    watcher.emit('all', 'change', 'file.js', '/root/a', undefined);
    expect(onChange).toHaveBeenCalledWith(
      'change',
      'file.js',
      '/root/a',
      undefined,
    );
  });

  it('close() awaits every watcher', async () => {
    const closeA = jest.fn(async () => {});
    const closeB = jest.fn(async () => {});
    let call = 0;
    MockParcelWatcher.mockImplementation(() => {
      const w =
        makeReadyWatcher() as unknown as jest.MockedObject<ParcelWatcher>;
      w.close = call++ === 0 ? closeA : closeB;
      return w;
    });

    const driver = new WatcherDriver({
      ...driverOpts,
      roots: ['/root/a', '/root/b'],
    });
    await driver.start(jest.fn());
    await driver.close();

    expect(closeA).toHaveBeenCalledTimes(1);
    expect(closeB).toHaveBeenCalledTimes(1);
  });

  it('rejects when the watcher does not emit ready within the timeout', async () => {
    jest.useFakeTimers();
    const watcher = Object.assign(new EventEmitter(), {
      close: jest.fn(async () => {}),
    });
    MockParcelWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<ParcelWatcher>,
    );

    const startPromise = new WatcherDriver({
      ...driverOpts,
    }).start(jest.fn());

    jest.advanceTimersByTime(250_000);
    await expect(startPromise).rejects.toThrow('Failed to start watch mode.');
    jest.useRealTimers();
  });

  it('closes the watcher when the ready timeout fires', async () => {
    jest.useFakeTimers();
    const close = jest.fn(async () => {});
    const watcher = Object.assign(new EventEmitter(), {close});
    MockParcelWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<ParcelWatcher>,
    );

    const startPromise = new WatcherDriver({...driverOpts}).start(jest.fn());
    jest.advanceTimersByTime(250_000);
    await expect(startPromise).rejects.toThrow('Failed to start watch mode.');

    expect(close).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('closes already-started watchers when one root fails to start', async () => {
    const closeA = jest.fn(async () => {});
    let call = 0;
    MockParcelWatcher.mockImplementation(() => {
      if (call++ === 0) {
        // First root: ready immediately
        const w =
          makeReadyWatcher() as unknown as jest.MockedObject<ParcelWatcher>;
        w.close = closeA;
        return w;
      }
      // Second root: never emits ready — the ready-timeout below triggers
      // the rejection.
      const emitter = new EventEmitter();
      return Object.assign(emitter, {
        close: jest.fn(async () => {}),
      }) as unknown as jest.MockedObject<ParcelWatcher>;
    });

    const driver = new WatcherDriver({
      ...driverOpts,
      roots: ['/root/a', '/root/b'],
    });

    jest.useFakeTimers();
    const startPromise = driver.start(jest.fn());
    jest.advanceTimersByTime(250_000);
    await expect(startPromise).rejects.toThrow('Failed to start watch mode.');

    expect(closeA).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
