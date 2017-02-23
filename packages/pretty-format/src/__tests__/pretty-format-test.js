/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable max-len */

'use strict';

const prettyFormat = require('../');

const React = require('react');
const ReactTestComponent = require('../plugins/ReactTestComponent');
const ReactElement = require('../plugins/ReactElement');
const renderer = require('react-test-renderer');

function returnArguments() {
  return arguments;
}

function assertPrintedJSX(actual, expected, opts) {
  expect(
    prettyFormat(actual, Object.assign({
      plugins: [ReactElement],
    }, opts))
  ).toEqual(expected);
  expect(
    prettyFormat(renderer.create(actual).toJSON(), Object.assign({
      plugins: [ReactTestComponent, ReactElement],
    }, opts))
  ).toEqual(expected);
}

describe('prettyFormat()', () => {
  it('prints empty arguments', () => {
    const val = returnArguments();
    expect(prettyFormat(val)).toEqual('Arguments []');
  });

  it('prints arguments', () => {
    const val = returnArguments(1, 2, 3);
    expect(prettyFormat(val)).toEqual('Arguments [\n  1,\n  2,\n  3,\n]');
  });

  it('prints an empty array', () => {
    const val = [];
    expect(prettyFormat(val)).toEqual('Array []');
  });

  it('prints an array with items', () => {
    const val = [1, 2, 3];
    expect(prettyFormat(val)).toEqual('Array [\n  1,\n  2,\n  3,\n]');
  });

  it('prints a typed array', () => {
    const val = new Uint32Array(3);
    expect(prettyFormat(val)).toEqual('Uint32Array [\n  0,\n  0,\n  0,\n]');
  });

  it('prints an array buffer', () => {
    const val = new ArrayBuffer(3);
    expect(prettyFormat(val)).toEqual('ArrayBuffer []');
  });

  it('prints a nested array', () => {
    const val = [[1, 2, 3]];
    expect(prettyFormat(val)).toEqual('Array [\n  Array [\n    1,\n    2,\n    3,\n  ],\n]');
  });

  it('prints true', () => {
    const val = true;
    expect(prettyFormat(val)).toEqual('true');
  });

  it('prints false', () => {
    const val = false;
    expect(prettyFormat(val)).toEqual('false');
  });

  it('prints an error', () => {
    const val = new Error();
    expect(prettyFormat(val)).toEqual('[Error]');
  });

  it('prints a typed error with a message', () => {
    const val = new TypeError('message');
    expect(prettyFormat(val)).toEqual('[TypeError: message]');
  });

  it('prints a function constructor', () => {
    /* eslint-disable no-new-func */
    const val = new Function();
    /* eslint-enable no-new-func */
    expect(prettyFormat(val)).toEqual('[Function anonymous]');
  });

  it('prints an anonymous function', () => {
    const val = () => {};
    const formatted = prettyFormat(val);
    // Node 6.5 infers function names
    expect(
      formatted === '[Function anonymous]' ||
      formatted === '[Function val]'
    ).toBeTruthy();
  });

  it('prints a named function', () => {
    const val = function named() {};
    expect(prettyFormat(val)).toEqual('[Function named]');
  });

  it('can customize function names', () => {
    const val = function named() {};
    expect(prettyFormat(val, {
      printFunctionName: false,
    })).toEqual('[Function]');
  });

  it('prints Infinity', () => {
    const val = Infinity;
    expect(prettyFormat(val)).toEqual('Infinity');
  });

  it('prints -Infinity', () => {
    const val = -Infinity;
    expect(prettyFormat(val)).toEqual('-Infinity');
  });

  it('prints an empty map', () => {
    const val = new Map();
    expect(prettyFormat(val)).toEqual('Map {}');
  });

  it('prints a map with values', () => {
    const val = new Map();
    val.set('prop1', 'value1');
    val.set('prop2', 'value2');
    expect(prettyFormat(val)).toEqual('Map {\n  "prop1" => "value1",\n  "prop2" => "value2",\n}');
  });

  it('prints a map with non-string keys', () => {
    const val = new Map();
    val.set({prop: 'value'}, {prop: 'value'});
    expect(prettyFormat(val)).toEqual('Map {\n  Object {\n    "prop": "value",\n  } => Object {\n    "prop": "value",\n  },\n}');
  });

  it('prints NaN', () => {
    const val = NaN;
    expect(prettyFormat(val)).toEqual('NaN');
  });

  it('prints null', () => {
    const val = null;
    expect(prettyFormat(val)).toEqual('null');
  });

  it('prints a number', () => {
    const val = 123;
    expect(prettyFormat(val)).toEqual('123');
  });

  it('prints a date', () => {
    const val = new Date(10e11);
    expect(prettyFormat(val)).toEqual('2001-09-09T01:46:40.000Z');
  });

  it('prints an empty object', () => {
    const val = {};
    expect(prettyFormat(val)).toEqual('Object {}');
  });

  it('prints an object with properties', () => {
    const val = {prop1: 'value1', prop2: 'value2'};
    expect(prettyFormat(val)).toEqual('Object {\n  "prop1": "value1",\n  "prop2": "value2",\n}');
  });

  it('prints an object with properties and symbols', () => {
    const val = {prop: 'value1'};
    val[Symbol('symbol1')] = 'value2';
    val[Symbol('symbol2')] = 'value3';
    expect(prettyFormat(val)).toEqual('Object {\n  "prop": "value1",\n  Symbol(symbol1): "value2",\n  Symbol(symbol2): "value3",\n}');
  });

  it('prints an object with sorted properties', () => {
    /* eslint-disable sort-keys */
    const val = {b: 1, a: 2};
    /* eslint-enable sort-keys */
    expect(prettyFormat(val)).toEqual('Object {\n  "a": 2,\n  "b": 1,\n}');
  });

  it('prints regular expressions from constructors', () => {
    const val = new RegExp('regexp');
    expect(prettyFormat(val)).toEqual('/regexp/');
  });

  it('prints regular expressions from literals', () => {
    const val = /regexp/ig;
    expect(prettyFormat(val)).toEqual('/regexp/gi');
  });

  it('escapes regular expressions', () => {
    const val = /regexp\d/ig;
    expect(prettyFormat(val, {escapeRegex: true})).toEqual('/regexp\\\\d/gi');
  });

  it('escapes regular expressions nested inside object', () => {
    const obj = {test: /regexp\d/ig};
    expect(prettyFormat(obj, {escapeRegex: true})).toEqual('Object {\n  "test": /regexp\\\\d/gi,\n}');
  });

  it('prints an empty set', () => {
    const val = new Set();
    expect(prettyFormat(val)).toEqual('Set {}');
  });

  it('prints a set with values', () => {
    const val = new Set();
    val.add('value1');
    val.add('value2');
    expect(prettyFormat(val)).toEqual('Set {\n  "value1",\n  "value2",\n}');
  });

  it('prints a string', () => {
    const val = 'string';
    expect(prettyFormat(val)).toEqual('"string"');
  });

  it('prints and escape a string', () => {
    const val = '"\'\\';
    expect(prettyFormat(val)).toEqual('"\\"\'\\\\"');
  });

  it('prints a string with escapes', () => {
    expect(prettyFormat('\"-\"'), '"\\"-\\""');
    expect(prettyFormat('\\ \\\\'), '"\\\\ \\\\\\\\"');
  });

  it('prints a symbol', () => {
    const val = Symbol('symbol');
    expect(prettyFormat(val)).toEqual('Symbol(symbol)');
  });

  it('prints undefined', () => {
    const val = undefined;
    expect(prettyFormat(val)).toEqual('undefined');
  });

  it('prints a WeakMap', () => {
    const val = new WeakMap();
    expect(prettyFormat(val)).toEqual('WeakMap {}');
  });

  it('prints a WeakSet', () => {
    const val = new WeakSet();
    expect(prettyFormat(val)).toEqual('WeakSet {}');
  });

  it('prints deeply nested objects', () => {
    const val = {prop: {prop: {prop: 'value'}}};
    expect(prettyFormat(val)).toEqual('Object {\n  "prop": Object {\n    "prop": Object {\n      "prop": "value",\n    },\n  },\n}');
  });

  it('prints circular references', () => {
    const val = {};
    val.prop = val;
    expect(prettyFormat(val)).toEqual('Object {\n  "prop": [Circular],\n}');
  });

  it('prints parallel references', () => {
    const inner = {};
    const val = {prop1: inner, prop2: inner};
    expect(prettyFormat(val)).toEqual('Object {\n  "prop1": Object {},\n  "prop2": Object {},\n}');
  });

  it('can customize indent', () => {
    const val = {prop: 'value'};
    expect(prettyFormat(val, {indent: 4})).toEqual('Object {\n    "prop": "value",\n}');
  });

  it('can customize the max depth', () => {
    const val = {prop: {prop: {prop: {}}}};
    expect(prettyFormat(val, {maxDepth: 2})).toEqual('Object {\n  "prop": Object {\n    "prop": [Object],\n  },\n}');
  });

  it('throws on invalid options', () => {
    expect(() => {
      prettyFormat({}, {invalidOption: true});
    }).toThrow();
  });

  it('supports plugins', () => {
    function Foo() {}

    expect(prettyFormat(new Foo(), {
      plugins: [{
        print: () => 'class Foo',
        test(object) {
          return object.constructor.name === 'Foo';
        },
      }],
    })).toEqual('class Foo');
  });

  it('supports plugins with deeply nested arrays (#24)', () => {
    const val = [[1, 2], [3, 4]];
    expect(prettyFormat(val, {
      plugins: [{
        print(val, print) {
          return val.map(item => print(item)).join(' - ');
        },
        test(val) {
          return Array.isArray(val);
        },
      }],
    })).toEqual('1 - 2 - 3 - 4');
  });

  it('prints objects with no constructor', () => {
    expect(prettyFormat(Object.create(null))).toEqual('Object {}');
  });

  it('calls toJSON and prints its return value', () => {
    expect(prettyFormat({
      toJSON: () => ({value: false}),
      value: true,
    })).toEqual('Object {\n  "value": false,\n}');
  });

  it('calls toJSON and prints an internal representation.', () => {
    expect(prettyFormat({
      toJSON: () => '[Internal Object]',
      value: true,
    })).toEqual('"[Internal Object]"');
  });

  it('calls toJSON only on functions', () => {
    expect(prettyFormat({
      toJSON: false,
      value: true,
    })).toEqual('Object {\n  "toJSON": false,\n  "value": true,\n}');
  });

  it('calls toJSON recursively', () => {
    expect(prettyFormat({
      toJSON: () => ({toJSON: () => ({value: true})}),
      value: false,
    })).toEqual('Object {\n  "value": true,\n}');
  });

  it('calls toJSON on Sets', () => {
    const set = new Set([1]);
    set.toJSON = () => 'map';
    expect(prettyFormat(set)).toEqual('"map"');
  });

  it('disables toJSON calls through options', () => {
    const value = {apple: 'banana', toJSON: jest.fn(() => '1')};
    const name = value.toJSON.name || 'anonymous';
    const set = new Set([value]);
    set.toJSON = jest.fn(() => 'map');
    expect(prettyFormat(set, {
      callToJSON: false,
    })).toEqual('Set {\n  Object {\n    \"apple\": \"banana\",\n    \"toJSON\": [Function ' + name + '],\n  },\n}');
    expect(set.toJSON).not.toBeCalled();
    expect(value.toJSON).not.toBeCalled();
  });

  describe('min', () => {
    it('prints in min mode', () => {
      const val = {prop: [1, 2, Infinity, new Set([1, 2, 3])]};
      expect(prettyFormat(val, {
        min: true,
      })).toEqual('{"prop": [1, 2, Infinity, Set {1, 2, 3}]}');
    });

    it('does not allow indent !== 0 in min mode', () => {
      expect(() => {
        prettyFormat(1, {indent: 1, min: true});
      }).toThrow();
    });
  });

  describe('ReactTestComponent and ReactElement plugins', () => {
    it('supports a single element with no props or children', () => {
      assertPrintedJSX(
        React.createElement('Mouse'),
        '<Mouse />'
      );
    });

    it('supports a single element with no props', () => {
      assertPrintedJSX(
        React.createElement('Mouse', null, 'Hello World'),
        '<Mouse>\n  Hello World\n</Mouse>'
      );
    });

    it('supports a single element with number children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', null, 4),
        '<Mouse>\n  4\n</Mouse>'
      );
    });

    it('supports a single element with mixed children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', null,
          [[1, null], 2, undefined, [false, [3]]]
        ),
        '<Mouse>\n  1\n  2\n  3\n</Mouse>'
      );
    });

    it('supports props with strings', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {style: 'color:red'}),
        '<Mouse\n  style="color:red"\n/>'
      );
    });

    it('supports props with numbers', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {size: 5}),
        '<Mouse\n  size={5}\n/>'
      );
    });

    it('supports a single element with a function prop', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {onclick: function onclick() {}}),
        '<Mouse\n  onclick={[Function onclick]}\n/>'
      );
    });

    it('supports a single element with a object prop', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {customProp: {one: '1', two: 2}}),
        '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n/>'
      );
    });

    it('supports an element with and object prop and children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {customProp: {one: '1', two: 2}},
          React.createElement('Mouse')
        ),
        '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n>\n  <Mouse />\n</Mouse>'
      );
    });

    it('supports an element with complex props and mixed children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
          'HELLO',
          React.createElement('Mouse'), 'CIAO'
        ),
        '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  onclick={[Function onclick]}\n>\n  HELLO\n  <Mouse />\n  CIAO\n</Mouse>'
      );
    });

    it('escapes children properly', () => {
      assertPrintedJSX(
        React.createElement('Mouse', null,
          '\"-\"',
          React.createElement('Mouse'),
          '\\ \\\\'
        ),
        '<Mouse>\n  "-"\n  <Mouse />\n  \\ \\\\\n</Mouse>'
      );
    });

    it('supports everything all together', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
          'HELLO',
          React.createElement('Mouse', {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
            'HELLO',
            React.createElement('Mouse'),
            'CIAO'
          ),
          'CIAO'
        ),
        '<Mouse\n  customProp={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  onclick={[Function onclick]}\n>\n  HELLO\n  <Mouse\n    customProp={\n      Object {\n        "one": "1",\n        "two": 2,\n      }\n    }\n    onclick={[Function onclick]}\n  >\n    HELLO\n    <Mouse />\n    CIAO\n  </Mouse>\n  CIAO\n</Mouse>'
      );
    });

    it('sorts props in nested components', () => {
      /* eslint-disable sort-keys */
      assertPrintedJSX(
        React.createElement(
          'Mouse',
          {
            zeus: 'kentaromiura watched me fix this',
            abc: {
              one: '1',
              two: 2,
            },
          },
          React.createElement(
            'Mouse',
            {
              xyz: 123,
              acbd: {
                one: '1',
                two: 2,
              },
            },
            'NESTED'
          )
        ),
        '<Mouse\n  abc={\n    Object {\n      "one": "1",\n      "two": 2,\n    }\n  }\n  zeus="kentaromiura watched me fix this"\n>\n  <Mouse\n    acbd={\n      Object {\n        "one": "1",\n        "two": 2,\n      }\n    }\n    xyz={123}\n  >\n    NESTED\n  </Mouse>\n</Mouse>'
      );
      /* eslint-enable sort-keys */
    });

    it('supports a single element with React elements as props', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement('div'),
        }),
        '<Mouse\n  prop={<div />}\n/>'
      );
    });

    it('supports a single element with React elements with props', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement('div', {foo: 'bar'}),
        }),
        '<Mouse\n  prop={\n    <div\n      foo="bar"\n    />\n  }\n/>'
      );
    });

    it('supports a single element with custom React elements with props', () => {
      function Cat() {
        return React.createElement('div');
      }
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement(Cat, {foo: 'bar'}),
        }),
        '<Mouse\n  prop={\n    <Cat\n      foo="bar"\n    />\n  }\n/>'
      );
    });

    it('supports a single element with custom React elements with a child', () => {
      function Cat(props) {
        return React.createElement('div', props);
      }
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement(Cat, {}, React.createElement('div')),
        }),
        '<Mouse\n  prop={\n    <Cat>\n      <div />\n    </Cat>\n  }\n/>'
      );
    });

    it('supports a single element with React elements with a child', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement('div', null, 'mouse'),
        }),
        '<Mouse\n  prop={\n    <div>\n      mouse\n    </div>\n  }\n/>'
      );
    });

    it('supports a single element with React elements with children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement('div', null, 'mouse', React.createElement('span', null, 'rat')),
        }),
        '<Mouse\n  prop={\n    <div>\n      mouse\n      <span>\n        rat\n      </span>\n    </div>\n  }\n/>'
      );
    });

    it('supports a single element with React elements with array children', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {
          prop: React.createElement('div', null,
            'mouse',
            [
              React.createElement('span', {key: 1}, 'rat'),
              React.createElement('span', {key: 2}, 'cat'),
            ],
          ),
        }),
        '<Mouse\n  prop={\n    <div>\n      mouse\n      <span>\n        rat\n      </span>\n      <span>\n        cat\n      </span>\n    </div>\n  }\n/>'
      );
    });

    it('uses the supplied line seperator for min mode', () => {
      assertPrintedJSX(
        React.createElement('Mouse', {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
          'HELLO',
          React.createElement('Mouse', {customProp: {one: '1', two: 2}, onclick: function onclick() {}},
            'HELLO',
            React.createElement('Mouse'),
            'CIAO'
          ),
          'CIAO'
        ),
        '<Mouse customProp={{"one": "1", "two": 2}} onclick={[Function onclick]}>HELLO<Mouse customProp={{"one": "1", "two": 2}} onclick={[Function onclick]}>HELLO<Mouse />CIAO</Mouse>CIAO</Mouse>',
        {min: true}
      );
    });

    it('ReactElement plugin highlights syntax', () => {
      const jsx = React.createElement('Mouse', {
        prop: React.createElement('div', null, 'mouse', React.createElement('span', null, 'rat')),
      });
      expect(
        prettyFormat(jsx, {
          highlight: true,
          plugins: [ReactElement],
        }),
      ).toMatchSnapshot();
    });

    it('ReactTestComponent plugin highlights syntax', () => {
      const jsx = React.createElement('Mouse', {
        prop: React.createElement('div', null, 'mouse', React.createElement('span', null, 'rat')),
      });
      expect(
        prettyFormat(renderer.create(jsx).toJSON(), {
          highlight: true,
          plugins: [ReactTestComponent, ReactElement],
        })
      ).toMatchSnapshot();
    });
  });
});
