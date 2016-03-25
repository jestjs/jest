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

const jasmine = require('jest-jasmine1/vendor/jasmine-1.3.0').jasmine;
const jasmine2Require = require('jest-jasmine2/vendor/jasmine-2.3.4.js');
const jasmine2 = jasmine2Require.core(jasmine2Require);

const JasmineFormatter = require('../JasmineFormatter');

const jsdom = require('jsdom').jsdom;
const fixture = '<html><body id="foo"></body></html>';

let formatter;

describe('JasmineFormatter', () => {
  describe('pretty printer', () => {
    it('should handle JSDOM nodes with Jasmine 1.x', () => {
      formatter = new JasmineFormatter(jasmine);

      expect(() => formatter.prettyPrint(jsdom(fixture).body)).not.toThrow();
    });

    it('should handle JSDOM nodes with Jasmine 2.x', () => {
      formatter = new JasmineFormatter(jasmine2);

      expect(() => formatter.prettyPrint(jsdom(fixture).body)).not.toThrow();
    });
  });
});
