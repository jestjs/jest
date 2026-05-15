/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'node:events';
import {FSEventsWatcher} from '../FSEventsWatcher';
import {WatcherDriver} from '../index';

jest.mock('../../lib/isWatchmanInstalled');
jest.mock('../FSEventsWatcher');
jest.mock('../NodeWatcher');
jest.mock('../WatchmanWatcher');

const MockFSEventsWatcher = FSEventsWatcher as jest.MockedClass<
  typeof FSEventsWatcher
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
  backend: 'fsevents' as const,
  extensions: ['js'],
  ignorePattern: undefined,
  roots: ['/root/a'],
};

describe('resolveWatcherBackend', () => {
  let resolveWatcherBackend: typeof import('../index').resolveWatcherBackend;
  let mockIsWatchmanInstalled: jest.MockedFunction<
    typeof import('../../lib/isWatchmanInstalled').default
  >;
  let MockFSEventsWatcherLocal: jest.MockedClass<typeof FSEventsWatcher>;

  beforeEach(() => {
    jest.resetModules();
    // Re-require after reset so each test gets a fresh module-level promise cache.
    jest.mock('../../lib/isWatchmanInstalled');
    jest.mock('../FSEventsWatcher');
    jest.mock('../NodeWatcher');
    jest.mock('../WatchmanWatcher');
    ({resolveWatcherBackend} = require('../index'));
    mockIsWatchmanInstalled = require('../../lib/isWatchmanInstalled').default;
    MockFSEventsWatcherLocal = require('../FSEventsWatcher').FSEventsWatcher;
  });

  it('returns watchman when backend is default and watchman is installed', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(true);
    expect(
      await resolveWatcherBackend({backend: 'default', useWatchman: true}),
    ).toBe('watchman');
  });

  it('returns fsevents when backend is default, watchman unavailable, and FSEvents supported', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(false);
    jest.spyOn(MockFSEventsWatcherLocal, 'isSupported').mockReturnValue(true);
    expect(
      await resolveWatcherBackend({backend: 'default', useWatchman: true}),
    ).toBe('fsevents');
  });

  it('returns node when backend is default, watchman unavailable, and FSEvents unsupported', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(false);
    jest.spyOn(MockFSEventsWatcherLocal, 'isSupported').mockReturnValue(false);
    expect(
      await resolveWatcherBackend({backend: 'default', useWatchman: true}),
    ).toBe('node');
  });

  it('skips watchman when useWatchman is false', async () => {
    jest.spyOn(MockFSEventsWatcherLocal, 'isSupported').mockReturnValue(true);
    expect(
      await resolveWatcherBackend({backend: 'default', useWatchman: false}),
    ).toBe('fsevents');
    expect(mockIsWatchmanInstalled).not.toHaveBeenCalled();
  });

  it('probes watchman when useWatchman is true', async () => {
    mockIsWatchmanInstalled.mockResolvedValue(true);
    expect(
      await resolveWatcherBackend({backend: 'default', useWatchman: true}),
    ).toBe('watchman');
  });

  it('throws for backend: parcel', async () => {
    await expect(
      resolveWatcherBackend({backend: 'parcel', useWatchman: true}),
    ).rejects.toThrow('@parcel/watcher backend is not yet supported');
  });

  it('throws for unknown haste backend', async () => {
    await expect(
      resolveWatcherBackend({
        backend: 'bogus' as 'default',
        useWatchman: true,
      }),
    ).rejects.toThrow('Unknown haste backend: bogus');
  });
});

describe('WatcherDriver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses FSEventsWatcher when backend is fsevents', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    MockFSEventsWatcher.mockImplementation(
      () => makeReadyWatcher() as unknown as jest.MockedObject<FSEventsWatcher>,
    );

    const driver = new WatcherDriver(driverOpts);
    await driver.start(jest.fn());

    expect(MockFSEventsWatcher).toHaveBeenCalledTimes(1);
  });

  it('emits change events to the onChange callback', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const watcher = makeReadyWatcher();
    MockFSEventsWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<FSEventsWatcher>,
    );

    const driver = new WatcherDriver(driverOpts);
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

  it('throws when backend is parcel', async () => {
    const driver = new WatcherDriver({...driverOpts, backend: 'parcel'});
    await expect(driver.start(jest.fn())).rejects.toThrow(
      '@parcel/watcher backend is not yet supported',
    );
  });

  it('close() awaits every watcher', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const closeA = jest.fn(async () => {});
    const closeB = jest.fn(async () => {});
    let call = 0;
    MockFSEventsWatcher.mockImplementation(() => {
      const w =
        makeReadyWatcher() as unknown as jest.MockedObject<FSEventsWatcher>;
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
    const watcher = Object.assign(new EventEmitter(), {
      close: jest.fn(async () => {}),
    });
    MockFSEventsWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<FSEventsWatcher>,
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
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const close = jest.fn(async () => {});
    const watcher = Object.assign(new EventEmitter(), {close});
    MockFSEventsWatcher.mockImplementation(
      () => watcher as unknown as jest.MockedObject<FSEventsWatcher>,
    );

    const startPromise = new WatcherDriver({...driverOpts}).start(jest.fn());
    jest.advanceTimersByTime(250_000);
    await expect(startPromise).rejects.toThrow('Failed to start watch mode.');

    expect(close).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('closes already-started watchers when one root fails to start', async () => {
    jest.spyOn(FSEventsWatcher, 'isSupported').mockReturnValue(true);
    const closeA = jest.fn(async () => {});
    let call = 0;
    MockFSEventsWatcher.mockImplementation(() => {
      if (call++ === 0) {
        // First root: ready immediately
        const w =
          makeReadyWatcher() as unknown as jest.MockedObject<FSEventsWatcher>;
        w.close = closeA;
        return w;
      }
      // Second root: never emits ready — will hit the timeout
      const emitter = new EventEmitter();
      return Object.assign(emitter, {
        close: jest.fn(async () => {}),
      }) as unknown as jest.MockedObject<FSEventsWatcher>;
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
