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
  const callbackImplementation = (cb: (err?: void) => void) => cb();

  test('mockImplementation preserves overloads in fluent chains', () => {
    expect(
      spyOn(o, 'callbackable')
        .mockImplementation(callbackImplementation)
        .mockReturnValue(Promise.resolve())
        .mockReturnValueOnce(Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable')
        .mockImplementation(callbackImplementation)
        .mockResolvedValue(undefined)
        .mockResolvedValueOnce(undefined),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable')
        .mockImplementation(callbackImplementation)
        .mockRejectedValue(new Error('test'))
        .mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

  test('mockImplementationOnce preserves overloads in fluent chains', () => {
    expect(
      spyOn(o, 'callbackable')
        .mockImplementationOnce(callbackImplementation)
        .mockReturnValue(Promise.resolve())
        .mockReturnValueOnce(Promise.resolve()),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable')
        .mockImplementationOnce(callbackImplementation)
        .mockResolvedValue(undefined)
        .mockResolvedValueOnce(undefined),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
    expect(
      spyOn(o, 'callbackable')
        .mockImplementationOnce(callbackImplementation)
        .mockRejectedValue(new Error('test'))
        .mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<typeof o.callbackable>>();
  });

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

  test('preserves Promise members within an overload return union', () => {
    interface Overloaded {
      (value: string): string | PromiseLike<number>;
      (value: number): boolean;
    }
    const target = {method: null as unknown as Overloaded};
    const spy = spyOn(target, 'method');

    expect(
      spy
        .mockResolvedValue(123)
        .mockResolvedValueOnce(456)
        .mockRejectedValue(new Error('test'))
        .mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<Overloaded>>();
    expect(spy.mockResolvedValue).type.not.toBeCallableWith('test');
    expect(spy.mockResolvedValueOnce).type.not.toBeCallableWith(true);
  });

  test('includes the first of fifteen overloads in value helpers', () => {
    interface Overloaded {
      (value: 1): Promise<string>;
      (value: 2): Promise<number>;
      (value: 3): 3;
      (value: 4): 4;
      (value: 5): 5;
      (value: 6): 6;
      (value: 7): 7;
      (value: 8): 8;
      (value: 9): 9;
      (value: 10): 10;
      (value: 11): 11;
      (value: 12): 12;
      (value: 13): 13;
      (value: 14): 14;
      (value: 15): 15;
    }
    const target = {method: null as unknown as Overloaded};
    const spy = spyOn(target, 'method');

    expect(
      spy
        .mockImplementation((value: 15) => value)
        .mockReturnValue(Promise.resolve('test'))
        .mockReturnValueOnce(15)
        .mockResolvedValue('test')
        .mockResolvedValueOnce(123)
        .mockRejectedValue(new Error('test'))
        .mockRejectedValueOnce(new Error('test')),
    ).type.toBe<SpiedFunction<Overloaded>>();
    expect(spy.mockReturnValue).type.not.toBeCallableWith(16);
    expect(spy.mockResolvedValue).type.not.toBeCallableWith(true);
  });
});
