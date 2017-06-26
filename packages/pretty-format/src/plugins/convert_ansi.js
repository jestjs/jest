/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  Colors,
  Indent,
  PluginOptions,
  Print,
  Plugin,
} from 'types/PrettyFormat';

import ansiRegex from 'ansi-regex';
import style from 'ansi-styles';

const toHumanReadableAnsi = text => {
  return text.replace(ansiRegex(), (match, offset, string) => {
    switch (match) {
      case style.red.close:
      case style.green.close:
      case style.reset.open:
      case style.reset.close:
        return '</>';
      case style.red.open:
        return '<red>';
      case style.green.open:
        return '<green>';
      case style.dim.open:
        return '<dim>';
      case style.bold.open:
        return '<bold>';
      default:
        return '';
    }
  });
};

const test = (value: any) =>
  typeof value === 'string' && value.match(ansiRegex());

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: PluginOptions,
  colors: Colors,
) => print(toHumanReadableAnsi(val));

module.exports = ({print, test}: Plugin);
