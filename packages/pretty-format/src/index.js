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
  Config,
  Options,
  OptionsReceived,
  Plugin,
  Plugins,
  Refs,
  StringOrNull,
  Theme,
} from 'types/PrettyFormat';

import style from 'ansi-styles';

import AsymmetricMatcher from './plugins/asymmetric_matcher';
import ConvertAnsi from './plugins/convert_ansi';
import HTMLElement from './plugins/html_element';
import Immutable from './plugins/immutable_plugins';
import ReactElement from './plugins/react_element';
import ReactTestComponent from './plugins/react_test_component';

const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = Symbol.prototype.toString;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
const NEWLINE_REGEXP = /\n/gi;

const getSymbols = Object.getOwnPropertySymbols || (obj => []);

const isSymbol = key =>
  // $FlowFixMe string literal `symbol`. This value is not a valid `typeof` return value
  typeof key === 'symbol' || toString.call(key) === '[object Symbol]';

function isToStringedArrayType(toStringed: string): boolean {
  return (
    toStringed === '[object Array]' ||
    toStringed === '[object ArrayBuffer]' ||
    toStringed === '[object DataView]' ||
    toStringed === '[object Float32Array]' ||
    toStringed === '[object Float64Array]' ||
    toStringed === '[object Int8Array]' ||
    toStringed === '[object Int16Array]' ||
    toStringed === '[object Int32Array]' ||
    toStringed === '[object Uint8Array]' ||
    toStringed === '[object Uint8ClampedArray]' ||
    toStringed === '[object Uint16Array]' ||
    toStringed === '[object Uint32Array]'
  );
}

function printNumber(val: number): string {
  if (val != +val) {
    return 'NaN';
  }
  const isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? '-0' : '' + val;
}

function printFunction(val: Function, printFunctionName: boolean): string {
  if (!printFunctionName) {
    return '[Function]';
  }
  return '[Function ' + (val.name || 'anonymous') + ']';
}

function printSymbol(val: Symbol): string {
  return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val: Error): string {
  return '[' + errorToString.call(val) + ']';
}

function printBasicValue(
  val: any,
  printFunctionName: boolean,
  escapeRegex: boolean,
): StringOrNull {
  if (val === true || val === false) {
    return '' + val;
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (val === null) {
    return 'null';
  }

  const typeOf = typeof val;

  if (typeOf === 'number') {
    return printNumber(val);
  }
  if (typeOf === 'string') {
    return '"' + val.replace(/"|\\/g, '\\$&') + '"';
  }
  if (typeOf === 'function') {
    return printFunction(val, printFunctionName);
  }
  if (typeOf === 'symbol') {
    return printSymbol(val);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object WeakMap]') {
    return 'WeakMap {}';
  }
  if (toStringed === '[object WeakSet]') {
    return 'WeakSet {}';
  }
  if (
    toStringed === '[object Function]' ||
    toStringed === '[object GeneratorFunction]'
  ) {
    return printFunction(val, printFunctionName);
  }
  if (toStringed === '[object Symbol]') {
    return printSymbol(val);
  }
  if (toStringed === '[object Date]') {
    return toISOString.call(val);
  }
  if (toStringed === '[object Error]') {
    return printError(val);
  }
  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      // https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
      return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    return regExpToString.call(val);
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}

function printListItems(
  list: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  let result = '';

  if (list.length) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    for (let i = 0; i < list.length; i++) {
      result +=
        indentationNext + print(list[i], config, indentationNext, depth, refs);

      if (i < list.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

function printMapEntries(
  val: Map<any, any>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  let result = '';
  const iterator = val.entries();
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    while (!current.done) {
      const name = print(
        current.value[0],
        config,
        indentationNext,
        depth,
        refs,
      );
      const value = print(
        current.value[1],
        config,
        indentationNext,
        depth,
        refs,
      );

      result += indentationNext + name + ' => ' + value;

      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

function printObjectProperties(
  val: Object,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  let result = '';
  let keys = Object.keys(val).sort();
  const symbols = getSymbols(val);

  if (symbols.length) {
    keys = keys.filter(key => !isSymbol(key)).concat(symbols);
  }

  if (keys.length) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = print(key, config, indentationNext, depth, refs);
      const value = print(val[key], config, indentationNext, depth, refs);

      result += indentationNext + name + ': ' + value;

      if (i < keys.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

function printSetValues(
  val: Set<any>,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  let result = '';
  const iterator = val.values();
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;

    const indentationNext = indentation + config.indent;

    while (!current.done) {
      result +=
        indentationNext +
        print(current.value, config, indentationNext, depth, refs);

      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}

function printComplexValue(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  if (refs.indexOf(val) !== -1) {
    return '[Circular]';
  }
  refs = refs.slice();
  refs.push(val);

  const hitMaxDepth = ++depth > config.maxDepth;
  const min = config.min;

  if (
    config.callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function'
  ) {
    return print(val.toJSON(), config, indentation, depth, refs);
  }

  const toStringed = toString.call(val);
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : (min ? '' : 'Arguments ') +
        '[' +
        printListItems(val, config, indentation, depth, refs) +
        ']';
  }
  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? '[' + val.constructor.name + ']'
      : (min ? '' : val.constructor.name + ' ') +
        '[' +
        printListItems(val, config, indentation, depth, refs) +
        ']';
  }
  if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : 'Map {' + printMapEntries(val, config, indentation, depth, refs) + '}';
  }
  if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : 'Set {' + printSetValues(val, config, indentation, depth, refs) + '}';
  }

  return hitMaxDepth
    ? '[' + (val.constructor ? val.constructor.name : 'Object') + ']'
    : (min ? '' : (val.constructor ? val.constructor.name : 'Object') + ' ') +
      '{' +
      printObjectProperties(val, config, indentation, depth, refs) +
      '}';
}

function printPlugin(
  plugin: Plugin,
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  const printed = plugin.serialize
    ? plugin.serialize(
        val,
        config,
        (valChild, indentationChild, depthChild, refsChild) =>
          print(valChild, config, indentationChild, depthChild, refsChild),
        indentation,
        depth,
        refs,
      )
    : plugin.print(
        val,
        valChild => print(valChild, config, indentation, depth, refs),
        str => {
          const indentationNext = indentation + config.indent;
          return (
            indentationNext +
            str.replace(NEWLINE_REGEXP, '\n' + indentationNext)
          );
        },
        {
          edgeSpacing: config.spacingOuter,
          min: config.min,
          spacing: config.spacingInner,
        },
        config.colors,
      );
  if (typeof printed !== 'string') {
    throw new Error(
      `pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`,
    );
  }
  return printed;
}

function findPlugin(plugins: Plugins, val: any) {
  for (let p = 0; p < plugins.length; p++) {
    if (plugins[p].test(val)) {
      return plugins[p];
    }
  }

  return null;
}

function print(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  const plugin = findPlugin(config.plugins, val);
  if (plugin !== null) {
    return printPlugin(plugin, val, config, indentation, depth, refs);
  }

  const basicResult = printBasicValue(
    val,
    config.printFunctionName,
    config.escapeRegex,
  );
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, config, indentation, depth, refs);
}

const DEFAULT_THEME: Theme = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green',
};

const DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);

const DEFAULT_OPTIONS: Options = {
  callToJSON: true,
  escapeRegex: false,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  theme: DEFAULT_THEME,
};

function validateOptions(options: OptionsReceived) {
  Object.keys(options).forEach(key => {
    if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });

  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error(
      'pretty-format: Options "min" and "indent" cannot be used together.',
    );
  }

  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error(`pretty-format: Option "theme" must not be null.`);
    }

    if (typeof options.theme !== 'object') {
      throw new Error(
        `pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`,
      );
    }
  }
}

