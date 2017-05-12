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

const {stringify, ensureNumbers, pluralize, ensureNoExpected} = require('../');

describe('.stringify()', () => {
  [
    [[], 'Array []'],
    [{}, '{}'],
    [1, '1'],
    [0, '0'],
    [1.5, '1.5'],
    [null, 'null'],
    [undefined, 'undefined'],
    ['abc', '"abc"'],
    [Symbol.for('abc'), 'Symbol(abc)'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    [/ab\.c/gi, '/ab\\.c/gi'],
  ].forEach(([v, s]) => {
    test(stringify(v), () => {
      expect(stringify(v)).toBe(s);
    });
  });

  test('circular references', () => {
    const a = {};
    a.a = a;
    expect(stringify(a)).toBe('{"a": [Circular]}');
  });

  test('toJSON error', () => {
    const evil = {
      toJSON() {
        throw new Error('Nope.');
      },
    };
    expect(stringify(evil)).toBe('{"toJSON": [Function toJSON]}');
    expect(stringify({a: {b: {evil}}})).toBe(
      '{"a": {"b": {"evil": {"toJSON": [Function toJSON]}}}}',
    );

    function Evil() {}
    Evil.toJSON = evil.toJSON;
    expect(stringify(Evil)).toBe('[Function Evil]');
  });

  test('toJSON errors when comparing two objects', () => {
    function toJSON() {
      throw new Error('Nope.');
    }
    const evilA = {
      a: 1,
      toJSON,
    };
    const evilB = {
      b: 1,
      toJSON,
    };

    expect(() => expect(evilA).toEqual(evilB)).toThrowErrorMatchingSnapshot();
  });

  test('reduces maxDepth if stringifying very large objects', () => {
    const big = {a: 1, b: {}};
    const small = {a: 1, b: {}};
    for (let i = 0; i < 10000; i += 1) {
      big.b[i] = 'test';
    }

    for (let i = 0; i < 10; i += 1) {
      small.b[i] = 'test';
    }

    expect(stringify(big)).toMatchSnapshot();
    expect(stringify(small)).toMatchSnapshot();
  });
});

describe('.ensureNumbers()', () => {
  test('dont throw error when variables are numbers', () => {
    expect(() => {
      ensureNumbers(1, 2);
    }).not.toThrow();
  });

  test('throws error when expected is not a number', () => {
    expect(() => {
      ensureNumbers(1, 'not_a_number');
    }).toThrow('Expected value must be a number');
  });

  test('throws error when actual is not a number', () => {
    expect(() => {
      ensureNumbers('not_a_number', 3);
    }).toThrow('Received value must be a number');
  });
});

describe('.ensureNoExpected()', () => {
  test('dont throw error when undefined', () => {
    expect(() => {
      ensureNoExpected(undefined);
    }).not.toThrow();
  });

  test('throws error when is not undefined', () => {
    expect(() => {
      ensureNoExpected({a: 1});
    }).toThrow('Matcher does not accept any arguments');
  });

  test('throws error when is not undefined with matcherName', () => {
    expect(() => {
      ensureNoExpected({a: 1}, '.toBeDefined');
    }).toThrow('Matcher does not accept any arguments');
  });
});

describe('.pluralize()', () => {
  test('one', () => expect(pluralize('apple', 1)).toEqual('one apple'));
  test('two', () => expect(pluralize('apple', 2)).toEqual('two apples'));
  test('20', () => expect(pluralize('apple', 20)).toEqual('20 apples'));
});
