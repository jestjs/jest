/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {jest, expect as jestExpect} from '@jest/globals';
import type {overloaded} from './toHaveBeenCalledWith.test';

expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith('value')).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith(123)).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenLastCalledWith(123, 'value'),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenLastCalledWith('value', 123),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(a: string, b: number) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.stringContaining('value'), 123),
).type.toBeVoid();

expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith()).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith('value')).type.toBeVoid();
expect(jestExpect(jest.fn()).toHaveBeenLastCalledWith(123)).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenLastCalledWith(123, 'value'),
).type.toBeVoid();
expect(
  jestExpect(jest.fn()).toHaveBeenLastCalledWith('value', 123),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(a: string, b: number) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.stringContaining('value'), 123),
).type.toBeVoid();

expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenLastCalledWith(),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenLastCalledWith(1),
).type.toRaiseError();

expect(jestExpect(() => {}).toHaveBeenLastCalledWith()).type.toBeVoid();
expect(jestExpect(() => {}).toHaveBeenLastCalledWith(123)).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenLastCalledWith(),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenLastCalledWith(123),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenLastCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenLastCalledWith(123),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenLastCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenLastCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect((n: number) => {}).toHaveBeenLastCalledWith(123),
).type.toBeVoid();
expect(
  jestExpect((n: number) => {}).toHaveBeenLastCalledWith(
    jestExpect.any(Number),
  ),
).type.toBeVoid();
expect(
  jestExpect((n: number) => {}).toHaveBeenLastCalledWith(),
).type.toRaiseError();
expect(
  jestExpect((n: number) => {}).toHaveBeenLastCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenLastCalledWith('value'),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenLastCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenLastCalledWith(123),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith(123, 'value'),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith(123),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith(123, 123),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith('value', 'value'),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s: string) => void>(),
  ).toHaveBeenLastCalledWith('value', 123),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith(123, 'value'),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith(123),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith('value'),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith('value', 'value'),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith('value', 123),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(n: number, s?: string) => void>(),
  ).toHaveBeenLastCalledWith(123, 123),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(123),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(
    123,
    'value',
  ),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(123, true),
).type.toBeVoid();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(123, 123),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith('value'),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(true),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenLastCalledWith(
    true,
    false,
  ),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    jestExpect.any(String),
  ]),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), jestExpect.any(Array)),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date)),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), []),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [jestExpect.any(String)]),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    123,
  ]),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), {
    foo: jestExpect.any(String),
  }),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), jestExpect.any(Object)),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date)),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), {
    bar: jestExpect.any(String),
  }),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), {
    bar: jestExpect.any(String),
    foo: jestExpect.any(String),
  }),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    [jestExpect.any(String)],
  ]),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [
    'value',
    [jestExpect.any(String)],
  ]),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    ['value'],
  ]),
).type.toBeVoid();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenLastCalledWith(jestExpect.any(Date), ['value', ['value']]),
).type.toBeVoid();
