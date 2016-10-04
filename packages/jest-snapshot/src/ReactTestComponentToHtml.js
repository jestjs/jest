/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const printString = require('pretty-format/printString');
const hyphenateStyleName = require('fbjs/lib/hyphenateStyleName');
const escapeHtml = require('escape-html');

const reactTestInstance = Symbol.for('react.test.json');

// From React: src/renderers/dom/shared/HTMLDOMPropertyConfig.js
const REACT_PROPS_TO_DOM_ATTRS = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
};

// Adapted from React: src/renderers/dom/shared/CSSProperty.js
const IS_UNITLESS_NUMBER = {
  animationIterationCount: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true,
};
Object.keys(IS_UNITLESS_NUMBER).forEach(prop => {
  ['Webkit', 'ms', 'Moz', 'O'].forEach(prefix => {
    const styleName = prefix + prop.charAt(0).toUpperCase() + prop.substring(1);
    IS_UNITLESS_NUMBER[styleName] = IS_UNITLESS_NUMBER[prop];
  });
});

function printChildren(children, print, indent, opts) {
  return children.map(child => printInstance(child, print, indent, opts))
    .join(opts.edgeSpacing);
}

function printProps(props, print, indent, opts) {
  return Object.keys(props).sort().map(propName => {
    const propValue = props[propName];

    let printedValue;
    if (typeof propValue === 'string') {
      printedValue = print(propValue);
    } else if (propName === 'style') {
      printedValue = printStyle(propValue, print);
    } else {
      return '';
    }

    let printedName = propName;
    if (REACT_PROPS_TO_DOM_ATTRS.hasOwnProperty(propName)) {
      printedName = REACT_PROPS_TO_DOM_ATTRS[propName];
    }
    return opts.spacing + indent(printedName + '=') + printedValue;
  }).join('');
}

function printStyle(style, print) {
  if (style == null) {
    return '';
  }

  let css = '';
  Object.keys(style).sort().forEach(styleName => {
    const styleValue = style[styleName];
    css += hyphenateStyleName(styleName) + ':';
    css += printStyleValue(styleName, styleValue) + ';';
  });

  return print(css);
}

// From React: src/renderers/dom/shared/dangerousStyleValue.js
function printStyleValue(name, value) {
  if (value == null || typeof value === 'boolean' || value === '') {
    return '';
  }
  if (typeof value === 'number' && value !== 0 &&
      !(IS_UNITLESS_NUMBER.hasOwnProperty(name) && IS_UNITLESS_NUMBER[name])) {
    return value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
  }
  return ('' + value).trim();
}

function printInstance(instance, print, indent, opts) {
  if (typeof instance == 'number') {
    return print(instance);
  } else if (typeof instance === 'string') {
    return printString(instance);
  }

  let result = '<' + instance.type;

  if (instance.props) {
    result += printProps(instance.props, print, indent, opts);
  }

  const children = instance.children;
  if (children) {
    const printedChildren = printChildren(children, print, indent, opts);
    result += '>' + opts.edgeSpacing + indent(printedChildren) +
      opts.edgeSpacing + '</' + instance.type + '>';
  } else if (instance.type.toUpperCase() === 'TEXTAREA') {
    result += '>' + (escapeHtml(instance.props.value) || '') +
      '</' + instance.type + '>';
  } else {
    result += '>' + opts.edgeSpacing + indent('') +
      opts.edgeSpacing + '</' + instance.type + '>';
  }

  return result;
}

module.exports = {
  test(object) {
    return object && object.$$typeof === reactTestInstance;
  },
  print(val, print, indent, opts) {
    return printInstance(val, print, indent, opts);
  },
};
