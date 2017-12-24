// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

describe('timers', () => {
  it('should work before calling resetAllMocks', () => {
    jest.useFakeTimers();
    const f = jest.fn();
    setTimeout(f, 0);
    jest.runAllTimers();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('should not break after calling resetAllMocks', () => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    const f = jest.fn();
    setTimeout(f, 0);
    jest.runAllTimers();
    expect(f).toHaveBeenCalledTimes(1);
  });
});
