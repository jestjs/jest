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

  test('mockRejectedValue accepts an Error for an overload returning Promise', () => {
    expect(
      spyOn(o, 'callbackable').mockRejectedValue(new Error('test')),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable').mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('mockResolvedValue accepts the resolved value of the Promise overload', () => {
    expect(spyOn(o, 'callbackable').mockResolvedValue(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
    expect(spyOn(o, 'callbackable').mockResolvedValueOnce(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
    expect(
      spyOn(o, 'callbackable').mockResolvedValue,
    ).type.not.toBeCallableWith('test');
    expect(
      spyOn(o, 'callbackable').mockResolvedValueOnce,
    ).type.not.toBeCallableWith('test');
  });

  test('mockReturnValue accepts the return type of either overload', () => {
    expect(spyOn(o, 'callbackable').mockReturnValue(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
    expect(
      spyOn(o, 'callbackable').mockReturnValue(Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(spyOn(o, 'callbackable').mockReturnValueOnce(undefined)).type.toBe<
      SpiedFunction<typeof o.callbackable>
    >();
    expect(
      spyOn(o, 'callbackable').mockReturnValueOnce(Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(spyOn(o, 'callbackable').mockReturnValue).type.not.toBeCallableWith(
      123,
    );
    expect(
      spyOn(o, 'callbackable').mockReturnValueOnce,
    ).type.not.toBeCallableWith(123);
  });
});
