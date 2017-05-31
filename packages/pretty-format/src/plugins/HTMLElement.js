/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Colors, Indent, Options, Print, Plugin} from 'types/PrettyFormat';

const escapeHTML = require('./lib/escapeHTML');

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
const test = isHTMLElement;

function isHTMLElement(value: any) {
  return (
    value !== undefined &&
    value !== null &&
    (value.nodeType === 1 || value.nodeType === 3 || value.nodeType === 8) &&
    value.constructor !== undefined &&
    value.constructor.name !== undefined &&
    HTML_ELEMENT_REGEXP.test(value.constructor.name)
  );
}

function printChildren(flatChildren, print, indent, colors, opts) {
  return flatChildren
    .map(node => {
      if (typeof node === 'object') {
        return print(node);
      } else if (typeof node === 'string') {
        return colors.content.open + escapeHTML(node) + colors.content.close;
      } else {
        return print(node);
      }
    })
    .filter(value => value.trim().length)
    .join(opts.edgeSpacing);
}

function printAttributes(attributes: Array<Attribute>, indent, colors, opts) {
  return attributes
    .sort()
    .map(attribute => {
      return (
        opts.spacing +
        indent(colors.prop.open + attribute.name + colors.prop.close + '=') +
        colors.value.open +
        `"${attribute.value}"` +
        colors.value.close
      );
    })
    .join('');
}

const print = (
  element: HTMLElement | HTMLText | HTMLComment,
  print: Print,
  indent: Indent,
  opts: Options,
  colors: Colors,
): string => {
  if (element.nodeType === 3) {
    return element.data
      .split('\n')
      .map(text => text.trimLeft())
      .filter(text => text.length)
      .join(' ');
  } else if (element.nodeType === 8) {
    return (
      colors.comment.open +
      '<!-- ' +
      element.data.trim() +
      ' -->' +
      colors.comment.close
    );
  }

  let result = colors.tag.open + '<';
  const elementName = element.tagName.toLowerCase();
  result += elementName + colors.tag.close;

  const hasAttributes = element.attributes && element.attributes.length;
  if (hasAttributes) {
    const attributes = Array.prototype.slice.call(element.attributes);
    result += printAttributes(attributes, indent, colors, opts);
  }

  const flatChildren = Array.prototype.slice.call(element.childNodes);
  if (!flatChildren.length && element.textContent) {
    flatChildren.push(element.textContent);
  }

  const closeInNewLine = hasAttributes && !opts.min;
  if (flatChildren.length) {
    const children = printChildren(flatChildren, print, indent, colors, opts);
    result +=
      colors.tag.open +
      (closeInNewLine ? '\n' : '') +
      '>' +
      colors.tag.close +
      opts.edgeSpacing +
      indent(children) +
      opts.edgeSpacing +
      colors.tag.open +
      '</' +
      elementName +
      '>' +
      colors.tag.close;
  } else {
    result +=
      colors.tag.open + (closeInNewLine ? '\n' : ' ') + '/>' + colors.tag.close;
  }

  return result;
};

module.exports = ({print, test}: Plugin);
