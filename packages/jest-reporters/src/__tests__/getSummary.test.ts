/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {makeEmptyAggregatedTestResult} from '@jest/test-result';
import getSummary from '../getSummary';

jest.useFakeTimers().setSystemTime(10);

describe('getSummary', () => {
  test('does not print seed value when showSeed is false', () => {
    const summary = getSummary(makeEmptyAggregatedTestResult(), {
      estimatedTime: 0,
      showSeed: false,
    });

    expect(summary).toMatchSnapshot();
  });

  test('does print seed value when showSeed is true', () => {
    const summary = getSummary(makeEmptyAggregatedTestResult(), {
      estimatedTime: 0,
      seed: 55555,
      showSeed: true,
    });

    expect(summary).toMatchSnapshot();
  });

  test('throws error is showSeed is true but seed is not present', () => {
    expect.assertions(1);

    try {
      getSummary(makeEmptyAggregatedTestResult(), {
        estimatedTime: 0,
        showSeed: true,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
