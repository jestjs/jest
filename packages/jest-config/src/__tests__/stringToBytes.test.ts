/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stringToBytes from '../stringToBytes';

describe('numeric input', () => {
  test('> 1 represents bytes', () => {
    expect(stringToBytes(50.8)).toBe(50);
  });

  test('1.1 should be a 1', () => {
    expect(stringToBytes(1.1, 54)).toBe(1);
  });

  test('< 1 represents a %', () => {
    expect(stringToBytes(0.3, 51)).toBe(15);
  });

  test('should throw when no reference supplied', () => {
    expect(() => stringToBytes(0.3)).toThrow(
      'For a percentage based memory limit a percentageReference must be supplied',
    );
  });

  test('should throw on a bad input', () => {
    expect(() => stringToBytes(-0.3, 51)).toThrow('Unexpected numerical input');
  });
});

describe('string input', () => {
  describe('numeric passthrough', () => {
    test('> 1 represents bytes', () => {
      expect(stringToBytes('50.8')).toBe(50);
    });

    test('< 1 represents a %', () => {
      expect(stringToBytes('0.3', 51)).toBe(15);
    });

    test('should throw when no reference supplied', () => {
      expect(() => stringToBytes('0.3')).toThrow(
        'For a percentage based memory limit a percentageReference must be supplied',
      );
    });

    test('should throw on a bad input', () => {
      expect(() => stringToBytes('-0.3', 51)).toThrow(
        'Unexpected numerical input',
      );
    });
  });

  describe('parsing', () => {
    test('0% should throw an error', () => {
      expect(() => stringToBytes('0%', 51)).toThrow(
        'Unexpected numerical input',
      );
    });

    test('30%', () => {
      expect(stringToBytes('30%', 51)).toBe(15);
    });

    test('80%', () => {
      expect(stringToBytes('80%', 51)).toBe(40);
    });

    test('100%', () => {
      expect(stringToBytes('100%', 51)).toBe(51);
    });

    // The units caps is intentionally janky to test for forgiving string parsing.
    describe('k', () => {
      test('30k', () => {
        expect(stringToBytes('30K')).toBe(30000);
      });

      test('30KB', () => {
        expect(stringToBytes('30kB')).toBe(30000);
      });

      test('30KiB', () => {
        expect(stringToBytes('30kIb')).toBe(30720);
      });
    });

    describe('m', () => {
      test('30M', () => {
        expect(stringToBytes('30M')).toBe(30000000);
      });

      test('30MB', () => {
        expect(stringToBytes('30MB')).toBe(30000000);
      });

      test('30MiB', () => {
        expect(stringToBytes('30MiB')).toBe(31457280);
      });
    });

    describe('g', () => {
      test('30G', () => {
        expect(stringToBytes('30G')).toBe(30000000000);
      });

      test('30GB', () => {
        expect(stringToBytes('30gB')).toBe(30000000000);
      });

      test('30GiB', () => {
        expect(stringToBytes('30GIB')).toBe(32212254720);
      });
    });

    test('unknown unit', () => {
      expect(() => stringToBytes('50XX')).toThrow('Unexpected input');
    });
  });
});

test('nesting', () => {
  expect(stringToBytes(stringToBytes(stringToBytes('30%', 51)))).toBe(15);
});

test('null', () => {
  expect(stringToBytes(null)).toBeNull();
});

test('undefined', () => {
  expect(stringToBytes(undefined)).toBeUndefined();
});
