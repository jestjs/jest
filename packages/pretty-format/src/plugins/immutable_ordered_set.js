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

import {printImmutableValues} from './lib/immutable';

const IS_SET = '@@__IMMUTABLE_SET__@@';
const IS_ORDERED = '@@__IMMUTABLE_ORDERED__@@';
export const test = (maybeOrderedSet: any) =>
  maybeOrderedSet && maybeOrderedSet[IS_SET] && maybeOrderedSet[IS_ORDERED];

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) =>
  printImmutableValues(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    'OrderedSet',
  );

export default ({serialize, test}: NewPlugin);
