/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import fs from 'fs';
import v8 from 'v8';

import type {Path} from 'types/Config';

type IOCallback = (?Error, ?any) => void;

// JSON and V8 serializers are both stable when it comes to compatibility. The
// current JSON specification is well defined in RFC 8259, and V8 ensures that
// the versions are compatible by encoding the serialization version in the own
// generated buffer.

// In memory functions.

export function serialize(content: any): Buffer {
  return v8.serialize
    ? v8.serialize(content)
    : Buffer.from(JSON.stringify(content));
}

export function deserialize(buffer: Buffer): any {
  return v8.deserialize
    ? v8.deserialize(buffer)
    : Buffer.from(JSON.stringify(buffer.toString('utf8')));
}

// Synchronous filesystem functions.

export function readFileSync(file: Path): any {
  return v8.deserialize
    ? v8.deserialize(fs.readFileSync(file))
    : JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeFileSync(file: Path, content: any) {
  return v8.serialize
    ? fs.writeFileSync(file, v8.serialize(content))
    : fs.writeFileSync(file, JSON.stringify(content), 'utf8');
}

// Asynchronous filesystem functions.

export function readFile(file: Path, callback: IOCallback) {
  if (v8.deserialize) {
    fs.readFile(file, (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      try {
        callback(null, v8.deserialize(data));
      } catch (error) {
        callback(error);
      }
    });
  } else {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        callback(err);
        return;
      }

      try {
        callback(null, JSON.parse(data));
      } catch (error) {
        callback(error);
      }
    });
  }
}

export function writeFile(file: Path, content: any, callback: IOCallback) {
  if (v8.serialize) {
    try {
      fs.writeFile(file, v8.serialize(content), callback);
    } catch (err) {
      callback(err);
    }
  } else {
    try {
      fs.writeFile(file, JSON.stringify(content), callback);
    } catch (err) {
      callback(err);
    }
  }
}

export default {
  deserialize,
  readFile,
  readFileSync,
  serialize,
  writeFile,
  writeFileSync,
};
