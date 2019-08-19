/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// TODO: Remove this
/// <reference path="../v8.d.ts" />

import * as fs from 'fs';
import v8 from 'v8';

type Path = string;

// JSON and V8 serializers are both stable when it comes to compatibility. The
// current JSON specification is well defined in RFC 8259, and V8 ensures that
// the versions are compatible by encoding the serialization version in the own
// generated buffer.

// In memory functions.

export function deserialize(buffer: Buffer): any {
  return v8.deserialize(buffer);
}

export function serialize(content: unknown): Buffer {
  return v8.serialize(content);
}

// Synchronous filesystem functions.

export function readFileSync(filePath: Path): any {
  return v8.deserialize(fs.readFileSync(filePath));
}

export function writeFileSync(filePath: Path, content: any) {
  return fs.writeFileSync(filePath, v8.serialize(content));
}

export default {
  deserialize,
  readFileSync,
  serialize,
  writeFileSync,
};
