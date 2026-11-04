/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Required *before* `jest.useFakeTimers()` is called: the module Jest hands
// out has to keep following whichever timers are installed at call time.
const timersPromises = require('node:timers/promises');

afterEach(() => {
  jest.useRealTimers();
});

test('setTimeout resolves when the fake clock advances', async () => {
  jest.useFakeTimers();

  let resolvedWith;
  const promise = timersPromises.setTimeout(1000, 'value').then(value => {
    resolvedWith = value;
  });

  expect(jest.getTimerCount()).toBe(1);

  await jest.advanceTimersByTimeAsync(500);
  expect(resolvedWith).toBeUndefined();

  await jest.advanceTimersByTimeAsync(500);
  expect(jest.getTimerCount()).toBe(0);
  await expect(promise).resolves.toBeUndefined();
  expect(resolvedWith).toBe('value');
});

test('`timers/promises` and `node:timers/promises` are the same module', async () => {
  jest.useFakeTimers();

  expect(require('timers/promises')).toBe(timersPromises);

  const promise = require('timers/promises').setTimeout(1000, 'value');
  expect(jest.getTimerCount()).toBe(1);

  await jest.advanceTimersByTimeAsync(1000);
  await expect(promise).resolves.toBe('value');
});

test('setTimeout honours options and clears the timer on abort', async () => {
  jest.useFakeTimers();

  const refPromise = timersPromises.setTimeout(1000, 'value', {ref: false});
  expect(jest.getTimerCount()).toBe(1);
  await jest.advanceTimersByTimeAsync(1000);
  await expect(refPromise).resolves.toBe('value');

  const controller = new AbortController();
  const timeout = timersPromises.setTimeout(1000, 'value', {
    signal: controller.signal,
  });
  const tick = timersPromises
    .setInterval(1000, 'tick', {signal: controller.signal})
    .next();

  expect(jest.getTimerCount()).toBe(2);

  controller.abort();

  await expect(timeout).rejects.toMatchObject({
    code: 'ABORT_ERR',
    message: 'The operation was aborted',
    name: 'AbortError',
  });
  await expect(tick).rejects.toMatchObject({name: 'AbortError'});
  expect(jest.getTimerCount()).toBe(0);
});

test('setTimeout rejects immediately when the signal is already aborted', async () => {
  jest.useFakeTimers();

  await expect(
    timersPromises.setTimeout(1000, 'value', {signal: AbortSignal.abort()}),
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(jest.getTimerCount()).toBe(0);
});

test('setImmediate resolves with runAllTimersAsync', async () => {
  jest.useFakeTimers();

  const promise = timersPromises.setImmediate('immediate');

  expect(jest.getTimerCount()).toBe(1);

  await jest.runAllTimersAsync();
  await expect(promise).resolves.toBe('immediate');
  expect(jest.getTimerCount()).toBe(0);
});

test('setInterval produces one tick per fake interval', async () => {
  jest.useFakeTimers();

  const iterator = timersPromises.setInterval(100, 'tick');

  expect(jest.getTimerCount()).toBe(1);

  let pending = iterator.next();
  await jest.advanceTimersByTimeAsync(100);
  await expect(pending).resolves.toEqual({done: false, value: 'tick'});

  pending = iterator.next();
  await jest.advanceTimersByTimeAsync(100);
  await expect(pending).resolves.toEqual({done: false, value: 'tick'});

  // Returning from the iterator is the `clearInterval` of this API
  await iterator.return();
  expect(jest.getTimerCount()).toBe(0);

  await jest.advanceTimersByTimeAsync(100);
  expect(jest.getTimerCount()).toBe(0);
});

test('scheduler.wait resolves when the fake clock advances', async () => {
  jest.useFakeTimers();

  const promise = timersPromises.scheduler.wait(1000);

  expect(jest.getTimerCount()).toBe(1);

  await jest.advanceTimersByTimeAsync(1000);
  await expect(promise).resolves.toBeUndefined();
  expect(jest.getTimerCount()).toBe(0);
});

test('jest.requireActual hands out the real Node module', () => {
  jest.useFakeTimers();

  const actual = jest.requireActual('timers/promises');

  expect(actual).toBe(jest.requireActual('node:timers/promises'));
  expect(actual.setTimeout).not.toBe(timersPromises.setTimeout);
});

test('with real timers the module keeps its real timing', async () => {
  jest.useRealTimers();

  const started = Date.now();

  await expect(timersPromises.setTimeout(50, 'value')).resolves.toBe('value');
  expect(Date.now() - started).toBeGreaterThanOrEqual(40);
});
