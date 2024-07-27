/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const NO_SHRED_AFTER_TEARDOWN = Symbol.for('$$jest-no-shred');

/**
 * Deletes all the properties from the given value (if it's an object),
 * unless the value was protected via {@link #setNotShreddable}.
 *
 * @param value the given value.
 */
export function shred(value: unknown): void {
  if (isShreddable(value)) {
    const protectedProperties = Reflect.get(value, NO_SHRED_AFTER_TEARDOWN);
    if (!Array.isArray(protectedProperties) || protectedProperties.length > 0) {
      for (const key of Reflect.ownKeys(value)) {
        if (!protectedProperties?.includes(key)) {
          Reflect.deleteProperty(value, key);
        }
      }
    }
  }
}

/**
 * Protects the given value from being shredded by {@link #shred}.
 *
 * @param value The given value.
 * @param properties If the array contains any property,
 * then only these properties will not be deleted; otherwise if the array is empty,
 * all properties will not be deleted.
 */
export function setNotShreddable<T extends object>(
  value: T,
  properties: Array<keyof T> = [],
): boolean {
  if (isShreddable(value)) {
    return Reflect.set(value, NO_SHRED_AFTER_TEARDOWN, properties);
  }
  return false;
}

/**
 * Whether the given value is possible to be shredded.
 *
 * @param value The given value.
 */
export function isShreddable(value: unknown): value is object {
  return value !== null && ['object', 'function'].includes(typeof value);
}
