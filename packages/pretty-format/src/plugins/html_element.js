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
import {printElement, printElementAsLeaf, printProps} from './lib/markup';

type Attribute = {
  name: string,
  value: string,
};

type HTMLElement = {
  attributes: Array<Attribute>,
  childNodes: Array<HTMLElement | HTMLText | HTMLComment>,
  nodeType: 1,
  tagName: string,
  textContent: string,
};
type HTMLText = {
  data: string,
  nodeType: 3,
};
type HTMLComment = {
  data: string,
  nodeType: 8,
};

const HTML_ELEMENT_REGEXP = /(HTML\w*?Element)|Text|Comment/;

export const test = (val: any) =>
  val !== undefined &&
  val !== null &&
  (val.nodeType === 1 || val.nodeType === 3 || val.nodeType === 8) &&
  val.constructor !== undefined &&
  val.constructor.name !== undefined &&
  HTML_ELEMENT_REGEXP.test(val.constructor.name);

// Return empty string if children is empty.
function printChildren(children, config, indentation, depth, refs, printer) {
  const colors = config.colors;
  return children
    .map(
      node =>
        typeof node === 'string'
          ? colors.content.open + escapeHTML(node) + colors.content.close
          : printer(node, config, indentation, depth, refs),
    )
    .filter(value => value.trim().length)
    .map(value => config.spacingOuter + indentation + value)
    .join('');
}

const getType = element => element.tagName.toLowerCase();

// Convert array of attribute objects to keys array and props object.
const keysMapper = attribute => attribute.name;
const propsReducer = (props, attribute) => {
  props[attribute.name] = attribute.value;
  return props;
};

export const serialize = (
  element: HTMLElement | HTMLText | HTMLComment,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  if (element.nodeType === 3) {
    return element.data
      .split('\n')
      .map(text => text.trimLeft())
      .filter(text => text.length)
      .join(' ');
  }

  const colors = config.colors;
  if (element.nodeType === 8) {
    return (
      colors.comment.open +
      '<!-- ' +
      element.data.trim() +
      ' -->' +
      colors.comment.close
    );
  }

  if (++depth > config.maxDepth) {
    return printElementAsLeaf(getType(element), config);
  }

  return printElement(
    getType(element),
    printProps(
      Array.prototype.map.call(element.attributes, keysMapper).sort(),
      Array.prototype.reduce.call(element.attributes, propsReducer, {}),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    printChildren(
      Array.prototype.slice.call(element.childNodes),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    config,
    indentation,
  );
};

export default ({serialize, test}: NewPlugin);
