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

const printImmutable = require('./lib/printImmutable');

const IS_SET = '@@__IMMUTABLE_SET__@@';
const IS_ORDERED = '@@__IMMUTABLE_ORDERED__@@';
const isSet = (maybeSet: any) => !!maybeSet[IS_SET];
const isNotOrdered = (maybeOrdered: any) => !maybeOrdered[IS_ORDERED];

const test = (maybeSet: any) => 
  !!(maybeSet && isSet(maybeSet) && isNotOrdered(maybeSet));

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
) => printImmutable(val, print, indent, opts, colors, 'Set', false);

module.exports = ({print, test}: Plugin);
