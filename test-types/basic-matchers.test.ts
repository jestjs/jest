/**
 * @type ./empty.d.ts
 */

import {expectError, expectType} from 'tsd';
import {expect, jest} from '@jest/globals';
import type {Mock} from 'jest-mock';

describe('', () => {
  it('', () => {
    /* Corrections of previous typings */

    // FIXME: TSD's limitations. Cannot run a function if it does not exist?
    // expectError<jest.Matchers<string>>(expect('').not.not);
    // expectError<jest.Matchers<Promise<Promise<string>>>>(
    //   expect('').resolves.resolves,
    // );

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
    expectType<never[]>(expect([]).toBe([]));
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

    // FIXME: Error expected. But none. Why?
    expectError(expect(jest.fn()).toBeCalledWith(1, 'two'));
    expectError(expect({}).toEqual({p1: 'hello'}));

    expectType<void>(expect(0).toBeCloseTo(1));
    expectType<void>(expect(0).toBeCloseTo(1, 2));

    expectType<void>(expect(undefined).toBeDefined());
    expectType<void>(expect({}).toBeDefined());

    expectType<void>(expect(true).toBeFalsy());
    expectType<void>(expect(false).toBeFalsy());
    expectType<void>(expect(0).toBeFalsy());

    expectType<void>(expect(0).toBeGreaterThan(1));
    expectType<void>(expect(0).toBeGreaterThanOrEqual(1));
    expectType<void>(expect(3).toBeInstanceOf(Number));
    expectType<void>(expect(0).toBeLessThan(1));
    expectType<void>(expect(0).toBeLessThanOrEqual(1));

    expectType<void>(expect(null).toBeNull());
    expectType<void>(expect(undefined).toBeNull());

    expectType<void>(expect(true).toBeTruthy());
    expectType<void>(expect(false).toBeFalsy());
    expectType<void>(expect(1).toBeTruthy());

    expectType<void>(expect(undefined).toBeUndefined());
    expectType<void>(expect({}).toBeUndefined());

    expectType<void>(expect(NaN).toBeNaN());
    expectType<void>(expect(Infinity).toBeNaN());

    expectType<void>(expect([]).toContain({}));
    expectType<void>(expect(['abc']).toContain('abc'));
    expectType<void>(expect(['abc']).toContain('def'));
    expectType<void>(expect('abc').toContain('bc'));

    expectType<void>(expect([]).toContainEqual({}));
    expectType<void>(expect(['abc']).toContainEqual('def'));

    expectType<void>(expect([]).toEqual([]));
    expectType<void>(expect({}).toEqual({}));

    expectType<void>(expect(jest.fn()).toHaveBeenCalled());

    expectType<void>(expect(jest.fn()).toHaveBeenCalledTimes(0));
    expectType<void>(expect(jest.fn()).toHaveBeenCalledTimes(1));

    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith());
    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith('jest'));
    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith({}, {}));

    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith(0));
    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith(1, 'jest'));
    expectType<void>(expect(jest.fn()).toHaveBeenCalledWith(2, {}, {}));

    expectType<void>(expect(jest.fn()).toHaveBeenLastCalledWith());
    expectType<void>(expect(jest.fn()).toHaveBeenLastCalledWith('jest'));
    expectType<void>(expect(jest.fn()).toHaveBeenLastCalledWith({}, {}));

    expectType<void>(expect(jest.fn()).toHaveLastReturnedWith('jest'));
    expectType<void>(expect(jest.fn()).toHaveLastReturnedWith({}));

    expectType<void>(expect([]).toHaveLength(0));
    expectType<void>(expect('').toHaveLength(1));

    expectType<void>(expect(jest.fn()).toHaveNthReturnedWith(0, 'jest'));
    expectType<void>(expect(jest.fn()).toHaveNthReturnedWith(1, {}));

    expectType<void>(expect({}).toHaveProperty('property'));
    expectType<void>(expect({}).toHaveProperty('property', {}));
    expectType<void>(expect({}).toHaveProperty(['property']));
    expectType<void>(expect({}).toHaveProperty(['property'], {}));
    expectType<void>(expect({}).toHaveProperty(['property', 'deep']));
    expectType<void>(expect({}).toHaveProperty(['property', 'deep'], {}));

    expectType<void>(expect(jest.fn()).toHaveReturned());

    expectType<void>(expect(jest.fn()).toHaveReturnedTimes(0));
    expectType<void>(expect(jest.fn()).toHaveReturnedTimes(1));

    expectType<void>(expect(jest.fn()).toHaveReturnedWith('jest'));
    expectType<void>(expect(jest.fn()).toHaveReturnedWith({}));

    expectType<void>(expect('').toMatch(''));
    expectType<void>(expect('').toMatch(/foo/));

    expectType<void>(expect({}).toMatchObject({}));
    expectType<void>(expect({abc: 'def'}).toMatchObject({abc: 'def'}));
    expectType<void>(expect({}).toMatchObject([{}, {}]));
    expectType<void>(
      expect({abc: 'def'}).toMatchObject([{abc: 'def'}, {invalid: 'property'}]),
    );
    expectType<void>(
      expect({abc: 'def'}).toMatchObject<{abc: string}>({abc: 'def'}),
    );
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

    expectType<void>(expect({}).toMatchInlineSnapshot());
    expectType<void>(expect({}).toMatchInlineSnapshot('snapshot'));
    expectType<void>(
      expect({abc: 'def'}).toMatchInlineSnapshot(
        {abc: expect.any(String)},
        'snapshot',
      ),
    );
    expectType<void>(
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

    expectType<void>(expect(jest.fn()).toReturn());

    expectType<void>(expect(jest.fn()).toReturnTimes(0));
    expectType<void>(expect(jest.fn()).toReturnTimes(1));

    expectType<void>(expect(jest.fn()).toReturnWith('jest'));
    expectType<void>(expect(jest.fn()).toReturnWith({}));

    expectType<void>(expect(true).toStrictEqual(false));
    expectType<void>(expect({}).toStrictEqual({}));

    const errInstance = new Error();
    const willThrow = () => {
      throw new Error();
    };
    expectType<void>(expect(() => {}).toThrow());
    expectType<void>(expect(willThrow).toThrow(''));
    expectType<void>(expect(willThrow).toThrow(errInstance));
    expectType<void>(expect(jest.fn()).toThrow(Error));
    expectType<void>(expect(jest.fn(willThrow)).toThrow(/foo/));

    expectType<void>(expect(() => {}).toThrowErrorMatchingSnapshot());
    expectType<void>(
      expect(() => {}).toThrowErrorMatchingSnapshot('snapshotName'),
    );
    expectType<void>(expect(willThrow).toThrowErrorMatchingSnapshot());
    expectType<void>(
      expect(willThrow).toThrowErrorMatchingSnapshot('snapshotName'),
    );
    expectType<void>(expect(jest.fn()).toThrowErrorMatchingSnapshot());
    expectType<void>(
      expect(jest.fn()).toThrowErrorMatchingSnapshot('snapshotName'),
    );
    expectType<void>(expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot());
    expectType<void>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot('snapshotName'),
    );

    expectType<void>(expect(() => {}).toThrowErrorMatchingInlineSnapshot());
    expectType<void>(
      expect(() => {}).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<void>(expect(willThrow).toThrowErrorMatchingInlineSnapshot());
    expectType<void>(
      expect(willThrow).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<void>(expect(jest.fn()).toThrowErrorMatchingInlineSnapshot());
    expectType<void>(
      expect(jest.fn()).toThrowErrorMatchingInlineSnapshot('Error Message'),
    );
    expectType<void>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot(),
    );
    expectType<void>(
      expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot(
        'Error Message',
      ),
    );

    // /* not */

    expectType<void>(expect({}).not.toEqual({}));
    expectType<void>(expect([]).not.toStrictEqual([]));

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

    expectType<void>(expect({}).toBe(expect.anything()));

    expectType<void>(expect({}).toBe(expect.any(class Foo {})));
    expectType<void>(expect(new Error()).toBe(expect.any(Error)));
    expectType<void>(expect(7).toBe(expect.any(Number)));

    expectType<void>(expect({}).toBe(expect.arrayContaining(['a', 'b'])));
    expectType<void>(expect(['abc']).toBe(expect.arrayContaining(['a', 'b'])));

    expectType<any>(expect.objectContaining({}));
    expectType<any>(expect.stringMatching('foo'));
    expectType<any>(expect.stringMatching(/foo/));
    expectType<any>(expect.stringContaining('foo'));

    expectType<void>(
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

    expectType<void>(
      expect('How are you?').toEqual(
        expect.not.stringContaining('Hello world!'),
      ),
    );
    expectType<void>(
      expect('How are you?').toEqual(expect.not.stringMatching(/Hello world!/)),
    );
    expectType<void>(
      expect({bar: 'baz'}).toEqual(expect.not.objectContaining({foo: 'bar'})),
    );
    expectType<void>(
      expect(['Alice', 'Bob', 'Eve']).toEqual(
        expect.not.arrayContaining(['Samantha']),
      ),
    );

    // /* Miscellaneous */

    expectType<void>(expect.hasAssertions());
    expectType<void>(expect.assertions(0));
    expectType<void>(expect.assertions(9001));
  });
});
