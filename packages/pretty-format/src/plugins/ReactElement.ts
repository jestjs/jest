/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as ReactIs from 'react-is';
import {Config, NewPlugin, Printer, Refs} from '../types';

import {
  printChildren,
  printElement,
  printElementAsLeaf,
  printProps,
} from './lib/markup';

const elementSymbol = Symbol.for('react.element');

// Given element.props.children, or subtree during recursive traversal,
// return flattened array of children.
const getChildren = (arg: Array<any>, children = []) => {
  if (Array.isArray(arg)) {
    arg.forEach(item => {
      getChildren(item, children);
    });
  } else if (arg != null && arg !== false) {
    children.push(arg);
  }
  return children;
};

const getType = (element: any) => {
  const type = element.type;
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || 'Unknown';
  }

  if (ReactIs.isFragment(element) === true) {
    return 'React.Fragment';
  }
  if (typeof type === 'object' && type !== null) {
    if (ReactIs.isContextProvider(type) === true) {
      return 'Context.Provider';
    }

    if (ReactIs.isContextConsumer(type) === true) {
      return 'Context.Consumer';
    }

    if (ReactIs.isForwardRef(type) === true) {
      const functionName = type.render.displayName || type.render.name || '';

      return functionName !== ''
        ? 'ForwardRef(' + functionName + ')'
        : 'ForwardRef';
    }

    if (ReactIs.isMemo(type) === true) {
      const functionName = type.type.displayName || type.type.name || '';

      return functionName !== '' ? 'Memo(' + functionName + ')' : 'Memo';
    }
  }
  return 'UNDEFINED';
};

const getPropKeys = (element: any) => {
  const {props} = element;

  return Object.keys(props)
    .filter(key => key !== 'children' && props[key] !== undefined)
    .sort();
};

export const serialize = (
  element: any,
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
          getPropKeys(element),
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

const plugin: NewPlugin = {serialize, test};

export default plugin;
