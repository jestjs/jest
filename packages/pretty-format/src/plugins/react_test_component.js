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
  Colors,
  Indent,
  PluginOptions,
  Print,
  Plugin,
  ReactTestObject,
  ReactTestChild,
} from 'types/PrettyFormat';

import escapeHTML from './lib/escape_html';

const reactTestInstance = Symbol.for('react.test.json');

function printChildren(
  children: Array<ReactTestChild>,
  print,
  indent,
  colors,
  opts,
) {
  return children
    .map(node => {
      if (typeof node === 'string') {
        return colors.content.open + escapeHTML(node) + colors.content.close;
      } else {
        return print(node);
      }
    })
    .join(opts.edgeSpacing);
}

function printProps(props: Object, print, indent, colors, opts) {
  return Object.keys(props)
    .sort()
    .map(name => {
      const prop = props[name];
      let printed = print(prop);

      if (typeof prop !== 'string') {
        if (printed.indexOf('\n') !== -1) {
          printed =
            '{' +
            opts.edgeSpacing +
            indent(indent(printed) + opts.edgeSpacing + '}');
        } else {
          printed = '{' + printed + '}';
        }
      }

      return (
        opts.spacing +
        indent(colors.prop.open + name + colors.prop.close + '=') +
        colors.value.open +
        printed +
        colors.value.close
      );
    })
    .join('');
}

export const print = (
  instance: ReactTestObject,
  print: Print,
  indent: Indent,
  opts: PluginOptions,
  colors: Colors,
) => {
  let closeInNewLine = false;
  let result = colors.tag.open + '<' + instance.type + colors.tag.close;

  if (instance.props) {
    closeInNewLine = !!Object.keys(instance.props).length && !opts.min;
    result += printProps(instance.props, print, indent, colors, opts);
  }

  if (instance.children) {
    const children = printChildren(
      instance.children,
      print,
      indent,
      colors,
      opts,
    );
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
      instance.type +
      '>' +
      colors.tag.close;
  } else {
    result +=
      colors.tag.open + (closeInNewLine ? '\n' : ' ') + '/>' + colors.tag.close;
  }

  return result;
};

export const test = (object: Object) =>
  object && object.$$typeof === reactTestInstance;

export default ({print, test}: Plugin);
