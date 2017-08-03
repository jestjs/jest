/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

import printImmutable from './lib/print_immutable';

const IS_LIST = '@@__IMMUTABLE_LIST__@@';
export const test = (maybeList: any) => !!(maybeList && maybeList[IS_LIST]);

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) =>
  printImmutable(val, config, indentation, depth, refs, printer, 'List', false);

export default ({serialize, test}: NewPlugin);
