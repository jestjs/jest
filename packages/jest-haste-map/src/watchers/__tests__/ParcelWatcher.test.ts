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
import {ParcelWatcher, ignoredToGlobs} from '../ParcelWatcher';

jest.mock('@parcel/watcher');
jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('graceful-fs')>('graceful-fs'),
  existsSync: jest.fn(() => false),
  lstat: jest.fn(),
}));

const parcelWatcher =
  jest.requireMock<typeof parcelWatcherType>('@parcel/watcher');
const mockExistsSync = gracefulFs.existsSync as jest.MockedFunction<
  typeof gracefulFs.existsSync
>;
type LstatSimple = (
  path: gracefulFs.PathLike,
  cb: (err: NodeJS.ErrnoException | null, stats: gracefulFs.Stats) => void,
) => void;
const mockLstat =
  gracefulFs.lstat as unknown as jest.MockedFunction<LstatSimple>;

// Use path.resolve so paths are correct on all platforms (e.g. 'D:\root' on Windows).
const ROOT = path.resolve('/root');

const defaultOpts: WatcherOptions = {
  dot: true,
  glob: ['**/*.js'],
  ignored: undefined,
  snapshotPath: '/tmp/snapshot',
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
    mockExistsSync.mockReturnValue(false);
    (
      parcelWatcher.subscribe as jest.MockedFunction<
        typeof parcelWatcher.subscribe
      >
    ).mockImplementation(async (_dir, fn) => {
      subscribeCallback = fn;
      return makeSubscription();
    });
    (
      parcelWatcher.writeSnapshot as jest.MockedFunction<
        typeof parcelWatcher.writeSnapshot
      >
    ).mockResolvedValue('/tmp/snapshot');
    (
      parcelWatcher.getEventsSince as jest.MockedFunction<
        typeof parcelWatcher.getEventsSince
      >
    ).mockResolvedValue([]);
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

  it('emits error when the subscribe callback receives an error', async () => {
    const watcher = makeWatcher();
    await waitReady(watcher);

    const onError = jest.fn();
    watcher.on('error', onError);

    subscribeCallback(new Error('watch error'), []);
    await flush();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('falls back to a fresh subscribe when getEventsSince rejects', async () => {
    mockExistsSync.mockReturnValue(true);
    (
      parcelWatcher.getEventsSince as jest.MockedFunction<
        typeof parcelWatcher.getEventsSince
      >
    ).mockRejectedValue(new Error('corrupt snapshot'));

    const watcher = makeWatcher();
    await waitReady(watcher);

    expect(parcelWatcher.subscribe).toHaveBeenCalledTimes(1);
  });

  it('replays events from snapshot when snapshotPath exists', async () => {
    mockExistsSync.mockReturnValue(true);
    const fakeStat = {isDirectory: () => false, mtime: new Date(), size: 100};
    mockLstat.mockImplementation((_p, cb) =>
      cb(null, fakeStat as gracefulFs.Stats),
    );

    (
      parcelWatcher.getEventsSince as jest.MockedFunction<
        typeof parcelWatcher.getEventsSince
      >
    ).mockResolvedValue([{path: path.join(ROOT, 'old.js'), type: 'create'}]);

    const watcher = makeWatcher();
    const onChange = jest.fn();
    // Attach listener inside 'ready' handler — mirrors WatcherDriver behaviour
    // and verifies replay fires after 'ready' (not before).
    watcher.once('ready', () => watcher.on('all', onChange));
    await waitReady(watcher);
    await flush();

    expect(parcelWatcher.getEventsSince).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('add', 'old.js', ROOT, fakeStat);
  });

  it('writes snapshot after subscribing', async () => {
    const watcher = makeWatcher();
    await waitReady(watcher);

    expect(parcelWatcher.writeSnapshot).toHaveBeenCalledWith(
      expect.any(String),
      '/tmp/snapshot',
      expect.objectContaining({backend: expect.any(String)}),
    );
  });

  it('close() calls unsubscribe and writes snapshot', async () => {
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

    jest.clearAllMocks();
    await watcher.close();

    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(parcelWatcher.writeSnapshot).toHaveBeenCalledTimes(1);
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
      ['freebsd', 'brute-force'],
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
});

describe('ignoredToGlobs', () => {
  const VCS = ['**/.git', '**/.hg', '**/.sl'];

  it('returns only VCS globs when ignored is undefined', () => {
    expect(ignoredToGlobs(undefined)).toEqual(VCS);
  });

  it('returns only VCS globs when ignored is a function', () => {
    expect(ignoredToGlobs(() => false)).toEqual(VCS);
  });

  it('extracts simple directory names from a regex', () => {
    expect(ignoredToGlobs(/node_modules/)).toEqual([...VCS, '**/node_modules']);
  });

  it('extracts multiple alternation segments', () => {
    const result = ignoredToGlobs(/node_modules|\.cache/);
    expect(result).toEqual([...VCS, '**/node_modules', '**/.cache']);
  });

  it('deduplicates VCS dirs already present in the regex', () => {
    const result = ignoredToGlobs(/node_modules|\.git/);
    expect(result).toEqual([...VCS, '**/node_modules']);
  });

  it('skips segments containing regex special characters', () => {
    const result = ignoredToGlobs(/node_modules|foo[0-9]+/);
    expect(result).toEqual([...VCS, '**/node_modules']);
  });

  it('extracts names from non-capturing group syntax', () => {
    const result = ignoredToGlobs(/(?:node_modules|\.cache)/);
    expect(result).toEqual([...VCS, '**/node_modules', '**/.cache']);
  });
});
