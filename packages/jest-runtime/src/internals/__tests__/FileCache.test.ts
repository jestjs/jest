/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as fs from 'graceful-fs';
import {FileCache} from '../FileCache';

jest.mock('graceful-fs', () => ({
  readFileSync: jest.fn(),
}));

const readFileSync = fs.readFileSync as jest.MockedFunction<
  typeof fs.readFileSync
>;

describe('FileCache', () => {
  beforeEach(() => {
    readFileSync.mockReset();
  });

  test('readFileBuffer reads once and caches by filename', () => {
    const buffer = Buffer.from('hello');
    readFileSync.mockReturnValue(buffer);
    const cache = new FileCache(new Map());

    expect(cache.readFileBuffer('/a.js')).toBe(buffer);
    expect(cache.readFileBuffer('/a.js')).toBe(buffer);
    expect(readFileSync).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledWith('/a.js');
  });

  test('readFile decodes the buffer and caches the string', () => {
    readFileSync.mockReturnValue(Buffer.from('hello'));
    const cache = new FileCache(new Map());

    expect(cache.readFile('/a.js')).toBe('hello');
    expect(cache.readFile('/a.js')).toBe('hello');
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  test('readFile prefers a pre-populated entry in the shared string cache', () => {
    const shared = new Map<string, string>([['/a.js', 'pre-populated']]);
    const cache = new FileCache(shared);

    expect(cache.readFile('/a.js')).toBe('pre-populated');
    expect(readFileSync).not.toHaveBeenCalled();
  });

  test('the constructor-provided string Map is shared (writes are visible to the caller)', () => {
    const shared = new Map<string, string>();
    readFileSync.mockReturnValue(Buffer.from('hello'));
    const cache = new FileCache(shared);

    cache.readFile('/a.js');
    expect(shared.get('/a.js')).toBe('hello');
  });

  test('clear() drops both string and buffer caches and clears the shared map', () => {
    const shared = new Map<string, string>();
    readFileSync.mockReturnValue(Buffer.from('hello'));
    const cache = new FileCache(shared);

    cache.readFile('/a.js');
    cache.readFileBuffer('/b.js');
    expect(shared.size).toBe(1);
    expect(readFileSync).toHaveBeenCalledTimes(2);

    cache.clear();
    expect(shared.size).toBe(0);

    cache.readFile('/a.js');
    cache.readFileBuffer('/b.js');
    expect(readFileSync).toHaveBeenCalledTimes(4);
  });
});
