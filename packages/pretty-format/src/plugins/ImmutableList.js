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

import type {Colors, Indent, Options, Print} from '../types.js';

const printImmutable = require('./lib/printImmutable');

const IS_LIST = '@@__IMMUTABLE_LIST__@@';
const test = (maybeList: any) => !!(maybeList && maybeList[IS_LIST]);

const print = (
  val: any,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
) => printImmutable(val, print, indent, opts, colors, 'List', false);

module.exports = {print, test};
