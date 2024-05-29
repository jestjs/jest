/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {List, OrderedMap, OrderedSet, Record} from 'immutable';
import {stringify} from 'jest-matcher-utils';
import {equals} from '../jasmineUtils';
import {
  arrayBufferEquality,
  emptyObject,
  getObjectSubset,
  getPath,
  iterableEquality,
  subsetEquality,
  typeEquality,
} from '../utils';

describe('getPath()', () => {
  test('property exists', () => {
    expect(getPath({a: {b: {c: 5}}}, 'a.b.c')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: {c: 5},
      traversedPath: ['a', 'b', 'c'],
      value: 5,
    });

    expect(getPath({a: {b: {c: {d: 1}}}}, 'a.b.c.d')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: {d: 1},
      traversedPath: ['a', 'b', 'c', 'd'],
      value: 1,
    });
  });

  test('property doesnt exist', () => {
    expect(getPath({a: {b: {}}}, 'a.b.c')).toEqual({
      endPropIsDefined: false,
      hasEndProp: false,
      lastTraversedObject: {},
      traversedPath: ['a', 'b'],
      value: undefined,
    });
  });

  test('property exist but undefined', () => {
    expect(getPath({a: {b: {c: undefined}}}, 'a.b.c')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: {c: undefined},
      traversedPath: ['a', 'b', 'c'],
      value: undefined,
    });
  });

  test('property is a getter on class instance', () => {
    class A {
      get a() {
        return 'a';
      }
      get b() {
        return {c: 'c'};
      }
    }

    expect(getPath(new A(), 'a')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: new A(),
      traversedPath: ['a'],
      value: 'a',
    });
    expect(getPath(new A(), 'b.c')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: {c: 'c'},
      traversedPath: ['b', 'c'],
      value: 'c',
    });
  });

  test('property is inherited', () => {
    class A {}
    // @ts-expect-error
    A.prototype.a = 'a';

    expect(getPath(new A(), 'a')).toEqual({
      endPropIsDefined: true,
      hasEndProp: true,
      lastTraversedObject: new A(),
      traversedPath: ['a'],
      value: 'a',
    });
  });

  test('path breaks', () => {
    expect(getPath({a: {}}, 'a.b.c')).toEqual({
      hasEndProp: false,
      lastTraversedObject: {},
      traversedPath: ['a'],
      value: undefined,
    });
  });

  test('empty object at the end', () => {
    expect(getPath({a: {b: {c: {}}}}, 'a.b.c.d')).toEqual({
      endPropIsDefined: false,
      hasEndProp: false,
      lastTraversedObject: {},
      traversedPath: ['a', 'b', 'c'],
      value: undefined,
    });
  });
});

