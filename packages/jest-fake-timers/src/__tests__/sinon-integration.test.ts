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

jest.spyOn(Date, 'now').mockImplementation(() => 123456);

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
      now: 123456,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'nextTick',
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
          doNotFake: ['Date', 'nextTick'],
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
          doNotFake: ['Date', 'nextTick'],
          now: 0,
          timerLimit: 1000,
        },
      }),
      global: globalThis,
    });

    timers.useFakeTimers({
      advanceTimers: false,
      doNotFake: ['hrtime'],
      now: 123456,
      timerLimit: 5000,
    });

    expect(mockInstall).toBeCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 5000,
      now: 123456,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'nextTick',
        'queueMicrotask',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });
});
