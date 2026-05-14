/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ChangeQueue} from '../ChangeQueue';
import {createEmptyMap} from '../../lib/util';

jest.useFakeTimers();

const INTERVAL = 30; // matches CHANGE_INTERVAL in ChangeQueue

function makeCallbacks(overrides = {}) {
  return {
    cleanup: jest.fn(),
    emit: jest.fn(),
    ignore: jest.fn().mockReturnValue(false),
    mocksPattern: null,
    onError: jest.fn(),
    platforms: [],
    processFile: jest.fn().mockReturnValue(null),
    recoverDuplicates: jest.fn(),
    rootDir: '/root',
    ...overrides,
  };
}

const STAT = {
  isDirectory: () => false,
  mtime: {getTime: () => 1000},
  size: 42,
} as any;

describe('ChangeQueue', () => {
  afterEach(() => jest.clearAllMocks());

  it('drops a change event when the file mtime is unchanged', async () => {
    const hasteMap = createEmptyMap();
    hasteMap.files.set('src/Banana.js', ['Banana', 1000, 42, 1, '', null]);
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('change', 'src/Banana.js', '/root', STAT);

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

    queue.onChange('add', 'src/Apple.js', '/root', STAT);
    await Promise.resolve();
    queue.onChange('add', 'src/Apple.js', '/root', STAT);
    await Promise.resolve();

    jest.advanceTimersByTime(INTERVAL);

    const [event] = callbacks.emit.mock.calls[0];
    expect(event.eventsQueue).toHaveLength(1);
    queue.stop();
  });

  it('emits a ChangeEvent when the interval fires with queued events', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('add', 'src/Mango.js', '/root', STAT);
    await Promise.resolve();

    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).toHaveBeenCalledTimes(1);
    const [event] = callbacks.emit.mock.calls[0];
    expect(event.eventsQueue).toHaveLength(1);
    expect(event.eventsQueue[0]).toMatchObject({
      filePath: '/root/src/Mango.js',
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
    hasteMap.files.set('src/Banana.js', ['Banana', 999, 42, 1, '', null]);
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.onChange('delete', 'src/Banana.js', '/root', undefined);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.recoverDuplicates).toHaveBeenCalledWith(
      expect.anything(),
      'src/Banana.js',
      'Banana',
    );
    queue.stop();
  });

  it('stop() clears the interval so no further emissions occur', async () => {
    const hasteMap = createEmptyMap();
    const callbacks = makeCallbacks();

    const queue = new ChangeQueue(hasteMap, ['js'], callbacks);
    queue.start();
    queue.stop();

    queue.onChange('add', 'src/Apple.js', '/root', STAT);
    await Promise.resolve();
    jest.advanceTimersByTime(INTERVAL);

    expect(callbacks.emit).not.toHaveBeenCalled();
  });
});
