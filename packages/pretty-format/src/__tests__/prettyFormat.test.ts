/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/prefer-rest-params-eventually */

import prettyFormat, {PrettyFormatOptions} from '../';

function returnArguments(..._args: Array<unknown>) {
  return arguments;
}

class MyArray<T> extends Array<T> {}

function MyObject(value: unknown) {
  // @ts-expect-error
  this.name = value;
}

describe('prettyFormat()', () => {
  it('prints empty arguments', () => {
    const val = returnArguments();
    expect(prettyFormat(val)).toBe('Arguments []');
  });

  it('prints arguments', () => {
    const val = returnArguments(1, 2, 3);
    expect(prettyFormat(val)).toBe('Arguments [\n  1,\n  2,\n  3,\n]');
  });

  it('prints an empty array', () => {
    const val: Array<never> = [];
    expect(prettyFormat(val)).toBe('Array []');
  });

  it('prints an array with items', () => {
    const val = [1, 2, 3];
    expect(prettyFormat(val)).toBe('Array [\n  1,\n  2,\n  3,\n]');
  });

  it('prints a sparse array with only holes', () => {
    // eslint-disable-next-line no-sparse-arrays
    const val = [, , ,];
    expect(prettyFormat(val)).toBe('Array [\n  ,\n  ,\n  ,\n]');
  });

  it('prints a sparse array with items', () => {
    // eslint-disable-next-line no-sparse-arrays
    const val = [1, , , 4];
    expect(prettyFormat(val)).toBe('Array [\n  1,\n  ,\n  ,\n  4,\n]');
  });

  it('prints a sparse array with value surrounded by holes', () => {
    // eslint-disable-next-line no-sparse-arrays
    const val = [, 5, ,];
    expect(prettyFormat(val)).toBe('Array [\n  ,\n  5,\n  ,\n]');
  });

  it('prints a sparse array also containing undefined values', () => {
    // eslint-disable-next-line no-sparse-arrays
    const val = [1, , undefined, undefined, , 4];
    expect(prettyFormat(val)).toBe(
      'Array [\n  1,\n  ,\n  undefined,\n  undefined,\n  ,\n  4,\n]',
    );
  });

  it('prints a empty typed array', () => {
    const val = new Uint32Array(0);
    expect(prettyFormat(val)).toBe('Uint32Array []');
  });

  it('prints a typed array with items', () => {
    const val = new Uint32Array(3);
    expect(prettyFormat(val)).toBe('Uint32Array [\n  0,\n  0,\n  0,\n]');
  });

  it('prints an array buffer', () => {
    const val = new ArrayBuffer(3);
    expect(prettyFormat(val)).toBe('ArrayBuffer []');
  });

  it('prints a nested array', () => {
    const val = [[1, 2, 3]];
    expect(prettyFormat(val)).toBe(
      'Array [\n  Array [\n    1,\n    2,\n    3,\n  ],\n]',
    );
  });

  it('prints true', () => {
    const val = true;
    expect(prettyFormat(val)).toBe('true');
  });

  it('prints false', () => {
    const val = false;
    expect(prettyFormat(val)).toBe('false');
  });

  it('prints an error', () => {
    const val = new Error();
    expect(prettyFormat(val)).toBe('[Error]');
  });

  it('prints a typed error with a message', () => {
    const val = new TypeError('message');
    expect(prettyFormat(val)).toBe('[TypeError: message]');
  });

  it('prints a function constructor', () => {
    /* eslint-disable no-new-func */
    const val = new Function();
    /* eslint-enable no-new-func */
    // In Node >=8.1.4: val.name === 'anonymous'
    expect(prettyFormat(val)).toBe('[Function anonymous]');
  });

  it('prints an anonymous callback function', () => {
    let val;
    function f(cb: () => void) {
      val = cb;
    }
    f(() => {});
    // In Node >=8.1.4: val.name === ''
    expect(prettyFormat(val)).toBe('[Function anonymous]');
  });

  it('prints an anonymous assigned function', () => {
    const val = () => {};
    const formatted = prettyFormat(val);
    // Node 6.5 infers function names
    expect(
      formatted === '[Function anonymous]' || formatted === '[Function val]',
    ).toBeTruthy();
  });

  it('prints a named function', () => {
    const val = function named() {};
    expect(prettyFormat(val)).toBe('[Function named]');
  });

  it('prints a named generator function', () => {
    const val = function* generate() {
      yield 1;
      yield 2;
      yield 3;
    };
    expect(prettyFormat(val)).toBe('[Function generate]');
  });

  it('can customize function names', () => {
    const val = function named() {};
    expect(
      prettyFormat(val, {
        printFunctionName: false,
      }),
    ).toBe('[Function]');
  });

  it('prints Infinity', () => {
    const val = Infinity;
    expect(prettyFormat(val)).toBe('Infinity');
  });

  it('prints -Infinity', () => {
    const val = -Infinity;
    expect(prettyFormat(val)).toBe('-Infinity');
  });

  it('prints an empty map', () => {
    const val = new Map();
    expect(prettyFormat(val)).toBe('Map {}');
  });

  it('prints a map with values', () => {
    const val = new Map();
    val.set('prop1', 'value1');
    val.set('prop2', 'value2');
    expect(prettyFormat(val)).toBe(
      'Map {\n  "prop1" => "value1",\n  "prop2" => "value2",\n}',
    );
  });

  it('prints a map with non-string keys', () => {
    const val = new Map<unknown, unknown>([
      [false, 'boolean'],
      ['false', 'string'],
      [0, 'number'],
      ['0', 'string'],
      [null, 'null'],
      ['null', 'string'],
      [undefined, 'undefined'],
      ['undefined', 'string'],
      [Symbol('description'), 'symbol'],
      ['Symbol(description)', 'string'],
      [['array', 'key'], 'array'],
      [{key: 'value'}, 'object'],
    ]);
    const expected = [
      'Map {',
      '  false => "boolean",',
      '  "false" => "string",',
      '  0 => "number",',
      '  "0" => "string",',
      '  null => "null",',
      '  "null" => "string",',
      '  undefined => "undefined",',
      '  "undefined" => "string",',
      '  Symbol(description) => "symbol",',
      '  "Symbol(description)" => "string",',
      '  Array [',
      '    "array",',
      '    "key",',
      '  ] => "array",',
      '  Object {',
      '    "key": "value",',
      '  } => "object",',
      '}',
    ].join('\n');
    expect(prettyFormat(val)).toEqual(expected);
  });

  it('prints NaN', () => {
    const val = NaN;
    expect(prettyFormat(val)).toBe('NaN');
  });

  it('prints null', () => {
    const val = null;
    expect(prettyFormat(val)).toBe('null');
  });

  it('prints a positive number', () => {
    const val = 123;
    expect(prettyFormat(val)).toBe('123');
  });

  it('prints a negative number', () => {
    const val = -123;
    expect(prettyFormat(val)).toBe('-123');
  });

  it('prints zero', () => {
    const val = 0;
    expect(prettyFormat(val)).toBe('0');
  });

  it('prints negative zero', () => {
    const val = -0;
    expect(prettyFormat(val)).toBe('-0');
  });

  it('prints a positive bigint', () => {
    const val = BigInt(123);
    expect(prettyFormat(val)).toBe('123n');
  });

  it('prints a negative bigint', () => {
    const val = BigInt(-123);
    expect(prettyFormat(val)).toBe('-123n');
  });

  it('prints zero bigint', () => {
    const val = BigInt(0);
    expect(prettyFormat(val)).toBe('0n');
  });

  it('prints negative zero bigint', () => {
    const val = BigInt(-0);
    expect(prettyFormat(val)).toBe('0n');
  });

  it('prints a date', () => {
    const val = new Date(10e11);
    expect(prettyFormat(val)).toBe('2001-09-09T01:46:40.000Z');
  });

  it('prints an invalid date', () => {
    const val = new Date(Infinity);
    expect(prettyFormat(val)).toBe('Date { NaN }');
  });

  it('prints an empty object', () => {
    const val = {};
    expect(prettyFormat(val)).toBe('Object {}');
  });

  it('prints an object with properties', () => {
    const val = {prop1: 'value1', prop2: 'value2'};
    expect(prettyFormat(val)).toBe(
      'Object {\n  "prop1": "value1",\n  "prop2": "value2",\n}',
    );
  });

  it('prints an object with properties and symbols', () => {
    const val: any = {};
    val[Symbol('symbol1')] = 'value2';
    val[Symbol('symbol2')] = 'value3';
    val.prop = 'value1';
    expect(prettyFormat(val)).toBe(
      'Object {\n  "prop": "value1",\n  Symbol(symbol1): "value2",\n  Symbol(symbol2): "value3",\n}',
    );
  });

  it('prints an object without non-enumerable properties which have string key', () => {
    const val: unknown = {
      enumerable: true,
    };
    const key = 'non-enumerable';
    Object.defineProperty(val, key, {
      enumerable: false,
      value: false,
    });
    expect(prettyFormat(val)).toBe('Object {\n  "enumerable": true,\n}');
  });

  it('prints an object without non-enumerable properties which have symbol key', () => {
    const val: unknown = {
      enumerable: true,
    };
    const key = Symbol('non-enumerable');
    Object.defineProperty(val, key, {
      enumerable: false,
      value: false,
    });
    expect(prettyFormat(val)).toBe('Object {\n  "enumerable": true,\n}');
  });

  it('prints an object with sorted properties', () => {
    // eslint-disable-next-line sort-keys
    const val = {b: 1, a: 2};
    expect(prettyFormat(val)).toBe('Object {\n  "a": 2,\n  "b": 1,\n}');
  });

  it('prints an object with keys in their original order with the appropriate comparing function', () => {
    // eslint-disable-next-line sort-keys
    const val = {b: 1, a: 2};
    const compareKeys = () => 0;
    expect(prettyFormat(val, {compareKeys})).toBe(
      'Object {\n  "b": 1,\n  "a": 2,\n}',
    );
  });

  it('prints an object with keys in their original order with compareKeys set to null', () => {
    // eslint-disable-next-line sort-keys
    const val = {b: 1, a: 2};
    expect(prettyFormat(val, {compareKeys: null})).toBe(
      'Object {\n  "b": 1,\n  "a": 2,\n}',
    );
  });

  it('prints an object with keys sorted in reverse order', () => {
    const val = {a: 1, b: 2};
    const compareKeys = (a: string, b: string) => (a > b ? -1 : 1);
    expect(prettyFormat(val, {compareKeys})).toBe(
      'Object {\n  "b": 2,\n  "a": 1,\n}',
    );
  });

  it('prints regular expressions from constructors', () => {
    const val = new RegExp('regexp');
    expect(prettyFormat(val)).toBe('/regexp/');
  });

  it('prints regular expressions from literals', () => {
    const val = /regexp/gi;
    expect(prettyFormat(val)).toBe('/regexp/gi');
  });

  it('prints regular expressions {escapeRegex: false}', () => {
    const val = /regexp\d/gi;
    expect(prettyFormat(val)).toBe('/regexp\\d/gi');
  });

  it('prints regular expressions {escapeRegex: true}', () => {
    const val = /regexp\d/gi;
    expect(prettyFormat(val, {escapeRegex: true})).toBe('/regexp\\\\d/gi');
  });

  it('escapes regular expressions nested inside object', () => {
    const obj = {test: /regexp\d/gi};
    expect(prettyFormat(obj, {escapeRegex: true})).toBe(
      'Object {\n  "test": /regexp\\\\d/gi,\n}',
    );
  });

  it('prints an empty set', () => {
    const val = new Set();
    expect(prettyFormat(val)).toBe('Set {}');
  });

  it('prints a set with values', () => {
    const val = new Set();
    val.add('value1');
    val.add('value2');
    expect(prettyFormat(val)).toBe('Set {\n  "value1",\n  "value2",\n}');
  });

  it('prints a string', () => {
    const val = 'string';
    expect(prettyFormat(val)).toBe('"string"');
  });

  it('prints and escape a string', () => {
    const val = '"\'\\';
    expect(prettyFormat(val)).toBe('"\\"\'\\\\"');
  });

  it("doesn't escape string with {escapeString: false}", () => {
    const val = '"\'\\n';
    expect(prettyFormat(val, {escapeString: false})).toBe('""\'\\n"');
  });

  it('prints a string with escapes', () => {
    expect(prettyFormat('"-"')).toBe('"\\"-\\""');
    expect(prettyFormat('\\ \\\\')).toBe('"\\\\ \\\\\\\\"');
  });

  it('prints a multiline string', () => {
    const val = ['line 1', 'line 2', 'line 3'].join('\n');
    expect(prettyFormat(val)).toBe(`"${val}"`);
  });

  it('prints a multiline string as value of object property', () => {
    const polyline = {
      props: {
        id: 'J',
        points: ['0.5,0.460', '0.5,0.875', '0.25,0.875'].join('\n'),
      },
      type: 'polyline',
    };
    const val = {
      props: {
        children: polyline,
      },
      type: 'svg',
    };
    expect(prettyFormat(val)).toEqual(
      [
        'Object {',
        '  "props": Object {',
        '    "children": Object {',
        '      "props": Object {',
        '        "id": "J",',
        '        "points": "0.5,0.460',
        '0.5,0.875',
        '0.25,0.875",',
        '      },',
        '      "type": "polyline",',
        '    },',
        '  },',
        '  "type": "svg",',
        '}',
      ].join('\n'),
    );
  });

  it('prints a symbol', () => {
    const val = Symbol('symbol');
    expect(prettyFormat(val)).toBe('Symbol(symbol)');
  });

  it('prints undefined', () => {
    const val = undefined;
    expect(prettyFormat(val)).toBe('undefined');
  });

  it('prints a WeakMap', () => {
    const val = new WeakMap();
    expect(prettyFormat(val)).toBe('WeakMap {}');
  });

  it('prints a WeakSet', () => {
    const val = new WeakSet();
    expect(prettyFormat(val)).toBe('WeakSet {}');
  });

  it('prints deeply nested objects', () => {
    const val = {prop: {prop: {prop: 'value'}}};
    expect(prettyFormat(val)).toBe(
      'Object {\n  "prop": Object {\n    "prop": Object {\n      "prop": "value",\n    },\n  },\n}',
    );
  });

  it('prints circular references', () => {
    const val: any = {};
    val.prop = val;
    expect(prettyFormat(val)).toBe('Object {\n  "prop": [Circular],\n}');
  });

  it('prints parallel references', () => {
    const inner = {};
    const val = {prop1: inner, prop2: inner};
    expect(prettyFormat(val)).toBe(
      'Object {\n  "prop1": Object {},\n  "prop2": Object {},\n}',
    );
  });

  describe('indent option', () => {
    const val = [
      {
        id: '8658c1d0-9eda-4a90-95e1-8001e8eb6036',
        text: 'Add alternative serialize API for pretty-format plugins',
        type: 'ADD_TODO',
      },
      {
        id: '8658c1d0-9eda-4a90-95e1-8001e8eb6036',
        type: 'TOGGLE_TODO',
      },
    ];
    const expected = [
      'Array [',
      '  Object {',
      '    "id": "8658c1d0-9eda-4a90-95e1-8001e8eb6036",',
      '    "text": "Add alternative serialize API for pretty-format plugins",',
      '    "type": "ADD_TODO",',
      '  },',
      '  Object {',
      '    "id": "8658c1d0-9eda-4a90-95e1-8001e8eb6036",',
      '    "type": "TOGGLE_TODO",',
      '  },',
      ']',
    ].join('\n');
    test('default implicit: 2 spaces', () => {
      expect(prettyFormat(val)).toEqual(expected);
    });
    test('default explicit: 2 spaces', () => {
      expect(prettyFormat(val, {indent: 2})).toEqual(expected);
    });

    // Tests assume that no strings in val contain multiple adjacent spaces!
    test('non-default: 0 spaces', () => {
      const indent = 0;
      expect(prettyFormat(val, {indent})).toEqual(
        expected.replace(/ {2}/g, ' '.repeat(indent)),
      );
    });
    test('non-default: 4 spaces', () => {
      const indent = 4;
      expect(prettyFormat(val, {indent})).toEqual(
        expected.replace(/ {2}/g, ' '.repeat(indent)),
      );
    });
  });

  it('can omit basic prototypes', () => {
    const val = {
      deeply: {nested: {object: {}}},
      'empty array': {},
      'empty object': {},
      'nested array': [[[]]],
      'typed array': new Uint8Array(),
    };
    expect(prettyFormat(val, {maxDepth: 2, printBasicPrototype: false})).toBe(
      [
        '{',
        '  "deeply": {',
        '    "nested": [Object],',
        '  },',
        '  "empty array": {},',
        '  "empty object": {},',
        '  "nested array": [',
        '    [Array],',
        '  ],',
        '  "typed array": Uint8Array [],',
        '}',
      ].join('\n'),
    );
  });

  describe('maxWidth option', () => {
    it('applies to arrays', () => {
      const val = Array(1_000_000).fill('x');
      expect(prettyFormat(val, {maxWidth: 5})).toEqual(
        [
          'Array [',
          '  "x",',
          '  "x",',
          '  "x",',
          '  "x",',
          '  "x",',
          '  …',
          ']',
        ].join('\n'),
      );
    });

    it('applies to sets', () => {
      const val = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
      expect(prettyFormat(val, {maxWidth: 5})).toEqual(
        ['Set {', '  1,', '  2,', '  3,', '  4,', '  5,', '  …', '}'].join(
          '\n',
        ),
      );
    });

    it('applies to maps', () => {
      const val = new Map();
      val.set('a', 1);
      val.set('b', 2);
      val.set('c', 3);
      val.set('d', 4);
      val.set('e', 5);
      val.set('f', 6);
      val.set('g', 7);
      val.set('h', 8);
      val.set('i', 9);
      val.set('j', 10);
      expect(prettyFormat(val, {maxWidth: 5})).toEqual(
        [
          'Map {',
          '  "a" => 1,',
          '  "b" => 2,',
          '  "c" => 3,',
          '  "d" => 4,',
          '  "e" => 5,',
          '  …',
          '}',
        ].join('\n'),
      );
    });
  });

  it('can customize the max depth', () => {
    const val = [
      {
        'arguments empty': returnArguments(),
        'arguments non-empty': returnArguments('arg'),
        'array literal empty': [],
        'array literal non-empty': ['item'],
        'extended array empty': new MyArray(),
        'map empty': new Map(),
        'map non-empty': new Map([['name', 'value']]),
        'object literal empty': {},
        'object literal non-empty': {name: 'value'},
        // @ts-expect-error
        'object with constructor': new MyObject('value'),
        'object without constructor': Object.create(null),
        'set empty': new Set(),
        'set non-empty': new Set(['value']),
      },
    ];
    expect(prettyFormat(val, {maxDepth: 2})).toEqual(
      [
        'Array [',
        '  Object {',
        '    "arguments empty": [Arguments],',
        '    "arguments non-empty": [Arguments],',
        '    "array literal empty": [Array],',
        '    "array literal non-empty": [Array],',
        '    "extended array empty": [MyArray],',
        '    "map empty": [Map],',
        '    "map non-empty": [Map],',
        '    "object literal empty": [Object],',
        '    "object literal non-empty": [Object],',
        '    "object with constructor": [MyObject],',
        '    "object without constructor": [Object],',
        '    "set empty": [Set],',
        '    "set non-empty": [Set],',
        '  },',
        ']',
      ].join('\n'),
    );
  });

  it('throws on invalid options', () => {
    expect(() => {
      // @ts-expect-error: Testing runtime error
      prettyFormat({}, {invalidOption: true});
    }).toThrow('Unknown option "invalidOption".');
  });

  it('supports plugins', () => {
    class Foo {}

    expect(
      prettyFormat(new Foo(), {
        plugins: [
          {
            print: () => 'class Foo',
            test(object) {
              return object.constructor.name === 'Foo';
            },
          },
        ],
      }),
    ).toBe('class Foo');
  });

  it('supports plugins that return empty string', () => {
    const val = {
      payload: '',
    };
    const options = {
      plugins: [
        {
          print(val: any) {
            return val.payload;
          },
          test(val: any) {
            return val && typeof val.payload === 'string';
          },
        },
      ],
    };
    expect(prettyFormat(val, options)).toBe('');
  });

  it('throws if plugin does not return a string', () => {
    const val = 123;
    const options: PrettyFormatOptions = {
      plugins: [
        {
          // @ts-expect-error: Testing runtime error
          print(val: unknown) {
            return val;
          },
          test() {
            return true;
          },
        },
      ],
    };
    expect(() => {
      prettyFormat(val, options);
    }).toThrow(
      'Plugin must return type "string" but instead returned "number".',
    );
  });

  it('throws PrettyFormatPluginError if test throws an error', () => {
    expect.hasAssertions();
    const options = {
      plugins: [
        {
          print: () => '',
          test() {
            throw new Error('Where is the error?');
          },
        },
      ],
    };

    try {
      prettyFormat('', options);
    } catch (error: any) {
      expect(error.name).toBe('PrettyFormatPluginError');
    }
  });

  it('throws PrettyFormatPluginError if print throws an error', () => {
    expect.hasAssertions();
    const options = {
      plugins: [
        {
          print: () => {
            throw new Error('Where is the error?');
          },
          test: () => true,
        },
      ],
    };

    try {
      prettyFormat('', options);
    } catch (error: any) {
      expect(error.name).toBe('PrettyFormatPluginError');
    }
  });

  it('throws PrettyFormatPluginError if serialize throws an error', () => {
    expect.hasAssertions();
    const options = {
      plugins: [
        {
          serialize: () => {
            throw new Error('Where is the error?');
          },
          test: () => true,
        },
      ],
    };

    try {
      prettyFormat('', options);
    } catch (error: any) {
      expect(error.name).toBe('PrettyFormatPluginError');
    }
  });

  it('supports plugins with deeply nested arrays (#24)', () => {
    const val = [
      [1, 2],
      [3, 4],
    ];
    expect(
      prettyFormat(val, {
        plugins: [
          {
            print(val: unknown, print: any) {
              return (val as Array<unknown>)
                .map(item => print(item))
                .join(' - ');
            },
            test(val: unknown) {
              return Array.isArray(val);
            },
          },
        ],
      }),
    ).toBe('1 - 2 - 3 - 4');
  });

  it('should call plugins on nested basic values', () => {
    const val = {prop: 42};
    expect(
      prettyFormat(val, {
        plugins: [
          {
            print(_val, _print) {
              return '[called]';
            },
            test(val) {
              return typeof val === 'string' || typeof val === 'number';
            },
          },
        ],
      }),
    ).toBe('Object {\n  [called]: [called],\n}');
  });

  it('prints objects with no constructor', () => {
    expect(prettyFormat(Object.create(null))).toBe('Object {}');
  });

  it('prints identity-obj-proxy with string constructor', () => {
    const val = Object.create(null);
    val.constructor = 'constructor'; // mock the mock object :)
    const expected = [
      'Object {', // Object instead of undefined
      '  "constructor": "constructor",',
      '}',
    ].join('\n');
    expect(prettyFormat(val)).toEqual(expected);
  });

  it('calls toJSON and prints its return value', () => {
    expect(
      prettyFormat({
        toJSON: () => ({value: false}),
        value: true,
      }),
    ).toBe('Object {\n  "value": false,\n}');
  });

  it('calls toJSON and prints an internal representation.', () => {
    expect(
      prettyFormat({
        toJSON: () => '[Internal Object]',
        value: true,
      }),
    ).toBe('"[Internal Object]"');
  });

  it('calls toJSON only on functions', () => {
    expect(
      prettyFormat({
        toJSON: false,
        value: true,
      }),
    ).toBe('Object {\n  "toJSON": false,\n  "value": true,\n}');
  });

  it('does not call toJSON recursively', () => {
    expect(
      prettyFormat({
        toJSON: () => ({toJSON: () => ({value: true})}),
        value: false,
      }),
    ).toBe('Object {\n  "toJSON": [Function toJSON],\n}');
  });

  it('calls toJSON on Sets', () => {
    const set = new Set([1]);
    (set as any).toJSON = () => 'map';
    expect(prettyFormat(set)).toBe('"map"');
  });

  it('disables toJSON calls through options', () => {
    const value = {apple: 'banana', toJSON: jest.fn(() => '1')};
    const name = value.toJSON.name || 'anonymous';
    const set = new Set([value]);
    (set as any).toJSON = jest.fn(() => 'map');
    expect(
      prettyFormat(set, {
        callToJSON: false,
      }),
    ).toBe(
      `Set {\n  Object {\n    "apple": "banana",\n    "toJSON": [Function ${name}],\n  },\n}`,
    );
    expect((set as any).toJSON).not.toHaveBeenCalled();
    expect(value.toJSON).not.toHaveBeenCalled();
  });

  describe('min', () => {
    it('prints some basic values in min mode', () => {
      const val = {
        boolean: [false, true],
        null: null,
        number: [0, -0, 123, -123, Infinity, -Infinity, NaN],
        string: ['', 'non-empty'],
        undefined,
      };
      expect(
        prettyFormat(val, {
          min: true,
        }),
      ).toBe(
        `{${[
          '"boolean": [false, true]',
          '"null": null',
          '"number": [0, -0, 123, -123, Infinity, -Infinity, NaN]',
          '"string": ["", "non-empty"]',
          '"undefined": undefined',
        ].join(', ')}}`,
      );
    });

    it('prints some complex values in min mode', () => {
      const val = {
        'arguments empty': returnArguments(),
        'arguments non-empty': returnArguments('arg'),
        'array literal empty': [],
        'array literal non-empty': ['item'],
        'extended array empty': new MyArray(),
        'map empty': new Map(),
        'map non-empty': new Map([['name', 'value']]),
        'object literal empty': {},
        'object literal non-empty': {name: 'value'},
        // @ts-expect-error
        'object with constructor': new MyObject('value'),
        'object without constructor': Object.create(null),
        'set empty': new Set(),
        'set non-empty': new Set(['value']),
      };
      expect(
        prettyFormat(val, {
          min: true,
        }),
      ).toBe(
        `{${[
          '"arguments empty": []',
          '"arguments non-empty": ["arg"]',
          '"array literal empty": []',
          '"array literal non-empty": ["item"]',
          '"extended array empty": []',
          '"map empty": Map {}',
          '"map non-empty": Map {"name" => "value"}',
          '"object literal empty": {}',
          '"object literal non-empty": {"name": "value"}',
          '"object with constructor": {"name": "value"}',
          '"object without constructor": {}',
          '"set empty": Set {}',
          '"set non-empty": Set {"value"}',
        ].join(', ')}}`,
      );
    });

    it('does not allow indent !== 0 in min mode', () => {
      expect(() => {
        prettyFormat(1, {indent: 1, min: true});
      }).toThrow('Options "min" and "indent" cannot be used together.');
    });
  });
});
