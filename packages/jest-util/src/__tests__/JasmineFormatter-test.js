/**
 * Copyright (c) 2016-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

const chalk = require('chalk');
const jasmine = require('../../../jest-jasmine1/vendor/jasmine-1.3.0').jasmine;
const jasmine2Require = require('../../../jest-jasmine2/vendor/jasmine-2.4.1.js');
const jasmine2 = jasmine2Require.core(jasmine2Require);

const JasmineFormatter = require('../JasmineFormatter');

const jsdom = require('jsdom').jsdom;
const fixture = '<html><body id="foo"></body></html>';

let formatter;

describe('JasmineFormatter', () => {
  describe('pretty printer', () => {
    beforeEach(() => {
      formatter = new JasmineFormatter(jasmine2, {global: {}});
    });

    it('should handle JSDOM nodes with Jasmine 1.x', () => {
      formatter = new JasmineFormatter(jasmine, {global: {}});

      expect(() => formatter.prettyPrint(jsdom(fixture).body)).not.toThrow();
    });

    it('should handle JSDOM nodes with Jasmine 2.x', () => {
      expect(() => formatter.prettyPrint(jsdom(fixture).body)).not.toThrow();
    });

    it('should pretty print Maps', () => {
      const map = new Map([['foo', {
        bar: 'baz',
      }]]);

      const printed = formatter.prettyPrint(map);
      const expected = 'Map {\n' +
      '| foo: {\n' +
      '| | bar: \'baz\'\n' +
      '| }\n' +
      '}';
      expect(printed).toBe(expected.replace(/\|/g, chalk.gray('|')));
    });

    it('should pretty print Sets', () => {
      const set = new Set(['a', 'b', 'c']);
      const printed = formatter.prettyPrint(set);
      expect(printed).toBe(`Set [\n'a', 'b', 'c'\n]`);
    });

    it('should pretty print mix of Sets, Maps and plain objects', () => {
      const map = new Map([['foo', {
        bar: 'baz',
        set: new Set(['a', 'b', {
          foo: 'bar',
          baz: 'foo',
        }]),
      }]]);
      const printed = formatter.prettyPrint(map);
      const expected = 'Map {\n' +
      '| foo: {\n' +
      '| | bar: \'baz\',\n' +
      '| | set: Set [\n' +
      '| | \'a\', \'b\', {\n' +
      '| | | | baz: \'foo\',\n' +
      '| | | | foo: \'bar\'\n' +
      '| | | }\n' +
      '| | ]\n' +
      '| }\n' +
      '}';
      expect(printed).toBe(expected.replace(/\|/g, chalk.gray('|')));
    });
  });
});
