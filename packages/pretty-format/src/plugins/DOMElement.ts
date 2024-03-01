/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config, NewPlugin, Printer, Refs} from '../types';
import {
  printChildren,
  printComment,
  printElement,
  printElementAsLeaf,
  printProps,
  printText,
} from './lib/markup';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const FRAGMENT_NODE = 11;

const ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/;

const testHasAttribute = (val: any) => {
  try {
    return typeof val.hasAttribute === 'function' && val.hasAttribute('is');
  } catch {
    return false;
  }
};

const testNode = (val: any) => {
  const constructorName = val.constructor.name;
  const {nodeType, tagName} = val;
  const isCustomElement =
    (typeof tagName === 'string' && tagName.includes('-')) ||
    testHasAttribute(val);

  return (
    (nodeType === ELEMENT_NODE &&
      (ELEMENT_REGEXP.test(constructorName) || isCustomElement)) ||
    (nodeType === TEXT_NODE && constructorName === 'Text') ||
    (nodeType === COMMENT_NODE && constructorName === 'Comment') ||
    (nodeType === FRAGMENT_NODE && constructorName === 'DocumentFragment')
  );
};

export const test: NewPlugin['test'] = (val: any) =>
  val?.constructor?.name && testNode(val);

type HandledType = Element | Text | Comment | DocumentFragment;

function nodeIsText(node: HandledType): node is Text {
  return node.nodeType === TEXT_NODE;
}

function nodeIsComment(node: HandledType): node is Comment {
  return node.nodeType === COMMENT_NODE;
}

function nodeIsFragment(node: HandledType): node is DocumentFragment {
  return node.nodeType === FRAGMENT_NODE;
}

export const serialize: NewPlugin['serialize'] = (
  node: HandledType,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
) => {
  if (nodeIsText(node)) {
    return printText(node.data, config);
  }

  if (nodeIsComment(node)) {
    return printComment(node.data, config);
  }

  const type = nodeIsFragment(node)
    ? 'DocumentFragment'
    : node.tagName.toLowerCase();

  if (++depth > config.maxDepth) {
    return printElementAsLeaf(type, config);
  }

  return printElement(
    type,
    printProps(
      nodeIsFragment(node)
        ? []
        : Array.from(node.attributes, attr => attr.name).sort(),
      nodeIsFragment(node)
        ? {}
        : [...node.attributes].reduce<Record<string, string>>(
            (props, attribute) => {
              props[attribute.name] = attribute.value;
              return props;
            },
            {},
          ),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer,
    ),
    printChildren(
      Array.prototype.slice.call(node.childNodes || node.children),
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

const plugin: NewPlugin = {serialize, test};

export default plugin;
