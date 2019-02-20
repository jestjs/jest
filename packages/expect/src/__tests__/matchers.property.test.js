/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const chalk = require('chalk');
const chalkEnabled = chalk.enabled;
const fc = require('fast-check');

// settings for anything arbitrary
const anythingSettings = {
  withBoxedValues: true,
  withMap: true,
  withSet: false,
};

// generate anything: from primitives to objects
const customAnything = () =>
  fc.oneof(
    // generate anything: from primitives to objects
    fc.anything(anythingSettings),
    // generate object - increase the share of object in generated values
    fc.object(anythingSettings),
    // generate array - increase the share of array in generated values
    fc.array(fc.anything(anythingSettings)),
    // generate array - increase the share of array in generated values
    fc.array(fc.object(anythingSettings)),
  );

// assertion settings
const assertSettings = {};

beforeAll(() => {
  chalk.enabled = true;
});

afterAll(() => {
  chalk.enabled = chalkEnabled;
});

describe('.toStrictEqual()', () => {
  const safeExpectStrictEqual = (a, b) => {
    try {
      expect(a).toEqual(b);
      return true;
    } catch (err) {
      return false;
    }
  };
  test('should distinguish distinct values', () => {
    fc.assert(
      fc.property(customAnything(), customAnything(), (a, b) => {
        // Given:  a and b values such as a different from b
        // Assert: We expect `expect(a).not.toStrictEqual(b)`
        const replacer = (k, v) => {
          if (v === undefined) return '<undefined>';
          if (v instanceof Set)
            return `new Set([${JSON.stringify(Array.from(v), replacer)}])`;
          if (v instanceof Map)
            return `new Map([${JSON.stringify(Array.from(v), replacer)}])`;
          return v;
        };
        fc.pre(JSON.stringify(a, replacer) !== JSON.stringify(b, replacer));
        expect(a).not.toStrictEqual(b);
      }),
      assertSettings,
    );
  });
  test('should be reflexive', () => {
    fc.assert(
      fc.property(fc.dedup(customAnything(), 2), ([a, b]) => {
        // Given:  a and b identical values
        // Assert: We expect `expect(a).toStrictEqual(b)`
        expect(a).toStrictEqual(b);
      }),
      assertSettings,
    );
  });
  test('should be symmetric', () => {
    fc.assert(
      fc.property(customAnything(), customAnything(), (a, b) => {
        // Given:  a and b values
        // Assert: We expect `expect(a).toStrictEqual(b)`
        //         to be equivalent to `expect(b).toStrictEqual(a)`
        expect(safeExpectStrictEqual(a, b)).toBe(safeExpectStrictEqual(b, a));
      }),
      assertSettings,
    );
  });
});

describe('.toEqual()', () => {
  const safeExpectEqual = (a, b) => {
    try {
      expect(a).toEqual(b);
      return true;
    } catch (err) {
      return false;
    }
  };
  test('should be reflexive', () => {
    fc.assert(
      fc.property(fc.dedup(customAnything(), 2), ([a, b]) => {
        // Given:  a and b identical values
        // Assert: We expect `expect(a).toEqual(b)`
        expect(a).toEqual(b);
      }),
      assertSettings,
    );
  });
  test('should be symmetric', () => {
    fc.assert(
      fc.property(customAnything(), customAnything(), (a, b) => {
        // Given: a and b values
        // Assert: We expect `expect(a).toEqual(b)`
        //         to be equivalent to `expect(b).toEqual(a)`
        expect(safeExpectEqual(a, b)).toBe(safeExpectEqual(b, a));
      }),
      assertSettings,
    );
  });
});

describe('.toContain()', () => {
  test('should always find the value when inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(customAnything()),
        fc.array(customAnything()),
        customAnything().filter(v => !Number.isNaN(v)),
        (startValues, endValues, v) => {
          // Given:  startValues, endValues arrays and v value (not NaN)
          // Assert: We expect `expect([...startValues, v, ...endValues]).toContainEqual(v)`
          expect([...startValues, v, ...endValues]).toContain(v);
        },
      ),
      assertSettings,
    );
  });
  test('should not find the value if it has been cloned into the array', () => {
    fc.assert(
      fc.property(
        fc.array(customAnything()),
        fc.array(customAnything()),
        fc.dedup(customAnything(), 2),
        (startValues, endValues, [a, b]) => {
          // Given:  startValues, endValues arrays
          //         and [a, b] identical values
          //         with `typeof a === 'object && a !== null`
          // Assert: We expect `expect([...startValues, a, ...endValues]).toContain(b)`
          fc.pre(typeof a === 'object' && a !== null);
          expect([...startValues, a, ...endValues]).not.toContain(b);
        },
      ),
      assertSettings,
    );
  });
});

describe('.toContainEqual()', () => {
  test('should always find the value when inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(customAnything()),
        fc.array(customAnything()),
        customAnything(),
        (startValues, endValues, v) => {
          // Given:  startValues, endValues arrays and v any value
          // Assert: We expect `expect([...startValues, v, ...endValues]).toContainEqual(v)`
          expect([...startValues, v, ...endValues]).toContainEqual(v);
        },
      ),
      assertSettings,
    );
  });
  test('should always find the value when cloned inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(customAnything()),
        fc.array(customAnything()),
        fc.dedup(customAnything(), 2),
        (startValues, endValues, [a, b]) => {
          // Given:  startValues, endValues arrays
          //         and [a, b] identical values
          // Assert: We expect `expect([...startValues, a, ...endValues]).toContainEqual(b)`
          expect([...startValues, a, ...endValues]).toContainEqual(b);
        },
      ),
      assertSettings,
    );
  });
});
