/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import prettyFormat = require('pretty-format');

import serializer from '..';

const objs = [
  3,
  null,
  [0, true, '2', [3.14, {}, null]],
  {key1: 'foo', key2: 'bar', key3: {array: [null, {}]}},
  {minusInf: -Infinity, nan: NaN, plusInf: +Infinity},
  {date: new Date(1234567890), re: /foo/gi},
  // @ts-expect-error - testing NaN
  {
    map: new Map([
      [NaN, 4],
      [undefined, 'm'],
    ]),
    set: new Set([undefined, NaN]),
  },
  {buf: Buffer.from([0, 255, 127])},
];

const file = path.join(tmpdir(), '__jest-serialize-test__');

afterEach(() => {
  try {
    fs.unlinkSync(file);
  } catch (err) {
    // Do nothing if file does not exist.
  }
});

describe('Using V8 implementation', () => {
  it('throws the error with an invalid serialization', () => {
    // No chance this is a valid serialization, neither in JSON nor V8.
    const invalidBuffer = Buffer.from([0, 85, 170, 255]);

    fs.writeFileSync(file, invalidBuffer);

    expect(() => serializer.deserialize(invalidBuffer)).toThrow();
    expect(() => serializer.readFileSync(file)).toThrow();
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

      it('serializes/deserializes in disk', () => {
        serializer.writeFileSync(file, obj);

        expect(prettyFormat(serializer.readFileSync(file))).toEqual(
          prettyFormat(obj),
        );
      });
    });
  });
});
