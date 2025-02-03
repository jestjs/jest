/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import style = require('ansi-styles');
import {
  printIteratorEntries,
  printIteratorValues,
  printListItems,
  printObjectProperties,
} from './collections';
import AsymmetricMatcher from './plugins/AsymmetricMatcher';
import DOMCollection from './plugins/DOMCollection';
import DOMElement from './plugins/DOMElement';
import Immutable from './plugins/Immutable';
import ReactElement from './plugins/ReactElement';
import ReactTestComponent from './plugins/ReactTestComponent';
import type {
  Colors,
  Config,
  NewPlugin,
  Options,
  OptionsReceived,
  Plugin,
  Plugins,
  Refs,
  Theme,
} from './types';

export type {
  Colors,
  CompareKeys,
  Config,
  Options,
  OptionsReceived,
  OldPlugin,
  NewPlugin,
  Plugin,
  Plugins,
  PrettyFormatOptions,
  Printer,
  Refs,
  Theme,
} from './types';

const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;

/**
 * Explicitly comparing typeof constructor to function avoids undefined as name
 * when mock identity-obj-proxy returns the key as the value for any key.
 */
const getConstructorName = (val: new (...args: Array<any>) => unknown) =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

/* global window */
/** Is val is equal to global window object? Works even if it does not exist :) */
const isWindow = (val: unknown) =>
  // eslint-disable-next-line unicorn/prefer-global-this
  typeof window !== 'undefined' && val === window;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
const NEWLINE_REGEXP = /\n/gi;

class PrettyFormatPluginError extends Error {
  constructor(message: string, stack: string) {
    super(message);
    this.stack = stack;
    this.name = this.constructor.name;
  }
}

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
  return Object.is(val, -0) ? '-0' : String(val);
}

function printBigInt(val: bigint): string {
  return String(`${val}n`);
}

function printFunction(val: Function, printFunctionName: boolean): string {
  if (!printFunctionName) {
    return '[Function]';
  }
  return `[Function ${val.name || 'anonymous'}]`;
}

function printSymbol(val: symbol): string {
  return String(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val: Error): string {
  return `[${errorToString.call(val)}]`;
}

/**
 * The first port of call for printing an object, handles most of the
 * data-types in JS.
 */
function printBasicValue(
  val: any,
  printFunctionName: boolean,
  escapeRegex: boolean,
  escapeString: boolean,
): string | null {
  if (val === true || val === false) {
    return `${val}`;
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
  if (typeOf === 'bigint') {
    return printBigInt(val);
  }
  if (typeOf === 'string') {
    if (escapeString) {
      return `"${val.replaceAll(/"|\\/g, '\\$&')}"`;
    }
    return `"${val}"`;
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
    return Number.isNaN(+val) ? 'Date { NaN }' : toISOString.call(val);
  }
  if (toStringed === '[object Error]') {
    return printError(val);
  }
  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      // https://github.com/benjamingr/RegExp.escape/blob/main/polyfill.js
      return regExpToString.call(val).replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
    }
    return regExpToString.call(val);
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}

/**
 * Handles more complex objects ( such as objects with circular references.
 * maps and sets etc )
 */
function printComplexValue(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
): string {
  if (refs.includes(val)) {
    return '[Circular]';
  }
  refs = [...refs];
  refs.push(val);

  const hitMaxDepth = ++depth > config.maxDepth;
  const min = config.min;

  if (
    config.callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function' &&
    !hasCalledToJSON
  ) {
    return printer(val.toJSON(), config, indentation, depth, refs, true);
  }

  const toStringed = toString.call(val);
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : `${min ? '' : 'Arguments '}[${printListItems(
          val,
          config,
          indentation,
          depth,
          refs,
          printer,
        )}]`;
  }
  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? `[${val.constructor.name}]`
      : `${
          min
            ? ''
            : !config.printBasicPrototype && val.constructor.name === 'Array'
              ? ''
              : `${val.constructor.name} `
        }[${printListItems(val, config, indentation, depth, refs, printer)}]`;
  }
  if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : `Map {${printIteratorEntries(
          val.entries(),
          config,
          indentation,
          depth,
          refs,
          printer,
          ' => ',
        )}}`;
  }
  if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : `Set {${printIteratorValues(
          val.values(),
          config,
          indentation,
          depth,
          refs,
          printer,
        )}}`;
  }

  // Avoid failure to serialize global window object in jsdom test environment.
  // For example, not even relevant if window is prop of React element.
  return hitMaxDepth || isWindow(val)
    ? `[${getConstructorName(val)}]`
    : `${
        min
          ? ''
          : !config.printBasicPrototype && getConstructorName(val) === 'Object'
            ? ''
            : `${getConstructorName(val)} `
      }{${printObjectProperties(
        val,
        config,
        indentation,
        depth,
        refs,
        printer,
      )}}`;
}

function isNewPlugin(plugin: Plugin): plugin is NewPlugin {
  return (plugin as NewPlugin).serialize != null;
}

