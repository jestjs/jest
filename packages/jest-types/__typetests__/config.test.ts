/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import type {Config} from 'jest';

const config: Config = {};

describe('Config', () => {
  test('coverageThreshold', () => {
    expect(config).type.toBeAssignableWith({
      coverageThreshold: {
        './src/api/very-important-module.js': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
        './src/components/': {
          branches: 40,
          statements: 40,
        },
        './src/reducers/**/*.js': {
          statements: 90,
        },
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    });
  });

  test('fakeTimers', () => {
    const doNotFake = [
      'Date' as const,
      'hrtime' as const,
      'nextTick' as const,
      'performance' as const,
      'queueMicrotask' as const,
      'requestAnimationFrame' as const,
      'cancelAnimationFrame' as const,
      'requestIdleCallback' as const,
      'cancelIdleCallback' as const,
      'setImmediate' as const,
      'clearImmediate' as const,
      'setInterval' as const,
      'clearInterval' as const,
      'setTimeout' as const,
      'clearTimeout' as const,
    ];

    expect(config).type.toBeAssignableWith({
      fakeTimers: {
        advanceTimers: true,
        doNotFake,
        enableGlobally: true,
        now: 1_483_228_800_000,
        timerLimit: 1000,
      },
    });

    expect(config).type.toBeAssignableWith({
      fakeTimers: {
        advanceTimers: 40,
        now: Date.now(),
      },
    });

    expect(config).type.not.toBeAssignableWith({
      fakeTimers: {
        now: new Date(),
      },
    });

    expect(config).type.toBeAssignableWith({
      fakeTimers: {
        enableGlobally: true,
        legacyFakeTimers: true as const,
      },
    });

    expect(config).type.not.toBeAssignableWith({
      fakeTimers: {
        advanceTimers: true,
        legacyFakeTimers: true as const,
      },
    });

    expect(config).type.not.toBeAssignableWith({
      fakeTimers: {
        doNotFake,
        legacyFakeTimers: true as const,
      },
    });

    expect(config).type.not.toBeAssignableWith({
      fakeTimers: {
        legacyFakeTimers: true as const,
        now: 1_483_228_800_000,
      },
    });

    expect(config).type.not.toBeAssignableWith({
      fakeTimers: {
        legacyFakeTimers: true as const,
        timerLimit: 1000,
      },
    });
  });

  test('projects', () => {
    expect(config).type.toBeAssignableWith({
      projects: [
        // projects can be globs or objects
        './src/**',
        {
          displayName: 'A Project',
          rootDir: './src/components',
        },
      ],
    });
  });
});
