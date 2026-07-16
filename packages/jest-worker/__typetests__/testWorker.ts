/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function runTest(a: string, b: boolean): void {}
export async function runTestAsync(c: number, d: number): Promise<void> {}

export function doSomething(): void {}
export async function doSomethingAsync(): Promise<void> {}

function getResult(): string {
  return 'result';
}
export const isResult = true;

// reserved keys should be excluded from returned type

export function end(): void {}
export function getStderr(): string {
  return 'get-err';
}
export function getStdout(): string {
  return 'get-out';
}
export function setup(): void {}
export function teardown(): void {}
