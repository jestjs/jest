/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Config, NewPlugin, Printer, Refs} from 'types/PrettyFormat';

import {
  printChildren,
  printComment,
  printElement,
  printElementAsLeaf,
  printProps,
  printText,
} from './lib/markup';

type Attribute = {
  name: string,
  value: string,
};

type Element = {
  attributes: Array<Attribute>,
  childNodes: Array<Element | Text | Comment>,
  nodeType: 1,
  tagName: string,
};
type Text = {
  data: string,
  nodeType: 3,
};
type Comment = {
  data: string,
  nodeType: 8,
};

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

const ELEMENT_REGEXP = /^(HTML|SVG)\w*?Element$/;

const testNode = (nodeType: any, name: any) =>
  (nodeType === ELEMENT_NODE && ELEMENT_REGEXP.test(name)) ||
  (nodeType === TEXT_NODE && name === 'Text') ||
  (nodeType === COMMENT_NODE && name === 'Comment');

export const test = (val: any) =>
  val &&
  val.constructor &&
  val.constructor.name &&
  testNode(val.nodeType, val.constructor.name);

// Convert array of attribute objects to keys array and props object.
const keysMapper = attribute => attribute.name;
const propsReducer = (props, attribute) => {
  props[attribute.name] = attribute.value;
  return props;
};

export const serialize = (
  node: Element | Text | Comment,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  if (node.nodeType === TEXT_NODE) {
    return printText(node.data, config);
  }

  if (node.nodeType === COMMENT_NODE) {
    return printComment(node.data, config);
  }

  const type = node.tagName.toLowerCase();
  if (++depth > config.maxDepth) {
    return printElementAsLeaf(type, config);
  }

  return printElement(
    type,
    printProps(
      Array.prototype.map.call(node.attributes, keysMapper).sort(),
      Array.prototype.reduce.call(node.attributes, propsReducer, {}),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    printChildren(
      Array.prototype.slice.call(node.childNodes),
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
