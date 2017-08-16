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
import {
  printChildren,
  printElement,
  printElementAsLeaf,
  printProps,
} from './lib/markup';

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

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;

const ELEMENT_REGEXP = /^HTML\w*?Element$/;

const testNode = (type: any, name: any) =>
  (type === ELEMENT_NODE && ELEMENT_REGEXP.test(name)) ||
  (type === TEXT_NODE && name === 'Text') ||
  (type === COMMENT_NODE && name === 'Comment');

export const test = (val: any) =>
  val &&
  val.constructor &&
  val.constructor.name &&
  testNode(val.nodeType, val.constructor.name);

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
  const colors = config.colors;
  if (element.nodeType === TEXT_NODE) {
    return (
      colors.content.open + escapeHTML(element.data) + colors.content.close
    );
  }

  if (element.nodeType === COMMENT_NODE) {
    return (
      colors.comment.open +
      '<!--' +
      escapeHTML(element.data) +
      '-->' +
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
