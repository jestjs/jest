/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';

/**
 * The symbol that is set on the global object to store the deletion mode.
 */
const DELETION_MODE_SYMBOL = Symbol.for('$$jest-deletion-mode');

/**
 * The symbol that is set on objects to protect them from deletion.
 *
 * If the value is an empty array, then all properties will be protected.
 * If the value is an array of strings or symbols, then only those properties will be protected.
 */
const PROTECT_SYMBOL = Symbol.for('$$jest-protect-from-deletion');

/**
 *  - <b>off</b>: deletion is completely turned off.
 *  - <b>soft</b>: doesn't delete objects, but instead wraps their getter/setter with a deprecation warning.
 *  - <b>on</b>: actually delete objects (using `delete`).
 */
export type DeletionMode = 'soft' | 'off' | 'on';

/**
 * Initializes the garbage collection utils with the given deletion mode.
 *
 * @param globalObject the global object on which to store the deletion mode.
 * @param deletionMode the deletion mode to use.
 */
export function initializeGarbageCollectionUtils(
  globalObject: typeof globalThis,
  deletionMode: DeletionMode,
): void {
  const currentMode = Reflect.get(globalObject, DELETION_MODE_SYMBOL);
  if (currentMode && currentMode !== deletionMode) {
    console.warn(
      chalk.yellow(
        [
          '[jest-util] garbage collection deletion mode already initialized, ignoring new mode',
          `  Current: '${currentMode}'`,
          `  Given: '${deletionMode}'`,
        ].join('\n'),
      ),
    );
    return;
  }
  Reflect.set(globalObject, DELETION_MODE_SYMBOL, deletionMode);
}

/**
 * Deletes all the properties from the given value (if it's an object),
 * unless the value was protected via {@link #protectProperties}.
 *
 * @param value the given value.
 */
export function deleteProperties(value: unknown): void {
  if (getDeletionMode() !== 'off' && canDeleteProperties(value)) {
    const protectedKeys = getProtectedKeys(
      value,
      Reflect.get(value, PROTECT_SYMBOL),
    );
    for (const key of Reflect.ownKeys(value)) {
      if (!protectedKeys.includes(key) && key !== PROTECT_SYMBOL) {
        deleteProperty(value, key);
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
  if (getDeletionMode() === 'off') {
    return false;
  }

  // Reflect.get may cause deprecation warnings, so we disable them temporarily
  const originalEmitWarning = process.emitWarning;

  try {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    process.emitWarning = () => {};
    if (
      depth >= 0 &&
      canDeleteProperties(value) &&
      !Reflect.has(value, PROTECT_SYMBOL)
    ) {
      const result = Reflect.defineProperty(value, PROTECT_SYMBOL, {
        configurable: true,
        enumerable: false,
        value: properties,
        writable: true,
      });
      for (const key of getProtectedKeys(value, properties)) {
        try {
          const nested = Reflect.get(value, key);
          protectProperties(nested, [], depth - 1);
        } catch {
          // Reflect.get might fail in certain edge-cases
          // Instead of failing the entire process, we will skip the property.
        }
      }
      return result;
    }
    return false;
  } finally {
    process.emitWarning = originalEmitWarning;
  }
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

/**
 * Deletes the property of the given key from the given object.
 *
 * @param obj the given object.
 * @param key the given key.
 * @param mode there are two possible modes of deletion:
 *  - <b>soft</b>: doesn't delete the object, but instead wraps its getter/setter with a deprecation warning.
 *  - <b>hard</b>: actually deletes the object (`delete`).
 *
 * @returns whether the deletion was successful or not.
 */
function deleteProperty(obj: object, key: string | symbol): boolean {
  const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
  if (!descriptor?.configurable) {
    return false;
  }

  if (getDeletionMode() === 'on') {
    return Reflect.deleteProperty(obj, key);
  }

  const originalGetter = descriptor.get ?? (() => descriptor.value);
  const originalSetter =
    descriptor.set ?? (value => Reflect.set(obj, key, value));

  return Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: descriptor.enumerable,
    get() {
      emitAccessWarning(obj, key);
      return originalGetter();
    },
    set(value) {
      emitAccessWarning(obj, key);
      return originalSetter(value);
    },
  });
}

function getDeletionMode(): DeletionMode {
  return Reflect.get(globalThis, DELETION_MODE_SYMBOL) ?? 'off';
}

const warningCache = new WeakSet<object>();

function emitAccessWarning(obj: object, key: string | symbol): void {
  if (warningCache.has(obj)) {
    return;
  }
  const objName = obj?.constructor?.name ?? 'unknown';
  const propertyName = typeof key === 'symbol' ? key.description : key;

  process.emitWarning(
    `'${propertyName}' property was accessed on [${objName}] after it was soft deleted`,
    {
      code: 'JEST-01',
      detail: [
        'Jest deletes objects that were set on the global scope between test files to reduce memory leaks.',
        'Currently it only "soft" deletes them and emits this warning if those objects were accessed after their deletion.',
        'In future versions of Jest, this behavior will change to "on", which will likely fail tests.',
        'You can change the behavior in your test configuration now to reduce memory usage.',
      ]
        .map(s => `  ${s}`)
        .join('\n'),
      type: 'DeprecationWarning',
    },
  );
  warningCache.add(obj);
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
