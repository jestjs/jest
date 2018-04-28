/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

import {printElementAsLeaf} from './lib/markup';

const forwardRefSymbol = Symbol.for('react.forward_ref');

const getType = element => {
  if (element.$$typeof === forwardRefSymbol) {
    const functionName =
      element.render.displayName || element.render.name || '';

    return functionName !== ''
      ? 'ForwardRef(' + functionName + ')'
      : 'ForwardRef';
  }
  return 'UNDEFINED';
};

export const serialize = (
  element: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => printElementAsLeaf(getType(element), config);

export const test = (val: any) => val && val.$$typeof === forwardRefSymbol;

export default ({serialize, test}: NewPlugin);
