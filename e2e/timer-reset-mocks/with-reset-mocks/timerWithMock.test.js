// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

describe('timers', () => {
  it('should work before calling resetAllMocks', () => {
    const f = jest.fn();
    jest.useFakeTimers();
    setTimeout(f, 0);
    jest.runAllTimers();
    expect(f).toHaveBeenCalledTimes(1);
  });
});
