/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { makeEmptyAggregatedTestResult } from '@jest/test-result';
import getSummary from '../getSummary';

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
      showSeed: true,
      seed: 55555,
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
})
