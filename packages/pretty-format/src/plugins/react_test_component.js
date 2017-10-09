/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Config,
  Printer,
  NewPlugin,
  ReactTestObject,
  Refs,
} from 'types/PrettyFormat';

import {
  printChildren,
  printElement,
  printElementAsLeaf,
  printProps,
} from './lib/markup';

const testSymbol = Symbol.for('react.test.json');

export const serialize = (
  object: ReactTestObject,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string =>
  ++depth > config.maxDepth
    ? printElementAsLeaf(object.type, config)
    : printElement(
        object.type,
        object.props
          ? printProps(
              Object.keys(object.props).sort(),
              // Despite ternary expression, Flow 0.51.0 found incorrect error:
              // undefined is incompatible with the expected param type of Object
              // $FlowFixMe
              object.props,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer,
            )
          : '',
        object.children
          ? printChildren(
              object.children,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer,
            )
          : '',
        config,
        indentation,
      );

export const test = (val: any) => val && val.$$typeof === testSymbol;

export default ({serialize, test}: NewPlugin);
