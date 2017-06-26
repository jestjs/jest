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

import printImmutable from './lib/print_immutable';

const IS_RECORD = '@@__IMMUTABLE_RECORD__@@';
const test = (maybeRecord: any) => !!(maybeRecord && maybeRecord[IS_RECORD]);

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: PluginOptions,
  colors: Colors,
) => printImmutable(val, print, indent, opts, colors, 'Record', true);

module.exports = ({print, test}: Plugin);
