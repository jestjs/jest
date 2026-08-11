/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {deleteProperties, protectProperties} from '../garbage-collection-utils';

const omit = require('lodash').omit;

// Mirror the registered symbols used inside garbage-collection-utils so each
// test can force the deletion mode it needs regardless of what an earlier
// setup script already initialized.
const DELETION_MODE_SYMBOL = Symbol.for('$$jest-deletion-mode');

// Real user objects in a jest run inherit a `PROTECT_SYMBOL` value from
// globalThis when jest-circus protects the global scope, which causes
// `deleteProperties` to treat every own key as protected. Construct
// prototypeless objects so the soft-delete path actually visits them.
function makeBareObject<T extends object>(props: T): T {
  const obj = Object.create(null) as T;
  for (const key of Reflect.ownKeys(props) as Array<keyof T>) {
    obj[key] = props[key];
  }
  return obj;
}

it('protection symbol doesnt leak', () => {
  const obj = {a: 1, b: 2};
  protectProperties(obj);
  expect(obj).toStrictEqual(obj);
  expect(omit(obj, 'a')).toStrictEqual({b: 2});
  expect({b: 2}).toStrictEqual(omit(obj, 'a'));
});

describe('soft deletion writes', () => {
  // The soft-deletion code path defines a wrapping setter for every
  // descriptor it visits. For data properties (no original setter on the
  // descriptor) the wrapping setter used to forward into
  // `Reflect.set(obj, key, value)` -- which re-entered the same wrapping
  // setter and produced `RangeError: Maximum call stack size exceeded`
  // on the first write after soft-delete. Regression for #16044.
  let originalEmitWarning: typeof process.emitWarning;
  let originalDeletionMode: unknown;

  beforeAll(() => {
    originalDeletionMode = Reflect.get(globalThis, DELETION_MODE_SYMBOL);
    Reflect.set(globalThis, DELETION_MODE_SYMBOL, 'soft');
    originalEmitWarning = process.emitWarning;
    // Silence the deprecation warnings the soft-delete wrappers emit on
    // every access; otherwise stderr fills with one warning per assertion.
    process.emitWarning = () => {};
  });

  afterAll(() => {
    process.emitWarning = originalEmitWarning;
    if (originalDeletionMode === undefined) {
      Reflect.deleteProperty(globalThis, DELETION_MODE_SYMBOL);
    } else {
      Reflect.set(globalThis, DELETION_MODE_SYMBOL, originalDeletionMode);
    }
  });

  it('writing to a soft-deleted data property does not recurse', () => {
    const obj = makeBareObject<{foo: string}>({foo: 'bar'});
    deleteProperties(obj);

    expect(() => {
      obj.foo = 'baz';
    }).not.toThrow();

    expect(obj.foo).toBe('baz');
  });

  it('repeated writes to a soft-deleted data property each take effect', () => {
    const obj = makeBareObject<{counter: number}>({counter: 0});
    deleteProperties(obj);

    for (let i = 1; i <= 5; i++) {
      obj.counter = i;
      expect(obj.counter).toBe(i);
    }
  });

  it('preserves the original accessor setter on accessor descriptors', () => {
    const log: Array<unknown> = [];
    const obj = Object.create(null) as {value: number};
    Reflect.defineProperty(obj, 'value', {
      configurable: true,
      enumerable: true,
      get: () => 1,
      set: (v: unknown) => {
        log.push(v);
      },
    });
    deleteProperties(obj);

    obj.value = 42;
    obj.value = 7;
    expect(log).toEqual([42, 7]);
  });
});
