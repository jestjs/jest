/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const replaceFunctionsWithStringReferences = <T>(value: T): T => {
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]` as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map(replaceFunctionsWithStringReferences) as T;
  }

  const isObject = value !== null && typeof value === 'object';
  if (isObject) {
    const oldObject = value as Record<string, unknown>;
    const newObject: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      newObject[key] = replaceFunctionsWithStringReferences(oldObject[key]);
    }

    return newObject as T;
  }

  return value;
};
