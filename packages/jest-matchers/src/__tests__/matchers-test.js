/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const jestExpect = require('../').expect;
const stringify = require('../utils').stringify;

describe('.toBe()', () => {
  it('does not throw', () => {
    jestExpect('a').not.toBe('b');
    jestExpect('a').toBe('a');
    jestExpect(1).not.toBe(2);
    jestExpect(1).toBe(1);
    jestExpect(null).not.toBe(undefined);
    jestExpect(null).toBe(null);
    jestExpect(undefined).toBe(undefined);
  });

  [[1, 2], [true, false], [{}, {}], [[], []], [null, undefined]].forEach(v => {
    it(`fails for: ${JSON.stringify(v[0])} and ${JSON.stringify(v[1])}`, () => {
      const fn = () => jestExpect(v[0]).toBe(v[1]);
      expect(fn).toThrowError(/expected.*to be.*using \'===.*/);
    });
  });

  [false, 1, 'a', undefined, null, {}, []].forEach(v => {
    it(`fails for '${JSON.stringify(v)}' with '.not'`, () => {
      const fn = () => jestExpect(v).not.toBe(v);
      expect(fn).toThrowError(/expected.*not to be.*using \'!==.*/);
    });
  });

  it('does not crash on circular references', () => {
    const obj = {};
    obj.circular = obj;
    expect(() => jestExpect(obj).toBe({})).toThrowError(
      /expected.*circular.*\[Circular\].*to be.*/,
    );
  });
});

describe('.toBeTruthy(), .toBeFalsy()', () => {
  it('does not accept arguments', () => {
    expect(() => jestExpect(0).toBeTruthy(null))
      .toThrowError(/toBeTruthy matcher does not accept any arguments/);
    expect(() => jestExpect(0).toBeFalsy(null))
      .toThrowError(/toBeFalsy matcher does not accept any arguments/);
  });

  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is truthy`, () => {
      jestExpect(v).toBeTruthy();
      jestExpect(v).not.toBeFalsy();
      expect(() => jestExpect(v).not.toBeTruthy())
        .toThrowError(/not to be truthy/);
      expect(() => jestExpect(v).toBeFalsy()).toThrowError(/falsy/);
    });
  });

  [false, null, NaN, 0, '', undefined].forEach(v => {
    test(`'${stringify(v)}' is falsy`, () => {
      jestExpect(v).toBeFalsy();
      jestExpect(v).not.toBeTruthy();
      expect(() => jestExpect(v).toBeTruthy()).toThrowError(/truthy/);
      expect(() => jestExpect(v).not.toBeFalsy())
        .toThrowError(/not to be falsy/);
    });
  });
});

describe('.toBeNaN()', () => {
  it('passes', () => {
    [NaN, Math.sqrt(-1), Infinity - Infinity, 0 / 0].forEach(v => {
      jestExpect(v).toBeNaN();
      expect(() => jestExpect(v).not.toBeNaN()).toThrowError(/not to be NaN/);
    });
  });

  it('throws', () => {
    [1, '', null, undefined, {}, [], 0.2, 0, Infinity, -Infinity].forEach(v => {
      expect(() => jestExpect(v).toBeNaN()).toThrowError(/to be NaN/);
      jestExpect(v).not.toBeNaN();
    });
  });
});

describe(
  '.toBeGreaterThan(), .toBeLessThan(), ' +
    '.toBeGreaterThanOrEqual(), .toBeLessThanOrEqual()',
  () => {
    [
      [1, 2],
      [-Infinity, Infinity],
      [Number.MIN_VALUE, Number.MAX_VALUE],
      [0x11, 0x22],
      [0b11, 0b111],
      [0o11, 0o22],
      [0.1, 0.2],
    ].forEach(([small, big]) => {
      it(`passes: [${small}, ${big}]`, () => {
        jestExpect(small).toBeLessThan(big);
        jestExpect(small).not.toBeGreaterThan(big);
        jestExpect(big).toBeGreaterThan(small);
        jestExpect(big).not.toBeLessThan(small);

        jestExpect(small).toBeLessThanOrEqual(big);
        jestExpect(small).not.toBeGreaterThanOrEqual(big);
        jestExpect(big).toBeGreaterThanOrEqual(small);
        jestExpect(big).not.toBeLessThanOrEqual(small);
      });

      it(`throws: [${small}, ${big}]`, () => {
        expect(() => jestExpect(small).toBeGreaterThan(big))
          .toThrowError(/to be greater than.*using \>/);
        expect(() => jestExpect(small).not.toBeLessThan(big))
          .toThrowError(/to be less than.*using \</);
        expect(() => jestExpect(big).not.toBeGreaterThan(small))
          .toThrowError(/not to be greater than.*using \>/);
        expect(() => jestExpect(big).toBeLessThan(small))
          .toThrowError(/to be less than.*using \</);

        expect(() => jestExpect(small).toBeGreaterThanOrEqual(big))
          .toThrowError(/to be greater than or equal.*using \>=/);
        expect(() => jestExpect(small).not.toBeLessThanOrEqual(big))
          .toThrowError(/to be less than or equal.*using \<=/);
        expect(() => jestExpect(big).not.toBeGreaterThanOrEqual(small))
          .toThrowError(/not to be greater than or equal.*using \>=/);
        expect(() => jestExpect(big).toBeLessThanOrEqual(small))
          .toThrowError(/to be less than or equal.*using \<=/);
      });
    });

    [
      [1, 1],
      [Number.MIN_VALUE, Number.MIN_VALUE],
      [Number.MAX_VALUE, Number.MAX_VALUE],
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ].forEach(([n1, n2]) => {
      test(`equal numbers: [${n1}, ${n2}]`, () => {
        jestExpect(n1).toBeGreaterThanOrEqual(n2);
        jestExpect(n1).toBeLessThanOrEqual(n2);
        expect(() => jestExpect(n1).not.toBeGreaterThanOrEqual(n2))
          .toThrowError(/not to be greater than or equal.*using \>=/);
        expect(() => jestExpect(n1).not.toBeLessThanOrEqual(n2))
          .toThrowError(/not to be less than or equal.*using \<=/);
      });
    });
  },
);
