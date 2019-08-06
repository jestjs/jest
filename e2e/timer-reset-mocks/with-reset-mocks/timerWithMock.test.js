/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('timers', () => {
  it('should work before calling resetAllMocks', () => {
    const f = jest.fn();
    jest.useFakeTimers();
    setImmediate(() => f());
    jest.runAllImmediates();
    expect(f.mock.calls.length).toBe(1);
  });
});
