/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Colors, Indent, Options, Print, Plugin} from '../types.js';

const toHumanReadableAnsi = text => {
  const style = require('ansi-styles');
  const reg = require('ansi-regex');
  return text.replace(reg(), (match, offset, string) => {
    switch (match) {
      case style.red.close:
      case style.green.close:
        return '</>';
      case style.red.open:
        return '<red>';
      case style.green.open:
        return '<green>';
      default:
        return '';
    }
  });
};

const test = (value: any) => value[Symbol.for('toThrowErrorMatchingSnapshot')];

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
) => print(toHumanReadableAnsi(val));

module.exports = ({print, test}: Plugin);
