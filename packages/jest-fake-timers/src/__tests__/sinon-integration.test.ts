/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {makeProjectConfig} from '@jest/test-utils';
import FakeTimers from '../modernFakeTimers';

jest.spyOn(Date, 'now').mockImplementation(() => 123_456);

const mockInstall = jest.fn();

const mockWithGlobal = {
  install: mockInstall,
  timers: {
    Date: jest.fn(),
    cancelAnimationFrame: jest.fn(),
    clearImmediate: jest.fn(),
    clearInterval: jest.fn(),
    clearTimeout: jest.fn(),
    hrtime: jest.fn(),
    nextTick: jest.fn(),
    performance: jest.fn(),
    queueMicrotask: jest.fn(),
    requestAnimationFrame: jest.fn(),
    setImmediate: jest.fn(),
    setInterval: jest.fn(),
    setTimeout: jest.fn(),
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
  test('uses default global config, when `useFakeTimers()` is called without options', () => {
    const timers = new FakeTimers({
      config: makeProjectConfig(),
      global: globalThis,
    });

    timers.useFakeTimers();

    expect(mockInstall).toHaveBeenCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 100_000,
      now: 123_456,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'cancelAnimationFrame',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('uses custom global config, when `useFakeTimers()` is called without options', () => {
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

    expect(mockInstall).toHaveBeenCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 100,
      now: 0,
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: [
        'cancelAnimationFrame',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('overrides default global config, when `useFakeTimers()` is called with options,', () => {
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

    expect(mockInstall).toHaveBeenCalledWith({
      advanceTimeDelta: 40,
      loopLimit: 2000,
      now: new Date('1995-12-17'),
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: [
        'cancelAnimationFrame',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'hrtime',
        'nextTick',
        'performance',
        'requestAnimationFrame',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });

  test('overrides custom global config, when `useFakeTimers()` is called with options,', () => {
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
      now: 123_456,
    });

    expect(mockInstall).toHaveBeenCalledWith({
      advanceTimeDelta: undefined,
      loopLimit: 1000,
      now: 123_456,
      shouldAdvanceTime: false,
      shouldClearNativeTimers: true,
      toFake: [
        'Date',
        'cancelAnimationFrame',
        'clearImmediate',
        'clearInterval',
        'clearTimeout',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'setImmediate',
        'setInterval',
        'setTimeout',
      ],
    });
  });
});
