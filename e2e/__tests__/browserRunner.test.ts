/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');

test('runs DOM tests in real browser', () => {
  const result = runJest(dir, ['dom.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs math tests in browser', () => {
  const result = runJest(dir, ['math.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs web API tests in browser', () => {
  const result = runJest(dir, ['web-apis.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs fake timers tests in browser', () => {
  const result = runJest(dir, ['timers.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs lifecycle hooks tests in browser', () => {
  const result = runJest(dir, ['lifecycle.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs parametric (it.each) tests in browser', () => {
  const result = runJest(dir, ['parametric.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs error stack trace tests in browser', () => {
  const result = runJest(dir, ['error-stacks.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs console forwarding tests in browser', () => {
  const result = runJest(dir, ['console-forwarding.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs userEvent tests in browser', () => {
  const result = runJest(dir, ['userEvent.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs viewport tests in browser', () => {
  const result = runJest(dir, ['viewport.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs dynamic module tests in browser', () => {
  const result = runJest(dir, ['dynamic-module.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs mocking tests in browser', () => {
  const result = runJest(dir, ['mocking.test.ts']);
  expect(result.exitCode).toBe(0);
});

test('runs screenshot tests in browser', () => {
  const result = runJest(dir, ['screenshot.test.ts']);
  expect(result.exitCode).toBe(0);
});
