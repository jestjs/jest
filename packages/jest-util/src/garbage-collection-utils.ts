/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const PROTECT_SYMBOL = Symbol.for('$$jest-protect-from-deletion');

/**
 * Deletes all the properties from the given value (if it's an object),
 * unless the value was protected via {@link #protectProperties}.
 *
 * @param value the given value.
 */
export function deleteProperties(value: unknown): void {
  if (canDeleteProperties(value)) {
    const protectedKeys = getProtectedKeys(
      value,
      Reflect.get(value, PROTECT_SYMBOL),
    );
    for (const key of Reflect.ownKeys(value)) {
      if (!protectedKeys.includes(key) && key !== PROTECT_SYMBOL) {
        Reflect.deleteProperty(value, key);
      }
    }
  }
}

/**
 * Protects the given value from being deleted by {@link #deleteProperties}.
 *
 * @param value The given value.
 * @param properties If the array contains any property,
 * then only these properties will be protected; otherwise if the array is empty,
 * all properties will be protected.
 * @param depth Determines how "deep" the protection should be.
 * A value of 0 means that only the top-most properties will be protected,
 * while a value larger than 0 means that deeper levels of nesting will be protected as well.
 */
export function protectProperties<T>(
  value: T,
  properties: Array<keyof T> = [],
  depth = 2,
): boolean {
  if (
    depth >= 0 &&
    canDeleteProperties(value) &&
    !Reflect.has(value, PROTECT_SYMBOL)
  ) {
    const result = Reflect.set(value, PROTECT_SYMBOL, properties);
    for (const key of getProtectedKeys(value, properties)) {
      const originalEmitWarning = process.emitWarning;
      try {
        // Reflect.get may cause deprecation warnings, so we disable them temporarily
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        process.emitWarning = () => {};

        const nested = Reflect.get(value, key);
        protectProperties(nested, [], depth - 1);
      } catch {
        // Reflect.get might fail in certain edge-cases
        // Instead of failing the entire process, we will skip the property.
      } finally {
        process.emitWarning = originalEmitWarning;
      }
    }
    return result;
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

function getProtectedKeys<T extends object>(
  value: T,
  properties: Array<keyof T> | undefined,
): Array<string | symbol | number> {
  if (properties === undefined) {
    return [];
  }
  const protectedKeys =
    properties.length > 0 ? properties : Reflect.ownKeys(value);
  return protectedKeys.filter(key => PROTECT_SYMBOL !== key);
}
