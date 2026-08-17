/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Stats} from 'graceful-fs';
import {createEmptyMap} from '../../lib/util';
import type {ChangeEvent, InternalHasteMap} from '../../types';
import {type Callbacks, ChangeQueue} from '../ChangeQueue';

jest.useFakeTimers();

const INTERVAL = 30; // matches CHANGE_INTERVAL in ChangeQueue

const ROOT = path.join('/', 'root');

function makeCallbacks(overrides: Partial<Callbacks> = {}): Callbacks {
  return {
    cleanup: jest.fn(),
    emit: jest.fn<(event: ChangeEvent) => void>(),
    ignore: jest.fn((_filePath: string) => false),
    mocksPattern: null,
    onError: jest.fn(),
    platforms: [],
    processFile: jest.fn(
      (_hasteMap: InternalHasteMap, _filePath: string) => null,
    ),
    recoverDuplicates: jest.fn(),
    rootDir: ROOT,
    ...overrides,
  };
}

const STAT = {
  isDirectory: () => false,
  mtime: {getTime: () => 1000} as Date,
  size: 42,
} as unknown as Stats;

describe('ChangeQueue', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('drops a change event when the file mtime is unchanged', async () => {
    const hasteMap = createEmptyMap();
    hasteMap.files.set(path.join('src', 'Banana.js'), [
      'Banana',
      1000,
      42,
      1,
      '',
      null,
    ]);
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('change', path.join('src', 'Banana.js'), ROOT, STAT);

    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).not.toHaveBeenCalled();
    queue.stop();
  });

  it('deduplicates events with the same type/path/mtime key', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();

    queue.onChange('add', path.join('src', 'Apple.js'), ROOT, STAT);
    await Promise.resolve();
    queue.onChange('add', path.join('src', 'Apple.js'), ROOT, STAT);
    await Promise.resolve();

    jest.advanceTimersByTime(INTERVAL);

    const [event] = jest.mocked(callbacks.emit).mock.calls[0];
    expect(event.eventsQueue).toHaveLength(1);
    queue.stop();
  });

  it('emits a ChangeEvent when the interval fires with queued events', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('add', path.join('src', 'Mango.js'), ROOT, STAT);
    await Promise.resolve();

    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).toHaveBeenCalledTimes(1);
    const [event] = jest.mocked(callbacks.emit).mock.calls[0];
    expect(event.eventsQueue).toHaveLength(1);
    expect(event.eventsQueue[0]).toMatchObject({
      filePath: path.join(ROOT, 'src', 'Mango.js'),
      type: 'add',
    });
    queue.stop();
  });

  it('does not emit when there are no queued events', () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).not.toHaveBeenCalled();
    queue.stop();
  });

  it('calls recoverDuplicates when a known file is deleted', async () => {
    const hasteMap = createEmptyMap();
    hasteMap.files.set(path.join('src', 'Banana.js'), [
      'Banana',
      999,
      42,
      1,
      '',
      null,
    ]);
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('delete', path.join('src', 'Banana.js'), ROOT, undefined);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.recoverDuplicates).toHaveBeenCalledWith(
      expect.anything(),
      path.join('src', 'Banana.js'),
      'Banana',
    );
    queue.stop();
  });

  // Deletes emit even for paths the haste map never tracked (e.g.
  // node_modules files from before _watch() enables retainAllFiles) —
  // matching the emit-regardless behavior changes to such files get.
  it('emits a delete event for an untracked path', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('delete', path.join('src', 'Ghost.js'), ROOT, undefined);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).toHaveBeenCalledTimes(1);
    queue.stop();
  });

  it('emits a delete event for a tracked path', async () => {
    const hasteMap = createEmptyMap();
    hasteMap.files.set(path.join('src', 'Banana.js'), [
      'Banana',
      999,
      42,
      1,
      '',
      null,
    ]);
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('delete', path.join('src', 'Banana.js'), ROOT, undefined);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).toHaveBeenCalledTimes(1);
    const [event] = jest.mocked(callbacks.emit).mock.calls[0];
    expect(event.eventsQueue[0]).toMatchObject({
      filePath: path.join(ROOT, 'src', 'Banana.js'),
      type: 'delete',
    });
    queue.stop();
  });

  describe('extension filtering', () => {
    async function emitAdd(extensions: Array<string>, fileName: string) {
      const hasteMap = createEmptyMap();
      const callbacks = makeCallbacks();

      const queue = new ChangeQueue(hasteMap, extensions, callbacks);
      queue.start();
      queue.onChange('add', path.join('src', fileName), ROOT, STAT);
      await Promise.resolve();
      jest.advanceTimersByTime(INTERVAL);
      queue.stop();

      return callbacks.emit;
    }

    it.each(['Apple.js', 'Apple.test.js'])(
      'accepts %s when `js` is configured',
      fileName =>
        expect(emitAdd(['js'], fileName)).resolves.toHaveBeenCalledTimes(1),
    );

    // `endsWith(ext)` matched any path whose final characters happened to
    // spell the extension, so a longer extension or a bare name ending in
    // those letters slipped through.
    it.each(['Apple.mjs', 'Apple.cjs', 'myjs', 'Apple.jsx'])(
      'rejects %s when only `js` is configured',
      fileName =>
        expect(emitAdd(['js'], fileName)).resolves.not.toHaveBeenCalled(),
    );

    it('accepts a file whose extension is one of several configured', () =>
      expect(
        emitAdd(['js', 'mjs'], 'Apple.mjs'),
      ).resolves.toHaveBeenCalledTimes(1));

    it('rejects a file with no extension', () =>
      expect(emitAdd(['js'], 'Makefile')).resolves.not.toHaveBeenCalled());
  });

  describe('duplicate manual mocks', () => {
    const MOCK_A = path.join('a', '__mocks__', 'foo.js');
    const MOCK_B = path.join('b', '__mocks__', 'foo.js');

    function hasteMapWithBothMocks(owner: string) {
      const hasteMap = createEmptyMap();
      for (const mockPath of [MOCK_A, MOCK_B]) {
        hasteMap.files.set(mockPath, ['', 1000, 42, 1, '', null]);
      }
      hasteMap.mocks.set('foo', owner);
      hasteMap.mockDuplicates.set('foo', new Set([MOCK_A, MOCK_B]));
      return hasteMap;
    }

    async function deleteAndEmit(hasteMap: InternalHasteMap, target: string) {
      const callbacks = makeCallbacks({mocksPattern: /__mocks__/});
      const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
      queue.start();
      queue.onChange('delete', target, ROOT, undefined);
      await Promise.resolve();
      jest.advanceTimersByTime(INTERVAL);
      queue.stop();

      const [event] = jest.mocked(callbacks.emit).mock.calls[0];
      return event.moduleMap;
    }

    it('falls back to the surviving file when the resolved mock is deleted', async () => {
      const moduleMap = await deleteAndEmit(
        hasteMapWithBothMocks(MOCK_A),
        MOCK_A,
      );

      expect(moduleMap.getMockModule('foo')).toBe(path.join(ROOT, MOCK_B));
    });

    it('leaves the resolved mock alone when a different claimant is deleted', async () => {
      const moduleMap = await deleteAndEmit(
        hasteMapWithBothMocks(MOCK_A),
        MOCK_B,
      );

      expect(moduleMap.getMockModule('foo')).toBe(path.join(ROOT, MOCK_A));
    });

    it('drops the mock when the deleted file was the only claimant', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(MOCK_A, ['', 1000, 42, 1, '', null]);
      hasteMap.mocks.set('foo', MOCK_A);

      const moduleMap = await deleteAndEmit(hasteMap, MOCK_A);

      expect(moduleMap.getMockModule('foo')).toBeUndefined();
    });
  });

  it('stop() clears the interval so no further emissions occur', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.stop();

    queue.onChange('add', path.join('src', 'Apple.js'), ROOT, STAT);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).not.toHaveBeenCalled();
  });
});
