/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable max-len */
'use strict';

const escapeHTML = require('./lib/escapeHTML');

const reactElement = Symbol.for('react.element');

function traverseChildren(opaqueChildren, cb) {
  if (Array.isArray(opaqueChildren)) {
    opaqueChildren.forEach(child => traverseChildren(child, cb));
  } else if (opaqueChildren != null && opaqueChildren !== false) {
    cb(opaqueChildren);
  }
}

function printChildren(flatChildren, print, indent, colors, opts) {
  return flatChildren
    .map(node => {
      if (typeof node === 'object') {
        return printElement(node, print, indent, colors, opts);
      } else if (typeof node === 'string') {
        return colors.content.open + escapeHTML(node) + colors.content.close;
      } else {
        return print(node);
      }
    })
    .join(opts.edgeSpacing);
}

function printProps(props, print, indent, colors, opts) {
  return Object.keys(props)
    .sort()
    .map(name => {
      if (name === 'children') {
        return '';
      }

      const prop = props[name];
      let printed = print(prop);

      if (typeof prop !== 'string') {
        if (printed.indexOf('\n') !== -1) {
          printed = '{' +
            opts.edgeSpacing +
            indent(indent(printed) + opts.edgeSpacing + '}');
        } else {
          printed = '{' + printed + '}';
        }
      }

      return opts.spacing +
        indent(colors.prop.open + name + colors.prop.close + '=') +
        colors.value.open +
        printed +
        colors.value.close;
    })
    .join('');
}

function printElement(element, print, indent, colors, opts) {
  let result = colors.tag.open + '<';
  let elementName;
  if (typeof element.type === 'string') {
    elementName = element.type;
  } else if (typeof element.type === 'function') {
    elementName = element.type.displayName || element.type.name || 'Unknown';
  } else {
    elementName = 'Unknown';
  }
  result += elementName + colors.tag.close;
  result += printProps(element.props, print, indent, colors, opts);

  const opaqueChildren = element.props.children;
  const hasProps = !!Object.keys(element.props).filter(
    propName => propName !== 'children',
  ).length;
  const closeInNewLine = hasProps && !opts.min;

  if (opaqueChildren) {
    const flatChildren = [];
    traverseChildren(opaqueChildren, child => {
      flatChildren.push(child);
    });
    const children = printChildren(flatChildren, print, indent, colors, opts);
    result += colors.tag.open +
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
    result += colors.tag.open +
      (closeInNewLine ? '\n' : ' ') +
      '/>' +
      colors.tag.close;
  }

  return result;
}

module.exports = {
  print(val, print, indent, opts, colors) {
    return printElement(val, print, indent, colors, opts);
  },
  test(object) {
    return object && object.$$typeof === reactElement;
  },
};
