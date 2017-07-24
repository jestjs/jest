/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  Config,
  Printer,
  NewPlugin,
  ReactTestObject,
  ReactTestChild,
  Refs,
} from 'types/PrettyFormat';

import escapeHTML from './lib/escape_html';

const testSymbol = Symbol.for('react.test.json');

function printChildren(
  children: Array<ReactTestChild>,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  const colors = config.colors;
  return children
    .map(
      child =>
        config.spacingOuter +
        indentation +
        (typeof child === 'string'
          ? colors.content.open + escapeHTML(child) + colors.content.close
          : printer(child, indentation, depth, refs)),
    )
    .join('');
}

function printProps(
  keys: Array<string>,
  props: Object,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  const indentationNext = indentation + config.indent;
  const colors = config.colors;
  return keys
    .sort()
    .map(key => {
      const value = props[key];
      let printed = printer(value, indentationNext, depth, refs);

      if (typeof value !== 'string') {
        if (printed.indexOf('\n') !== -1) {
          printed =
            config.spacingOuter +
            indentationNext +
            printed +
            config.spacingOuter +
            indentation;
        }
        printed = '{' + printed + '}';
      }

      return (
        config.spacingInner +
        indentation +
        colors.prop.open +
        key +
        colors.prop.close +
        '=' +
        colors.value.open +
        printed +
        colors.value.close
      );
    })
    .join('');
}

export const serialize = (
  instance: ReactTestObject,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string => {
  const tag = config.colors.tag;
  let result = tag.open + '<' + instance.type;

  let hasProps = false;
  if (instance.props) {
    const keys = Object.keys(instance.props);
    hasProps = keys.length !== 0;
    if (hasProps) {
      result +=
        tag.close +
        printProps(
          keys,
          instance.props,
          config,
          printer,
          indentation + config.indent,
          depth,
          refs,
        ) +
        config.spacingOuter +
        indentation +
        tag.open;
    }
  }

  if (instance.children) {
    result +=
      '>' +
      tag.close +
      printChildren(
        instance.children,
        config,
        printer,
        indentation + config.indent,
        depth,
        refs,
      ) +
      config.spacingOuter +
      indentation +
      tag.open +
      '</' +
      instance.type +
      '>' +
      tag.close;
  } else {
    result += (hasProps && !config.min ? '' : ' ') + '/>' + tag.close;
  }

  return result;
};

export const test = (val: any) => val && val.$$typeof === testSymbol;

export default ({serialize, test}: NewPlugin);
