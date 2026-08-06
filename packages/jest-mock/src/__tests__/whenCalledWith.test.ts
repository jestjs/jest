/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Mock, ModuleMocker} from '../';

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
    fn.whenCalledWith({a: 42}).mockReturnValue(3);
    expect(fn('a')).toBe(1);
    expect(fn('b')).toBe(2);
    expect(fn({a: 42})).toBe(3);
    expect(fn({a: 43})).toBeUndefined();
  });

  it('matches asymmetric matchers via equals', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(expect.any(Number)).mockReturnValue('numeric');
    expect(fn(42)).toBe('numeric');
    expect(fn(0)).toBe('numeric');
    expect(fn('not-a-number')).toBeUndefined();
  });

  it('matches asymmetric matchers nested inside object args', () => {
    const fn = moduleMocker.fn();
    const matcher = {
      meta: {roles: expect.arrayContaining(['admin'])},
      user: expect.any(String),
    };

    fn.whenCalledWith(matcher).mockReturnValue('user');

    expect(fn({meta: {roles: ['admin', 'editor']}, user: 'alice'})).toBe(
      'user',
    );
    expect(fn({meta: {roles: ['admin']}, user: 123})).toBeUndefined();
    expect(fn({meta: {roles: ['editor']}, user: 'alice'})).toBeUndefined();
  });

  it('mockReturnValueOnce on the sub-mock returns the value exactly once', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('foo').mockReturnValueOnce('once');
    expect(fn('foo')).toBe('once');
    expect(fn('foo')).toBeUndefined();
  });

  it('passes matched call args to mockImplementation on the sub-mock', () => {
    const fn = moduleMocker.fn<(a: number, b: number) => number>();
    fn.whenCalledWith(
      expect.any(Number),
      expect.any(Number),
    ).mockImplementation((a, b) => a + b);
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

  it('drains a once registered after a persistent on the same literal', () => {
    const persistentFirst = moduleMocker.fn();
    persistentFirst.whenCalledWith('x').mockReturnValue('B');
    persistentFirst.whenCalledWith('x').mockReturnValueOnce('A');
    expect(persistentFirst('x')).toBe('A');
    expect(persistentFirst('x')).toBe('B');
    expect(persistentFirst('x')).toBe('B');

    const onceFirst = moduleMocker.fn();
    onceFirst.whenCalledWith('x').mockReturnValueOnce('A');
    onceFirst.whenCalledWith('x').mockReturnValue('B');
    expect(onceFirst('x')).toBe('A');
    expect(onceFirst('x')).toBe('B');
    expect(onceFirst('x')).toBe('B');
  });

  it('drains a once on a literal before a wildcard persistent (and vice versa)', () => {
    const persistentFirst = moduleMocker.fn();
    persistentFirst.whenCalledWith('x').mockReturnValue('B');
    persistentFirst.whenCalledWith(expect.any(String)).mockReturnValueOnce('A');
    expect(persistentFirst('x')).toBe('A');
    expect(persistentFirst('x')).toBe('B');
    expect(persistentFirst('x')).toBe('B');

    const persistentFirst2 = moduleMocker.fn();
    persistentFirst2.whenCalledWith('x').mockReturnValue('B');
    persistentFirst2
      .whenCalledWith(expect.any(String))
      .mockReturnValueOnce('A');
    expect(persistentFirst2('OTHER')).toBe('A');
    expect(persistentFirst2('x')).toBe('B');
    expect(persistentFirst2('x')).toBe('B');

    const onceFirst = moduleMocker.fn();
    onceFirst.whenCalledWith('x').mockReturnValueOnce('A');
    onceFirst.whenCalledWith(expect.any(String)).mockReturnValue('B');
    expect(onceFirst('x')).toBe('A');
    expect(onceFirst('x')).toBe('B');
    expect(onceFirst('x')).toBe('B');
  });

  it('drains a once on a wildcard before a literal persistent (and vice versa)', () => {
    const persistentFirst = moduleMocker.fn();
    persistentFirst.whenCalledWith(expect.any(String)).mockReturnValue('B');
    persistentFirst.whenCalledWith('x').mockReturnValueOnce('A');
    expect(persistentFirst('OTHER')).toBe('B');
    expect(persistentFirst('x')).toBe('A');
    expect(persistentFirst('x')).toBe('B');
    expect(persistentFirst('x')).toBe('B');

    const persistentFirst2 = moduleMocker.fn();
    persistentFirst2.whenCalledWith(expect.any(String)).mockReturnValue('B');
    persistentFirst2.whenCalledWith('x').mockReturnValueOnce('A');
    expect(persistentFirst2('OTHER')).toBe('B');
    expect(persistentFirst2('x')).toBe('A');
    expect(persistentFirst2('x')).toBe('B');
    expect(persistentFirst2('x')).toBe('B');

    const onceFirst = moduleMocker.fn();
    onceFirst.whenCalledWith(expect.any(String)).mockReturnValueOnce('A');
    onceFirst.whenCalledWith('x').mockReturnValue('B');
    expect(onceFirst('x')).toBe('A');
    expect(onceFirst('x')).toBe('B');
    expect(onceFirst('x')).toBe('B');

    const onceFirst2 = moduleMocker.fn();
    onceFirst2.whenCalledWith(expect.any(String)).mockReturnValueOnce('A');
    onceFirst2.whenCalledWith('x').mockReturnValue('B');
    expect(onceFirst2('OTHER')).toBe('A');
    expect(onceFirst2('x')).toBe('B');
    expect(onceFirst2('x')).toBe('B');
  });

  it('keeps the wildcard branch live for non-literal calls when literal was registered first', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('lit');
    fn.whenCalledWith(expect.any(String)).mockReturnValue('wild');
    expect(fn('y')).toBe('wild');
    expect(fn('z')).toBe('wild');
  });

  it('keeps the wildcard branch live for non-literal calls when literal was registered second', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(expect.any(String)).mockReturnValue('wild');
    fn.whenCalledWith('x').mockReturnValue('lit');
    expect(fn('y')).toBe('wild');
    expect(fn('z')).toBe('wild');
  });

  it('returns distinct sub-mock references for repeat literal whenCalledWith calls', () => {
    const fn = moduleMocker.fn();
    const first = fn.whenCalledWith('x');
    const second = fn.whenCalledWith('x');
    expect(first).not.toBe(second);
  });

  it('records overlapping calls only on the branch that actually fired', () => {
    const fn = moduleMocker.fn();
    const first = fn.whenCalledWith('x').mockReturnValue('A');
    const second = fn.whenCalledWith('x').mockReturnValue('B');
    fn('x');
    expect(second.mock.calls).toEqual([['x']]);
    expect(first.mock.calls).toEqual([]);
  });

  it('treats a second whenCalledWith on the same literal as an override', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('A');
    fn.whenCalledWith('x').mockReturnValue('B');
    expect(fn('x')).toBe('B');
  });

  it('lets a later literal override an earlier wildcard for matching calls', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(expect.any(String)).mockReturnValue('wild');
    fn.whenCalledWith('x').mockReturnValue('lit');
    expect(fn('x')).toBe('lit');
    expect(fn('y')).toBe('wild');
  });

  it('accumulates onces and a persistent on a saved sub-mock reference', () => {
    const fn = moduleMocker.fn();
    const branch = fn.whenCalledWith('x');
    branch.mockReturnValueOnce('once');
    branch.mockReturnValue('default');
    expect(fn('x')).toBe('once');
    expect(fn('x')).toBe('default');
    expect(fn('x')).toBe('default');
  });

  it('does not merge when the same asymmetric matcher reference is reused', () => {
    const fn = moduleMocker.fn();
    const matcher = expect.any(String);
    fn.whenCalledWith(matcher).mockReturnValueOnce('A');
    fn.whenCalledWith(matcher).mockReturnValue('B');
    expect(fn('foo')).toBe('A');
    expect(fn('foo')).toBe('B');
    expect(fn('foo')).toBe('B');
  });

  it('exhausts mockReturnValueOnce across overlapping matchers regardless of declaration order', () => {
    const persistentFirst = moduleMocker.fn();
    persistentFirst
      .whenCalledWith(expect.objectContaining({a: 1}))
      .mockReturnValue('persistent');
    persistentFirst
      .whenCalledWith(expect.objectContaining({b: 2}))
      .mockReturnValueOnce('once');
    expect(persistentFirst({a: 1, b: 2})).toBe('once');
    expect(persistentFirst({a: 1, b: 2})).toBe('persistent');
    expect(persistentFirst({a: 1, b: 2})).toBe('persistent');

    const onceFirst = moduleMocker.fn();
    onceFirst
      .whenCalledWith(expect.objectContaining({b: 2}))
      .mockReturnValueOnce('once');
    onceFirst
      .whenCalledWith(expect.objectContaining({a: 1}))
      .mockReturnValue('persistent');
    expect(onceFirst({a: 1, b: 2})).toBe('once');
    expect(onceFirst({a: 1, b: 2})).toBe('persistent');
    expect(onceFirst({a: 1, b: 2})).toBe('persistent');
  });

  it('drains queued onces in registration order across overlapping matchers', () => {
    const fn = moduleMocker.fn();
    // Two overlapping matchers, both with queued onces; the later registration
    // also sets the persistent fallback. A call matching both should drain
    // matcher A's queue (registered first) before touching matcher B's queue,
    // then fall through to the last-registered persistent.
    fn.whenCalledWith(expect.objectContaining({a: 1}))
      .mockReturnValueOnce('A1')
      .mockReturnValueOnce('A2');
    fn.whenCalledWith(expect.objectContaining({b: 2}))
      .mockReturnValueOnce('B1')
      .mockReturnValue('persistent');

    expect(fn({a: 1, b: 2})).toBe('A1');
    expect(fn({a: 1, b: 2})).toBe('A2');
    expect(fn({a: 1, b: 2})).toBe('B1');
    expect(fn({a: 1, b: 2})).toBe('persistent');
    expect(fn({a: 1, b: 2})).toBe('persistent');
  });

  it('getMockImplementation returns the user impl, not the internal dispatcher', () => {
    const fn = moduleMocker.fn();
    expect(fn.getMockImplementation()).toBeUndefined();

    fn.whenCalledWith('x').mockReturnValue('matched');
    expect(fn.getMockImplementation()).toBeUndefined();

    const userImpl = () => 'user';
    fn.mockImplementation(userImpl);
    fn.whenCalledWith('y').mockReturnValue('also-matched');
    expect(fn.getMockImplementation()).toBe(userImpl);
  });

  it('forwards `new fn(...)` to an arrow-fn fallback without throwing', () => {
    const fn = moduleMocker.fn<(name: string) => {built: string}>();
    fn.mockImplementation((name: string) => ({built: name}));
    fn.whenCalledWith('match').mockReturnValue({built: 'matched'});

    const made = new fn('non-match');
    expect(made).toEqual({built: 'non-match'});
  });

  it('falls through `new spy(...)` to the original method on a non-matching arg', () => {
    const target = {
      factory(name: string) {
        return {created: name};
      },
    };
    const spy = moduleMocker.spyOn(target, 'factory') as unknown as Mock<
      typeof target.factory
    >;
    spy.whenCalledWith('match').mockImplementation(name => ({created: name}));

    const made = new spy('non-match');
    expect(made).toEqual({created: 'non-match'});
  });

  it('a later mockReturnValue overrides the fall-through without disturbing branches', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.mockReturnValue('A');
    fn.mockReturnValue('B');
    expect(fn('x')).toBe('X');
    expect(fn('y')).toBe('B');
  });

  it('mockResolvedValue after whenCalledWith sets the fall-through value', async () => {
    const fn = moduleMocker.fn<(arg: string) => Promise<string>>();
    fn.whenCalledWith('x').mockResolvedValue('X');
    fn.mockResolvedValue('default');
    await expect(fn('x')).resolves.toBe('X');
    await expect(fn('y')).resolves.toBe('default');
  });

  it('mockReturnValue after whenCalledWith sets the fall-through value', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.mockReturnValue('default');
    expect(fn('x')).toBe('X');
    expect(fn('y')).toBe('default');
  });

  it('mockImplementation after whenCalledWith sets the fall-through, not the routing', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.whenCalledWith('y').mockReturnValue('Y');
    fn.mockImplementation(() => 'fallback');
    expect(fn('y')).toBe('Y');
    expect(fn('x')).toBe('X');
    expect(fn('bla')).toBe('fallback');
  });

  it('preserves prior registrations when a later mockImplementation re-arms the dispatcher', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.mockImplementation(() => 'fallback');
    fn.whenCalledWith('y').mockReturnValue('Y');
    expect(fn('x')).toBe('X');
    expect(fn('y')).toBe('Y');
    expect(fn('other')).toBe('fallback');
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

  it('resetAllMocks clears whenCalledWith registrations', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.mockReturnValue('default');
    expect(fn('x')).toBe('X');
    moduleMocker.resetAllMocks();
    expect(fn('x')).toBeUndefined();
    expect(fn('y')).toBeUndefined();
  });

  it('mockReset clears both whenCalledWith branches and the fall-through impl', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('x').mockReturnValue('X');
    fn.mockReturnValue('default');
    expect(fn('x')).toBe('X');
    expect(fn('y')).toBe('default');
    fn.mockReset();
    expect(fn('x')).toBeUndefined();
    expect(fn('y')).toBeUndefined();
    expect(fn.getMockImplementation()).toBeUndefined();
  });

  it('cascades mockReset to sub-mocks held by user references', () => {
    const fn = moduleMocker.fn();
    const branch = fn.whenCalledWith('a').mockReturnValue('A');
    expect(fn('a')).toBe('A');
    fn.mockReset();
    // After parent reset, the user's reference to the sub-mock should reflect
    // the reset state (no impl) rather than silently retain the prior impl.
    expect(branch.getMockImplementation()).toBeUndefined();
  });

  it('returns a fresh sub-mock from whenCalledWith after a parent mockReset', () => {
    const fn = moduleMocker.fn();
    const before = fn.whenCalledWith('a').mockReturnValue('A');
    fn.mockReset();
    const after = fn.whenCalledWith('a');
    expect(after).not.toBe(before);
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
    const fn = moduleMocker.fn<(arg: string) => Promise<string>>();
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

  it('parent-level mockImplementationOnce wins over whenCalledWith for one call', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('a').mockReturnValue('matched');
    fn.mockImplementationOnce(() => 'parent-once');
    expect(fn('a')).toBe('parent-once');
    // Once consumed, normal whenCalledWith routing resumes.
    expect(fn('a')).toBe('matched');
    expect(fn('a')).toBe('matched');
  });

  it('parent-level mockImplementationOnce queue drains across non-matching calls too', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith('a').mockReturnValue('matched');
    fn.mockImplementationOnce(() => 'one');
    fn.mockImplementationOnce(() => 'two');
    expect(fn('non-match')).toBe('one');
    expect(fn('a')).toBe('two');
    expect(fn('a')).toBe('matched');
  });

  it('routes constructor calls through the matching sub-mock', () => {
    const Ctor = moduleMocker.fn<(arg: string) => {kind: string}>();
    const sentinel = {kind: 'made-by-A'};
    Ctor.whenCalledWith('A').mockImplementation(() => sentinel);

    const made = new Ctor('A');
    expect(made).toBe(sentinel);
  });

  it("records constructor calls on the sub-mock's mock.instances", () => {
    const Ctor = moduleMocker.fn<(arg: string) => {kind: string}>();
    const branch = Ctor.whenCalledWith('A').mockImplementation(() => ({
      kind: 'made',
    }));

    const made = new Ctor('A');

    expect(made).toEqual({kind: 'made'});
    expect(branch.mock.instances).toHaveLength(1);
    expect(branch.mock.calls).toEqual([['A']]);
  });

  it('lets the withImplementation temp fn take precedence over existing branches', () => {
    const fn = moduleMocker.fn<(arg: string) => string>();
    fn.whenCalledWith('x').mockReturnValue('X');

    expect(fn('x')).toBe('X');

    fn.withImplementation(
      () => 'temp',
      () => {
        expect(fn('x')).toBe('temp');
      },
    );
  });

  it('reactivates branch routing after calling whenCalledWith inside withImplementation', () => {
    const fn = moduleMocker.fn<(arg: string) => string>();
    fn.whenCalledWith('x').mockReturnValue('X');

    fn.withImplementation(
      () => 'temp',
      () => {
        expect(fn('x')).toBe('temp');

        fn.whenCalledWith('y').mockReturnValue('Y');
        expect(fn('x')).toBe('X');
        expect(fn('y')).toBe('Y');
        expect(fn('z')).toBe('temp');
      },
    );
  });

  it('preserves existing and new branches after withImplementation', () => {
    const fn = moduleMocker.fn<(arg: string) => string>();
    fn.whenCalledWith('x').mockReturnValue('X');

    fn.withImplementation(
      () => 'temp',
      () => {
        fn.whenCalledWith('y').mockReturnValue('Y');
      },
    );

    expect(fn('x')).toBe('X');
    expect(fn('y')).toBe('Y');
  });

  it('discriminates Maps and Sets by content via iterableEquality', () => {
    const fn = moduleMocker.fn();
    fn.whenCalledWith(new Map([['a', 1]])).mockReturnValue('A');
    fn.whenCalledWith(new Map([['b', 2]])).mockReturnValue('B');
    expect(fn(new Map([['a', 1]]))).toBe('A');
    expect(fn(new Map([['b', 2]]))).toBe('B');
    expect(fn(new Map([['c', 3]]))).toBeUndefined();

    const setFn = moduleMocker.fn();
    setFn.whenCalledWith(new Set([1, 2])).mockReturnValue('one-two');
    setFn.whenCalledWith(new Set([3, 4])).mockReturnValue('three-four');
    expect(setFn(new Set([1, 2]))).toBe('one-two');
    expect(setFn(new Set([3, 4]))).toBe('three-four');
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

  it('falls through to _protoImpl on non-matching calls for class-hierarchy auto-mocks', () => {
    class Base {
      greet(name: string) {
        return `hello ${name}`;
      }
    }
    class Child extends Base {}

    const ChildMock = moduleMocker.generateFromMetadata(
      moduleMocker.getMetadata(Child),
    ) as typeof Child;
    const instance = new ChildMock();

    // _protoImpl is the parent mock's greet — configure it to return something
    // recognisable so we can tell the dispatcher fell through.
    instance.greet._protoImpl.mockReturnValue('from-proto');

    instance.greet.whenCalledWith('match').mockReturnValue('matched');
    expect(instance.greet('match')).toBe('matched');
    expect(instance.greet('other')).toBe('from-proto');
  });
});