describe('getObjectSubset', () => {
  for (const [object, subset, expected] of [
    [{a: 'b', c: 'd'}, {a: 'd'}, {a: 'b'}],
    [{a: [1, 2], b: 'b'}, {a: [3, 4]}, {a: [1, 2]}],
    [[{a: 'b', c: 'd'}], [{a: 'z'}], [{a: 'b'}]],
    [
      [1, 2],
      [1, 2, 3],
      [1, 2],
    ],
    [{a: [1]}, {a: [1, 2]}, {a: [1]}],
    [new Date('2015-11-30'), new Date('2016-12-30'), new Date('2015-11-30')],
  ]) {
    test(
      `expect(getObjectSubset(${stringify(object)}, ${stringify(subset)}))` +
        `.toEqual(${stringify(expected)})`,
      () => {
        expect(getObjectSubset(object, subset)).toEqual(expected);
      },
    );
  }

  describe('returns the object instance if the subset has no extra properties', () => {
    test('Date', () => {
      const object = new Date('2015-11-30');
      const subset = new Date('2016-12-30');

      expect(getObjectSubset(object, subset)).toBe(object);
    });
  });

  describe('returns the subset instance if its property values are equal', () => {
    test('Object', () => {
      const object = {key0: 'zero', key1: 'one', key2: 'two'};
      const subset = {key0: 'zero', key2: 'two'};

      expect(getObjectSubset(object, subset)).toBe(subset);
    });

    describe('Uint8Array', () => {
      const equalObject = {'0': 0, '1': 0, '2': 0};
      const typedArray = new Uint8Array(3);

      test('expected', () => {
        const object = equalObject;
        const subset = typedArray;

        expect(getObjectSubset(object, subset)).toBe(subset);
      });

      test('received', () => {
        const object = typedArray;
        const subset = equalObject;

        expect(getObjectSubset(object, subset)).toBe(subset);
      });
    });
  });

  describe('calculating subsets of objects with circular references', () => {
    test('simple circular references', () => {
      type CircularObj = {a?: string; b?: string; ref?: unknown};

      const nonCircularObj = {a: 'world', b: 'something'};

      const circularObjA: CircularObj = {a: 'hello'};
      circularObjA.ref = circularObjA;

      const circularObjB: CircularObj = {a: 'world'};
      circularObjB.ref = circularObjB;

      const primitiveInsteadOfRef: CircularObj = {b: 'something'};
      primitiveInsteadOfRef.ref = 'not a ref';

      const nonCircularRef: CircularObj = {b: 'something'};
      nonCircularRef.ref = {};

      expect(getObjectSubset(circularObjA, nonCircularObj)).toEqual({
        a: 'hello',
      });
      expect(getObjectSubset(nonCircularObj, circularObjA)).toEqual({
        a: 'world',
      });

      expect(getObjectSubset(circularObjB, circularObjA)).toEqual(circularObjB);

      expect(getObjectSubset(primitiveInsteadOfRef, circularObjA)).toEqual({
        ref: 'not a ref',
      });
      expect(getObjectSubset(nonCircularRef, circularObjA)).toEqual({
        ref: {},
      });
    });

    test('transitive circular references', () => {
      type CircularObj = {a?: string; nestedObj?: unknown};

      const nonCircularObj = {a: 'world', b: 'something'};

      const transitiveCircularObjA: CircularObj = {a: 'hello'};
      transitiveCircularObjA.nestedObj = {parentObj: transitiveCircularObjA};

      const transitiveCircularObjB: CircularObj = {a: 'world'};
      transitiveCircularObjB.nestedObj = {parentObj: transitiveCircularObjB};

      const primitiveInsteadOfRef: CircularObj = {};
      primitiveInsteadOfRef.nestedObj = {otherProp: 'not the parent ref'};

      const nonCircularRef: CircularObj = {};
      nonCircularRef.nestedObj = {otherProp: {}};

      expect(getObjectSubset(transitiveCircularObjA, nonCircularObj)).toEqual({
        a: 'hello',
      });
      expect(getObjectSubset(nonCircularObj, transitiveCircularObjA)).toEqual({
        a: 'world',
      });

      expect(
        getObjectSubset(transitiveCircularObjB, transitiveCircularObjA),
      ).toEqual(transitiveCircularObjB);

      expect(
        getObjectSubset(primitiveInsteadOfRef, transitiveCircularObjA),
      ).toEqual({nestedObj: {otherProp: 'not the parent ref'}});
      expect(getObjectSubset(nonCircularRef, transitiveCircularObjA)).toEqual({
        nestedObj: {otherProp: {}},
      });
    });
  });
});

describe('emptyObject()', () => {
  test('matches an empty object', () => {
    expect(emptyObject({})).toBe(true);
  });

  test('does not match an object with keys', () => {
    expect(emptyObject({foo: undefined})).toBe(false);
  });

  test('does not match a non-object', () => {
    expect(emptyObject(null)).toBe(false);
    expect(emptyObject(34)).toBe(false);
  });
});