function printPlugin(
  plugin: Plugin,
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
): string {
  let printed;

  try {
    printed = isNewPlugin(plugin)
      ? plugin.serialize(val, config, indentation, depth, refs, printer)
      : plugin.print(
          val,
          valChild => printer(valChild, config, indentation, depth, refs),
          str => {
            const indentationNext = indentation + config.indent;
            return (
              indentationNext +
              str.replaceAll(NEWLINE_REGEXP, `\n${indentationNext}`)
            );
          },
          {
            edgeSpacing: config.spacingOuter,
            min: config.min,
            spacing: config.spacingInner,
          },
          config.colors,
        );
  } catch (error: any) {
    throw new PrettyFormatPluginError(error.message, error.stack);
  }
  if (typeof printed !== 'string') {
    throw new TypeError(
      `pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`,
    );
  }
  return printed;
}

function findPlugin(plugins: Plugins, val: unknown) {
  for (const plugin of plugins) {
    try {
      if (plugin.test(val)) {
        return plugin;
      }
    } catch (error: any) {
      throw new PrettyFormatPluginError(error.message, error.stack);
    }
  }

  return null;
}

function printer(
  val: unknown,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
): string {
  const plugin = findPlugin(config.plugins, val);
  if (plugin !== null) {
    return printPlugin(plugin, val, config, indentation, depth, refs);
  }

  const basicResult = printBasicValue(
    val,
    config.printFunctionName,
    config.escapeRegex,
    config.escapeString,
  );
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(
    val,
    config,
    indentation,
    depth,
    refs,
    hasCalledToJSON,
  );
}

const DEFAULT_THEME: Theme = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green',
};

const DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME) as Array<
  keyof typeof DEFAULT_THEME
>;

// could be replaced by `satisfies` operator in the future: https://github.com/microsoft/TypeScript/issues/47920
const toOptionsSubtype = <T extends Options>(options: T) => options;

export const DEFAULT_OPTIONS = toOptionsSubtype({
  callToJSON: true,
  compareKeys: undefined,
  escapeRegex: false,
  escapeString: true,
  highlight: false,
  indent: 2,
  maxDepth: Number.POSITIVE_INFINITY,
  maxWidth: Number.POSITIVE_INFINITY,
  min: false,
  plugins: [],
  printBasicPrototype: true,
  printFunctionName: true,
  theme: DEFAULT_THEME,
});

function validateOptions(options: OptionsReceived) {
  for (const key of Object.keys(options)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_OPTIONS, key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  }

  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error(
      'pretty-format: Options "min" and "indent" cannot be used together.',
    );
  }

  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error('pretty-format: Option "theme" must not be null.');
    }

    if (typeof options.theme !== 'object') {
      throw new TypeError(
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
    const color = value && (style as any)[value];
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
  }, Object.create(null));

const getColorsEmpty = (): Colors =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    colors[key] = {close: '', open: ''};
    return colors;
  }, Object.create(null));

const getPrintFunctionName = (options?: OptionsReceived) =>
  options?.printFunctionName ?? DEFAULT_OPTIONS.printFunctionName;

const getEscapeRegex = (options?: OptionsReceived) =>
  options?.escapeRegex ?? DEFAULT_OPTIONS.escapeRegex;

const getEscapeString = (options?: OptionsReceived) =>
  options?.escapeString ?? DEFAULT_OPTIONS.escapeString;

const getConfig = (options?: OptionsReceived): Config => ({
  callToJSON: options?.callToJSON ?? DEFAULT_OPTIONS.callToJSON,
  colors: options?.highlight ? getColorsHighlight(options) : getColorsEmpty(),
  compareKeys:
    typeof options?.compareKeys === 'function' || options?.compareKeys === null
      ? options.compareKeys
      : DEFAULT_OPTIONS.compareKeys,
  escapeRegex: getEscapeRegex(options),
  escapeString: getEscapeString(options),
  indent: options?.min
    ? ''
    : createIndent(options?.indent ?? DEFAULT_OPTIONS.indent),
  maxDepth: options?.maxDepth ?? DEFAULT_OPTIONS.maxDepth,
  maxWidth: options?.maxWidth ?? DEFAULT_OPTIONS.maxWidth,
  min: options?.min ?? DEFAULT_OPTIONS.min,
  plugins: options?.plugins ?? DEFAULT_OPTIONS.plugins,
  printBasicPrototype: options?.printBasicPrototype ?? true,
  printFunctionName: getPrintFunctionName(options),
  spacingInner: options?.min ? ' ' : '\n',
  spacingOuter: options?.min ? '' : '\n',
});

function createIndent(indent: number): string {
  return Array.from({length: indent + 1}).join(' ');
}

/**
 * Returns a presentation string of your `val` object
 * @param val any potential JavaScript object
 * @param options Custom settings
 */
export function format(val: unknown, options?: OptionsReceived): string {
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
    getEscapeString(options),
  );
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(options), '', 0, []);
}

export const plugins = {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
};

export default format;
