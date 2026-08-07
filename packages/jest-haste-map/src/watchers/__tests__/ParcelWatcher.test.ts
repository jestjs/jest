/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {EventEmitter} from 'node:events';
import * as path from 'node:path';
import type * as parcelWatcherType from '@parcel/watcher';
import * as gracefulFs from 'graceful-fs';
import type {WatcherOptions} from '../types';
import {ParcelWatcher} from '../ParcelWatcher';

jest.mock('@parcel/watcher');
jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('graceful-fs')>('graceful-fs'),
  lstat: jest.fn(),
}));

const parcelWatcher =
  jest.requireMock<typeof parcelWatcherType>('@parcel/watcher');
type LstatSimple = (
  path: gracefulFs.PathLike,
  cb: (err: NodeJS.ErrnoException | null, stats: gracefulFs.Stats) => void,
) => void;
const mockLstat =
  gracefulFs.lstat as unknown as jest.MockedFunction<LstatSimple>;

// Use path.resolve so paths are correct on all platforms (e.g. 'D:\root' on Windows).
const ROOT = path.resolve('/root');

const mockConsole = {warn: jest.fn()} as unknown as Console;

const defaultOpts: WatcherOptions = {
  console: mockConsole,
  dot: true,
  glob: ['**/*.js'],
  ignored: undefined,
  useWatchman: false,
};

function makeSubscription() {
  return {unsubscribe: jest.fn(async () => {})};
}

function flush(): Promise<void> {
  return new Promise(setImmediate);
}

