/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function withoutCircularRefs(obj: unknown): unknown {
  const cache = new WeakSet();
  function copy(obj: unknown) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    if (cache.has(obj)) {
      return '[Circular]';
    }
    cache.add(obj);
    const copyObj: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copyObj[key] = copy((obj as any)[key]);
      }
    }
    return copyObj;
  }
  return copy(obj);
}
