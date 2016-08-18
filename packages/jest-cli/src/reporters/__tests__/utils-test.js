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

const {wrapAnsiString} = require('../utils');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');

describe('wrapAnsiString()', () => {
  it('wraps a long string containing ansi chars', () => {
    const string = `abcde ${chalk.red.bold('red-bold')} 1234456` +
     `${chalk.dim('bcd')} 123ttttttththththththththththththththththththththth` +
     `tetetetetettetetetetetetetete${chalk.underline.bold('stnhsnthsnth')}ssot`;
    expect(wrapAnsiString(string, 10)).toMatchSnapshot();
    expect(stripAnsi(wrapAnsiString(string, 10))).toMatchSnapshot();
  });
});
