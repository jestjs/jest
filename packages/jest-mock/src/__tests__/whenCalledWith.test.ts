/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createContext, runInNewContext} from 'vm';
import {ModuleMocker, spyOn} from '../';

describe('whenCalledWith', () => {
  let moduleMocker: ModuleMocker;

  beforeEach(() => {
    const mockContext = createContext();
    const mockGlobals = runInNewContext('this', mockContext);
    moduleMocker = new ModuleMocker(mockGlobals);
  });

  it('mocks specific args', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    fn.whenCalledWith('special input').mockReturnValue('special output');

    expect(fn('special input')).toBe('special output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');
  });

  it('works with several whens', () => {
    const fn = moduleMocker.fn();
    fn.mockImplementation(num => `${num}teen`);
    fn.whenCalledWith('one').mockReturnValue('eleven');
    fn.whenCalledWith('two').mockReturnValue('twelve');
    fn.whenCalledWith('three').mockReturnValue('thirteen');

    expect(fn('one')).toBe('eleven');
    expect(fn('two')).toBe('twelve');
    expect(fn('three')).toBe('thirteen');
    expect(fn('four')).toBe('fourteen');
  });

  it('works without a default implementation', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('special input').mockReturnValue('special output');

    expect(fn('arbitrary')).toBeUndefined();
    expect(fn('special input')).toBe('special output');
  });

  it('interacts correctly with withImplementation', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');

    fn.whenCalledWith('special input').mockReturnValue('special output');
    fn.withImplementation(
      () => 'extra special output',
      () => {
        expect(fn('special input')).toBe('extra special output');
        expect(fn('arbitrary')).toBe('extra special output');
      },
    );

    expect(fn('special input')).toBe('special output');
    expect(fn('arbitrary')).toBe('generic output');
  });

  it('supports withImplementation', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');

    fn.whenCalledWith('special input').withImplementation(
      () => 'special output',
      () => {
        expect(fn('special input')).toBe('special output');
        expect(fn('arbitrary')).toBe('generic output');
      },
    );

    expect(fn('arbitrary')).toBe('generic output');
    // Outside the withImplementation(), this is equivalent to just
    //  fn.whenCalledWith('special input')
    // which means you get a default mock that returns undefined,
    // rather than falling back to the generic output.
    expect(fn('special input')).toBeUndefined();
  });

  it('interacts correctly with mock*Once', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');

    fn.whenCalledWith('special input').mockReturnValue('special output');
    fn.mockReturnValueOnce('extra special output');

    expect(fn('special input')).toBe('extra special output');
    expect(fn('special input')).toBe('special output');
    expect(fn('arbitrary')).toBe('generic output');
  });

  it('supports mock*Once', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');

    fn.whenCalledWith('special input').mockReturnValueOnce('special output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');
    expect(fn('arbitrary')).toBe('generic output');
    // After the one-time mock is used, this is equivalent to just
    //  fn.whenCalledWith('special input')
    // which means you get a default mock that returns undefined,
    // rather than falling back to the generic output.
    expect(fn('special input')).toBeUndefined();
  });

  it('supports mock*Once with fallback', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');

    fn.whenCalledWith('special input')
      .mockReturnValue('special output')
      .mockReturnValueOnce('extra special output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('extra special output');
    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');
  });

  it('supports matchers', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('hello');
    fn.whenCalledWith(expect.any(String)).mockImplementation(
      v => `hello, ${v}`,
    );
    fn.whenCalledWith('hello', expect.any(String)).mockImplementation(
      (_, y) => `morning, ${y}`,
    );

    expect(fn(3)).toBe('hello');
    expect(fn('world')).toBe('hello, world');
    expect(fn('hello', 3)).toBe('hello');
    expect(fn('hello', 'friend')).toBe('morning, friend');
  });

  it('still tracks all calls on the root mock', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    fn.whenCalledWith('special input').mockReturnValue('special output');

    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');
    expect(fn).toHaveBeenNthCalledWith(1, 'arbitrary');
    expect(fn).toHaveBeenNthCalledWith(2, 'special input');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('supports spies', () => {
    class TestClass {
      public calls: Record<string, number> = {};
      increment(arg: string) {
        this.calls[arg] = (this.calls[arg] ?? 0) + 1;
        return this.calls[arg];
      }
    }

    const instance = new TestClass();
    const spy = spyOn(instance, 'increment');
    spy.whenCalledWith('hello').mockReturnValue(-3);

    expect(instance.increment('goodbye')).toBe(1);
    expect(instance.increment('goodbye')).toBe(2);
    expect(instance.increment('hello')).toBe(-3);
    expect(instance.increment('hello')).toBe(-3);
    expect(instance.increment('goodbye')).toBe(3);
  });

  it('gets removed by reset', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    fn.whenCalledWith('special input').mockReturnValue('special output');

    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');

    fn.mockReset();
    expect(fn('arbitrary')).toBeUndefined();
    expect(fn('special input')).toBeUndefined();
  });

  it('gets removed by resetAllMocks', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('generic output');
    fn.whenCalledWith('special input').mockReturnValue('special output');

    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('special output');

    moduleMocker.resetAllMocks();
    expect(fn('arbitrary')).toBeUndefined();
    expect(fn('special input')).toBeUndefined();
  });

  it('gets clobbered by other mocks', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('special input').mockReturnValue('special output');
    fn.mockReturnValue('generic output');

    expect(fn('arbitrary')).toBe('generic output');
    expect(fn('special input')).toBe('generic output');
  });

  it('gets superseded by other Once mocks, but only temporarily', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('special input').mockReturnValue('special output');
    fn.mockReturnValueOnce('generic output');

    expect(fn('special input')).toBe('generic output');
    expect(fn('special input')).toBe('special output');
    expect(fn('arbitrary')).toBeUndefined();
  });

  it('matches only the right number of arguments (or undefined)', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue(0);
    fn.whenCalledWith(1).mockReturnValue(1);
    fn.whenCalledWith(2, undefined).mockReturnValue(2);

    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    expect(fn(1, 1)).toBe(0); // extra arg doesn't match
    expect(fn(1, undefined)).toBe(1); // unless it's undefined
    expect(fn()).toBe(0); // missing arg doesn't match
    expect(fn(2)).toBe(2); // unless it's undefined
    expect(fn(2, undefined)).toBe(2);
  });
});
