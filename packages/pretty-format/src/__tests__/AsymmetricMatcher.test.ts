/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat, {plugins} from '../';
import type {OptionsReceived} from '../types';

const {AsymmetricMatcher} = plugins;
let options: OptionsReceived;

function fnNameFor(func: (...any: Array<any>) => unknown) {
  if (func.name) {
    return func.name;
  }

  const matches = func.toString().match(/^\s*function\s*(\w*)\s*\(/);
  return matches ? matches[1] : '<anonymous>';
}

beforeEach(() => {
  options = {plugins: [AsymmetricMatcher]};
});

[
  String,
  Function,
  Array,
  Object,
  RegExp,
  Symbol,
  Function,
  () => {},
  function namedFunction() {},
].forEach(type => {
  test(`supports any(${fnNameFor(type)})`, () => {
    const result = prettyFormat(expect.any(type), options);
    expect(result).toBe(`Any<${fnNameFor(type)}>`);
  });

  test(`supports nested any(${fnNameFor(type)})`, () => {
    const result = prettyFormat(
      {
        test: {
          nested: expect.any(type),
        },
      },
      options,
    );
    expect(result).toBe(
      `Object {\n  "test": Object {\n    "nested": Any<${fnNameFor(
        type,
      )}>,\n  },\n}`,
    );
  });
});

test('anything()', () => {
  const result = prettyFormat(expect.anything(), options);
  expect(result).toBe('Anything');
});

test('arrayContaining()', () => {
  const result = prettyFormat(expect.arrayContaining([1, 2]), options);
  expect(result).toBe(`ArrayContaining [
  1,
  2,
]`);
});

test('arrayNotContaining()', () => {
  const result = prettyFormat(expect.not.arrayContaining([1, 2]), options);
  expect(result).toBe(`ArrayNotContaining [
  1,
  2,
]`);
});

test('objectContaining()', () => {
  const result = prettyFormat(expect.objectContaining({a: 'test'}), options);
  expect(result).toBe(`ObjectContaining {
  "a": "test",
}`);
});

test('objectNotContaining()', () => {
  const result = prettyFormat(
    expect.not.objectContaining({a: 'test'}),
    options,
  );
  expect(result).toBe(`ObjectNotContaining {
  "a": "test",
}`);
});

test('stringContaining(string)', () => {
  const result = prettyFormat(expect.stringContaining('jest'), options);
  expect(result).toBe('StringContaining "jest"');
});

test('not.stringContaining(string)', () => {
  const result = prettyFormat(expect.not.stringContaining('jest'), options);
  expect(result).toBe('StringNotContaining "jest"');
});

test('stringMatching(string)', () => {
  const result = prettyFormat(expect.stringMatching('jest'), options);
  expect(result).toBe('StringMatching /jest/');
});

test('stringMatching(regexp)', () => {
  const result = prettyFormat(expect.stringMatching(/(jest|niema).*/), options);
  expect(result).toBe('StringMatching /(jest|niema).*/');
});

test('stringMatching(regexp) {escapeRegex: false}', () => {
  const result = prettyFormat(expect.stringMatching(/regexp\d/gi), options);
  expect(result).toBe('StringMatching /regexp\\d/gi');
});

test('stringMatching(regexp) {escapeRegex: true}', () => {
  const result = prettyFormat(expect.stringMatching(/regexp\d/gi), {
    ...options,
    escapeRegex: true,
  });
  expect(result).toBe('StringMatching /regexp\\\\d/gi');
});

test('stringNotMatching(string)', () => {
  const result = prettyFormat(expect.not.stringMatching('jest'), options);
  expect(result).toBe('StringNotMatching /jest/');
});

test('closeTo(number, precision)', () => {
  const result = prettyFormat(expect.closeTo(1.2345, 4), options);
  expect(result).toBe('NumberCloseTo 1.2345 (4 digits)');
});

test('notCloseTo(number, precision)', () => {
  const result = prettyFormat(expect.not.closeTo(1.2345, 1), options);
  expect(result).toBe('NumberNotCloseTo 1.2345 (1 digit)');
});

test('closeTo(number)', () => {
  const result = prettyFormat(expect.closeTo(1.2345), options);
  expect(result).toBe('NumberCloseTo 1.2345 (2 digits)');
});

test('closeTo(Infinity)', () => {
  const result = prettyFormat(expect.closeTo(-Infinity), options);
  expect(result).toBe('NumberCloseTo -Infinity (2 digits)');
});

test('closeTo(scientific number)', () => {
  const result = prettyFormat(expect.closeTo(1.56e-3, 4), options);
  expect(result).toBe('NumberCloseTo 0.00156 (4 digits)');
});

test('closeTo(very small scientific number)', () => {
  const result = prettyFormat(expect.closeTo(1.56e-10, 4), options);
  expect(result).toBe('NumberCloseTo 1.56e-10 (4 digits)');
});

test('correctly handles inability to pretty-print matcher', () => {
  expect(() => prettyFormat(new DummyMatcher(1), options)).toThrow(
    'Asymmetric matcher DummyMatcher does not implement toAsymmetricMatcher()',
  );
});

test('supports multiple nested asymmetric matchers', () => {
  const result = prettyFormat(
    {
      test: {
        nested: expect.objectContaining({
          a: expect.arrayContaining([1]),
          b: expect.anything(),
          c: expect.any(String),
          d: expect.stringContaining('jest'),
          e: expect.stringMatching('jest'),
          f: expect.objectContaining({test: 'case'}),
        }),
      },
    },
    options,
  );
  expect(result).toBe(`Object {
  "test": Object {
    "nested": ObjectContaining {
      "a": ArrayContaining [
        1,
      ],
      "b": Anything,
      "c": Any<String>,
      "d": StringContaining "jest",
      "e": StringMatching /jest/,
      "f": ObjectContaining {
        "test": "case",
      },
    },
  },
}`);
});

describe('indent option', () => {
  const val = {
    nested: expect.objectContaining({
      a: expect.arrayContaining([1]),
      b: expect.anything(),
      c: expect.any(String),
      d: expect.stringContaining('jest'),
      e: expect.stringMatching('jest'),
      f: expect.objectContaining({
        composite: ['exact', 'match'],
        primitive: 'string',
      }),
    }),
  };
  const result = `Object {
  "nested": ObjectContaining {
    "a": ArrayContaining [
      1,
    ],
    "b": Anything,
    "c": Any<String>,
    "d": StringContaining "jest",
    "e": StringMatching /jest/,
    "f": ObjectContaining {
      "composite": Array [
        "exact",
        "match",
      ],
      "primitive": "string",
    },
  },
}`;

  test('default implicit: 2 spaces', () => {
    expect(prettyFormat(val, options)).toEqual(result);
  });
  test('default explicit: 2 spaces', () => {
    expect(prettyFormat(val, {...options, indent: 2})).toEqual(result);
  });

  // Tests assume that no strings in val contain multiple adjacent spaces!
  test('non-default: 0 spaces', () => {
    expect(prettyFormat(val, {...options, indent: 0})).toEqual(
      result.replace(/ {2}/g, ''),
    );
  });
  test('non-default: 4 spaces', () => {
    expect(prettyFormat(val, {...options, indent: 4})).toEqual(
      result.replace(/ {2}/g, ' '.repeat(4)),
    );
  });
});

describe('maxDepth option', () => {
  test('matchers as leaf nodes', () => {
    const val = {
      // ++depth === 1
      nested: [
        // ++depth === 2
        expect.arrayContaining(
          // ++depth === 3
          [1],
        ),
        expect.objectContaining({
          // ++depth === 3
          composite: ['exact', 'match'],
          primitive: 'string',
        }),
        expect.stringContaining('jest'),
        expect.stringMatching('jest'),
        expect.any(String),
        expect.anything(),
      ],
    };
    const result = prettyFormat(val, {...options, maxDepth: 2});
    expect(result).toBe(`Object {
  "nested": Array [
    [ArrayContaining],
    [ObjectContaining],
    StringContaining "jest",
    StringMatching /jest/,
    Any<String>,
    Anything,
  ],
}`);
  });
  test('matchers as internal nodes', () => {
    const val = [
      // ++depth === 1
      expect.arrayContaining([
        // ++depth === 2
        'printed',
        {
          // ++depth === 3
          properties: 'not printed',
        },
      ]),
      expect.objectContaining({
        // ++depth === 2
        array: [
          // ++depth === 3
          'items',
          'not',
          'printed',
        ],
        primitive: 'printed',
      }),
    ];
    const result = prettyFormat(val, {...options, maxDepth: 2});
    expect(result).toBe(`Array [
  ArrayContaining [
    "printed",
    [Object],
  ],
  ObjectContaining {
    "array": [Array],
    "primitive": "printed",
  },
]`);
  });
});

test('min option', () => {
  const result = prettyFormat(
    {
      test: {
        nested: expect.objectContaining({
          a: expect.arrayContaining([1]),
          b: expect.anything(),
          c: expect.any(String),
          d: expect.stringContaining('jest'),
          e: expect.stringMatching('jest'),
          f: expect.objectContaining({test: 'case'}),
        }),
      },
    },
    {...options, min: true},
  );
  expect(result).toBe(
    '{"test": {"nested": ObjectContaining {"a": ArrayContaining [1], "b": Anything, "c": Any<String>, "d": StringContaining "jest", "e": StringMatching /jest/, "f": ObjectContaining {"test": "case"}}}}',
  );
});

class DummyMatcher {
  $$typeof = Symbol.for('jest.asymmetricMatcher');

  constructor(private readonly sample: number) {}

  asymmetricMatch(other: number) {
    return this.sample === other;
  }

  toString() {
    return 'DummyMatcher';
  }

  getExpectedType() {
    return 'number';
  }
}
