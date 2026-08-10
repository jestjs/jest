/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig} from '@jest/test-utils';
import getWatermarks from '../getWatermarks';

describe('getWatermarks', () => {
  test('that watermarks use thresholds as upper target', () => {
    const watermarks = getWatermarks(
      makeGlobalConfig({
        coverageThreshold: {
          global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
          },
        },
      }),
    );

    expect(watermarks).toEqual({
      branches: [expect.any(Number), 100],
      functions: [expect.any(Number), 100],
      lines: [expect.any(Number), 100],
      statements: [expect.any(Number), 100],
    });
  });

  test('that watermarks are created always created', () => {
    const watermarks = getWatermarks(makeGlobalConfig());

    expect(watermarks).toEqual({
      branches: [expect.any(Number), expect.any(Number)],
      functions: [expect.any(Number), expect.any(Number)],
      lines: [expect.any(Number), expect.any(Number)],
      statements: [expect.any(Number), expect.any(Number)],
    });
  });
});
