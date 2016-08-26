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
const {stringify} = require('jest-matcher-utils');

const matchErrorSnapshot = fn => {
  let error;

  try {
    fn();
  } catch (e) {
    error = e;
  }

  expect(error).toBeDefined();
  expect(error.message).toMatchSnapshot();
};

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

  [
    [1, 2],
    [true, false],
    [{}, {}],
    [{a: 1}, {a: 1}],
    [{a: 1}, {a: 5}],
    ['abc', 'cde'],
    [[], []],
    [null, undefined],
  ].forEach(([a, b]) => {
    it(`fails for: ${stringify(a)} and ${stringify(b)}`, () => {
      let error;

      try {
        jestExpect(a).toBe(b);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  [false, 1, 'a', undefined, null, {}, []].forEach(v => {
    it(`fails for '${stringify(v)}' with '.not'`, () => {
      let error;

      try {
        jestExpect(v).not.toBe(v);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatchSnapshot();
    });
  });

  it('does not crash on circular references', () => {
    const obj = {};
    obj.circular = obj;
    let error;

    try {
      jestExpect(obj).toBe({});
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toMatch(/\[Circular\]/);
    expect(error.message).toMatchSnapshot();
  });
});

describe('.toEqual()', () => {
  [
    [true, false],
    [1, 2],
    [{a: 5}, {b: 6}],
    ['banana', 'apple'],
    [null, undefined],
  ].forEach(([a, b]) => {
    test(`expect(${stringify(a)}).toEqual(${stringify(b)})`, () => {
      matchErrorSnapshot(() => jestExpect(a).toEqual(b));
    });
  });

  [
    [true, true],
    [1, 1],
    ['abc', 'abc'],
    [{a: 99}, {a: 99}],
  ].forEach(([a, b]) => {
    test(`expect(${stringify(a)}).not.toEqual(${stringify(b)})`, () => {
      matchErrorSnapshot(() => jestExpect(a).not.toEqual(b));
    });
  });
});

describe('.toBeTruthy(), .toBeFalsy()', () => {
  it('does not accept arguments', () => {
    matchErrorSnapshot(() => jestExpect(0).toBeTruthy(null));
    matchErrorSnapshot(() => jestExpect(0).toBeFalsy(null));
  });

  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is truthy`, () => {
      jestExpect(v).toBeTruthy();
      jestExpect(v).not.toBeFalsy();
      matchErrorSnapshot(() => jestExpect(v).not.toBeTruthy());
      matchErrorSnapshot(() => jestExpect(v).toBeFalsy());
    });
  });

  [false, null, NaN, 0, '', undefined].forEach(v => {
    test(`'${stringify(v)}' is falsy`, () => {
      jestExpect(v).toBeFalsy();
      jestExpect(v).not.toBeTruthy();
      matchErrorSnapshot(() => jestExpect(v).toBeTruthy());
      matchErrorSnapshot(() => jestExpect(v).not.toBeFalsy());
    });
  });
});

describe('.toBeNaN()', () => {
  it('passes', () => {
    [NaN, Math.sqrt(-1), Infinity - Infinity, 0 / 0].forEach(v => {
      jestExpect(v).toBeNaN();
      matchErrorSnapshot(() => jestExpect(v).not.toBeNaN());
    });
  });

  it('throws', () => {
    [1, '', null, undefined, {}, [], 0.2, 0, Infinity, -Infinity].forEach(v => {
      matchErrorSnapshot(() => jestExpect(v).toBeNaN());
      jestExpect(v).not.toBeNaN();
    });
  });
});

describe('.toBeNull()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`fails for '${stringify(v)}' with .not`, () => {
      jestExpect(v).not.toBeNull();
      matchErrorSnapshot(() => jestExpect(v).toBeNull());
    });
  });

  it('pass for null', () => {
    jestExpect(null).toBeNull();
    matchErrorSnapshot(() => jestExpect(null).not.toBeNull());
  });
});

describe('.toBeDefined(), .toBeUndefined()', () => {
  [{}, [], true, 1, 'a', 0.5, new Map(), () => {}, Infinity].forEach(v => {
    test(`'${stringify(v)}' is defined`, () => {
      jestExpect(v).toBeDefined();
      jestExpect(v).not.toBeUndefined();
      matchErrorSnapshot(() => jestExpect(v).not.toBeDefined());
      matchErrorSnapshot(() => jestExpect(v).toBeUndefined());
    });
  });

  test('undefined is undefined', () => {
    jestExpect(undefined).toBeUndefined();
    jestExpect(undefined).not.toBeDefined();
    matchErrorSnapshot(() => jestExpect(undefined).toBeDefined());
    matchErrorSnapshot(() => jestExpect(undefined).not.toBeUndefined());
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
        matchErrorSnapshot(() => jestExpect(small).toBeGreaterThan(big));
        matchErrorSnapshot(() => jestExpect(small).not.toBeLessThan(big));
        matchErrorSnapshot(() => jestExpect(big).not.toBeGreaterThan(small));
        matchErrorSnapshot(() => jestExpect(big).toBeLessThan(small));

        matchErrorSnapshot(() => jestExpect(small).toBeGreaterThanOrEqual(big));
        matchErrorSnapshot(
          () => jestExpect(small).not.toBeLessThanOrEqual(big),
        );
        matchErrorSnapshot(
          () => jestExpect(big).not.toBeGreaterThanOrEqual(small),
        );
        matchErrorSnapshot(() => jestExpect(big).toBeLessThanOrEqual(small));
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
        matchErrorSnapshot(() => jestExpect(n1).not.toBeGreaterThanOrEqual(n2));
        matchErrorSnapshot(() => jestExpect(n1).not.toBeLessThanOrEqual(n2));
      });
    });
  },
);

describe('.toContain()', () => {
  [
    [[1, 2, 3, 4], 1],
    [['a', 'b', 'c', 'd'], 'a'],
    [[undefined, null], null],
    [[undefined, null], undefined],
    [[Symbol.for('a')], Symbol.for('a')],
    ['abcdef', 'abc'],
    ['11112111', '2'],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' contains '${stringify(v)}'`, () => {
      jestExpect(list).toContain(v);
      matchErrorSnapshot(() => jestExpect(list).not.toContain(v));
    });
  });

  [
    [[1, 2, 3], 4],
    [[null, undefined], 1],
    [[{}, []], []],
    [[{}, []], {}],
  ].forEach(([list, v]) => {
    it(`'${stringify(list)}' does not contain '${stringify(v)}'`, () => {
      jestExpect(list).not.toContain(v);
      matchErrorSnapshot(() => jestExpect(list).toContain(v));
    });
  });
});

describe('.toBeCloseTo()', () => {
  [
    [0, 0],
    [0, 0.001],
    [1.23, 1.229],
    [1.23, 1.226],
    [1.23, 1.225],
    [1.23, 1.234],
  ].forEach(([n1, n2]) => {
    it(`passes: [${n1}, ${n2}]`, () => {
      jestExpect(n1).toBeCloseTo(n2);
      matchErrorSnapshot(() => jestExpect(n1).not.toBeCloseTo(n2));
    });
  });

  [
    [0, 0.01],
    [1, 1.23],
    [1.23, 1.2249999],
  ].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      matchErrorSnapshot(() => jestExpect(n1).toBeCloseTo(n2));
      jestExpect(n1).not.toBeCloseTo(n2);
    });
  });

  [
    [0, 0.1, 0],
    [0, 0.0001, 3],
    [0, 0.000004, 5],
  ].forEach(([n1, n2, p]) => {
    it(`accepts an optional precision argument: [${n1}, ${n2}, ${p}]`, () => {
      jestExpect(n1).toBeCloseTo(n2, p);
      matchErrorSnapshot(() => jestExpect(n1).not.toBeCloseTo(n2, p));
    });
  });
});

