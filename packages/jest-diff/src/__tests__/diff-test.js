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

const diff = require('../');
const stripAnsi = require('strip-ansi');

const toJSON = function toJSON() {
  return 'apple';
};

describe('different types', () => {
  [
    [1, 'a', 'number', 'string'],
    [{}, 'a', 'object', 'string'],
    [[], 2, 'array', 'number'],
    [null, undefined, 'null', 'undefined'],
    [() => {}, 3, 'function', 'number'],
  ].forEach(values => {
    const a = values[0];
    const b = values[1];
    const typeA = values[2];
    const typeB = values[3];

    test(`'${a}' and '${b}'`, () => {
      expect(stripAnsi(diff(a, b))).toBe(
        '  Comparing two different types of values. ' +
        `Expected ${typeA} but received ${typeB}.`,
      );

    });

  });
});

describe('no visual difference', () => {
  [
    ['a', 'a'],
    [{}, {}],
    [[], []],
    [[1, 2], [1, 2]],
    [11, 11],
    [() => {}, () => {}],
    [null, null],
    [undefined, undefined],
    [{a: 1}, {a: 1}],
    [{a: {b: 5}}, {a: {b: 5}}],
  ].forEach(values => {
    test(
      `'${JSON.stringify(values[0])}' and '${JSON.stringify(values[1])}'`,
      () => {
        expect(stripAnsi(diff(values[0], values[1]))).toBe(
          'Compared values have no visual difference.',
        );
      },
    );
  });

  test('Map key order should be irrelevant', () => {
    const arg1 = new Map([[1, 'foo'], [2, 'bar']]);
    const arg2 = new Map([[2, 'bar'], [1, 'foo']]);

    expect(stripAnsi(diff(arg1, arg2))).toBe(
      'Compared values have no visual difference.',
    );
  });

  test('Set value order should be irrelevant', () => {
    const arg1 = new Set([1, 2]);
    const arg2 = new Set([2, 1]);

    expect(stripAnsi(diff(arg1, arg2))).toBe(
      'Compared values have no visual difference.',
    );
  });
});

test('oneline strings', () => {
  // oneline strings don't produce a diff currently.
  expect(stripAnsi(diff('ab', 'aa'))).toBe(null);
  expect(diff('a', 'a')).toMatch(/no visual difference/);
  expect(stripAnsi(diff('123456789', '234567890'))).toBe(null);
});

test('falls back to not call toJSON if objects look identical', () => {
  const a = {line: 1, toJSON};
  const b = {line: 2, toJSON};
  expect(diff(a, b)).toMatchSnapshot();
});

test('prints a fallback message if two objects truly look identical', () => {
  const a = {line: 2, toJSON};
  const b = {line: 2, toJSON};
  expect(diff(a, b)).toMatchSnapshot();
});

test('multiline strings', () => {
  const result = diff(
`line 1
line 2
line 3
line 4`,
`line 1
line  2
line 3
line 4`,
  );

  expect(stripAnsi(result)).toMatch(/\- line 2/);
  expect(stripAnsi(result)).toMatch(/\+ line {2}2/);
});

test('objects', () => {
  const result = stripAnsi(diff({a: {b: {c: 5}}}, {a: {b: {c: 6}}}));
  expect(result).toMatch(/\-\s+\"c\"\: 5/);
  expect(result).toMatch(/\+\s+\"c\"\: 6/);
});

test('numbers', () => {
  const result = diff(123, 234);
  expect(result).toBe(null);
});

test('booleans', () => {
  const result = diff(true, false);
  expect(result).toBe(null);
});

test('React elements', () => {
  const result = diff({
    $$typeof: Symbol.for('react.element'),
    props: {
      children: 'Hello',
      className: 'fun',
    },
    type: 'div',
  }, {
    $$typeof: Symbol.for('react.element'),
    className: 'fun',
    props: {
      children: 'Goodbye',
    },
    type: 'div',
  });
  expect(stripAnsi(result)).toMatch(/<div\n/);
  expect(stripAnsi(result)).toMatch(/[\s\S]+className="fun"\n/);
  expect(stripAnsi(result)).toMatch(/>/);
  expect(stripAnsi(result)).toMatch(/\-\s+Hello/);
  expect(stripAnsi(result)).toMatch(/\+\s+Goodbye/);
});

test('collapses big diffs to patch format', () => {
  const result = diff(
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    {test: [1, 2, 3, 4, 5, 6, 7, 8, 10, 9]},
    {expand: false}
  );

  expect(result).toMatchSnapshot();
});
