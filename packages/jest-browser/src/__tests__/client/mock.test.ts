/**
 * @jest-environment jsdom
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createMockSystem} from '../../client/tester/mock';

describe('createMockSystem', () => {
  test('jest.fn() tracks calls, results, and instances', () => {
    const {fn} = createMockSystem();
    const mock = fn((value: number) => value * 2);
    const receiver = {run: mock};

    const first = receiver.run(2);
    const second = receiver.run(3);

    expect(first).toBe(4);
    expect(second).toBe(6);
    expect(mock.mock.calls).toEqual([[2], [3]]);
    expect(mock.mock.results).toEqual([
      {type: 'return', value: 4},
      {type: 'return', value: 6},
    ]);
    expect(mock.mock.instances).toEqual([receiver, receiver]);
  });

  test('jest.fn() supports mockImplementation and mockReturnValue', () => {
    const {fn} = createMockSystem();
    const mock = fn();

    mock.mockImplementation((left: number, right: number) => left + right);
    expect(mock(2, 5)).toBe(7);

    mock.mockReturnValue(99);
    expect(mock(1, 1)).toBe(99);
  });

  test('jest.fn() supports mockOnce variants (impl, return, resolved, rejected)', async () => {
    const {fn} = createMockSystem();
    const rejectError = new Error('once-rejected');
    const mock = fn(() => 'default');

    mock.mockImplementationOnce(() => 'once-impl');
    mock.mockReturnValueOnce('once-return');
    mock.mockResolvedValueOnce('once-resolved');
    mock.mockRejectedValueOnce(rejectError);

    await expect(Promise.resolve(mock())).resolves.toBe('once-impl');
    await expect(Promise.resolve(mock())).resolves.toBe('once-return');
    await expect(mock()).resolves.toBe('once-resolved');
    await expect(mock()).rejects.toBe(rejectError);
    await expect(Promise.resolve(mock())).resolves.toBe('default');
  });

  test('jest.fn() supports mockResolvedValue and mockRejectedValue', async () => {
    const {fn} = createMockSystem();

    const resolved = fn().mockResolvedValue('ok');
    await expect(resolved()).resolves.toBe('ok');

    const failure = new Error('boom');
    const rejected = fn().mockRejectedValue(failure);
    await expect(rejected()).rejects.toBe(failure);
  });

  test('jest.fn() mockClear resets calls/results but keeps impl', () => {
    const {fn} = createMockSystem();
    const mock = fn((value: number) => value + 10);

    expect(mock(1)).toBe(11);
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.results).toHaveLength(1);

    mock.mockClear();

    expect(mock.mock.calls).toEqual([]);
    expect(mock.mock.results).toEqual([]);
    expect(mock(5)).toBe(15);
  });

  test('jest.fn() mockReset clears and removes implementation', () => {
    const {fn} = createMockSystem();
    const mock = fn((value: number) => value + 1);

    expect(mock(1)).toBe(2);
    mock.mockReset();

    expect(mock.mock.calls).toEqual([]);
    expect(mock.mock.results).toEqual([]);
    expect(mock(1)).toBeUndefined();
  });

  test('jest.spyOn replaces method and mockRestore restores original', () => {
    const {spyOn} = createMockSystem();
    const target = {
      method(value: string) {
        return `orig:${value}`;
      },
    };

    const spy = spyOn(target, 'method');
    spy.mockImplementation((value: string) => `mock:${value}`);

    expect(target.method('x')).toBe('mock:x');
    expect(spy.mock.calls).toEqual([['x']]);

    spy.mockRestore();
    expect(target.method('y')).toBe('orig:y');
  });

  test('jest.spyOn supports getter and setter accessType', () => {
    const {spyOn} = createMockSystem();
    let stored = 'initial';
    const target = {
      get value() {
        return stored;
      },
      set value(next: string) {
        stored = next;
      },
    };

    const getSpy = spyOn(target, 'value', 'get');
    const setSpy = spyOn(target, 'value', 'set');

    getSpy.mockReturnValue('mocked');
    target.value = 'updated';

    expect(target.value).toBe('mocked');
    expect(setSpy.mock.calls).toEqual([['updated']]);
    expect(getSpy.mock.calls).toHaveLength(1);

    getSpy.mockRestore();
    setSpy.mockRestore();
    expect(target.value).toBe('updated');
  });

  test('clearAllMocks/resetAllMocks/restoreAllMocks operate on all tracked mocks', () => {
    const {fn, spyOn, clearAllMocks, resetAllMocks, restoreAllMocks} =
      createMockSystem();
    const standalone = fn(() => 'standalone');
    const target = {
      method() {
        return 'orig';
      },
    };
    const spy = spyOn(target, 'method');
    spy.mockReturnValue('spy');

    expect(standalone()).toBe('standalone');
    expect(target.method()).toBe('spy');
    expect(standalone.mock.calls).toHaveLength(1);
    expect(spy.mock.calls).toHaveLength(1);

    clearAllMocks();
    expect(standalone.mock.calls).toEqual([]);
    expect(spy.mock.calls).toEqual([]);

    resetAllMocks();
    expect(standalone()).toBeUndefined();
    expect(target.method()).toBeUndefined();

    restoreAllMocks();
    expect(target.method()).toBe('orig');
  });

  test('isMockFunction returns true for mocks, false for regular functions', () => {
    const {fn, isMockFunction} = createMockSystem();
    const mock = fn();
    const regular = () => 'regular';

    expect(isMockFunction(mock)).toBe(true);
    expect(isMockFunction(regular)).toBe(false);
  });

  test('jest.mocked returns input unchanged (type helper)', () => {
    const {mocked} = createMockSystem();
    const value = {nested: {count: 1}};

    expect(mocked(value)).toBe(value);
  });
});
