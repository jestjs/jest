/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  type SerializedRecord,
  deserialize,
  serialize,
} from '@ungap/structured-clone';

type TransferringContainer = {
  __STRUCTURED_CLONE_SERIALIZED__: true;
  data: SerializedRecord;
};

export function packMessage(message: unknown): TransferringContainer {
  return {
    __STRUCTURED_CLONE_SERIALIZED__: true,
    /**
     * Use the `json: true` option to avoid errors
     * caused by `symbol` types.
     *
     * Functions are replaced with a string reference before serializing.
     * `worker_threads` cannot transfer them, and the structured clone
     * algorithm has no representation for them, so they would otherwise be
     * dropped silently - losing data the receiving side might rely on, such as
     * the `actual` and `expected` values of a failed matcher.
     */
    data: serialize(replaceFunctionsWithStringReferences(message), {
      json: true,
    }),
  };
}

/**
 * Replaces every function found in `value` with a string reference, mirroring
 * how `pretty-format` renders functions (e.g. `[Function foo]`), so that the
 * message can be transferred to the parent thread/process.
 *
 * Only values the structured clone algorithm serializes as plain objects are
 * traversed; errors, dates, maps, sets and the like keep their own handling,
 * so this never changes how anything else is serialized.
 */
export function replaceFunctionsWithStringReferences<T>(
  value: T,
  cycles = new WeakMap<object, object>(),
): T {
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]` as unknown as T;
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    // Stop on cyclic references: the clone being built is put into the map
    // before its properties are visited, so a cycle points back to it and is
    // left for the serializer to handle.
    const cached = cycles.get(value);

    if (cached !== undefined) {
      return cached as T;
    }
  }

  if (Array.isArray(value)) {
    const cloned: Array<unknown> = [];
    cycles.set(value, cloned);

    for (const item of value) {
      cloned.push(replaceFunctionsWithStringReferences(item, cycles));
    }

    return cloned as unknown as T;
  }

  if (isPlainObject(value)) {
    const cloned: Record<string, unknown> = {};
    cycles.set(value, cloned);

    for (const key of Object.keys(value)) {
      cloned[key] = replaceFunctionsWithStringReferences(value[key], cycles);
    }

    return cloned as unknown as T;
  }

  return value;
}

/**
 * Mirrors the values `@ungap/structured-clone` serializes as plain objects:
 * everything tagged `[object Object]`, plus errors created in another realm
 * (e.g. a test file sandboxed by `jest-runtime`), which are not instances of
 * this realm's `Error` and are therefore serialized as plain objects as well.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const tag = Object.prototype.toString.call(value).slice(8, -1);

  if (tag === 'Object') {
    return true;
  }

  return tag === 'Error' && !(value instanceof Error);
}

function isTransferringContainer(
  message: unknown,
): message is TransferringContainer {
  return (
    message != null &&
    typeof message === 'object' &&
    '__STRUCTURED_CLONE_SERIALIZED__' in message &&
    'data' in message
  );
}

export function unpackMessage(message: unknown): unknown {
  if (isTransferringContainer(message)) {
    return deserialize(message.data);
  }
  return message;
}
