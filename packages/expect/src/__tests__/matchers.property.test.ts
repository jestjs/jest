/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import chalk from 'chalk';
const chalkEnabled = chalk.enabled;
import fc from 'fast-check';

// settings for anything arbitrary
const anythingSettings = {
  key: fc.oneof(fc.string(), fc.constantFrom('k1', 'k2', 'k3')),
  withBoxedValues: true,
  withMap: false,
  withSet: false,
};

// assertion settings
const assertSettings = {}; // eg.: {numRuns: 10000}

beforeAll(() => {
  chalk.enabled = true;
});

afterAll(() => {
  chalk.enabled = chalkEnabled;
});

describe('.toStrictEqual()', () => {
  it('should distinguish distinct values', () => {
    fc.assert(
      fc.property(
        fc.anything(anythingSettings),
        fc.anything(anythingSettings),
        (a, b) => {
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
        },
      ),
      assertSettings,
    );
  });

  it('should be reflexive', () => {
    fc.assert(
      fc.property(fc.dedup(fc.anything(anythingSettings), 2), ([a, b]) => {
        // Given:  a and b identical values
        // Assert: We expect `expect(a).toStrictEqual(b)`
        expect(a).toStrictEqual(b);
      }),
      assertSettings,
    );
  });

  it('should be symmetric', () => {
    const safeExpectStrictEqual = (a, b) => {
      try {
        expect(a).toEqual(b);
        return true;
      } catch (err) {
        return false;
      }
    };
    fc.assert(
      fc.property(
        fc.anything(anythingSettings),
        fc.anything(anythingSettings),
        (a, b) => {
          // Given:  a and b values
          // Assert: We expect `expect(a).toStrictEqual(b)`
          //         to be equivalent to `expect(b).toStrictEqual(a)`
          expect(safeExpectStrictEqual(a, b)).toBe(safeExpectStrictEqual(b, a));
        },
      ),
      assertSettings,
    );
  });
});

describe('.toEqual()', () => {
  it('should be reflexive', () => {
    fc.assert(
      fc.property(fc.dedup(fc.anything(anythingSettings), 2), ([a, b]) => {
        // Given:  a and b identical values
        // Assert: We expect `expect(a).toEqual(b)`
        expect(a).toEqual(b);
      }),
      assertSettings,
    );
  });

  it('should be symmetric', () => {
    const safeExpectEqual = (a, b) => {
      try {
        expect(a).toEqual(b);
        return true;
      } catch (err) {
        return false;
      }
    };
    fc.assert(
      fc.property(
        fc.anything(anythingSettings),
        fc.anything(anythingSettings),
        (a, b) => {
          // Given: a and b values
          // Assert: We expect `expect(a).toEqual(b)`
          //         to be equivalent to `expect(b).toEqual(a)`
          expect(safeExpectEqual(a, b)).toBe(safeExpectEqual(b, a));
        },
      ),
      assertSettings,
    );
  });
});

describe('.toContain()', () => {
  it('should always find the value when inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.anything(anythingSettings).filter(v => !Number.isNaN(v)),
        (startValues, endValues, v) => {
          // Given:  startValues, endValues arrays and v value (not NaN)
          // Assert: We expect `expect([...startValues, v, ...endValues]).toContainEqual(v)`
          expect([...startValues, v, ...endValues]).toContain(v);
        },
      ),
      assertSettings,
    );
  });

  it('should not find the value if it has been cloned into the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.dedup(fc.anything(anythingSettings), 2),
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
  it('should always find the value when inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.anything(anythingSettings),
        (startValues, endValues, v) => {
          // Given:  startValues, endValues arrays and v any value
          // Assert: We expect `expect([...startValues, v, ...endValues]).toContainEqual(v)`
          expect([...startValues, v, ...endValues]).toContainEqual(v);
        },
      ),
      assertSettings,
    );
  });

  it('should always find the value when cloned inside the array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything(anythingSettings)),
        fc.array(fc.anything(anythingSettings)),
        fc.dedup(fc.anything(anythingSettings), 2),
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
