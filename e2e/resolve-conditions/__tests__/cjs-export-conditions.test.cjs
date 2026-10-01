/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {basename} = require('node:path');

const expected = globalThis.EXPORT_CONDITIONS_EXPECTED ?? {
  addon: 'node',
  branch: 'node',
  fallback: 'node',
};

test.each([
  ['fake-conditional-cjs', expected.branch],
  ['fake-conditional-cjs/node-default', expected.fallback],
  ['fake-conditional-cjs/node-addons', expected.addon],
])('require(%s) honors environment conditions', (name, branch) => {
  expect(require(name)).toBe(branch);
});

test.each([
  ['fake-conditional-cjs', expected.branch],
  ['fake-conditional-cjs/node-default', expected.fallback],
  ['fake-conditional-cjs/node-addons', expected.addon],
])('require.resolve(%s) honors environment conditions', (name, branch) => {
  expect(basename(require.resolve(name))).toBe(`${branch}.cjs`);
});

test('dynamic import honors the same environment conditions', async () => {
  expect((await import('fake-conditional-cjs')).default).toBe(expected.branch);
});

test('built-in modules remain available', () => {
  expect(typeof require('node:fs').readFileSync).toBe('function');
});
