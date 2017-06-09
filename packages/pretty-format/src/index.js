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
  Refs,
  StringOrNull,
  Plugins,
  Options,
} from 'types/PrettyFormat';

import style from 'ansi-styles';

type Theme = {|
  comment?: string,
  content?: string,
  prop?: string,
  tag?: string,
  value?: string,
|};

type InitialOptions = {|
  callToJSON?: boolean,
  escapeRegex?: boolean,
  edgeSpacing?: string,
  highlight?: boolean,
  indent?: number,
  maxDepth?: number,
  min?: boolean,
  plugins?: Plugins,
  printFunctionName?: boolean,
  spacing?: string,
  theme?: Theme,
|};

const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = Symbol.prototype.toString;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
const NEWLINE_REGEXP = /\n/gi;

const getSymbols = Object.getOwnPropertySymbols || (obj => []);

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
  } else if (val.name === '') {
    return '[Function anonymous]';
  } else {
    return '[Function ' + val.name + ']';
  }
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
  if (toStringed === '[object Arguments]' && val.length === 0) {
    return 'Arguments []';
  }
  if (isToStringedArrayType(toStringed) && val.length === 0) {
    return val.constructor.name + ' []';
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}

function printList(
  list: any,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  let body = '';

  if (list.length) {
    body += edgeSpacing;

    const innerIndent = prevIndent + indent;

    for (let i = 0; i < list.length; i++) {
      body +=
        innerIndent +
        print(
          list[i],
          indent,
          innerIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );

      if (i < list.length - 1) {
        body += ',' + spacing;
      }
    }

    body += (min ? '' : ',') + edgeSpacing + prevIndent;
  }

  return '[' + body + ']';
}

function printArguments(
  val: any,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  return (
    (min ? '' : 'Arguments ') +
    printList(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors,
    )
  );
}

function printArray(
  val: any,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  return (
    (min ? '' : val.constructor.name + ' ') +
    printList(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors,
    )
  );
}

function printMap(
  val: Map<any, any>,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  let result = 'Map {';
  const iterator = val.entries();
  let current = iterator.next();

  if (!current.done) {
    result += edgeSpacing;

    const innerIndent = prevIndent + indent;

    while (!current.done) {
      const key = print(
        current.value[0],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors,
      );
      const value = print(
        current.value[1],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors,
      );

      result += innerIndent + key + ' => ' + value;

      current = iterator.next();

      if (!current.done) {
        result += ',' + spacing;
      }
    }

    result += (min ? '' : ',') + edgeSpacing + prevIndent;
  }

  return result + '}';
}

function printObject(
  val: Object,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  const constructor = min
    ? ''
    : val.constructor ? val.constructor.name + ' ' : 'Object ';
  let result = constructor + '{';
  let keys = Object.keys(val).sort();
  const symbols = getSymbols(val);

  if (symbols.length) {
    keys = keys
      .filter(
        key =>
          // $FlowFixMe string literal `symbol`. This value is not a valid `typeof` return value
          !(typeof key === 'symbol' ||
            toString.call(key) === '[object Symbol]'),
      )
      .concat(symbols);
  }

  if (keys.length) {
    result += edgeSpacing;

    const innerIndent = prevIndent + indent;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = print(
        key,
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors,
      );
      const value = print(
        val[key],
        indent,
        innerIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors,
      );

      result += innerIndent + name + ': ' + value;

      if (i < keys.length - 1) {
        result += ',' + spacing;
      }
    }

    result += (min ? '' : ',') + edgeSpacing + prevIndent;
  }

  return result + '}';
}

function printSet(
  val: Set<any>,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  let result = 'Set {';
  const iterator = val.entries();
  let current = iterator.next();

  if (!current.done) {
    result += edgeSpacing;

    const innerIndent = prevIndent + indent;

    while (!current.done) {
      result +=
        innerIndent +
        print(
          current.value[1],
          indent,
          innerIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );

      current = iterator.next();

      if (!current.done) {
        result += ',' + spacing;
      }
    }

    result += (min ? '' : ',') + edgeSpacing + prevIndent;
  }

  return result + '}';
}

function printComplexValue(
  val: any,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  refs = refs.slice();
  if (refs.indexOf(val) > -1) {
    return '[Circular]';
  } else {
    refs.push(val);
  }

  currentDepth++;

  const hitMaxDepth = currentDepth > maxDepth;

  if (
    callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function'
  ) {
    return print(
      val.toJSON(),
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors,
    );
  }

  const toStringed = toString.call(val);
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : printArguments(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );
  } else if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? '[Array]'
      : printArray(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );
  } else if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : printMap(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );
  } else if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : printSet(
          val,
          indent,
          prevIndent,
          spacing,
          edgeSpacing,
          refs,
          maxDepth,
          currentDepth,
          plugins,
          min,
          callToJSON,
          printFunctionName,
          escapeRegex,
          colors,
        );
  }

  return hitMaxDepth
    ? '[Object]'
    : printObject(
        val,
        indent,
        prevIndent,
        spacing,
        edgeSpacing,
        refs,
        maxDepth,
        currentDepth,
        plugins,
        min,
        callToJSON,
        printFunctionName,
        escapeRegex,
        colors,
      );
}

function printPlugin(
  val,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): StringOrNull {
  let plugin;

  for (let p = 0; p < plugins.length; p++) {
    if (plugins[p].test(val)) {
      plugin = plugins[p];
      break;
    }
  }

  if (!plugin) {
    return null;
  }

  function boundPrint(val) {
    return print(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      maxDepth,
      currentDepth,
      plugins,
      min,
      callToJSON,
      printFunctionName,
      escapeRegex,
      colors,
    );
  }

  function boundIndent(str) {
    const indentation = prevIndent + indent;
    return indentation + str.replace(NEWLINE_REGEXP, '\n' + indentation);
  }

  const opts = {
    edgeSpacing,
    min,
    spacing,
  };
  return plugin.print(val, boundPrint, boundIndent, opts, colors);
}

