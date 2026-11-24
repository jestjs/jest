/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('outer retried describe', () => {
  jest.retryTimes(1, {entireDescribe: true});

  describe('nested describe', () => {
    beforeAll(() => {
      setTimeout(() => {
        Promise.reject(new Error('nested delayed hook rejection'));
      }, 10);
    });

    test('finishes before the delayed rejection', () => {});
  });

  test('keeps the outer attempt active', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
});
