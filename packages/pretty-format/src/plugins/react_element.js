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

import escapeHTML from './lib/escape_html';

const elementSymbol = Symbol.for('react.element');

function traverseChildren(opaqueChildren, cb) {
  if (Array.isArray(opaqueChildren)) {
    opaqueChildren.forEach(child => traverseChildren(child, cb));
  } else if (opaqueChildren != null && opaqueChildren !== false) {
    cb(opaqueChildren);
  }
}

function printChildren(
  children: Array<any>,
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
  element: React$Element<*>,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string => {
  const tag = config.colors.tag;
  let elementName;
  if (typeof element.type === 'string') {
    elementName = element.type;
  } else if (typeof element.type === 'function') {
    elementName = element.type.displayName || element.type.name || 'Unknown';
  } else {
    elementName = 'Unknown';
  }
  let result = tag.open + '<' + elementName;

  const keys = Object.keys(element.props).filter(key => key !== 'children');
  const hasProps = keys.length !== 0;
  if (hasProps) {
    result +=
      tag.close +
      printProps(
        keys,
        element.props,
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

  const opaqueChildren = element.props.children;
  if (opaqueChildren) {
    const flatChildren = [];
    traverseChildren(opaqueChildren, child => {
      flatChildren.push(child);
    });
    result +=
      '>' +
      tag.close +
      printChildren(
        flatChildren,
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
      elementName +
      '>' +
      tag.close;
  } else {
    result += (hasProps && !config.min ? '' : ' ') + '/>' + tag.close;
  }

  return result;
};

export const test = (val: any) => val && val.$$typeof === elementSymbol;

export default ({serialize, test}: NewPlugin);
