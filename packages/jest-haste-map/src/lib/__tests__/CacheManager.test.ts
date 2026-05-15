/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {deserialize, serialize} from 'node:v8';
import {readFileSync, writeFileSync} from 'graceful-fs';
import {CacheManager} from '../CacheManager';
import {createEmptyMap} from '../util';

jest.mock('graceful-fs');

const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<
  typeof writeFileSync
>;

describe('CacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('path getter returns the constructor argument', () => {
    const cm = new CacheManager('/tmp/cache-path');
    expect(cm.path).toBe('/tmp/cache-path');
  });

  describe('read', () => {
    it('deserializes and returns the cached haste map', () => {
      const map = createEmptyMap();
      map.mocks.set('Banana', 'fruits/Banana.js');
      mockReadFileSync.mockReturnValue(serialize(map) as any);

      const result = new CacheManager('/cache').read();
      expect(result.mocks.get('Banana')).toBe('fruits/Banana.js');
    });

    it('returns an empty map when the cache file does not exist', () => {
      mockReadFileSync.mockImplementation(() => {
        throw Object.assign(new Error('ENOENT'), {code: 'ENOENT'});
      });

      const result = new CacheManager('/cache').read();
      expect(result).toEqual(createEmptyMap());
    });
  });

  describe('persist', () => {
    it('writes the serialized haste map to the cache path', () => {
      const map = createEmptyMap();
      map.files.set('fruits/Banana.js', ['Banana', 0, 0, 0, '', null]);

      new CacheManager('/cache').persist(map);

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const [calledPath, calledData] = mockWriteFileSync.mock.calls[0];
      expect(calledPath).toBe('/cache');
      const deserialized = deserialize(calledData as Buffer);
      expect(deserialized.files.get('fruits/Banana.js')).toEqual([
        'Banana',
        0,
        0,
        0,
        '',
        null,
      ]);
    });
  });
});
