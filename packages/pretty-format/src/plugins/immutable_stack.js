/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Colors, Indent, Options, Print, Plugin} from 'types/PrettyFormat';

import printImmutable from './lib/print_immutable';

const IS_STACK = '@@__IMMUTABLE_STACK__@@';
const test = (maybeStack: any) => !!(maybeStack && maybeStack[IS_STACK]);

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
) => printImmutable(val, print, indent, opts, colors, 'Stack', false);

module.exports = ({print, test}: Plugin);
