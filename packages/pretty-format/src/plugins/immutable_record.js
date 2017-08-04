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

import {printImmutableRecord} from './lib/immutable';

const IS_RECORD = '@@__IMMUTABLE_RECORD__@@';
export const test = (maybeRecord: any) =>
  !!(maybeRecord && maybeRecord[IS_RECORD]);

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) => printImmutableRecord(val, config, indentation, depth, refs, printer);

export default ({serialize, test}: NewPlugin);
