/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import {jest} from '@jest/globals';
import type {Mock} from 'jest-mock';

// jest.fn()

const mockFn = jest.fn((a: string, b: number) => true);

expectType<string>(mockFn.getMockName());
expectError(mockFn.getMockName('some-mock'));

expectType<number>(mockFn.mock.calls.length);

// hm.. possibly undefined?
// https://github.com/facebook/jest/issues/10402
expectType<string>(mockFn.mock.calls[0][0]);
expectType<number>(mockFn.mock.calls[0][1]);

expectType<string>(mockFn.mock.calls[1][0]);
expectType<number>(mockFn.mock.calls[1][1]);

expectType<[a: string, b: number] | undefined>(mockFn.mock.lastCall);

expectType<Array<number>>(mockFn.mock.invocationCallOrder);

const returnValue = mockFn.mock.results[0];

expectType<'incomplete' | 'return' | 'throw'>(returnValue.type);
expectType<unknown>(returnValue.value);

// TODO
//
// if (returnValue.type === 'incomplete') {
//   expectType(returnValue.value);
// }

// if (returnValue.type === 'return') {
//   expectType(returnValue.value);
// }

// if (returnValue.type === 'throw') {
//   expectType(returnValue.value);
// }

expectType<Mock<boolean, [a: string, b: number]>>(mockFn.mockClear());
expectError(mockFn.mockClear('some-mock'));

expectType<Mock<boolean, [a: string, b: number]>>(mockFn.mockReset());
expectError(mockFn.mockClear('some-mock'));

expectType<void>(mockFn.mockRestore());
expectError(mockFn.mockClear('some-mock'));

//
// All bellow is TODO
//

const mock = jest.fn();

mock.mockClear();

expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockResolvedValueOnce('A string, not a Promise'),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockResolvedValue('A string, not a Promise'),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockRejectedValueOnce(new Error('An error, not a string')),
);
expectType<Mock<Promise<string>, []>>(
  jest
    .fn(() => Promise.resolve('string value'))
    .mockRejectedValue(new Error('An error, not a string')),
);

// jest.spyOn()
