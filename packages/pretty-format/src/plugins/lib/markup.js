/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Config, Printer, Refs} from 'types/PrettyFormat';

import escapeHTML from './escape_html';

// Return spacing and indentation that precedes the property.
const printProp = (
  key: string,
  value: any,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string => {
  const indentationNext = indentation + config.indent;
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

  const colors = config.colors;
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
};

// Return empty string if keys is empty.
export const printProps = (
  keys: Array<string>,
  props: Object,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string =>
  keys
    .map(key =>
      printProp(key, props[key], config, printer, indentation, depth, refs),
    )
    .join('');

// Return empty string if children is empty.
export const printChildren = (
  children: Array<any>,
  config: Config,
  printer: Printer,
  indentation: string,
  depth: number,
  refs: Refs,
): string => {
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
};

// Separate the functions to format props, children, and element,
// so a plugin could override a particular function, if needed.
// Too bad, so sad: the traditional (but unnecessary) space
// in a self-closing tag requires a second test of printedProps.
export const printElement = (
  type: string,
  printedProps: string,
  printedChildren: string,
  config: Config,
  indentation: string,
): string => {
  const tag = config.colors.tag;
  return (
    tag.open +
    '<' +
    type +
    (printedProps &&
      tag.close + printedProps + config.spacingOuter + indentation + tag.open) +
    (printedChildren
      ? '>' +
        tag.close +
        printedChildren +
        config.spacingOuter +
        indentation +
        tag.open +
        '</' +
        type
      : (printedProps && !config.min ? '' : ' ') + '/') +
    '>' +
    tag.close
  );
};
