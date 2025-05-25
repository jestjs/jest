/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const PROTECT_PROPERTY = Symbol.for('$$jest-protect-from-deletion');

/**
 * Deletes all the properties from the given value (if it's an object),
 * unless the value was protected via {@link #protectProperties}.
 *
 * @param value the given value.
 */
export function deleteProperties(value: unknown): void {
  if (canDeleteProperties(value)) {
    const protectedProperties = Reflect.get(value, PROTECT_PROPERTY);
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
 * Protects the given value from being deleted by {@link #deleteProperties}.
 *
 * @param value The given value.
 * @param properties If the array contains any property,
 * then only these properties will not be deleted; otherwise if the array is empty,
 * all properties will not be deleted.
 */
export function protectProperties<T extends object>(
  value: T,
  properties: Array<keyof T> = [],
): boolean {
  if (canDeleteProperties(value)) {
    return Reflect.set(value, PROTECT_PROPERTY, properties);
  }
  return false;
}

/**
 * Whether the given value has properties that can be deleted (regardless of protection).
 *
 * @param value The given value.
 */
export function canDeleteProperties(value: unknown): value is object {
  if (value !== null) {
    const type = typeof value;
    return type === 'object' || type === 'function';
  }

  return false;
}
