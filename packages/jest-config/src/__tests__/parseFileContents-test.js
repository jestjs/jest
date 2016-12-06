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

jest.mock('jest-resolve');

//const path = require('path');
const parseFileContents = require('../parseFileContents');

describe('good json, config object', () => {
  const goodJson = `{
    "bail": false,
    "verbose": true
  }`;

  it('returns a config object if your json is not bad', () => {
    const expected = {
      bail: false,
      verbose: true,
    };

    expect(parseFileContents('good-config.json', goodJson)).toEqual(expected);
  });
});

describe('bad json, helpful message', () => {
  const badJson = `{
    bail: false
    verbose: true,
  }`;

  it('tells which line of your json config is bad', () => {
    const expected = `Jest: Failed to parse config file bad-config.json.
Error: Parse error on line 1:
{    bail: false    verb
-----^
Expecting 'STRING', '}', got 'undefined'`;

    expect(() => {
      return parseFileContents('bad-config.json', badJson);
    }).toThrow(expected);
  });
});
