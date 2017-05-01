/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

type Node = MemberExpression | CallExpression;

type Location = {
  column: number,
  line: number,
};

type NodeLocation = {
  end: Location,
  start: Location,
};

export type Identifier = {
  type: 'Identifier',
  name: string,
  value: string,
  parent: Node,
  loc: NodeLocation,
};

export type MemberExpression = {
  type: 'MemberExpression',
  name: string,
  expression: CallExpression,
  property: Identifier,
  object: Identifier,
  parent: Node,
  loc: NodeLocation,
};

export type Literal = {
  type: 'Literal',
  value?: string,
  rawValue?: string,
  regex?: Object,
  parent: Node,
  loc: NodeLocation,
};

export type CallExpression = {
  type: 'CallExpression',
  arguments: Array<Literal>,
  callee: Identifier | MemberExpression,
  parent: Node,
  loc: NodeLocation,
};

export type EslintContext = {|
  report: ({loc?: NodeLocation, message: string, node: any}) => void,
|};
