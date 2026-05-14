/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'node:events';
import isWatchmanInstalled from '../../lib/isWatchmanInstalled';
import {FSEventsWatcher} from '../FSEventsWatcher';
import {WatcherDriver, shouldUseWatchman} from '../index';

jest.mock('../../lib/isWatchmanInstalled');
jest.mock('../FSEventsWatcher');
jest.mock('../NodeWatcher');
jest.mock('../WatchmanWatcher');

const mockIsWatchmanInstalled = isWatchmanInstalled as jest.MockedFunction<
  typeof isWatchmanInstalled
>;
const MockFSEventsWatcher = FSEventsWatcher as jest.MockedClass<
  typeof FSEventsWatcher
>;

function makeReadyWatcher() {
  const emitter = new EventEmitter();
  const watcher = Object.assign(emitter, {
    close: jest.fn().mockResolvedValue(undefined),
  });
  setTimeout(() => emitter.emit('ready'), 0);
  return watcher;
}

const driverOpts = {
  extensions: ['js'],
  ignorePattern: undefined,
  roots: ['/root/a'],
  useWatchman: false,
};

describe('shouldUseWatchman', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset module-scope promise cache between tests
    jest.resetModules();
  });

  it('returns false when useWatchmanOption is false', async () => {
    expect(await shouldUseWatchman(false)).toBe(false);
    expect(mockIsWatchmanInstalled).not.toHaveBeenCalled();
  });

  it('returns isWatchmanInstalled() result when useWatchmanOption is true', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(true);
    expect(await shouldUseWatchman(true)).toBe(true);
  });
});

describe('WatcherDriver', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses FSEventsWatcher when useWatchman=false and FSEventsWatcher is supported', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    MockFSEventsWatcher.mockImplementation(() => makeReadyWatcher() as any);

    const driver = new WatcherDriver({...driverOpts, useWatchman: false});
    await driver.start(jest.fn());

    expect(MockFSEventsWatcher).toHaveBeenCalledTimes(1);
  });

  it('emits change events to the onChange callback', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const watcher = makeReadyWatcher();
    MockFSEventsWatcher.mockImplementation(() => watcher as any);

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
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const closeA = jest.fn().mockResolvedValue(undefined);
    const closeB = jest.fn().mockResolvedValue(undefined);
    let call = 0;
    MockFSEventsWatcher.mockImplementation(() => {
      const w = makeReadyWatcher() as any;
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
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const watcher = new EventEmitter();
    MockFSEventsWatcher.mockImplementation(() => watcher as any);

    const startPromise = new WatcherDriver({
      ...driverOpts,
    }).start(jest.fn());

    jest.advanceTimersByTime(250_000);
    await expect(startPromise).rejects.toThrow('Failed to start watch mode.');
    jest.useRealTimers();
  });
});