function print(
  val: any,
  indent: string,
  prevIndent: string,
  spacing: string,
  edgeSpacing: string,
  refs: Refs,
  maxDepth: number,
  currentDepth: number,
  plugins: Plugins,
  min: boolean,
  callToJSON: boolean,
  printFunctionName: boolean,
  escapeRegex: boolean,
  colors: Colors,
): string {
  const pluginsResult = printPlugin(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    maxDepth,
    currentDepth,
    plugins,
    min,
    callToJSON,
    printFunctionName,
    escapeRegex,
    colors,
  );
  if (typeof pluginsResult === 'string') {
    return pluginsResult;
  }

  const basicResult = printBasicValue(val, printFunctionName, escapeRegex);
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    maxDepth,
    currentDepth,
    plugins,
    min,
    callToJSON,
    printFunctionName,
    escapeRegex,
    colors,
  );
}

const DEFAULTS: Options = {
  callToJSON: true,
  edgeSpacing: '\n',
  escapeRegex: false,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  spacing: '\n',
  theme: {
    comment: 'gray',
    content: 'reset',
    prop: 'yellow',
    tag: 'cyan',
    value: 'green',
  },
};

function validateOptions(opts: InitialOptions) {
  Object.keys(opts).forEach(key => {
    if (!DEFAULTS.hasOwnProperty(key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });

  if (opts.min && opts.indent !== undefined && opts.indent !== 0) {
    throw new Error(
      'pretty-format: Options "min" and "indent" cannot be used together.',
    );
  }
}

function normalizeOptions(opts: InitialOptions): Options {
  const result = {};

  Object.keys(DEFAULTS).forEach(
    key =>
      (result[key] = opts.hasOwnProperty(key)
        ? key === 'theme' ? normalizeTheme(opts.theme) : opts[key]
        : DEFAULTS[key]),
  );

  if (result.min) {
    result.indent = 0;
  }

  // $FlowFixMe the type cast below means YOU are responsible to verify the code above.
  return (result: Options);
}

function normalizeTheme(themeOption: ?Theme) {
  if (!themeOption) {
    throw new Error(`pretty-format: Option "theme" must not be null.`);
  }

  if (typeof themeOption !== 'object') {
    throw new Error(
      `pretty-format: Option "theme" must be of type "object" but instead received "${typeof themeOption}".`,
    );
  }

  // Silently ignore any keys in `theme` that are not in defaults.
  const themeRefined = themeOption;
  const themeDefaults = DEFAULTS.theme;
  return Object.keys(themeDefaults).reduce((theme, key) => {
    theme[key] = Object.prototype.hasOwnProperty.call(themeOption, key)
      ? themeRefined[key]
      : themeDefaults[key];
    return theme;
  }, {});
}

function createIndent(indent: number): string {
  return new Array(indent + 1).join(' ');
}

function prettyFormat(val: any, initialOptions?: InitialOptions): string {
  let opts: Options;
  if (!initialOptions) {
    opts = DEFAULTS;
  } else {
    validateOptions(initialOptions);
    opts = normalizeOptions(initialOptions);
  }

  const colors: Colors = {
    comment: {close: '', open: ''},
    content: {close: '', open: ''},
    prop: {close: '', open: ''},
    tag: {close: '', open: ''},
    value: {close: '', open: ''},
  };
  Object.keys(opts.theme).forEach(key => {
    if (opts.highlight) {
      const color = (colors[key] = style[opts.theme[key]]);
      if (
        !color ||
        typeof color.close !== 'string' ||
        typeof color.open !== 'string'
      ) {
        throw new Error(
          `pretty-format: Option "theme" has a key "${key}" whose value "${opts.theme[key]}" is undefined in ansi-styles.`,
        );
      }
    }
  });

  let indent;
  let refs;
  const prevIndent = '';
  const currentDepth = 0;
  const spacing = opts.min ? ' ' : '\n';
  const edgeSpacing = opts.min ? '' : '\n';

  if (opts && opts.plugins.length) {
    indent = createIndent(opts.indent);
    refs = [];
    const pluginsResult = printPlugin(
      val,
      indent,
      prevIndent,
      spacing,
      edgeSpacing,
      refs,
      opts.maxDepth,
      currentDepth,
      opts.plugins,
      opts.min,
      opts.callToJSON,
      opts.printFunctionName,
      opts.escapeRegex,
      colors,
    );
    if (typeof pluginsResult === 'string') {
      return pluginsResult;
    }
  }

  const basicResult = printBasicValue(
    val,
    opts.printFunctionName,
    opts.escapeRegex,
  );
  if (basicResult !== null) {
    return basicResult;
  }

  if (!indent) {
    indent = createIndent(opts.indent);
  }
  if (!refs) {
    refs = [];
  }
  return printComplexValue(
    val,
    indent,
    prevIndent,
    spacing,
    edgeSpacing,
    refs,
    opts.maxDepth,
    currentDepth,
    opts.plugins,
    opts.min,
    opts.callToJSON,
    opts.printFunctionName,
    opts.escapeRegex,
    colors,
  );
}

prettyFormat.plugins = {
  AsymmetricMatcher: require('./plugins/AsymmetricMatcher'),
  ConvertAnsi: require('./plugins/ConvertAnsi'),
  HTMLElement: require('./plugins/HTMLElement'),
  Immutable: require('./plugins/ImmutablePlugins'),
  ReactElement: require('./plugins/ReactElement'),
  ReactTestComponent: require('./plugins/ReactTestComponent'),
};

module.exports = prettyFormat;