describe('subsetEquality()', () => {
  test('matching object returns true', () => {
    expect(subsetEquality({foo: 'bar'}, {foo: 'bar'})).toBe(true);
  });

  test('object without keys is undefined', () => {
    expect(subsetEquality('foo', 'bar')).toBeUndefined();
  });

  test('objects to not match', () => {
    expect(subsetEquality({foo: 'bar'}, {foo: 'baz'})).toBe(false);
    expect(subsetEquality('foo', {foo: 'baz'})).toBe(false);
  });

  test('null does not return errors', () => {
    expect(subsetEquality(null, {foo: 'bar'})).not.toBeTruthy();
  });

  test('undefined does not return errors', () => {
    expect(subsetEquality(undefined, {foo: 'bar'})).not.toBeTruthy();
  });

  describe('matching subsets with circular references', () => {
    test('simple circular references', () => {
      type CircularObj = {a?: string; ref?: unknown};

      const circularObjA1: CircularObj = {a: 'hello'};
      circularObjA1.ref = circularObjA1;

      const circularObjA2: CircularObj = {a: 'hello'};
      circularObjA2.ref = circularObjA2;

      const circularObjB: CircularObj = {a: 'world'};
      circularObjB.ref = circularObjB;

      const primitiveInsteadOfRef: CircularObj = {};
      primitiveInsteadOfRef.ref = 'not a ref';

      expect(subsetEquality(circularObjA1, {})).toBe(true);
      expect(subsetEquality({}, circularObjA1)).toBe(false);
      expect(subsetEquality(circularObjA2, circularObjA1)).toBe(true);
      expect(subsetEquality(circularObjB, circularObjA1)).toBe(false);
      expect(subsetEquality(primitiveInsteadOfRef, circularObjA1)).toBe(false);
    });

    test('referenced object on same level should not regarded as circular reference', () => {
      const referencedObj = {abc: 'def'};
      const object = {
        a: {abc: 'def'},
        b: {abc: 'def', zzz: 'zzz'},
      };
      const thisIsNotCircular = {
        a: referencedObj,
        b: referencedObj,
      };
      expect(subsetEquality(object, thisIsNotCircular)).toBeTruthy();
    });

    test('transitive circular references', () => {
      type CircularObj = {a: string; nestedObj?: unknown};

      const transitiveCircularObjA1: CircularObj = {a: 'hello'};
      transitiveCircularObjA1.nestedObj = {parentObj: transitiveCircularObjA1};

      const transitiveCircularObjA2: CircularObj = {a: 'hello'};
      transitiveCircularObjA2.nestedObj = {
        parentObj: transitiveCircularObjA2,
      };

      const transitiveCircularObjB: CircularObj = {a: 'world'};
      transitiveCircularObjB.nestedObj = {
        parentObj: transitiveCircularObjB,
      };

      const primitiveInsteadOfRef = {
        parentObj: 'not the parent ref',
      };

      expect(subsetEquality(transitiveCircularObjA1, {})).toBe(true);
      expect(subsetEquality({}, transitiveCircularObjA1)).toBe(false);
      expect(
        subsetEquality(transitiveCircularObjA2, transitiveCircularObjA1),
      ).toBe(true);
      expect(
        subsetEquality(transitiveCircularObjB, transitiveCircularObjA1),
      ).toBe(false);
      expect(
        subsetEquality(primitiveInsteadOfRef, transitiveCircularObjA1),
      ).toBe(false);
    });
  });

  describe('matching subsets with symbols', () => {
    describe('same symbol', () => {
      test('objects to not match with value diff', () => {
        const symbol = Symbol('foo');
        expect(subsetEquality({[symbol]: 1}, {[symbol]: 2})).toBe(false);
      });

      test('objects to match with non-enumerable symbols', () => {
        const symbol = Symbol('foo');
        const foo = {};
        Object.defineProperty(foo, symbol, {
          enumerable: false,
          value: 1,
        });
        const bar = {};
        Object.defineProperty(bar, symbol, {
          enumerable: false,
          value: 2,
        });
        expect(subsetEquality(foo, bar)).toBe(true);
      });
    });

    describe('different symbol', () => {
      test('objects to not match with same value', () => {
        expect(subsetEquality({[Symbol('foo')]: 1}, {[Symbol('foo')]: 2})).toBe(
          false,
        );
      });
      test('objects to match with non-enumerable symbols', () => {
        const foo = {};
        Object.defineProperty(foo, Symbol('foo'), {
          enumerable: false,
          value: 1,
        });
        const bar = {};
        Object.defineProperty(bar, Symbol('foo'), {
          enumerable: false,
          value: 2,
        });
        expect(subsetEquality(foo, bar)).toBe(true);
      });
    });
  });

  describe('subset is not object with keys', () => {
    test('returns true if subset has keys', () => {
      expect(subsetEquality({foo: 'bar'}, {foo: 'bar'})).toBe(true);
    });
    test('returns true if subset has Symbols', () => {
      const symbol = Symbol('foo');
      expect(subsetEquality({[symbol]: 'bar'}, {[symbol]: 'bar'})).toBe(true);
    });
    test('returns undefined if subset has no keys', () => {
      expect(subsetEquality('foo', 'bar')).toBeUndefined();
    });
    test('returns undefined if subset is null', () => {
      expect(subsetEquality({foo: 'bar'}, null)).toBeUndefined();
    });
    test('returns undefined if subset is Error', () => {
      expect(subsetEquality({foo: 'bar'}, new Error())).toBeUndefined();
    });
    test('returns undefined if subset is Array', () => {
      expect(subsetEquality({foo: 'bar'}, [])).toBeUndefined();
    });
    test('returns undefined if subset is Date', () => {
      expect(subsetEquality({foo: 'bar'}, new Date())).toBeUndefined();
    });
    test('returns undefined if subset is Set', () => {
      expect(subsetEquality({foo: 'bar'}, new Set())).toBeUndefined();
    });
    test('returns undefined if subset is Map', () => {
      expect(subsetEquality({foo: 'bar'}, new Map())).toBeUndefined();
    });
  });
});