describe('.toMatch()', () => {
  [['foo', 'foo'], ['Foo bar', /^foo/i]].forEach(([n1, n2]) => {
    it(`passes: [${n1}, ${n2}]`, () => {
      jestExpect(n1).toMatch(n2);
      matchErrorSnapshot(() => jestExpect(n1).not.toMatch(n2));
    });
  });

  [['bar', 'foo'], ['bar', /foo/]].forEach(([n1, n2]) => {
    it(`throws: [${n1}, ${n2}]`, () => {
      matchErrorSnapshot(() => jestExpect(n1).toMatch(n2));
    });
  });

  [
    [1, 'foo'],
    [{}, 'foo'],
    [[], 'foo'],
    [true, 'foo'],
    [/foo/i, 'foo'],
    [() => {}, 'foo'],
    [undefined, 'foo'],
  ].forEach(([n1, n2]) => {
    it(
      'throws if non String actual value passed:' +
        ` [${stringify(n1)}, ${stringify(n2)}]`,
      () => {
        matchErrorSnapshot(() => jestExpect(n1).toMatch(n2));
      },
    );
  });

  [
    ['foo', 1],
    ['foo', {}],
    ['foo', []],
    ['foo', true],
    ['foo', () => {}],
    ['foo', undefined],
  ].forEach(([n1, n2]) => {
    it(
      `throws if non String/RegExp expected value passed:` +
        ` [${stringify(n1)}, ${stringify(n2)}]`,
      () => {
        matchErrorSnapshot(() => jestExpect(n1).toMatch(n2));
      },
    );
  });

  it('escapes strings properly', () => {
    jestExpect('this?: throws').toMatch('this?: throws');
  });
});
