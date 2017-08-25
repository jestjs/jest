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

import {
  printChildren,
  printElement,
  printElementAsLeaf,
  printProps,
} from './lib/markup';

const elementSymbol = Symbol.for('react.element');

// Given element.props.children, or subtree during recursive traversal,
// return flattened array of children.
const getChildren = (arg, children = []) => {
  if (Array.isArray(arg)) {
    arg.forEach(item => {
      getChildren(item, children);
    });
  } else if (arg != null && arg !== false) {
    children.push(arg);
  }
  return children;
};

const getType = element => {
  if (typeof element.type === 'string') {
    return element.type;
  }
  if (typeof element.type === 'function') {
    return element.type.displayName || element.type.name || 'Unknown';
  }
  return 'UNDEFINED';
};

export const serialize = (
  element: React$Element<*>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string =>
  ++depth > config.maxDepth
    ? printElementAsLeaf(getType(element), config)
    : printElement(
        getType(element),
        printProps(
          Object.keys(element.props).filter(key => key !== 'children').sort(),
          element.props,
          config,
          indentation + config.indent,
          depth,
          refs,
          printer,
        ),
        printChildren(
          getChildren(element.props.children),
          config,
          indentation + config.indent,
          depth,
          refs,
          printer,
        ),
        config,
        indentation,
      );

export const test = (val: any) => val && val.$$typeof === elementSymbol;

export default ({serialize, test}: NewPlugin);