describe('iterableEquality', () => {
  test('returns true when given circular iterators', () => {
    class Iter {
      *[Symbol.iterator]() {
        yield this;
      }
    }

    const a = new Iter();
    const b = new Iter();

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given circular Set', () => {
    const a = new Set();
    a.add(a);
    const b = new Set();
    b.add(b);
    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given nested Sets', () => {
    expect(
      iterableEquality(
        new Set([new Set([[1]]), new Set([[2]])]),
        new Set([new Set([[2]]), new Set([[1]])]),
      ),
    ).toBe(true);
    expect(
      iterableEquality(
        new Set([new Set([[1]]), new Set([[2]])]),
        new Set([new Set([[3]]), new Set([[1]])]),
      ),
    ).toBe(false);
  });

  test('returns false when given inequal set within a set', () => {
    expect(
      iterableEquality(new Set([new Set([2])]), new Set([new Set([1, 2])])),
    ).toBe(false);
    expect(
      iterableEquality(new Set([new Set([2])]), new Set([new Set([1, 2])])),
    ).toBe(false);
  });

  test('returns false when given inequal map within a set', () => {
    expect(
      iterableEquality(
        new Set([new Map([['a', 2]])]),
        new Set([new Map([['a', 3]])]),
      ),
    ).toBe(false);
    expect(
      iterableEquality(new Set([new Set([2])]), new Set([new Set([1, 2])])),
    ).toBe(false);
  });

  test('returns false when given inequal set within a map', () => {
    expect(
      iterableEquality(
        new Map([['one', new Set([2])]]),
        new Map([['one', new Set([1, 2])]]),
      ),
    ).toBe(false);
  });

  test('returns true when given iterator within equal objects', () => {
    const a = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: [],
    };
    const b = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: [],
    };

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns false when given iterator within inequal objects', () => {
    const a = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: [1],
    };
    const b = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: [],
    };

    expect(iterableEquality(a, b)).toBe(false);
  });

  test('returns false when given iterator within inequal nested objects', () => {
    const a = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: {
        b: [1],
      },
    };
    const b = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      a: {
        b: [],
      },
    };

    expect(iterableEquality(a, b)).toBe(false);
  });

  test('returns true when given circular Set shape', () => {
    const a1 = new Set();
    const a2 = new Set();
    a1.add(a2);
    a2.add(a1);
    const b = new Set();
    b.add(b);

    expect(iterableEquality(a1, b)).toBe(true);
  });

  test('returns true when given circular key in Map', () => {
    const a = new Map();
    a.set(a, 'a');
    const b = new Map();
    b.set(b, 'a');

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given nested Maps', () => {
    expect(
      iterableEquality(
        new Map([['hello', new Map([['world', 'foobar']])]]),
        new Map([['hello', new Map([['world', 'qux']])]]),
      ),
    ).toBe(false);
    expect(
      iterableEquality(
        new Map([['hello', new Map([['world', 'foobar']])]]),
        new Map([['hello', new Map([['world', 'foobar']])]]),
      ),
    ).toBe(true);
  });

  test('returns true when given circular key and value in Map', () => {
    const a = new Map();
    a.set(a, a);
    const b = new Map();
    b.set(b, b);

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given circular value in Map', () => {
    const a = new Map();
    a.set('a', a);
    const b = new Map();
    b.set('a', b);

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given Immutable Lists without an OwnerID', () => {
    const a = List([1, 2, 3]);
    const b = a.filter(v => v > 0);

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given Immutable OrderedMaps without an OwnerID', () => {
    const a = OrderedMap().set('saving', true);
    const b = OrderedMap().merge({saving: true});
    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given Immutable OrderedSets without an OwnerID', () => {
    const a = OrderedSet().add('newValue');
    const b = List(['newValue']).toOrderedSet();
    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given Immutable Record without an OwnerID', () => {
    class TestRecord extends Record({dummy: ''}) {}
    const a = new TestRecord().merge({dummy: 'data'});
    const b = new TestRecord().set('dummy', 'data');
    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns true when given a symbols keys within equal objects', () => {
    const KEY = Symbol();

    const a = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      [KEY]: [],
    };
    const b = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      [KEY]: [],
    };

    expect(iterableEquality(a, b)).toBe(true);
  });

  test('returns false when given a symbols keys within inequal objects', () => {
    const KEY = Symbol();

    const a = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      [KEY]: [1],
    };
    const b = {
      [Symbol.iterator]: () => ({next: () => ({done: true})}),
      [KEY]: [],
    };

    expect(iterableEquality(a, b)).toBe(false);
  });
});

