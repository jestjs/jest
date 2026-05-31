/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import {type SpiedFunction, spyOn} from 'jest-mock';

describe('spyOn with overloaded methods (issue #15998)', () => {
  function callbackable(): Promise<void>;
  function callbackable(cb: (err?: void) => void): void;
  function callbackable(cb?: (err?: void) => void) {
    if (!cb) {
      return Promise.resolve();
    }
    return;
  }

  const o = {callbackable};

  test('mockRejectedValueOnce accepts an Error for an overload returning Promise', () => {
    expect(
      spyOn(o, 'callbackable').mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('mockResolvedValueOnce accepts the resolved value of the Promise overload', () => {
    expect(spyOn(o, 'callbackable').mockResolvedValueOnce(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
  });

  test('mockReturnValueOnce accepts the return type of either overload', () => {
    expect(spyOn(o, 'callbackable').mockReturnValueOnce(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
    expect(
      spyOn(o, 'callbackable').mockReturnValueOnce(Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('mockImplementation accepts a function matching one overload only', () => {
    expect(
      spyOn(o, 'callbackable').mockImplementation(() => Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable').mockImplementation(cb => {
        cb?.();
      }),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('mockImplementation strips namespace members of the spied function', () => {
    // `Array.isArray` is a type predicate `(arg: any) => arg is any[]`. The
    // spy must accept a plain `(arg: any) => boolean` implementation rather
    // than forcing the caller to reconstruct the predicate. See issue #15998.
    expect(spyOn(Array, 'isArray').mockImplementation(() => true)).type.toBe<
      SpiedFunction<typeof Array.isArray>
    >();
  });

  test('mockImplementationOnce accepts a function matching one overload only', () => {
    expect(
      spyOn(o, 'callbackable').mockImplementationOnce(() => Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('withImplementation accepts an implementation matching one overload (async callback)', async () => {
    const spy = spyOn(o, 'callbackable');
    expect(
      spy.withImplementation(
        () => Promise.resolve(),
        () => Promise.resolve(),
      ),
    ).type.toBe<Promise<void>>();
    expect(
      spy.withImplementation(
        cb => {
          cb?.();
        },
        () => Promise.resolve(),
      ),
    ).type.toBe<Promise<void>>();
  });

  test('withImplementation accepts an implementation matching one overload (sync callback)', () => {
    const spy = spyOn(o, 'callbackable');
    expect(
      spy.withImplementation(
        () => Promise.resolve(),
        () => {
          // noop
        },
      ),
    ).type.toBe<void>();
  });

  test('mockImplementation preserves the spied function `this` (issue #15998)', () => {
    const target = {
      method(this: Date, a: string): boolean {
        return this.getTime() > 0 && a.length > 0;
      },
    };
    // Explicit `this: Date` annotation works — the spy accepts an
    // implementation matching the original method's `this` type.
    expect(
      spyOn(target, 'method').mockImplementation(function (
        this: Date,
        a,
      ): boolean {
        return this.getTime() > 0 && a.length > 0;
      }),
    ).type.toBe<SpiedFunction<typeof target.method>>();
  });
});