describe('ParcelWatcher', () => {
  let subscribeCallback: parcelWatcherType.SubscribeCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    (
      parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >
    ).mockImplementation(async (_dir, fn) => {
      subscribeCallback = fn;
      return makeSubscription();
    });
  });

  function makeWatcher(root = ROOT, opts = defaultOpts): ParcelWatcher {
    return new ParcelWatcher(root, opts);
  }

  function waitReady(watcher: EventEmitter): Promise<void> {
    return new Promise((resolve, reject) => {
      watcher.once('ready', resolve);
      watcher.once('error', reject);
    });
  }

  it('emits ready after subscribing', async () => {
    const watcher = makeWatcher();
    await waitReady(watcher);
    expect(parcelWatcher.subscribe).toHaveBeenCalledTimes(1);
  });

  it('maps create → add events', async () => {
    const fakeStat = {isDirectory: () => false, mtime: new Date(), size: 100};
    mockLstat.mockImplementation((_p, cb) =>
      cb(null, fakeStat as gracefulFs.Stats),
    );

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onChange = jest.fn();
    watcher.on('all', onChange);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'create'},
    ]);
    await flush();

    expect(onChange).toHaveBeenCalledWith('add', 'file.js', ROOT, fakeStat);
  });

  it('maps update → change events', async () => {
    const fakeStat = {isDirectory: () => false, mtime: new Date(), size: 100};
    mockLstat.mockImplementation((_p, cb) =>
      cb(null, fakeStat as gracefulFs.Stats),
    );

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onChange = jest.fn();
    watcher.on('all', onChange);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'update'},
    ]);
    await flush();

    expect(onChange).toHaveBeenCalledWith('change', 'file.js', ROOT, fakeStat);
  });

  it('maps delete → delete events without stat', async () => {
    const watcher = makeWatcher();
    await waitReady(watcher);

    const onChange = jest.fn();
    watcher.on('all', onChange);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'delete'},
    ]);
    await flush();

    expect(mockLstat).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('delete', 'file.js', ROOT);
  });

  it('drops add/change when lstat returns ENOENT', async () => {
    mockLstat.mockImplementation((_p, cb) =>
      cb(
        Object.assign(new Error('ENOENT'), {
          code: 'ENOENT',
        }) as NodeJS.ErrnoException,
        null as unknown as gracefulFs.Stats,
      ),
    );

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onChange = jest.fn();
    watcher.on('all', onChange);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'create'},
    ]);
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('emits error when lstat fails with a non-ENOENT error', async () => {
    mockLstat.mockImplementation((_p, cb) =>
      cb(
        Object.assign(new Error('EACCES'), {
          code: 'EACCES',
        }) as NodeJS.ErrnoException,
        null as unknown as gracefulFs.Stats,
      ),
    );

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onError = jest.fn();
    watcher.on('error', onError);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'create'},
    ]);
    await flush();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('re-subscribes when the subscribe callback receives an error', async () => {
    const fakeStat = {isDirectory: () => false, mtime: new Date(), size: 100};
    mockLstat.mockImplementation((_p, cb) =>
      cb(null, fakeStat as gracefulFs.Stats),
    );

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onError = jest.fn();
    const onChange = jest.fn();
    watcher.on('error', onError);
    watcher.on('all', onChange);

    subscribeCallback(new Error('inotify queue overflow'), []);
    await flush();

    expect(parcelWatcher.subscribe).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('inotify queue overflow'),
    );

    // The replacement subscription's events flow through.
    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'create'},
    ]);
    await flush();

    expect(onChange).toHaveBeenCalledWith('add', 'file.js', ROOT, fakeStat);
  });

  it('emits error when every re-subscribe attempt fails', async () => {
    const subscribeMock = parcelWatcher.subscribe as jest.MockedFunction<
      typeof parcelWatcher.subscribe
    >;

    const watcher = makeWatcher();
    await waitReady(watcher);

    const onError = jest.fn();
    watcher.on('error', onError);

    const resubscribeError = new Error('backend gone');
    subscribeMock.mockRejectedValue(resubscribeError);
    jest.useFakeTimers({doNotFake: ['setImmediate']});
    subscribeCallback(new Error('watch error'), []);
    await flush();

    // The two retries each sit behind a delay.
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    await flush();
    jest.useRealTimers();

    // Initial subscribe plus three failed re-subscribe attempts.
    expect(subscribeMock).toHaveBeenCalledTimes(4);
    expect(onError).toHaveBeenCalledWith(resubscribeError);
  });

  it('close() calls unsubscribe', async () => {
    const subscription = makeSubscription();
    (
      parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >
    ).mockImplementation(async (_dir, fn) => {
      subscribeCallback = fn;
      return subscription;
    });

    const watcher = makeWatcher();
    await waitReady(watcher);

    await watcher.close();

    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('close() before _start resolves unsubscribes the late subscription', async () => {
    let resolveSubscribe!: (s: parcelWatcherType.AsyncSubscription) => void;
    const subscription = makeSubscription();
    (
      parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >
    ).mockImplementation(
      () => new Promise(resolve => (resolveSubscribe = resolve)),
    );

    const watcher = makeWatcher();
    // Let _start run up to the point it awaits subscribe
    await flush();
    // close() before subscribe resolves
    await watcher.close();

    // Now let subscribe resolve — _start should unsubscribe immediately
    resolveSubscribe(subscription);
    await flush();

    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not emit error when subscribe rejects after close()', async () => {
    let rejectSubscribe!: (error: Error) => void;
    (
      parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >
    ).mockImplementation(
      () => new Promise((_resolve, reject) => (rejectSubscribe = reject)),
    );

    const watcher = makeWatcher();
    // Let _start run up to the point it awaits subscribe
    await flush();
    await watcher.close();

    // close() removed all listeners — emitting 'error' now would throw
    // ERR_UNHANDLED_ERROR and fail this test.
    rejectSubscribe(new Error('subscribe timed out'));
    await flush();
  });

  it('does not emit error when an in-flight lstat fails after close()', async () => {
    let lstatCallback!: Parameters<LstatSimple>[1];
    mockLstat.mockImplementation((_p, cb) => {
      lstatCallback = cb;
    });

    const watcher = makeWatcher();
    await waitReady(watcher);

    subscribeCallback(null, [
      {path: path.join(ROOT, 'file.js'), type: 'create'},
    ]);
    await watcher.close();

    lstatCallback(
      Object.assign(new Error('EACCES'), {
        code: 'EACCES',
      }) as NodeJS.ErrnoException,
      null as unknown as gracefulFs.Stats,
    );
    await flush();
  });

  it('filters events for paths excluded by ignore pattern', async () => {
    const fakeStat = {isDirectory: () => false, mtime: new Date(), size: 100};
    mockLstat.mockImplementation((_p, cb) =>
      cb(null, fakeStat as gracefulFs.Stats),
    );

    const watcher = makeWatcher(ROOT, {
      ...defaultOpts,
      ignored: /node_modules/,
    });
    await waitReady(watcher);

    const onChange = jest.fn();
    watcher.on('all', onChange);

    subscribeCallback(null, [
      {
        path: path.join(ROOT, 'node_modules', 'pkg', 'index.js'),
        type: 'create',
      },
      {path: path.join(ROOT, 'src', 'index.js'), type: 'create'},
    ]);
    await flush();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      'add',
      path.join('src', 'index.js'),
      ROOT,
      fakeStat,
    );
  });

  describe('backend selection', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', {value: originalPlatform});
    });

    it.each<[string, parcelWatcherType.BackendType]>([
      ['darwin', 'fs-events'],
      ['linux', 'inotify'],
      ['win32', 'windows'],
    ])(
      'selects %s backend on %s when useWatchman=false',
      async (platform, backend) => {
        Object.defineProperty(process, 'platform', {value: platform});
        const watcher = makeWatcher(ROOT, {
          ...defaultOpts,
          useWatchman: false,
        });
        await waitReady(watcher);
        expect(parcelWatcher.subscribe).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Function),
          expect.objectContaining({backend}),
        );
      },
    );

    it('omits the backend on unsupported platforms so parcel picks its default', async () => {
      Object.defineProperty(process, 'platform', {value: 'freebsd'});
      const watcher = makeWatcher(ROOT, {...defaultOpts, useWatchman: false});
      await waitReady(watcher);
      const subscribeOpts = (
        parcelWatcher.subscribe as jest.MockedFunction<
          typeof parcelWatcher.subscribe
        >
      ).mock.calls[0][2];
      expect(subscribeOpts?.backend).toBeUndefined();
    });

    it('selects watchman backend when useWatchman=true', async () => {
      const watcher = makeWatcher(ROOT, {...defaultOpts, useWatchman: true});
      await waitReady(watcher);
      expect(parcelWatcher.subscribe).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({backend: 'watchman'}),
      );
    });
  });

  describe('ignore patterns passed to parcel', () => {
    const VCS = [
      '**/.git',
      '**/.git/**',
      '**/.hg',
      '**/.hg/**',
      '**/.sl',
      '**/.sl/**',
    ];

    async function subscribedIgnore(
      ignored: WatcherOptions['ignored'],
    ): Promise<unknown> {
      const watcher = makeWatcher(ROOT, {...defaultOpts, ignored});
      await waitReady(watcher);
      return (
        parcelWatcher.subscribe as jest.MockedFunction<
          typeof parcelWatcher.subscribe
        >
      ).mock.calls[0][2]?.ignore;
    }

    it('passes an unflagged regex through natively, with VCS globs appended', async () => {
      const ignored = /node_modules/;
      expect(await subscribedIgnore(ignored)).toEqual([ignored, ...VCS]);
    });

    it('falls back to VCS globs for a regex with flags', async () => {
      expect(await subscribedIgnore(/node_modules/i)).toEqual(VCS);
    });

    it('falls back to VCS globs when ignored is undefined', async () => {
      expect(await subscribedIgnore(undefined)).toEqual(VCS);
    });

    it('falls back to VCS globs when ignored is a function', async () => {
      expect(await subscribedIgnore(() => false)).toEqual(VCS);
    });

    it('retries without the regex when the native matcher rejects it, and warns', async () => {
      const subscribeMock = parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >;
      subscribeMock.mockRejectedValueOnce(
        new Error(
          'One of *?+{ was not preceded by a valid regular expression.',
        ),
      );

      const ignored = /(?<=x)dist/;
      const watcher = makeWatcher(ROOT, {...defaultOpts, ignored});
      await waitReady(watcher);

      expect(subscribeMock).toHaveBeenCalledTimes(2);
      expect(subscribeMock.mock.calls[0][2]?.ignore).toEqual([ignored, ...VCS]);
      expect(subscribeMock.mock.calls[1][2]?.ignore).toEqual(VCS);
      const [warning] = jest.mocked(mockConsole.warn).mock.calls[0];
      expect(warning).toContain(String(ignored));
      expect(warning).toContain('was not preceded by a valid');
    });

    it('does not retry when the ignore list has no regex', async () => {
      const subscribeMock = parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >;
      subscribeMock.mockRejectedValueOnce(new Error('backend failure'));

      const watcher = makeWatcher(ROOT, defaultOpts);
      const onError = jest.fn();
      watcher.on('error', onError);
      await flush();

      expect(subscribeMock).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
