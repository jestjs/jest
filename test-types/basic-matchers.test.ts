/**
 * @type ./empty.d.ts
 */

import {expectError, expectType} from 'tsd';

describe('', () => {
  it('', () => {
    /* Corrections of previous typings */

    // expectError<jest.Matchers<void, string>>(expect('').not.not);
    // expectError<jest.AndNot<jest.Matchers<Promise<void>, string>>>(
    //   expect('').resolves.resolves,
    // );

    expectType<void>(expect('').toEqual(''));
    expectType<Promise<void>>(expect(Promise.resolve('')).resolves.toEqual(''));

    expectType<jest.Mock<any, any>>(jest.fn());

    expectType<void>(expect(jest.fn()).lastCalledWith());
    expectType<void>(expect(jest.fn()).lastCalledWith('jest'));
    expectType<void>(expect(jest.fn()).lastCalledWith({}, {}));

    expectType<void>(expect(jest.fn()).lastReturnedWith('jest'));
    expectType<void>(expect(jest.fn()).lastReturnedWith({}));

    expectType<void>(expect(jest.fn()).nthCalledWith(0, 'jest'));
    expectType<void>(expect(jest.fn()).nthCalledWith(1, {}));

    expectType<void>(expect(jest.fn()).nthReturnedWith(0, 'jest'));
    expectType<void>(expect(jest.fn()).nthReturnedWith(1, {}));

    expectType<void>(expect({}).toBe({}));
    expectType<void>(expect([]).toBe([]));
    expectType<void>(expect(10).toBe(10));

    expectType<void>(expect(jest.fn()).toBeCalled());

    expectType<void>(expect(jest.fn()).toBeCalledTimes(1));

    expectType<void>(expect(jest.fn()).toBeCalledWith());
    expectType<void>(expect(jest.fn()).toBeCalledWith('jest'));
    expectType<void>(expect(jest.fn()).toBeCalledWith({}, {}));

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

    // expect(jest.fn()).toHaveNthReturnedWith(0, 'jest');
    // expect(jest.fn()).toHaveNthReturnedWith(1, {});

    // expect({}).toHaveProperty('property');
    // expect({}).toHaveProperty('property', {});
    // expect({}).toHaveProperty(['property']);
    // expect({}).toHaveProperty(['property'], {});
    // expect({}).toHaveProperty(['property', 'deep']);
    // expect({}).toHaveProperty(['property', 'deep'], {});

    // expect(jest.fn()).toHaveReturned();

    // expect(jest.fn()).toHaveReturnedTimes(0);
    // expect(jest.fn()).toHaveReturnedTimes(1);

    // expect(jest.fn()).toHaveReturnedWith('jest');
    // expect(jest.fn()).toHaveReturnedWith({});

    // expect('').toMatch('');
    // expect('').toMatch(/foo/);

    // expect({}).toMatchObject({});
    // expect({abc: 'def'}).toMatchObject({abc: 'def'});
    // expect({}).toMatchObject([{}, {}]);
    // expect({abc: 'def'}).toMatchObject([{abc: 'def'}, {invalid: 'property'}]);
    // expect({abc: 'def'}).toMatchObject<{abc: string}>({abc: 'def'});
    // expect([{abc: 'def'}, {abc: 'def'}]).toMatchObject<
    //   [{abc: string}, {abc: string}]
    // >([{abc: 'def'}, {abc: 'def'}]);

    // expect({}).toMatchSnapshot();
    // expect({}).toMatchSnapshot('snapshotName');
    // expect({abc: 'def'}).toMatchSnapshot(
    //   {abc: expect.any(String)},
    //   'snapshotName',
    // );
    // expect({
    //   one: 1,
    //   two: '2',
    //   three: 3,
    //   four: {four: 3},
    //   date: new Date(),
    // }).toMatchSnapshot({
    //   one: expect.any(Number),
    //   // Leave 'two' to the auto-generated snapshot
    //   three: 3,
    //   four: {four: expect.any(Number)},
    //   date: expect.any(Date),
    // });

    // expect({}).toMatchInlineSnapshot();
    // expect({}).toMatchInlineSnapshot('snapshot');
    // expect({abc: 'def'}).toMatchInlineSnapshot(
    //   {abc: expect.any(String)},
    //   'snapshot',
    // );
    // expect({
    //   one: 1,
    //   two: '2',
    //   three: 3,
    //   four: {four: 3},
    //   date: new Date(),
    // }).toMatchInlineSnapshot({
    //   one: expect.any(Number),
    //   // leave out two
    //   three: 3,
    //   four: {four: expect.any(Number)},
    //   date: expect.any(Date),
    // });

    // expect(jest.fn()).toReturn();

    // expect(jest.fn()).toReturnTimes(0);
    // expect(jest.fn()).toReturnTimes(1);

    // expect(jest.fn()).toReturnWith('jest');
    // expect(jest.fn()).toReturnWith({});

    // expect(true).toStrictEqual(false);
    // expect({}).toStrictEqual({});

    // const errInstance = new Error();
    // const willThrow = () => {
    //   throw new Error();
    // };
    // expect(() => {}).toThrow();
    // expect(willThrow).toThrow('');
    // expect(willThrow).toThrow(errInstance);
    // expect(jest.fn()).toThrow(Error);
    // expect(jest.fn(willThrow)).toThrow(/foo/);

    // expect(() => {}).toThrowErrorMatchingSnapshot();
    // expect(() => {}).toThrowErrorMatchingSnapshot('snapshotName');
    // expect(willThrow).toThrowErrorMatchingSnapshot();
    // expect(willThrow).toThrowErrorMatchingSnapshot('snapshotName');
    // expect(jest.fn()).toThrowErrorMatchingSnapshot();
    // expect(jest.fn()).toThrowErrorMatchingSnapshot('snapshotName');
    // expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot();
    // expect(jest.fn(willThrow)).toThrowErrorMatchingSnapshot('snapshotName');

    // expect(() => {}).toThrowErrorMatchingInlineSnapshot();
    // expect(() => {}).toThrowErrorMatchingInlineSnapshot('Error Message');
    // expect(willThrow).toThrowErrorMatchingInlineSnapshot();
    // expect(willThrow).toThrowErrorMatchingInlineSnapshot('Error Message');
    // expect(jest.fn()).toThrowErrorMatchingInlineSnapshot();
    // expect(jest.fn()).toThrowErrorMatchingInlineSnapshot('Error Message');
    // expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot();
    // expect(jest.fn(willThrow)).toThrowErrorMatchingInlineSnapshot(
    //   'Error Message',
    // );

    // /* not */

    // expect({}).not.toEqual({});
    // expect([]).not.toStrictEqual([]);

    // /* Promise matchers */

    // expect(Promise.reject('jest'))
    //   .rejects.toEqual('jest')
    //   .then(() => {});
    // expect(Promise.reject('jest'))
    //   .rejects.not.toEqual('other')
    //   .then(() => {});

    // expect(Promise.resolve('jest'))
    //   .resolves.toEqual('jest')
    //   .then(() => {});
    // expect(Promise.resolve('jest'))
    //   .resolves.not.toEqual('other')
    //   .then(() => {});

    // /* type matchers */

    // expect({}).toBe(expect.anything());

    // expect({}).toBe(expect.any(class Foo {}));
    // expect(new Error()).toBe(expect.any(Error));
    // expect(7).toBe(expect.any(Number));

    // expect({}).toBe(expect.arrayContaining(['a', 'b']));
    // expect(['abc']).toBe(expect.arrayContaining(['a', 'b']));

    // expect.objectContaining({});
    // expect.stringMatching('foo');
    // expect.stringMatching(/foo/);
    // expect.stringContaining('foo');

    // expect({abc: 'def'}).toBe(
    //   expect.objectContaining({
    //     abc: expect.arrayContaining([expect.any(Date), {}]),
    //     def: expect.objectContaining({
    //       foo: 'bar',
    //     }),
    //     ghi: expect.stringMatching('foo'),
    //   }),
    // );

    // /* Inverse type matchers */

    // expect('How are you?').toEqual(expect.not.stringContaining('Hello world!'));
    // expect('How are you?').toEqual(expect.not.stringMatching(/Hello world!/));
    // expect({bar: 'baz'}).toEqual(expect.not.objectContaining({foo: 'bar'}));
    // expect(['Alice', 'Bob', 'Eve']).toEqual(
    //   expect.not.arrayContaining(['Samantha']),
    // );

    // /* Miscellaneous */

    // expect.hasAssertions();
    // expect.assertions(0);
    // expect.assertions(9001);
  });
});
