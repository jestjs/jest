/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import fs from 'fs';
import os from 'os';
import path from 'path';
import v8 from 'v8';

import serializer from '..';

const v8s = [
  {
    deserialize: v8.deserialize,
    serialize: v8.serialize,
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
];

const file = path.join(os.tmpdir(), '__jest-serialize-test__');

afterEach(() => {
  try {
    fs.unlinkSync(file);
  } catch (err) {
    // Do nothing if file does not exist.
  }
});

// We execute the same suite of tests over multiple objects ("objs") and over
// multiple mocks of the V8 object ("v8s") so that we verify that all possible
// encodings and cases work.
v8s.forEach((mockV8, i) => {
  describe('Using V8 implementation ' + i, () => {
    jest.mock('v8', () => mockV8);

    it('throws the error with an invalid serialization', done => {
      // No chance this is a valid serialization, neither in JSON nor V8.
      const invalidBuffer = Buffer.from([0x00, 0x55, 0xaa, 0xff]);

      fs.writeFileSync(file, invalidBuffer);

      expect(() => serializer.deserialize(invalidBuffer)).toThrow();
      expect(() => serializer.readFileSync(file)).toThrow();

      serializer.readFile(file, err => {
        expect(err).toBeDefined();
        done();
      });
    });

    objs.forEach((obj, i) => {
      describe('Object ' + i, () => {
        it('serializes/deserializes in memory', () => {
          const buf = serializer.serialize(obj);

          expect(buf).toBeInstanceOf(Buffer);
          expect(serializer.deserialize(buf)).toEqual(obj);
        });

        it('serializes/deserializes in disk, synchronously', () => {
          serializer.writeFileSync(file, obj);
          expect(serializer.readFileSync(file)).toEqual(obj);
        });

        it('serializes/deserializes in disk, asynchronously', done => {
          serializer.writeFile(file, obj, err => {
            serializer.readFile(file, (err, data) => {
              expect(data).toEqual(obj);
              done();
            });
          });
        });
      });
    });
  });
});
