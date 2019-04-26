/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* global BigInt */

const {stringify} = require('jest-matcher-utils');

const chalk = require('chalk');
const jestExpect = require('../');

const chalkEnabled = chalk.enabled;

beforeAll(() => {
  chalk.enabled = true;
});

afterAll(() => {
  chalk.enabled = chalkEnabled;
});

describe('.toBe()', () => {
  it('does not throw', () => {
    jestExpect(BigInt(1)).not.toBe(BigInt(2));
    jestExpect(BigInt(1)).toBe(BigInt(1));
  });

  [[BigInt(1), BigInt(2)]].forEach(([a, b]) => {
    it(`fails for: ${stringify(a)} and ${stringify(b)}`, () => {
      expect(() => jestExpect(a).toBe(b)).toThrowErrorMatchingSnapshot();
    });
  });

  [BigInt(1)].forEach(v => {
    it(`fails for '${stringify(v)}' with '.not'`, () => {
      expect(() => jestExpect(v).not.toBe(v)).toThrowErrorMatchingSnapshot();
    });
  });
});
describe('.toEqual()', () => {
  [[BigInt(1), BigInt(2)]].forEach(([a, b]) => {
    test(`{pass: false} expect(${stringify(a)}).toEqual(${stringify(
      b,
    )})`, () => {
      expect(() => jestExpect(a).toEqual(b)).toThrowErrorMatchingSnapshot();
      jestExpect(a).not.toEqual(b);
    });
  });

  [[BigInt(1), BigInt(1)]].forEach(([a, b]) => {
    test(`{pass: true} expect(${stringify(a)}).not.toEqual(${stringify(
      b,
    )})`, () => {
      jestExpect(a).toEqual(b);
      expect(() => jestExpect(a).not.toEqual(b)).toThrowErrorMatchingSnapshot();
    });
  });
});

describe('.toBeTruthy(), .toBeFalsy()', () => {
  [BigInt(1)].forEach(v => {
    test(`'${stringify(v)}' is truthy`, () => {
      jestExpect(v).toBeTruthy();
      jestExpect(v).not.toBeFalsy();

      expect(() =>
        jestExpect(v).not.toBeTruthy(),
      ).toThrowErrorMatchingSnapshot();

      expect(() => jestExpect(v).toBeFalsy()).toThrowErrorMatchingSnapshot();
    });
  });

  [BigInt(0)].forEach(v => {
    test(`'${stringify(v)}' is falsy`, () => {
      jestExpect(v).toBeFalsy();
      jestExpect(v).not.toBeTruthy();

      expect(() => jestExpect(v).toBeTruthy()).toThrowErrorMatchingSnapshot();

      expect(() =>
        jestExpect(v).not.toBeFalsy(),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});

describe('.toBeDefined(), .toBeUndefined()', () => {
  [BigInt(1)].forEach(v => {
    test(`'${stringify(v)}' is defined`, () => {
      jestExpect(v).toBeDefined();
      jestExpect(v).not.toBeUndefined();

      expect(() =>
        jestExpect(v).not.toBeDefined(),
      ).toThrowErrorMatchingSnapshot();

      expect(() =>
        jestExpect(v).toBeUndefined(),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});

describe(
  '.toBeGreaterThan(), .toBeLessThan(), ' +
    '.toBeGreaterThanOrEqual(), .toBeLessThanOrEqual()',
  () => {
    [[BigInt(1), BigInt(2)]].forEach(([small, big]) => {
      it(`{pass: true} expect(${small}).toBeLessThan(${big})`, () => {
        jestExpect(small).toBeLessThan(big);
      });

      it(`{pass: false} expect(${big}).toBeLessThan(${small})`, () => {
        jestExpect(big).not.toBeLessThan(small);
      });

      it(`{pass: true} expect(${big}).toBeGreaterThan(${small})`, () => {
        jestExpect(big).toBeGreaterThan(small);
      });

      it(`{pass: false} expect(${small}).toBeGreaterThan(${big})`, () => {
        jestExpect(small).not.toBeGreaterThan(big);
      });

      it(`{pass: true} expect(${small}).toBeLessThanOrEqual(${big})`, () => {
        jestExpect(small).toBeLessThanOrEqual(big);
      });

      it(`{pass: false} expect(${big}).toBeLessThanOrEqual(${small})`, () => {
        jestExpect(big).not.toBeLessThanOrEqual(small);
      });

      it(`{pass: true} expect(${big}).toBeGreaterThanOrEqual(${small})`, () => {
        jestExpect(big).toBeGreaterThanOrEqual(small);
      });

      it(`{pass: false} expect(${small}).toBeGreaterThanOrEqual(${big})`, () => {
        jestExpect(small).not.toBeGreaterThanOrEqual(big);
      });

      it(`throws: [${small}, ${big}]`, () => {
        expect(() =>
          jestExpect(small).toBeGreaterThan(big),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(small).not.toBeLessThan(big),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(big).not.toBeGreaterThan(small),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(big).toBeLessThan(small),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(small).toBeGreaterThanOrEqual(big),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(small).not.toBeLessThanOrEqual(big),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(big).not.toBeGreaterThanOrEqual(small),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(big).toBeLessThanOrEqual(small),
        ).toThrowErrorMatchingSnapshot();
      });
    });

    [[BigInt(1), BigInt(1)]].forEach(([n1, n2]) => {
      test(`equal numbers: [${n1}, ${n2}]`, () => {
        jestExpect(n1).toBeGreaterThanOrEqual(n2);
        jestExpect(n1).toBeLessThanOrEqual(n2);

        expect(() =>
          jestExpect(n1).not.toBeGreaterThanOrEqual(n2),
        ).toThrowErrorMatchingSnapshot();

        expect(() =>
          jestExpect(n1).not.toBeLessThanOrEqual(n2),
        ).toThrowErrorMatchingSnapshot();
      });
    });
  },
);

describe('.toStrictEqual()', () => {
  class TestClassA {
    constructor(a, b) {
      this.a = a;
      this.b = b;
    }
  }

  it('passes when comparing same type', () => {
    expect({
      test: new TestClassA(BigInt(1), BigInt(2)),
    }).toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))});
  });

  it('matches the expected snapshot when it fails', () => {
    expect(() =>
      jestExpect({
        test: BigInt(2),
      }).toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))}),
    ).toThrowErrorMatchingSnapshot();

    expect(() =>
      jestExpect({
        test: new TestClassA(BigInt(1), BigInt(2)),
      }).not.toStrictEqual({test: new TestClassA(BigInt(1), BigInt(2))}),
    ).toThrowErrorMatchingSnapshot();
  });

  /* eslint-disable no-sparse-arrays */
  it('passes for matching sparse arrays', () => {
    expect([, BigInt(1)]).toStrictEqual([, BigInt(1)]);
  });

  it('does not pass when sparseness of arrays do not match', () => {
    expect([, BigInt(1)]).not.toStrictEqual([undefined, BigInt(1)]);
    expect([undefined, BigInt(1)]).not.toStrictEqual([, BigInt(1)]);
    expect([, , , BigInt(1)]).not.toStrictEqual([, BigInt(1)]);
  });

  it('does not pass when equally sparse arrays have different values', () => {
    expect([, BigInt(1)]).not.toStrictEqual([, BigInt(2)]);
  });
  /* eslint-enable */
});
