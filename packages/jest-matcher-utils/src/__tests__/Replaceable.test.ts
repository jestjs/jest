/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Replaceable from '../Replaceable';

describe('Replaceable', () => {
  describe('constructor', () => {
    test('init with object', () => {
      const replaceable = new Replaceable({a: 1, b: 2});
      expect(replaceable.object).toEqual({a: 1, b: 2});
      expect(replaceable.type).toBe('object');
    });

    test('init with array', () => {
      const replaceable = new Replaceable([1, 2, 3]);
      expect(replaceable.object).toEqual([1, 2, 3]);
      expect(replaceable.type).toBe('array');
    });

    test('init with Map', () => {
      const replaceable = new Replaceable(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      );
      expect(replaceable.object).toEqual(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      );
      expect(replaceable.type).toBe('map');
    });

    test('init with other type should throw error', () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new Replaceable(new Date());
      }).toThrow('Type date is not support in Replaceable!');
    });
  });

  describe('get', () => {
    test('get object item', () => {
      const replaceable = new Replaceable({a: 1, b: 2});
      expect(replaceable.get('b')).toBe(2);
    });

    test('get array item', () => {
      const replaceable = new Replaceable([1, 2, 3]);
      expect(replaceable.get(1)).toBe(2);
    });

    test('get Map item', () => {
      const replaceable = new Replaceable(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      );
      expect(replaceable.get('b')).toBe(2);
    });
  });

  describe('set', () => {
    test('set object item', () => {
      const replaceable = new Replaceable({a: 1, b: 2});
      replaceable.set('b', 3);
      expect(replaceable.object).toEqual({a: 1, b: 3});
    });

    test('set array item', () => {
      const replaceable = new Replaceable([1, 2, 3]);
      replaceable.set(1, 3);
      expect(replaceable.object).toEqual([1, 3, 3]);
    });

    test('set Map item', () => {
      const replaceable = new Replaceable(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      );
      replaceable.set('b', 3);
      expect(replaceable.object).toEqual(
        new Map([
          ['a', 1],
          ['b', 3],
        ]),
      );
    });
  });

  describe('forEach', () => {
    test('object forEach', () => {
      const symbolKey = Symbol('jest');
      const object = {a: 1, b: 2, [symbolKey]: 3};
      const replaceable = new Replaceable(object);
      const cb = jest.fn();
      replaceable.forEach(cb);
      expect(cb).toHaveBeenCalledTimes(3);
      expect(cb.mock.calls[0]).toEqual([1, 'a', object]);
      expect(cb.mock.calls[1]).toEqual([2, 'b', object]);
      expect(cb.mock.calls[2]).toEqual([3, symbolKey, object]);
    });

    test('array forEach', () => {
      const replaceable = new Replaceable([1, 2, 3]);
      const cb = jest.fn();
      replaceable.forEach(cb);
      expect(cb).toHaveBeenCalledTimes(3);
      expect(cb.mock.calls[0]).toEqual([1, 0, [1, 2, 3]]);
      expect(cb.mock.calls[1]).toEqual([2, 1, [1, 2, 3]]);
      expect(cb.mock.calls[2]).toEqual([3, 2, [1, 2, 3]]);
    });

    test('map forEach', () => {
      const map = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const replaceable = new Replaceable(map);
      const cb = jest.fn();
      replaceable.forEach(cb);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb.mock.calls[0]).toEqual([1, 'a', map]);
      expect(cb.mock.calls[1]).toEqual([2, 'b', map]);
    });

    test('forEach should ignore nonenumerable property', () => {
      const symbolKey = Symbol('jest');
      const symbolKey2 = Symbol('awesome');
      const object = {a: 1, [symbolKey]: 3};
      Object.defineProperty(object, 'b', {
        configurable: true,
        enumerable: false,
        value: 2,
        writable: true,
      });
      Object.defineProperty(object, symbolKey2, {
        configurable: true,
        enumerable: false,
        value: 4,
        writable: true,
      });
      const replaceable = new Replaceable(object);
      const cb = jest.fn();
      replaceable.forEach(cb);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb.mock.calls[0]).toEqual([1, 'a', object]);
      expect(cb.mock.calls[1]).toEqual([3, symbolKey, object]);
    });
  });

  describe('isReplaceable', () => {
    test('should return true if two object types equal and support', () => {
      expect(Replaceable.isReplaceable({a: 1}, {b: 2})).toBe(true);
      expect(Replaceable.isReplaceable([], [1, 2, 3])).toBe(true);
      expect(
        Replaceable.isReplaceable(
          new Map(),
          new Map([
            ['a', 1],
            ['b', 2],
          ]),
        ),
      ).toBe(true);
    });

    test('should return false if two object types not equal', () => {
      expect(Replaceable.isReplaceable({a: 1}, [1, 2, 3])).toBe(false);
    });

    test('should return false if object types not support', () => {
      expect(Replaceable.isReplaceable('foo', 'bar')).toBe(false);
    });
  });
});
