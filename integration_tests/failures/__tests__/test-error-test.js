/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

describe('failure messages', () => {
  test('logs', () => {
    console.log('This is what a log looks like.');

    console.error('This is what an error looks like.');
  });

  [
    () => expect(1).toBe(2),
    () => expect('a').toBe(2),
    () => expect(true).toBe(5),
    () => expect({a: 1, b: 2}).toBe({a: 1, b: 3}),
    () => expect({
      a: 1,
      b: 2,
      c: {
        apple: 'banana',
      },
    }).toEqual({
      a: 2,
      b: 2,
      c: {
        kiwi: 'melon',
      },
    }),
    () => expect([1, 2, 3]).toEqual([2, 3, 1]),
    () => expect([1, 2, 3]).toEqual([1, 3, 2]),
    () => expect(true).not.toBeTruthy(),
    () => expect(false).toBeTruthy(),
    () => expect(true).toBeFalsy(),
    () => expect(false).not.toBeFalsy(),
    () => expect({a: 1, b: 2}).toBeFalsy(),
    () => expect(1).toBeNaN(),
    () => expect({}).toBeNull(),
    () => expect(undefined).toBeDefined(),
    () => expect(1).toBeUndefined(),
    () => expect(1).toBeGreaterThan(5),
    () => expect(1).toBeGreaterThanOrEqual(5),
    () => expect(5).toBeLessThan(1),
    () => expect(5).toBeLessThanOrEqual(1),
    () => expect([1, 2]).toContain({apple: 'banana'}),
    () => expect(4).toBeCloseTo(100),
    () => expect('hello this is a message').toMatch('bye'),
    () => expect(() => {}).toThrow(),
    () => expect(() => {}).toThrow(new TypeError('This is an error!')),
    () => expect(() => { throw new Error('not an error'); })
      .toThrow('This is an error!'),
    () => expect(() => {}).toThrow('This is an error!'),
    () => expect(() => { throw new Error('not an error'); })
      .toThrowError('This is an error!'),
  ].forEach(fn => test(fn.toString(), fn));

  test('toMatchSnapshot', () => {
    expect({
      a: 1,
      apple: 'banana',
    }).toMatchSnapshot();
  });

});
