/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ModuleMocker} from '../';

describe('whenCalledWith', () => {
  let moduleMocker: ModuleMocker;

  beforeEach(() => {
    moduleMocker = new ModuleMocker(globalThis);
  });

  it('returns the configured value for a matching literal arg', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('foo').mockReturnValue('bar');
    expect(fn('foo')).toBe('bar');
  });

  it('returns undefined for a non-matching call when no base impl is set', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('foo').mockReturnValue('bar');
    expect(fn('other')).toBeUndefined();
  });

  it('falls through to the base mockReturnValue for non-matching calls', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    fn.whenCalledWith('foo').mockReturnValue('bar');
    expect(fn('foo')).toBe('bar');
    expect(fn('other')).toBe('default');
  });

  it('routes to the correct sub-mock when multiple matchers are registered', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('a').mockReturnValue(1);
    fn.whenCalledWith('b').mockReturnValue(2);
    fn.whenCalledWith('c').mockReturnValue(3);
    expect(fn('a')).toBe(1);
    expect(fn('b')).toBe(2);
    expect(fn('c')).toBe(3);
    expect(fn('z')).toBeUndefined();
  });

  it('matches asymmetric matchers via equals', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(expect.any(Number)).mockReturnValue('numeric');
    expect(fn(42)).toBe('numeric');
    expect(fn(0)).toBe('numeric');
    expect(fn('not-a-number')).toBeUndefined();
  });

  it('mockReturnValueOnce on the sub-mock returns the value exactly once', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('foo').mockReturnValueOnce('once');
    expect(fn('foo')).toBe('once');
    expect(fn('foo')).toBeUndefined();
  });

  it('passes matched call args to mockImplementation on the sub-mock', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(
      expect.any(Number),
      expect.any(Number),
    ).mockImplementation((a: number, b: number) => a + b);
    expect(fn(2, 3)).toBe(5);
    expect(fn(10, 20)).toBe(30);
  });

  it('queues stacked mockReturnValueOnce calls in registration order', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    fn.whenCalledWith('x')
      .mockReturnValueOnce('A')
      .mockReturnValueOnce('B')
      .mockReturnValueOnce('C');
    expect(fn('x')).toBe('A');
    expect(fn('x')).toBe('B');
    expect(fn('x')).toBe('C');
    expect(fn('x')).toBe('default');
  });

  it('falls through to the base mock once a sub-mock is drained', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    fn.whenCalledWith('foo').mockReturnValueOnce('once');
    expect(fn('foo')).toBe('once');
    expect(fn('foo')).toBe('default');
  });

  it('merges repeat registrations on the same matchers (once-then-persistent)', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValueOnce('A');
    fn.whenCalledWith('x').mockReturnValue('B');
    expect(fn('x')).toBe('A');
    expect(fn('x')).toBe('B');
    expect(fn('x')).toBe('B');
  });

  it('does not clear whenCalledWith registrations on mockClear', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('match').mockReturnValue('matched');
    expect(fn('match')).toBe('matched');
    fn.mockClear();
    expect(fn.mock.calls).toEqual([]);
    expect(fn('match')).toBe('matched');
  });

  it('clears all whenCalledWith registrations on mockReset', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('a').mockReturnValue(1);
    fn.whenCalledWith('b').mockReturnValue(2);
    fn.mockReset();
    expect(fn('a')).toBeUndefined();
    expect(fn('b')).toBeUndefined();
  });

  it('mockReset on a sub-mock resets only that branch, not siblings or base', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    const aBranch = fn.whenCalledWith('a').mockReturnValue('A');
    fn.whenCalledWith('b').mockReturnValue('B');
    aBranch.mockReset();
    expect(fn('a')).toBe('default');
    expect(fn('b')).toBe('B');
    expect(fn('other')).toBe('default');
  });

  it('preserves the calling `this` for matched calls', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('hi').mockImplementation(function (this: unknown) {
      return this;
    });
    const ctx = {tag: 'ctx'};
    expect(fn.call(ctx, 'hi')).toBe(ctx);
  });

  it('records every call on fn.mock.calls regardless of branch', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    fn.whenCalledWith('match').mockReturnValue('matched');
    fn('match');
    fn('miss');
    fn('match', 'extra');
    expect(fn.mock.calls).toEqual([['match'], ['miss'], ['match', 'extra']]);
    expect(fn.mock.results.map(r => r.value)).toEqual([
      'matched',
      'default',
      'default',
    ]);
  });

  it('preserves the calling `this` for non-matched calls', () => {
    const fn = moduleMocker.fn();
    fn.mockImplementation(function (this: unknown) {
      return this;
    });
    fn.whenCalledWith('match').mockReturnValue('matched');
    const ctx = {tag: 'ctx'};
    expect(fn.call(ctx, 'no-match')).toBe(ctx);
  });

  it('supports mockResolvedValue and mockRejectedValue on the sub-mock', async () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('ok').mockResolvedValue('resolved');
    fn.whenCalledWith('boom').mockRejectedValue(new Error('rejected'));
    await expect(fn('ok')).resolves.toBe('resolved');
    await expect(fn('boom')).rejects.toThrow('rejected');
  });

  it('treats whenCalledWith with different arity as separate registrations', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('a').mockReturnValue('1-arg');
    fn.whenCalledWith('a', 'b').mockReturnValue('2-arg');
    expect(fn('a')).toBe('1-arg');
    expect(fn('a', 'b')).toBe('2-arg');
  });

  it('honors withImplementation scope around whenCalledWith routing', () => {
    const fn = moduleMocker.fn();
    fn.mockReturnValue('default');
    fn.whenCalledWith('match').mockReturnValue('matched');
    expect(fn('match')).toBe('matched');
    expect(fn('miss')).toBe('default');

    fn.withImplementation(
      () => 'temp',
      () => {
        expect(fn('match')).toBe('temp');
        expect(fn('miss')).toBe('temp');
      },
    );

    expect(fn('match')).toBe('matched');
    expect(fn('miss')).toBe('default');
  });

  it('matches null and symbol args by identity', () => {
    const fn = moduleMocker.fn();
    const sym = Symbol('s');
    fn.whenCalledWith(null).mockReturnValue('null');
    fn.whenCalledWith(sym).mockReturnValue('sym');
    expect(fn(null)).toBe('null');
    expect(fn(sym)).toBe('sym');
    expect(fn(Symbol('s'))).toBeUndefined();
  });

  it('does not match when the call has fewer args than the matcher list', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(1, 2).mockReturnValue('matched');
    expect(fn(1)).toBeUndefined();
    expect(fn(1, 2)).toBe('matched');
    expect(fn(1, 2, 3)).toBeUndefined();
  });

  it('matches calls with trailing undefined args (toHaveBeenCalledWith parity)', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(1).mockReturnValue('matched');
    expect(fn(1, undefined)).toBe('matched');
    expect(fn(1, 2)).toBeUndefined();
  });

  it('works on spies and falls through to the original on non-match', () => {
    const target = {
      greet(name: string) {
        return `hello ${name}`;
      },
    };
    const spy = moduleMocker.spyOn(target, 'greet');
    spy.whenCalledWith('world').mockReturnValue('hi world');
    expect(target.greet('world')).toBe('hi world');
    expect(target.greet('jest')).toBe('hello jest');
    spy.mockRestore();
    expect(target.greet('world')).toBe('hello world');
  });
});