describe('typeEquality', () => {
  test('returns undefined if given mock.calls and []', () => {
    expect(typeEquality(jest.fn().mock.calls, [])).toBeUndefined();
  });
});

describe('arrayBufferEquality', () => {
  test('returns undefined if given a non instance of ArrayBuffer', () => {
    expect(arrayBufferEquality(2, 's')).toBeUndefined();
    expect(arrayBufferEquality(undefined, 2)).toBeUndefined();
    expect(arrayBufferEquality(new Date(), new ArrayBuffer(2))).toBeUndefined();
  });

  test('returns false when given non-matching buffers', () => {
    const a = Uint8Array.from([2, 4]).buffer;
    const b = Uint16Array.from([1, 7]).buffer;
    expect(arrayBufferEquality(a, b)).not.toBeTruthy();
  });

  test('returns true when given matching buffers', () => {
    const a = Uint8Array.from([1, 2]).buffer;
    const b = Uint8Array.from([1, 2]).buffer;
    expect(arrayBufferEquality(a, b)).toBeTruthy();
  });

  test('returns true when given matching DataView', () => {
    const a = new DataView(Uint8Array.from([1, 2, 3]).buffer);
    const b = new DataView(Uint8Array.from([1, 2, 3]).buffer);
    expect(arrayBufferEquality(a, b)).toBeTruthy();
  });

  test('returns false when given non-matching DataView', () => {
    const a = new DataView(Uint8Array.from([1, 2, 3]).buffer);
    const b = new DataView(Uint8Array.from([3, 2, 1]).buffer);
    expect(arrayBufferEquality(a, b)).toBeFalsy();
  });

  test('returns true when given matching URL', () => {
    const a = new URL('https://jestjs.io/');
    const b = new URL('https://jestjs.io/');
    expect(equals(a, b)).toBeTruthy();
  });

  test('returns false when given non-matching URL', () => {
    const a = new URL('https://jestjs.io/docs/getting-started');
    const b = new URL('https://jestjs.io/docs/getting-started#using-babel');
    expect(equals(a, b)).toBeFalsy();
  });
});

describe('jasmineUtils primitives comparison', () => {
  const falseCases: Array<[any, any]> = [
    [null, undefined],
    [null, 0],
    [false, 0],
    [false, ''],
  ];

  for (const [a, b] of falseCases) {
    test(`${JSON.stringify(a)} and ${JSON.stringify(b)} returns false`, () => {
      expect(equals(a, b)).toBe(false);
    });
  }

  const trueCases: Array<any> = [null, 0, false, '', undefined];

  for (const value of trueCases) {
    test(`${JSON.stringify(value)} returns true`, () => {
      expect(equals(value, value)).toBe(true);
    });
  }
});
