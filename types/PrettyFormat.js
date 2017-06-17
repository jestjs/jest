/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

export type Colors = {
  comment: {close: string, open: string},
  content: {close: string, open: string},
  prop: {close: string, open: string},
  tag: {close: string, open: string},
  value: {close: string, open: string},
};
export type Indent = string => string;
export type Refs = Array<any>;
export type Print = any => string;
export type StringOrNull = string | null;

export type Options = {|
  callToJSON: boolean,
  edgeSpacing: string,
  escapeRegex: boolean,
  highlight: boolean,
  indent: number,
  maxDepth: number,
  min: boolean,
  plugins: Plugins,
  printFunctionName: boolean,
  spacing: string,
  theme: {|
    comment: string,
    content: string,
    prop: string,
    tag: string,
    value: string,
  |},
|};

export type Plugin = {
  print: (
    val: any,
    serialize: Print,
    indent: Indent,
    opts: Options,
    colors: Colors,
  ) => string,
  test: any => boolean,
};

export type Plugins = Array<Plugin>;

export type ReactTestObject = {|
  $$typeof: Symbol,
  type: string,
  props?: Object,
  children?: null | Array<ReactTestChild>,
|};

// Child can be `number` in Stack renderer but not in Fiber renderer.
export type ReactTestChild = ReactTestObject | string | number;
