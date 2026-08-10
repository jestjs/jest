/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {jest, expect as jestExpect} from '@jest/globals';
import type {overloaded} from './toHaveBeenCalledWith.test';

expect(jestExpect(jest.fn()).toHaveBeenNthCalledWith(2)).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenNthCalledWith(1, 'value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenNthCalledWith(1, 'value', 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(a: string, b: number) => void>()).toHaveBeenNthCalledWith(
    1,
    jestExpect.stringContaining('value'),
    123,
  ),
).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenNthCalledWith()).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveBeenNthCalledWith(2)).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenNthCalledWith(1, 'value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenNthCalledWith(1, 'value', 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(a: string, b: number) => void>()).toHaveBeenNthCalledWith(
    1,
    jestExpect.stringContaining('value'),
    123,
  ),
).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenNthCalledWith()).type.toRaiseError();

expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenNthCalledWith(1),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenNthCalledWith(1, 123),
).type.toRaiseError();

expect(jestExpect(() => {}).toHaveBeenNthCalledWith(1)).type.toBe<void>();
expect(
  jestExpect(() => {}).toHaveBeenNthCalledWith(1, 123),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenNthCalledWith(1),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenNthCalledWith(1, 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenNthCalledWith(
    1,
    'value',
  ),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenNthCalledWith(1, 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenNthCalledWith(1),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenNthCalledWith(
    1,
    'value',
  ),
).type.toRaiseError();

expect(
  jestExpect((n: number) => {}).toHaveBeenNthCalledWith(1, 123),
).type.toBe<void>();
expect(
  jestExpect((n: number) => {}).toHaveBeenNthCalledWith(
    1,
    jestExpect.any(Number),
  ),
).type.toBe<void>();
expect(
  jestExpect((n: number) => {}).toHaveBeenNthCalledWith(1),
).type.toRaiseError();
expect(
  jestExpect((n: number) => {}).toHaveBeenNthCalledWith(1, 'value'),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    'value',
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenNthCalledWith(1),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenNthCalledWith(1, 123),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    123,
    'value',
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    123,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    123,
    123,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenNthCalledWith(
    1,
    'value',
    123,
  ),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 123, 'value'),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 123),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 'value'),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 'value', 'value'),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 'value', 123),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenNthCalledWith(1, 123, 123),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(1),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(1, 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(
    1,
    123,
    'value',
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(
    1,
    123,
    true,
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(1, 123, 123),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(1, 'value'),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(1, true),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(
    1,
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenNthCalledWith(
    1,
    true,
    false,
  ),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [
    jestExpect.any(String),
    jestExpect.any(String),
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), jestExpect.any(Array)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), []),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [jestExpect.any(String)]),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [
    jestExpect.any(String),
    123,
  ]),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), {
    foo: jestExpect.any(String),
  }),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), jestExpect.any(Object)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date)),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), {
    bar: jestExpect.any(String),
  }),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), {
    bar: jestExpect.any(String),
    foo: jestExpect.any(String),
  }),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [
    jestExpect.any(String),
    [jestExpect.any(String)],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [
    'value',
    [jestExpect.any(String)],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), [
    jestExpect.any(String),
    ['value'],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenNthCalledWith(1, jestExpect.any(Date), ['value', ['value']]),
).type.toBe<void>();
