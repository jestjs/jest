/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  const mockObject = {
    calls: val.mock.calls,
    name: val.getMockName(),
  };

  return printer(mockObject, config, indentation, depth, refs);
};

export const test = (val: any) => val && !!val._isMockFunction;

export default ({serialize, test}: NewPlugin);
