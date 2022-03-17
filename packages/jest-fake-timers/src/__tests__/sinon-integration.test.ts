/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {withGlobal} from '@sinonjs/fake-timers';
import {makeProjectConfig} from '@jest/test-utils';
import FakeTimers from '../modernFakeTimers';

const mockInstall = jest.fn();

const mockWithGlobal = {
  install: mockInstall,
  timers: {
    Date,
    clearImmediate,
    clearInterval,
    clearTimeout,
    hrtime: process.hrtime,
    nextTick: process.nextTick,
    performance,
    queueMicrotask,
    setImmediate,
    setInterval,
    setTimeout,
  },
};

jest.mock('@sinonjs/fake-timers', () => {
  return {
    withGlobal: jest.fn(() => mockWithGlobal),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('`@sinonjs/fake-timers` integration', () => {
  test('passes `globalThis` to `withGlobal()` method', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig(),
      global: globalThis,
    });

    expect(withGlobal).toBeCalledWith(globalThis);
  });

  test('passes default options to `install()` method', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig(),
      global: globalThis,
    });

    timers.useFakeTimers();

    expect(mockInstall).toBeCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: undefined,
      now: Date.now(),
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('passes `projectConfig.fakeTimers` to `install()` method', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig({
        fakeTimers: {
          advanceTimers: true,
          doNotFake: ['nextTick', 'performance'],
          now: 0,
          timerLimit: 100,
        },
      }),
      global: globalThis,
    });

    timers.useFakeTimers();

    expect(mockInstall).toBeCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 100,
      now: 0,
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'queueMicrotask',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('passes `fakeTimersConfig` to `install()` method', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig(),
      global: globalThis,
    });

    timers.useFakeTimers({
      advanceTimers: 40,
      doNotFake: ['Date', 'queueMicrotask'],
      now: new Date('1995-12-17'),
      timerLimit: 2000,
    });

    expect(mockInstall).toBeCalledWith({
      advanceTimeDelta: 40,
      loopLimit: 2000,
      now: new Date('1995-12-17'),
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: [
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'nextTick',
        'performance',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('overrides `projectConfig.fakeTimers` if `fakeTimersConfig` is passed', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig({
        fakeTimers: {
          advanceTimers: 20,
          doNotFake: ['Date', 'nextTick', 'performance'],
          now: 0,
          timerLimit: 1000,
        },
      }),
      global: globalThis,
    });

    const now = Date.now();

    timers.useFakeTimers({
      advanceTimers: false,
      doNotFake: ['hrtime'],
      now,
      timerLimit: 5000,
    });

    expect(mockInstall).toBeCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 5000,
      now,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'nextTick',
        'performance',
        'queueMicrotask',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });
});