const getColorsHighlight = (options: OptionsReceived): Colors =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    const value =
      options.theme && options.theme[key] !== undefined
        ? options.theme[key]
        : DEFAULT_THEME[key];
    const color = style[value];
    if (
      color &&
      typeof color.close === 'string' &&
      typeof color.open === 'string'
    ) {
      colors[key] = color;
    } else {
      throw new Error(
        `pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`,
      );
    }
    return colors;
  }, {});

const getColorsEmpty = () =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    colors[key] = {close: '', open: ''};
    return colors;
  }, {});

const getPrintFunctionName = (options?: OptionsReceived) =>
  options && options.printFunctionName !== undefined
    ? options.printFunctionName
    : DEFAULT_OPTIONS.printFunctionName;

const getEscapeRegex = (options?: OptionsReceived) =>
  options && options.escapeRegex !== undefined
    ? options.escapeRegex
    : DEFAULT_OPTIONS.escapeRegex;

const getConfig = (options?: OptionsReceived): Config => ({
  callToJSON:
    options && options.callToJSON !== undefined
      ? options.callToJSON
      : DEFAULT_OPTIONS.callToJSON,
  colors:
    options && options.highlight
      ? getColorsHighlight(options)
      : getColorsEmpty(),
  escapeRegex: getEscapeRegex(options),
  indent:
    options && options.min
      ? ''
      : createIndent(
          options && options.indent !== undefined
            ? options.indent
            : DEFAULT_OPTIONS.indent,
        ),
  maxDepth:
    options && options.maxDepth !== undefined
      ? options.maxDepth
      : DEFAULT_OPTIONS.maxDepth,
  min: options && options.min !== undefined ? options.min : DEFAULT_OPTIONS.min,
  plugins:
    options && options.plugins !== undefined
      ? options.plugins
      : DEFAULT_OPTIONS.plugins,
  printFunctionName: getPrintFunctionName(options),
  spacingInner: options && options.min ? ' ' : '\n',
  spacingOuter: options && options.min ? '' : '\n',
});

function createIndent(indent: number): string {
  return new Array(indent + 1).join(' ');
}

function prettyFormat(val: any, options?: OptionsReceived): string {
  if (options) {
    validateOptions(options);
    if (options.plugins) {
      const plugin = findPlugin(options.plugins, val);
      if (plugin !== null) {
        return printPlugin(plugin, val, getConfig(options), '', 0, []);
      }
    }
  }

  const basicResult = printBasicValue(
    val,
    getPrintFunctionName(options),
    getEscapeRegex(options),
  );
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(options), '', 0, []);
}

prettyFormat.plugins = {
  AsymmetricMatcher,
  ConvertAnsi,
  HTMLElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
};

module.exports = prettyFormat;
