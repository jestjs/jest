/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const DATE = new Date('2026-01-01T00:00:00Z');
const EPOCH_MS = DATE.getTime();
const ISO = DATE.toISOString();

describe('Temporal support in fake timers', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('useFakeTimers({now}) accepts Temporal.Instant', () => {
    jest.useFakeTimers({now: Temporal.Instant.from(ISO)});
    expect(Date.now()).toBe(EPOCH_MS);
  });

  test('useFakeTimers({now}) accepts Temporal.ZonedDateTime', () => {
    const zdt = Temporal.Instant.from(ISO).toZonedDateTimeISO('UTC');
    jest.useFakeTimers({now: zdt});
    expect(Date.now()).toBe(EPOCH_MS);
  });

  test('setSystemTime accepts Temporal.Instant', () => {
    jest.useFakeTimers();
    jest.setSystemTime(Temporal.Instant.from(ISO));
    expect(Date.now()).toBe(EPOCH_MS);
  });

  test('setSystemTime accepts Temporal.ZonedDateTime', () => {
    jest.useFakeTimers();
    const zdt = Temporal.Instant.from(ISO).toZonedDateTimeISO('UTC');
    jest.setSystemTime(zdt);
    expect(Date.now()).toBe(EPOCH_MS);
  });

  test('advanceTimersByTime accepts Temporal.Duration', () => {
    jest.useFakeTimers({now: EPOCH_MS});
    jest.advanceTimersByTime(Temporal.Duration.from({hours: 1}));
    expect(Date.now()).toBe(EPOCH_MS + 3_600_000);
  });

  test('advanceTimersByTimeAsync accepts Temporal.Duration', async () => {
    jest.useFakeTimers({now: EPOCH_MS});
    await jest.advanceTimersByTimeAsync(Temporal.Duration.from({minutes: 30}));
    expect(Date.now()).toBe(EPOCH_MS + 1_800_000);
  });
});
