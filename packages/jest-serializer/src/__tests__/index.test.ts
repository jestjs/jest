/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import prettyFormat from 'pretty-format';

import fs from 'fs';
import v8 from 'v8';

import serializer from '..';

const v8s = [
  {
    deserialize: v8['deserialize'],
    serialize: v8['serialize'],
  },
  {
    deserialize: undefined,
    serialize: undefined,
  },
];

const objs = [
  3,
  null,
  [0, true, '2', [3.14, {}, null]],
  {key1: 'foo', key2: 'bar', key3: {array: [null, {}]}},
  {minusInf: -Infinity, nan: NaN, plusInf: +Infinity},
  {date: new Date(1234567890), re: /foo/gi},
  // @ts-ignore - testing NaN
  {map: new Map([[NaN, 4], [undefined, 'm']]), set: new Set([undefined, NaN])},
  {buf: Buffer.from([0, 255, 127])},
];

let mockFs: {[key: string]: unknown};
const mockFile = './__jest-serialize-file__';
const mockFailureFile = './__jest-serialize-failure-file__';
jest.mock('fs', () => ({
  readFile: jest.fn((path, callback) => {
    if (mockFs[path] && path !== mockFailureFile) {
      callback(undefined, mockFs[path]);
      return;
    }

    callback(new Error(`Cannot read path '${path}'.`));
  }),
  writeFile: jest.fn((path, data, callback) => {
    if (path === mockFailureFile) {
      callback(new Error(`Cannot write path '${path}'.`));
      return;
    }

    mockFs[path] = data;
    callback();
  }),
}));

beforeEach(() => {
  mockFs = {};
});

// We execute the same suite of tests over multiple objects ("objs") and over
// multiple mocks of the V8 object ("v8s") so that we verify that all possible
// encodings and cases work.
v8s.forEach((mockV8, i) => {
  describe('Using V8 implementation ' + i, () => {
    beforeEach(() => {
      v8['serialize'] = mockV8.serialize;
      v8['deserialize'] = mockV8.deserialize;
    });

    it('reject promise when invalid serialization', async () => {
      // No chance this is a valid serialization, neither in JSON nor V8.
      const invalidBuffer = Buffer.from([0, 85, 170, 255]);

      await new Promise(resolve =>
        fs.writeFile(mockFile, invalidBuffer, resolve),
      );

      expect(() => serializer.deserialize(invalidBuffer)).toThrow();
      expect(serializer.readFile(mockFile)).rejects.toThrow();
    });

    it('rejects promise when file does not exist', () => {
      expect(serializer.readFile('does-not-exist')).rejects.toThrow();
    });

    it('rejects promise when file write fails', () => {
      expect(serializer.writeFile(mockFailureFile, {})).rejects.toThrow();
    });

    objs.forEach((obj, i) => {
      describe('Object ' + i, () => {
        it('serializes/deserializes in memory', () => {
          const buf = serializer.serialize(obj);

          expect(buf).toBeInstanceOf(Buffer);

          expect(prettyFormat(serializer.deserialize(buf))).toEqual(
            prettyFormat(obj),
          );
        });

        it('serializes/deserializes in disk', async () => {
          await serializer.writeFile(mockFile, obj);

          expect(prettyFormat(await serializer.readFile(mockFile))).toEqual(
            prettyFormat(obj),
          );
        });
      });
    });
  });
});
