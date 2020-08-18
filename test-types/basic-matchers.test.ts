/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @type ./empty.d.ts
 */

import {expectError, expectType} from 'mlh-tsd';
//eslint-disable-next-line import/no-extraneous-dependencies
import {expect, jest} from '@jest/globals';
import type {Mock} from 'jest-mock';
import type {Matchers} from 'expect';

describe('', () => {
  it('', () => {
    /* Corrections of previous typings */

    expectType<Matchers<string>>(expect('').not.not);
    expectType<Matchers<Promise<Promise<string>>>>(
      expect('').resolves.resolves,
    );

    expectType<string>(expect('').toEqual(''));
    expectType<Promise<Promise<string>>>(
      expect(Promise.resolve('')).resolves.toEqual(''),
    );

    expectType<Mock<unknown, unknown[]>>(jest.fn());

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).lastCalledWith());
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).lastCalledWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).lastCalledWith({}, {}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).lastReturnedWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).lastReturnedWith({}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).nthCalledWith(0, 'jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).nthCalledWith(1, {}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).nthReturnedWith(0, 'jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).nthReturnedWith(1, {}),
    );

    expectType<{}>(expect({}).toBe({}));
    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).toBe([]));
    expectType<number>(expect(10).toBe(10));

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toBeCalled());
    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toBeCalledTimes(1));
    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toBeCalledWith());
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toBeCalledWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toBeCalledWith({}, {}),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toBeCalledWith(1, 'two'),
    );

    expectType<{}>(expect({}).toEqual({p1: 'hello'}));

    expectType<number>(expect(0).toBeCloseTo(1));
    expectType<number>(expect(0).toBeCloseTo(1, 2));

    expectType<undefined>(expect(undefined).toBeDefined());
    expectType<{}>(expect({}).toBeDefined());

    expectType<boolean>(expect(true).toBeFalsy());
    expectType<boolean>(expect(false).toBeFalsy());
    expectType<number>(expect(0).toBeFalsy());

    expectType<number>(expect(0).toBeGreaterThan(1));
    expectType<number>(expect(0).toBeGreaterThanOrEqual(1));
    expectType<number>(expect(3).toBeInstanceOf(Number));
    expectType<number>(expect(0).toBeLessThan(1));
    expectType<number>(expect(0).toBeLessThanOrEqual(1));

    expectType<null>(expect(null).toBeNull());
    expectType<undefined>(expect(undefined).toBeNull());

    expectType<boolean>(expect(true).toBeTruthy());
    expectType<boolean>(expect(false).toBeFalsy());
    expectType<number>(expect(1).toBeTruthy());

    expectType<undefined>(expect(undefined).toBeUndefined());
    expectType<{}>(expect({}).toBeUndefined());

    expectType<number>(expect(NaN).toBeNaN());
    expectType<number>(expect(Infinity).toBeNaN());

    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).toContain({}));
    expectType<string[]>(expect(['abc']).toContain('abc'));
    expectType<string[]>(expect(['abc']).toContain('def'));
    expectType<string>(expect('abc').toContain('bc'));

    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).toContainEqual({}));
    expectType<string[]>(expect(['abc']).toContainEqual('def'));

    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).toEqual([]));
    expectType<{}>(expect({}).toEqual({}));

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toHaveBeenCalled());

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledTimes(0),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledTimes(1),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith(),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith({}, {}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith(0),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith(1, 'jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenCalledWith(2, {}, {}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenLastCalledWith(),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenLastCalledWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveBeenLastCalledWith({}, {}),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveLastReturnedWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveLastReturnedWith({}),
    );

    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).toHaveLength(0));
    expectType<string>(expect('').toHaveLength(1));

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveNthReturnedWith(0, 'jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveNthReturnedWith(1, {}),
    );

    expectType<{}>(expect({}).toHaveProperty('property'));
    expectType<{}>(expect({}).toHaveProperty('property', {}));
    expectType<{}>(expect({}).toHaveProperty(['property']));
    expectType<{}>(expect({}).toHaveProperty(['property'], {}));
    expectType<{}>(expect({}).toHaveProperty(['property', 'deep']));
    expectType<{}>(expect({}).toHaveProperty(['property', 'deep'], {}));

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toHaveReturned());
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveReturnedTimes(0),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveReturnedTimes(1),
    );

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveReturnedWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toHaveReturnedWith({}),
    );

    expectType<string>(expect('').toMatch(''));
    expectType<string>(expect('').toMatch(/foo/));

    expectType<{}>(expect({}).toMatchObject({}));
    expectType<{abc: string}>(expect({abc: 'def'}).toMatchObject({abc: 'def'}));
    expectType<{}>(expect({}).toMatchObject([{}, {}]));
    expectType<{abc: string}>(
      expect({abc: 'def'}).toMatchObject([{abc: 'def'}, {invalid: 'property'}]),
    );
    expectType<{abc: string}>(expect({abc: 'def'}).toMatchObject({abc: 'def'}));
    expectType<{abc: string}[]>(
      expect([{abc: 'def'}, {abc: 'def'}]).toMatchObject([
        {abc: 'def'},
        {abc: 'def'},
      ]),
    );

    expectType<{}>(expect({}).toMatchSnapshot());
    expectType<{}>(expect({}).toMatchSnapshot('snapshotName'));
    expectType<{abc: string}>(
      expect({abc: 'def'}).toMatchSnapshot(
        {abc: expect.any(String)},
        'snapshotName',
      ),
    );
    expectType<{
      one: number;
      two: string;
      three: number;
      four: {four: number};
      date: Date;
    }>(
      expect({
        one: 1,
        two: '2',
        three: 3,
        four: {four: 3},
        date: new Date(),
      }).toMatchSnapshot({
        one: expect.any(Number),
        // Leave 'two' to the auto-generated snapshot
        three: 3,
        four: {four: expect.any(Number)},
        date: expect.any(Date),
      }),
    );

    expectType<{}>(expect({}).toMatchInlineSnapshot());
    expectType<{}>(expect({}).toMatchInlineSnapshot('snapshot'));
    expectType<{abc: string}>(
      expect({abc: 'def'}).toMatchInlineSnapshot(
        {abc: expect.any(String)},
        'snapshot',
      ),
    );
    expectType<{
      one: number;
      two: string;
      three: number;
      four: {
        four: number;
      };
      date: Date;
    }>(
      expect({
        one: 1,
        two: '2',
        three: 3,
        four: {four: 3},
        date: new Date(),
      }).toMatchInlineSnapshot({
        one: expect.any(Number),
        // leave out two
        three: 3,
        four: {four: expect.any(Number)},
        date: expect.any(Date),
      }),
    );

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toReturn());

    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toReturnTimes(0));
    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toReturnTimes(1));

    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toReturnWith('jest'),
    );
    expectType<Mock<unknown, unknown[]>>(expect(jest.fn()).toReturnWith({}));

    expectType<boolean>(expect(true).toStrictEqual(false));
    expectType<{}>(expect({}).toStrictEqual({}));

    const errInstance = new Error();
    const willThrow = () => {
      throw new Error();
    };

    expectType<() => void>(expect(() => {}).toThrow());
    expectType<() => never>(expect(willThrow).toThrow(''));
    expectType<() => never>(expect(willThrow).toThrow(errInstance));
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toThrow(new Error()),
    );
    expectType<Mock<never, []>>(expect(jest.fn(willThrow)).toThrow(/foo/));

    expectType<() => void>(expect(() => {}).toThrowErrorMatchingSnapshot());

    expectError(expect(() => {}).toThrowErrorMatchingSnapshot('snapshotName'));
    expectType<() => never>(expect(willThrow).toThrowErrorMatchingSnapshot());
    expectError(expect(willThrow).toThrowErrorMatchingSnapshot('snapshotName'));
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toThrowErrorMatchingSnapshot(),
    );
    expectError(expect(jest.fn()).toThrowErrorMatchingSnapshot('snapshotName'));
    expectType<Mock<never, []>>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot(),
    );
    expectError(
      expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot('snapshotName'),
    );

    expectType<() => void>(
      expect(() => {}).toThrowErrorMatchingInlineSnapshot(),
    );
    expectType<() => void>(
      expect(() => {}).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<() => never>(
      expect(willThrow).toThrowErrorMatchingInlineSnapshot(),
    );
    expectType<() => never>(
      expect(willThrow).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toThrowErrorMatchingInlineSnapshot(),
    );
    expectType<Mock<unknown, unknown[]>>(
      expect(jest.fn()).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<Mock<never, []>>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot(),
    );
    expectType<Mock<never, []>>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot(
        'Error Message',
      ),
    );

    // /* not */

    expectType<{}>(expect({}).not.toEqual({}));
    //FIXME: Parameter type `never[]` is not assignable to argument type `never[]`
    // expectType<never[]>(expect([]).not.toStrictEqual([]));

    // /* Promise matchers */

    expectType<Promise<void>>(
      expect(Promise.reject('jest'))
        .rejects.toEqual('jest')
        .then(() => {}),
    );
    expectType<Promise<void>>(
      expect(Promise.reject('jest'))
        .rejects.not.toEqual('other')
        .then(() => {}),
    );

    expectType<Promise<void>>(
      expect(Promise.resolve('jest'))
        .resolves.toEqual('jest')
        .then(() => {}),
    );
    expectType<Promise<void>>(
      expect(Promise.resolve('jest'))
        .resolves.not.toEqual('other')
        .then(() => {}),
    );

    // /* type matchers */

    expectType<{}>(expect({}).toBe(expect.anything()));

    expectType<{}>(expect({}).toBe(expect.any(class Foo {})));
    expectType<Error>(expect(new Error()).toBe(expect.any(Error)));
    expectType<number>(expect(7).toBe(expect.any(Number)));

    expectType<{}>(expect({}).toBe(expect.arrayContaining(['a', 'b'])));
    expectType<string[]>(
      expect(['abc']).toBe(expect.arrayContaining(['a', 'b'])),
    );

    expectType<Record<string, any>>(expect.objectContaining({}));
    expectType<Record<string, any>>(expect.stringMatching('foo'));
    expectType<Record<string, any>>(expect.stringMatching(/foo/));
    expectType<Record<string, any>>(expect.stringContaining('foo'));

    expectType<{abc: string}>(
      expect({abc: 'def'}).toBe(
        expect.objectContaining({
          abc: expect.arrayContaining([expect.any(Date), {}]),
          def: expect.objectContaining({
            foo: 'bar',
          }),
          ghi: expect.stringMatching('foo'),
        }),
      ),
    );

    // /* Inverse type matchers */

    // FIXME: Type 'Record<string, any>' has no call signatures.
    // expectType<string>(
    //   expect('How are you?').toEqual(
    //     expect.not.stringContaining('Hello world!'),
    //   ),
    // );
    // expectType<string>(
    //   expect('How are you?').toEqual(expect.not.stringMatching(/Hello world!/)),
    // );
    // expectType<{bar: string}>(
    //   expect({bar: 'baz'}).toEqual(expect.not.objectContaining({foo: 'bar'})),
    // );
    // expectType<string[]>(
    //   expect(['Alice', 'Bob', 'Eve']).toEqual(
    //     expect.not.arrayContaining(['Samantha']),
    //   ),
    // );

    // /* Miscellaneous */

    expectType<void>(expect.hasAssertions());
    expectType<void>(expect.assertions(0));
    expectType<void>(expect.assertions(9001));
  });
});
