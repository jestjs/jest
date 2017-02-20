/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* eslint-disable max-len */
'use strict';

const escapeHTML = require('./escapeHTML');

const reactTestInstance = Symbol.for('react.test.json');

function printChildren(children, print, indent, colors, opts) {
  return children.map(child => printInstance(child, print, indent, colors, opts)).join(opts.edgeSpacing);
}

function printProps(props, print, indent, colors, opts) {
  return Object.keys(props).sort().map(name => {
    const prop = props[name];
    let printed = print(prop);

    if (typeof prop !== 'string') {
      if (printed.indexOf('\n') !== -1) {
        printed = '{' + opts.edgeSpacing + indent(indent(printed) + opts.edgeSpacing + '}');
      } else {
        printed = '{' + printed + '}';
      }
    }

    return opts.spacing + indent(colors.prop.open + name + colors.prop.close + '=') + colors.value.open + printed + colors.value.close;
  }).join('');
}

function printInstance(instance, print, indent, colors, opts) {
  if (typeof instance == 'number') {
    return print(instance);
  } else if (typeof instance === 'string') {
    return colors.content.open + escapeHTML(instance) + colors.content.close;
  }

  let result = colors.tag.open + '<' + instance.type + colors.tag.close;
  let closeInNewLine = false;

  if (instance.props) {
    result += printProps(instance.props, print, indent, colors, opts);
    closeInNewLine = !!Object.keys(instance.props).length && !opts.min;
  }

  if (instance.children) {
    const children = printChildren(instance.children, print, indent, colors, opts);
    result += colors.tag.open + (closeInNewLine ? '\n' : '') + '>' + colors.tag.close + opts.edgeSpacing + indent(children) + opts.edgeSpacing + colors.tag.open + '</' + instance.type + '>' + colors.tag.close;
  } else {
    result += colors.tag.open + (closeInNewLine ? '\n' : ' ') + '/>' + colors.tag.close;
  }

  return result;
}

module.exports = {
  print(val, print, indent, opts, colors) {
    return printInstance(val, print, indent, colors, opts);
  },
  test(object) {
    return object && object.$$typeof === reactTestInstance;
  },
};
