/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

export type Identifier = {|
  type: 'Identifier',
  name: string,
  value: string,
|};

export type MemberExpression = {|
  type: 'MemberExpression',
  name: string,
  expression: CallExpression,
  property: Identifier,
  object: Identifier,
|};

export type Literal = {|
  type: 'Literal',
  value?: string,
  rawValue?: string,
|};

export type CallExpression = {|
  type: 'CallExpression',
  arguments: [Literal],
  callee: Identifier | MemberExpression,
|};

export type EslintContext = {|
  report: ({message: string, node: any}) => void
|};
