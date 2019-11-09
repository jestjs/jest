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
    setTimeout(f, 0);
    jest.runAllTimers();
    expect(f).toHaveBeenCalledTimes(1);
  });
});
