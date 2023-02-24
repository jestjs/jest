/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readFileSync} from 'node:fs';
import {jest} from '@jest/globals';
// file origin: https://github.com/mdn/webassembly-examples/blob/2f2163287f86fe29deb162335bccca7d5d95ca4f/understanding-text-format/add.wasm
// source code: https://github.com/mdn/webassembly-examples/blob/2f2163287f86fe29deb162335bccca7d5d95ca4f/understanding-text-format/add.was
import {add} from '../add.wasm';

const wasmFileBuffer = readFileSync('add.wasm');

test('supports native wasm imports', () => {
  expect(add(1, 2)).toBe(3);

  // because arguments are i32 (signed), fractional part is truncated
  expect(add(0.99, 1.01)).toBe(1);

  // because return value is i32 (signed), (2^31 - 1) + 1 overflows and becomes -2^31
  expect(add(Math.pow(2, 31) - 1, 1)).toBe(-Math.pow(2, 31));

  // invalid or missing arguments are treated as 0
  expect(add('hello', 'world')).toBe(0);
  expect(add()).toBe(0);
  expect(add(null)).toBe(0);
  expect(add({}, [])).toBe(0);

  // redundant arguments are silently ignored
  expect(add(1, 2, 3)).toBe(3);
});

test('supports dynamic wasm imports', async () => {
  const {add: dynamicAdd} = await import('../add.wasm');
  expect(dynamicAdd(1, 2)).toBe(3);
});

test('supports imports from "data:application/wasm" URI with base64 encoding', async () => {
  const importedWasmModule = await import(
    `data:application/wasm;base64,${wasmFileBuffer.toString('base64')}`
  );
  expect(importedWasmModule.add(0, 42)).toBe(42);
});

test('imports from "data:application/wasm" URI without explicit encoding fail', async () => {
  await expect(() =>
    import(`data:application/wasm,${wasmFileBuffer.toString('base64')}`),
  ).rejects.toThrow('Missing data URI encoding');
});

test('imports from "data:application/wasm" URI with invalid encoding fail', async () => {
  await expect(() =>
    import('data:application/wasm;charset=utf-8,oops'),
  ).rejects.toThrow('Invalid data URI encoding: charset=utf-8');
});

test('supports wasm files that import js resources (wasm-bindgen)', async () => {
  globalThis.alert = jest.fn();

  const {greet} = await import('../wasm-bindgen/index.js');
  greet('World');

  expect(globalThis.alert).toHaveBeenCalledWith('Hello, World!');
});
