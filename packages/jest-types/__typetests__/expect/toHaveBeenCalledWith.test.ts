/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {jest, expect as jestExpect} from '@jest/globals';

export function overloaded(): void;
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function overloaded(n: number): void;
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function overloaded(n: number, s: string): void;
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function overloaded(n: number, b: boolean): void;
export function overloaded(n?: number, sOrB?: string | boolean): void {
  // noop
}

expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(jestExpect.anything()),
).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(jestExpect.anything(true)),
).type.toRaiseError();

expect(jestExpect(jest.fn()).toHaveBeenCalledWith()).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith(123)).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith('value')).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(123, 'value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith('value', 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(a: string, b: number) => void>()).toHaveBeenCalledWith(
    jestExpect.stringContaining('value'),
    123,
  ),
).type.toBe<void>();

expect(jestExpect(jest.fn()).toHaveBeenCalledWith()).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith(123)).type.toBe<void>();
expect(jestExpect(jest.fn()).toHaveBeenCalledWith('value')).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith(123, 'value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn()).toHaveBeenCalledWith('value', 123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(a: string, b: number) => void>()).toHaveBeenCalledWith(
    jestExpect.stringContaining('value'),
    123,
  ),
).type.toBe<void>();

expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenCalledWith(),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<() => void>()).toHaveBeenCalledWith(123),
).type.toRaiseError();

expect(jestExpect(() => {}).toHaveBeenCalledWith()).type.toBe<void>();
expect(jestExpect(() => {}).toHaveBeenCalledWith(123)).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenCalledWith(),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenCalledWith(123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n?: number) => void>()).toHaveBeenCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenCalledWith(123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number) => void>()).toHaveBeenCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect((n: number) => {}).toHaveBeenCalledWith(123),
).type.toBe<void>();
expect(
  jestExpect((n: number) => {}).toHaveBeenCalledWith(jestExpect.any(Number)),
).type.toBe<void>();
expect(
  jestExpect((n: number) => {}).toHaveBeenCalledWith(),
).type.toRaiseError();
expect(
  jestExpect((n: number) => {}).toHaveBeenCalledWith('value'),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenCalledWith('value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(s: string) => void>()).toHaveBeenCalledWith(123),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(
    123,
    'value',
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(
    123,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(
    123,
    123,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s: string) => void>()).toHaveBeenCalledWith(
    'value',
    123,
  ),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    123,
    'value',
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    123,
  ),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    'value',
    123,
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<(n: number, s?: string) => void>()).toHaveBeenCalledWith(
    123,
    123,
  ),
).type.toRaiseError();

expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(123),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(123, 'value'),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(123, true),
).type.toBe<void>();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(123, 123),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith('value'),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(true),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(
    'value',
    'value',
  ),
).type.toRaiseError();
expect(
  jestExpect(jest.fn<typeof overloaded>()).toHaveBeenCalledWith(true, false),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    jestExpect.any(String),
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), jestExpect.any(Array)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), []),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [jestExpect.any(String)]),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name?: [string, string]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [jestExpect.any(String), 123]),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), {foo: jestExpect.any(String)}),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), jestExpect.any(Object)),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date)),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), {bar: jestExpect.any(String)}),
).type.toRaiseError();
expect(
  jestExpect(
    jest.fn<(date: Date, name: {foo: string}) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), {
    bar: jestExpect.any(String),
    foo: jestExpect.any(String),
  }),
).type.toRaiseError();

expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    [jestExpect.any(String)],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [
    'value',
    [jestExpect.any(String)],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), [
    jestExpect.any(String),
    ['value'],
  ]),
).type.toBe<void>();
expect(
  jestExpect(
    jest.fn<(date: Date, name: [string, [string]]) => void>(),
  ).toHaveBeenCalledWith(jestExpect.any(Date), ['value', ['value']]),
).type.toBe<void>();
