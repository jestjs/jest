/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type Context, toThrowErrorMatchingSnapshot} from '../';

const mockedMatch = jest.fn<
  (args: {received: string; testName: string}) => unknown
>(() => ({
  actual: 'coconut',
  expected: 'coconut',
}));

const mockedContext = {
  snapshotState: {match: mockedMatch},
} as unknown as Context;

afterEach(() => {
  jest.clearAllMocks();
});

it('throw matcher can take func', () => {
  toThrowErrorMatchingSnapshot.call(
    mockedContext,
    () => {
      throw new Error('coconut');
    },
    undefined,
    false,
  );

  expect(mockedMatch).toHaveBeenCalledTimes(1);
  expect(mockedMatch).toHaveBeenCalledWith(
    expect.objectContaining({received: 'coconut', testName: ''}),
  );
});

describe('throw matcher from promise', () => {
  it('can take error', () => {
    toThrowErrorMatchingSnapshot.call(
      mockedContext,
      new Error('coco'),
      'testName',
      true,
    );

    expect(mockedMatch).toHaveBeenCalledTimes(1);
    expect(mockedMatch).toHaveBeenCalledWith(
      expect.objectContaining({received: 'coco', testName: ''}),
    );
  });

  it('can take custom error', () => {
    class CustomError extends Error {}

    toThrowErrorMatchingSnapshot.call(
      mockedContext,
      new CustomError('nut'),
      'testName',
      true,
    );

    expect(mockedMatch).toHaveBeenCalledTimes(1);
    expect(mockedMatch).toHaveBeenCalledWith(
      expect.objectContaining({received: 'nut', testName: ''}),
    );
  });
});

describe('cause chain', () => {
  const snapshotOf = (received: unknown) => {
    toThrowErrorMatchingSnapshot.call(mockedContext, received, undefined, true);

    expect(mockedMatch).toHaveBeenCalledTimes(1);

    return mockedMatch.mock.calls[0][0].received;
  };

  it('walks a chain of causes', () => {
    const inner = new Error('inner');
    const middle = new Error('middle', {cause: inner});

    expect(snapshotOf(new Error('outer', {cause: middle}))).toBe(
      'outer\nCause: middle\nCause: inner',
    );
  });

  it('marks an error that is its own cause', () => {
    const error: Error & {cause?: unknown} = new Error('outer');
    error.cause = error;

    expect(snapshotOf(error)).toBe('outer\nCause: [Circular cause]');
  });

  it('marks a cause chain that loops back to an earlier error', () => {
    const outer: Error & {cause?: unknown} = new Error('outer');
    const inner: Error & {cause?: unknown} = new Error('inner');
    outer.cause = inner;
    inner.cause = outer;

    expect(snapshotOf(outer)).toBe(
      'outer\nCause: inner\nCause: [Circular cause]',
    );
  });

  it('marks a proxy that returns itself as its own cause', () => {
    const target = new Error('proxied');
    const proxy: Error = new Proxy(target, {
      get: (object, property, receiver) =>
        property === 'cause' ? proxy : Reflect.get(object, property, receiver),
      has: (object, property) =>
        property === 'cause' || Reflect.has(object, property),
    });

    expect(snapshotOf(new Error('outer', {cause: proxy}))).toBe(
      'outer\nCause: proxied\nCause: [Circular cause]',
    );
  });

  it.each([
    ['an object tagged as an Error', {[Symbol.toStringTag]: 'Error'}],
    ['a null prototype object', Object.assign(Object.create(null), {cause: 1})],
    // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
    ['a boxed primitive', new String('boxed')],
    ['a number', 42],
  ])('ignores a cause that is %s', (_name, cause) => {
    expect(snapshotOf(new Error('outer', {cause}))).toBe('outer');
  });
});
