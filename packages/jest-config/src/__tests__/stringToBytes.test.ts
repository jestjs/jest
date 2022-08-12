/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import stringToBytes from '../stringToBytes';

describe('numeric input', () => {
  test('> 1 represents bytes', () => {
    expect(stringToBytes(50.8)).toEqual(50);
  });

  test('1.1 should be a 1', () => {
    expect(stringToBytes(1.1, 54)).toEqual(1);
  });

  test('< 1 represents a %', () => {
    expect(stringToBytes(0.3, 51)).toEqual(15);
  });

  test('should throw when no reference supplied', () => {
    expect(() => stringToBytes(0.3)).toThrowError();
  });

  test('should throw on a bad input', () => {
    expect(() => stringToBytes(-0.3, 51)).toThrowError();
  });
});

describe('string input', () => {
  describe('numeric passthrough', () => {
    test('> 1 represents bytes', () => {
      expect(stringToBytes('50.8')).toEqual(50);
    });

    test('< 1 represents a %', () => {
      expect(stringToBytes('0.3', 51)).toEqual(15);
    });

    test('should throw when no reference supplied', () => {
      expect(() => stringToBytes('0.3')).toThrowError();
    });

    test('should throw on a bad input', () => {
      expect(() => stringToBytes('-0.3', 51)).toThrowError();
    });
  });

  describe('parsing', () => {
    test('0% should throw an error', () => {
      expect(() => stringToBytes('0%', 51)).toThrowError();
    });

    test('30%', () => {
      expect(stringToBytes('30%', 51)).toEqual(15);
    });

    test('80%', () => {
      expect(stringToBytes('80%', 51)).toEqual(40);
    });

    test('100%', () => {
      expect(stringToBytes('100%', 51)).toEqual(51);
    });

    // The units caps is intentionally janky to test for forgiving string parsing.
    describe('k', () => {
      test('30k', () => {
        expect(stringToBytes('30K')).toEqual(30000);
      });

      test('30KB', () => {
        expect(stringToBytes('30kB')).toEqual(30000);
      });

      test('30KiB', () => {
        expect(stringToBytes('30kIb')).toEqual(30720);
      });
    });

    describe('m', () => {
      test('30M', () => {
        expect(stringToBytes('30M')).toEqual(30000000);
      });

      test('30MB', () => {
        expect(stringToBytes('30MB')).toEqual(30000000);
      });

      test('30MiB', () => {
        expect(stringToBytes('30MiB')).toEqual(31457280);
      });
    });

    describe('g', () => {
      test('30G', () => {
        expect(stringToBytes('30G')).toEqual(30000000000);
      });

      test('30GB', () => {
        expect(stringToBytes('30gB')).toEqual(30000000000);
      });

      test('30GiB', () => {
        expect(stringToBytes('30GIB')).toEqual(32212254720);
      });
    });

    test('unknown unit', () => {
      expect(() => stringToBytes('50XX')).toThrowError();
    });
  });
});

test('nesting', () => {
  expect(stringToBytes(stringToBytes(stringToBytes('30%', 51)))).toEqual(15);
});

test('null', () => {
  expect(stringToBytes(null)).toEqual(null);
});

test('undefined', () => {
  expect(stringToBytes(undefined)).toEqual(undefined);
});
