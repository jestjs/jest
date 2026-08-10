/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import greet, {helper} from '../babel-style-default.cjs';
import plainDefault, {multiply, value} from '../plain-cjs.cjs';
import fnDefault, {
  helper as fnHelper,
  splitCookiesString,
} from '../fn-exports.cjs';
import {getCount as countA, increment as incA} from '../importer-a.mjs';
import {getCount as countB, increment as incB} from '../importer-b.mjs';

// ── __esModule interop ────────────────────────────────────────────────────────

test('default import of __esModule CJS is the whole module.exports (Node-aligned)', () => {
  // default is the whole module.exports, matching Node's native CJS-from-ESM behavior.
  expect(typeof greet).toBe('object');
  expect(greet.default('World')).toBe('Hello, World!');
});

test('named imports of __esModule CJS work alongside default', () => {
  expect(helper(7)).toBe(14);
});

test('__esModule key is exposed as a named export, matching Node behavior', async () => {
  const ns = await import('../babel-style-default.cjs');
  expect(ns.__esModule).toBe(true);
});

// ── plain CJS (no __esModule flag) ───────────────────────────────────────────

test('default import of plain CJS is the whole module.exports object', () => {
  expect(plainDefault).toEqual({multiply: expect.any(Function), value: 99});
});

test('named imports from plain CJS work', () => {
  expect(value).toBe(99);
  expect(multiply(6, 7)).toBe(42);
});

// ── CJS with function module.exports ─────────────────────────────────────────

test('default import of function-export CJS is the function itself', () => {
  expect(typeof fnDefault).toBe('function');
  expect(fnDefault('x')).toEqual({input: 'x'});
});

test('named imports from function-export CJS work', () => {
  expect(splitCookiesString('a,b')).toEqual(['a', 'b']);
  expect(fnHelper(21)).toBe(42);
});

// ── CJS-as-ESM caching (singleton) ───────────────────────────────────────────

test('two ESM importers of the same CJS module share one singleton instance', () => {
  // importer-a and importer-b both re-export singleton-state.cjs.
  // If the CJS module is cached, mutations are visible across importers.
  incA();
  incA();
  incB(); // operates on the same underlying CJS export object
  expect(countA()).toBe(3);
  expect(countB()).toBe(3);
});
