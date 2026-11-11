/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  deleteProperties,
  initializeGarbageCollectionUtils,
  protectProperties,
} from '../garbage-collection-utils';

const omit = require('lodash').omit;

// `Object.prototype` itself gets protected, so a plain object inherits that
// protection and would not be walked at all.
const makeUnprotectedObject = <T extends object>(properties: T) =>
  Object.assign(Object.create(null) as T, properties);

it('protection symbol doesnt leak', () => {
  const obj = {a: 1, b: 2};
  protectProperties(obj);
  expect(obj).toStrictEqual(obj);
  expect(omit(obj, 'a')).toStrictEqual({b: 2});
  expect({b: 2}).toStrictEqual(omit(obj, 'a'));
});

describe('protectProperties', () => {
  it('does not resolve accessors while protecting nested values', () => {
    let resolutions = 0;
    const obj = Object.create(null) as {lazy: unknown};
    Object.defineProperty(obj, 'lazy', {
      configurable: true,
      enumerable: true,
      get() {
        resolutions++;
        return {};
      },
    });

    protectProperties(obj);

    expect(resolutions).toBe(0);
  });

  it('skips values that cannot be inspected', () => {
    const throwOnInspection = () => {
      throw new Error('cannot inspect');
    };
    const obj = makeUnprotectedObject({
      nested: new Proxy(Object.create(null), {
        defineProperty: throwOnInspection,
        getOwnPropertyDescriptor: throwOnInspection,
        has: throwOnInspection,
        ownKeys: throwOnInspection,
      }),
    });

    expect(() => protectProperties(obj)).not.toThrow();
  });
});

describe('initializeGarbageCollectionUtils', () => {
  let globalObject: typeof globalThis;
  let warn: jest.Spied<typeof console.warn>;

  beforeEach(() => {
    globalObject = {} as typeof globalThis;
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('defaults to soft when no mode is given', () => {
    expect(initializeGarbageCollectionUtils(globalObject)).toBe('soft');
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the initialized mode when no mode is given', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject)).toBe('on');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn when the same mode is given again', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject, 'on')).toBe('on');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and keeps the initialized mode when a different mode is given', () => {
    initializeGarbageCollectionUtils(globalObject, 'on');

    expect(initializeGarbageCollectionUtils(globalObject, 'soft')).toBe('on');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(
      'garbage collection deletion mode already initialized',
    );
  });
});

describe('deleteProperties in soft mode', () => {
  const deletionModeSymbol = Symbol.for('$$jest-deletion-mode');
  let previousMode: unknown;
  let emitWarning: jest.Spied<typeof process.emitWarning>;

  beforeEach(() => {
    previousMode = Reflect.get(globalThis, deletionModeSymbol);
    Reflect.set(globalThis, deletionModeSymbol, 'soft');
    emitWarning = jest
      .spyOn(process, 'emitWarning')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    emitWarning.mockRestore();
    Reflect.set(globalThis, deletionModeSymbol, previousMode);
  });

  it('keeps data properties writable', () => {
    const obj = makeUnprotectedObject({foo: 'bar'});
    deleteProperties(obj);

    obj.foo = 'baz';

    expect(obj.foo).toBe('baz');
  });

  it('ignores writes to read-only data properties', () => {
    const obj = Object.create(null) as {foo: string};
    Object.defineProperty(obj, 'foo', {configurable: true, value: 'bar'});
    deleteProperties(obj);

    Reflect.set(obj, 'foo', 'baz');

    expect(obj.foo).toBe('bar');
  });

  it('keeps calling the setter of accessor properties', () => {
    const values: Array<number> = [];
    const obj = Object.create(null) as {value: number};
    Object.defineProperty(obj, 'value', {
      configurable: true,
      get: () => 1,
      set: (value: number) => values.push(value),
    });
    deleteProperties(obj);

    obj.value = 2;

    expect(values).toEqual([2]);
  });
});
