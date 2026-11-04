/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeProjectConfig} from '@jest/test-utils';
import FakeTimers from '../modernFakeTimers';

const createTimers = (config = makeProjectConfig()) => {
  const global = {
    Date,
    Promise,
    clearImmediate,
    clearInterval,
    clearTimeout,
    process,
    setImmediate,
    setInterval,
    setTimeout,
  } as unknown as typeof globalThis;

  return new FakeTimers({config, global});
};

describe('timersPromises', () => {
  let timers: FakeTimers;

  beforeEach(() => {
    timers = createTimers();
  });

  afterEach(() => {
    timers.dispose();
  });

  it('is shaped like the real module', () => {
    const {setImmediate, setInterval, setTimeout} = timers.timersPromises;

    expect(Object.keys(timers.timersPromises).sort()).toEqual([
      'scheduler',
      'setImmediate',
      'setInterval',
      'setTimeout',
    ]);
    expect([
      setTimeout.length,
      setImmediate.length,
      setInterval.length,
    ]).toEqual([2, 1, 2]);
    expect(typeof timers.timersPromises.scheduler.wait).toBe('function');
    expect(timers.timersPromises.scheduler.wait).toHaveLength(2);
    expect(timers.timersPromises.scheduler.yield).toHaveLength(0);
  });

  it('always hands out the same module', () => {
    expect(timers.timersPromises).toBe(timers.timersPromises);
    timers.useFakeTimers();
    expect(timers.timersPromises).toBe(timers.timersPromises);
  });

  it('resolves from the fake clock once fake timers are installed', async () => {
    timers.useFakeTimers();

    const promise = timers.timersPromises.setTimeout(1000, 'value');

    expect(timers.getTimerCount()).toBe(1);

    await timers.advanceTimersByTimeAsync(999);
    expect(timers.getTimerCount()).toBe(1);

    await timers.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toBe('value');
    expect(timers.getTimerCount()).toBe(0);
  });

  it('resolves setImmediate from the fake clock', async () => {
    timers.useFakeTimers();

    const promise = timers.timersPromises.setImmediate('value');

    expect(timers.getTimerCount()).toBe(1);

    await timers.runAllTimersAsync();
    await expect(promise).resolves.toBe('value');
    expect(timers.getTimerCount()).toBe(0);
  });

  it('keeps a `ref: false` timer on the fake clock', async () => {
    timers.useFakeTimers();

    const promise = timers.timersPromises.setTimeout(1000, 'value', {
      ref: false,
    });

    expect(timers.getTimerCount()).toBe(1);

    await timers.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBe('value');
  });

  it('rejects an already aborted signal without scheduling a timer', async () => {
    timers.useFakeTimers();

    const promise = timers.timersPromises.setTimeout(1000, 'value', {
      signal: AbortSignal.abort(),
    });

    expect(timers.getTimerCount()).toBe(0);
    await expect(promise).rejects.toMatchObject({
      code: 'ABORT_ERR',
      message: 'The operation was aborted',
      name: 'AbortError',
    });
  });

  it('clears the timer and rejects when the signal is aborted', async () => {
    timers.useFakeTimers();

    const controller = new AbortController();
    const promise = timers.timersPromises.setTimeout(1000, 'value', {
      signal: controller.signal,
    });

    expect(timers.getTimerCount()).toBe(1);

    controller.abort();

    expect(timers.getTimerCount()).toBe(0);
    await expect(promise).rejects.toMatchObject({name: 'AbortError'});
  });

  it('yields interval ticks on the fake clock', async () => {
    timers.useFakeTimers();

    const iterator = timers.timersPromises.setInterval(100, 'tick');

    expect(timers.getTimerCount()).toBe(1);

    const firstTick = iterator.next();
    await timers.advanceTimersByTimeAsync(100);
    await expect(firstTick).resolves.toEqual({done: false, value: 'tick'});

    const secondTick = iterator.next();
    await timers.advanceTimersByTimeAsync(100);
    await expect(secondTick).resolves.toEqual({done: false, value: 'tick'});

    await iterator.return();
    expect(timers.getTimerCount()).toBe(0);

    await timers.advanceTimersByTimeAsync(100);
    expect(timers.getTimerCount()).toBe(0);
  });

  it('drops interval ticks that nobody is waiting for', async () => {
    timers.useFakeTimers();

    const iterator = timers.timersPromises.setInterval(100, 'tick');

    // Ticks that happen while no `next()` call is pending are dropped.
    await timers.advanceTimersByTimeAsync(200);

    let resolutions = 0;
    const tick = iterator.next().then(result => {
      resolutions++;
      return result;
    });

    await timers.advanceTimersByTimeAsync(50);
    await Promise.resolve();
    expect(resolutions).toBe(0);

    await timers.advanceTimersByTimeAsync(50);
    await expect(tick).resolves.toEqual({done: false, value: 'tick'});

    await iterator.return();
  });

  it('stops an interval and rejects the pending tick when aborted', async () => {
    timers.useFakeTimers();

    const controller = new AbortController();
    const iterator = timers.timersPromises.setInterval(100, 'tick', {
      signal: controller.signal,
    });

    const tick = iterator.next();
    await timers.advanceTimersByTimeAsync(100);
    await expect(tick).resolves.toEqual({done: false, value: 'tick'});

    const pending = iterator.next();
    controller.abort();

    expect(timers.getTimerCount()).toBe(0);
    await expect(pending).rejects.toMatchObject({name: 'AbortError'});
  });

  it('drives `scheduler.wait` with the fake clock', async () => {
    timers.useFakeTimers();

    const promise = timers.timersPromises.scheduler.wait(1000);

    expect(timers.getTimerCount()).toBe(1);

    await timers.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('leaves the real module alone while fake timers are not installed', async () => {
    const started = Date.now();
    const promise = timers.timersPromises.setTimeout(50, 'value');

    expect(timers.timersPromises.setTimeout).not.toBe(setTimeout);

    await expect(promise).resolves.toBe('value');
    expect(Date.now() - started).toBeGreaterThanOrEqual(40);
  });

  it('goes back to the real module after `useRealTimers`', async () => {
    timers.useFakeTimers();
    expect(timers.timersPromises.setTimeout).not.toBe(setTimeout);

    timers.useRealTimers();

    const started = Date.now();
    await expect(timers.timersPromises.setTimeout(50, 'value')).resolves.toBe(
      'value',
    );
    expect(Date.now() - started).toBeGreaterThanOrEqual(40);
  });
});

describe('timersPromises with `doNotFake`', () => {
  it('falls back to the real API for APIs that are not faked', async () => {
    const timers = createTimers(
      makeProjectConfig({fakeTimers: {doNotFake: ['setTimeout']}}),
    );

    timers.useFakeTimers();

    const started = Date.now();
    const promise = timers.timersPromises.setTimeout(50, 'value');
    const immediate = timers.timersPromises.setImmediate('immediate');

    expect(timers.getTimerCount()).toBe(1);

    await timers.runAllTimersAsync();
    await expect(immediate).resolves.toBe('immediate');
    await expect(promise).resolves.toBe('value');
    expect(Date.now() - started).toBeGreaterThanOrEqual(40);

    timers.dispose();
  });
});
