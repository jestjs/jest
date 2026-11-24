/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

describe('ancestor beforeAll error', () => {
  beforeAll(() => {
    throw new Error('outer setup failed');
  });

  describe('inner retry', () => {
    jest.retryTimes(1, {entireDescribe: true});

    test('keeps an ancestor beforeAll error', () => {});
  });
});

describe('ancestor snapshot failure', () => {
  let invocations = 0;

  beforeAll(() => {
    expect('actual').toMatchInlineSnapshot('"expected"');
  });

  describe('inner retry', () => {
    jest.retryTimes(1, {entireDescribe: true});

    test('does not retry or duplicate an ancestor snapshot failure', () => {
      invocations += 1;
      expect(invocations).toBe(2);
    });
  });
});

describe('ancestor assertion failure', () => {
  let invocations = 0;

  beforeAll(() => {
    expect.assertions(2);
  });

  describe('inner retry', () => {
    jest.retryTimes(1, {entireDescribe: true});

    test('keeps an ancestor assertion failure', () => {
      invocations += 1;
      expect(invocations).toBe(2);
    });
  });
});
