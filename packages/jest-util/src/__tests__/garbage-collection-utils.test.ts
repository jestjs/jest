/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  initializeGarbageCollectionUtils,
  protectProperties,
} from '../garbage-collection-utils';

const omit = require('lodash').omit;

it('protection symbol doesnt leak', () => {
  const obj = {a: 1, b: 2};
  protectProperties(obj);
  expect(obj).toStrictEqual(obj);
  expect(omit(obj, 'a')).toStrictEqual({b: 2});
  expect({b: 2}).toStrictEqual(omit(obj, 'a'));
});

describe('protectProperties', () => {
  // `Object.prototype` itself gets protected, so a plain object inherits that
  // protection and would not be walked at all.
  const makeUnprotectedObject = <T extends object>(properties: T) =>
    Object.assign(Object.create(null) as T, properties);

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
