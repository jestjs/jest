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

const IS_STACK = '@@__IMMUTABLE_STACK__@@';
export const test = (maybeStack: any) => !!(maybeStack && maybeStack[IS_STACK]);

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) =>
  printImmutable(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    'Stack',
    false,
  );

export default ({serialize, test}: NewPlugin);
